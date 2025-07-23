import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    NumberInput,
    Select,
    Stack,
    Switch,
    Text,
    Title,
    useMantineTheme
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconDatabase,
    IconDownload,
    IconInfoCircle,
    IconPalette,
    IconSettings,
    IconShield,
    IconTrash
} from '@tabler/icons-react';
import { useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
import { ThemeActions } from '../components/ThemeToggle';
import { themeUtils } from '../lib/theme';
import { userPreferencesAtom, updateUserPreferencesAtom, isGuestModeAtom } from '../store/atoms';
import { useConnections } from '../services/connections';

const calculateStorageSize = (data: unknown): number => {
    try {
        return new Blob([JSON.stringify(data)]).size;
    } catch {
        return 0;
    }
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const SettingsPage = () => {
    const theme = useMantineTheme();
    const [userPreferences] = useAtom(userPreferencesAtom);
    const [, updateUserPreferences] = useAtom(updateUserPreferencesAtom);
    const [isGuestMode] = useAtom(isGuestModeAtom);
    const { data: connections = [] } = useConnections();

    const storageUsage = useMemo(() => {
        const connectionsSize = calculateStorageSize(connections);
        const settingsSize = calculateStorageSize(userPreferences);
        
        const cacheKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.includes('cache') || key?.includes('log') || key?.includes('query-cache')) {
                cacheKeys.push(key);
            }
        }
        
        let cacheSize = 0;
        cacheKeys.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                cacheSize += calculateStorageSize(item);
            }
        });

        return {
            connections: connectionsSize,
            settings: settingsSize,
            cache: cacheSize,
            total: connectionsSize + settingsSize + cacheSize
        };
    }, [connections, userPreferences]);

    const handleExportData = useCallback(() => {
        try {
            const exportData = {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                settings: userPreferences,
                connections: connections.map(conn => ({
                    id: conn.id,
                    name: conn.name,
                    host: conn.host,
                    port: conn.port,
                    username: conn.username,
                    createdAt: conn.createdAt,
                    updatedAt: conn.updatedAt,
                    lastUsed: conn.lastUsed
                }))
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `logged-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            notifications.show({
                title: 'Export Successful',
                message: 'Your data has been downloaded successfully',
                color: 'green',
            });
        } catch {
            notifications.show({
                title: 'Export Failed',
                message: 'Failed to export data. Please try again.',
                color: 'red',
            });
        }
    }, [userPreferences, connections]);

    const handleClearCache = useCallback(() => {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.includes('cache') || key?.includes('log') || key?.includes('query-cache')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            if (typeof window !== 'undefined' && 'caches' in window) {
                caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                        caches.delete(cacheName);
                    });
                });
            }

            notifications.show({
                title: 'Cache Cleared',
                message: `Cleared ${keysToRemove.length} cached items`,
                color: 'green',
            });
        } catch {
            notifications.show({
                title: 'Clear Cache Failed',
                message: 'Failed to clear cache. Please try again.',
                color: 'red',
            });
        }
    }, []);

    return (
        <Stack gap="lg">
            {/* Header */}
            <Stack gap="sm">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Box style={{ minWidth: 0, flex: 1 }}>
                        <Title order={2} style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>Settings</Title>
                        <Text c="dimmed" size="sm">
                            Configure your application preferences
                        </Text>
                    </Box>
                </Group>
            </Stack>

            {/* General Settings */}
            <Card
                padding="lg"
                radius="md"
                withBorder
                style={{ transition: themeUtils.transitions.normal }}
            >
                <Group gap="sm" mb="md">
                    <IconSettings size={20} />
                    <Title order={3} size="h4">General</Title>
                </Group>

                <Stack gap="md">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={500}>Enable Notifications</Text>
                            <Text size="xs" c="dimmed">
                                Receive alerts for connection status and errors
                            </Text>
                        </Box>
                        <Switch
                            checked={userPreferences.notifications}
                            onChange={(e) => updateUserPreferences({ notifications: e.currentTarget.checked })}
                            color="blue"
                            style={{ transition: themeUtils.transitions.normal }}
                        />
                    </Group>

                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={500}>Log Level Filter</Text>
                            <Text size="xs" c="dimmed">
                                Minimum log level to display
                            </Text>
                        </Box>
                        <Select
                            data={[
                                { value: 'all', label: 'All' },
                                { value: 'debug', label: 'Debug' },
                                { value: 'info', label: 'Info' },
                                { value: 'warn', label: 'Warning' },
                                { value: 'error', label: 'Error' },
                            ]}
                            value={userPreferences.logLevelFilter}
                            onChange={(value) => updateUserPreferences({ logLevelFilter: (value as 'all' | 'error' | 'warn' | 'info' | 'debug') || 'all' })}
                            w={120}
                            styles={{
                                input: {
                                    transition: themeUtils.transitions.normal,
                                },
                            }}
                        />
                    </Group>

                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={500}>Refresh Interval</Text>
                            <Text size="xs" c="dimmed">
                                Milliseconds between automatic updates
                            </Text>
                        </Box>
                        <NumberInput
                            value={userPreferences.refreshInterval}
                            onChange={(value) => updateUserPreferences({ refreshInterval: Number(value) || 5000 })}
                            min={1000}
                            max={60000}
                            step={1000}
                            w={120}
                            suffix="ms"
                            styles={{
                                input: {
                                    transition: themeUtils.transitions.normal,
                                },
                            }}
                        />
                    </Group>

                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={500}>Max Log Lines</Text>
                            <Text size="xs" c="dimmed">
                                Maximum number of log lines to keep in memory
                            </Text>
                        </Box>
                        <NumberInput
                            value={userPreferences.maxLogLines}
                            onChange={(value) => updateUserPreferences({ maxLogLines: Number(value) || 1000 })}
                            min={100}
                            max={10000}
                            step={100}
                            w={120}
                            styles={{
                                input: {
                                    transition: themeUtils.transitions.normal,
                                },
                            }}
                        />
                    </Group>

                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={500}>Auto-scroll Logs</Text>
                            <Text size="xs" c="dimmed">
                                Automatically scroll to newest log entries
                            </Text>
                        </Box>
                        <Switch
                            checked={userPreferences.autoScroll}
                            onChange={(e) => updateUserPreferences({ autoScroll: e.currentTarget.checked })}
                            color="blue"
                            style={{ transition: themeUtils.transitions.normal }}
                        />
                    </Group>
                </Stack>
            </Card>

            {/* Appearance */}
            <Card
                padding="lg"
                radius="md"
                withBorder
            >
                <Group gap="sm" mb="md">
                    <IconPalette size={20} />
                    <Title order={3} size="h4">Appearance</Title>
                </Group>

                <Stack gap="lg">
                    <Alert
                        icon={<IconInfoCircle size={16} />}
                        color="blue"
                        variant="light"
                        style={{ transition: themeUtils.transitions.normal }}
                    >
                        <Text size="sm">
                            Choose your preferred theme. Auto mode will follow your system preference.
                        </Text>
                    </Alert>

                    <ThemeActions />
                </Stack>
            </Card>

            {/* Security */}
            <Card
                padding="lg"
                radius="md"
                withBorder
            >
                <Group gap="sm" mb="md">
                    <IconShield size={20} />
                    <Title order={3} size="h4">Security</Title>
                </Group>

                <Stack gap="md">
                    <Alert
                        icon={<IconInfoCircle size={16} />}
                        color="blue"
                        variant="light"
                        style={{ transition: themeUtils.transitions.normal }}
                    >
                        <Text size="sm">
                            {isGuestMode 
                                ? 'Guest mode: Connection credentials are stored temporarily in your browser and will be lost when you close the tab.'
                                : 'Your connection credentials are encrypted and stored securely. We recommend using SSH keys instead of passwords when possible.'
                            }
                        </Text>
                    </Alert>

                    {!isGuestMode && (
                        <Group justify="space-between">
                            <div>
                                <Text size="sm" fw={500}>Session Management</Text>
                                <Text size="xs" c="dimmed">
                                    Managed by your authentication provider
                                </Text>
                            </div>
                            <Badge variant="light" color="green">
                                Active
                            </Badge>
                        </Group>
                    )}
                </Stack>
            </Card>

            {/* Data Management */}
            <Card
                padding="lg"
                radius="md"
                withBorder
            >
                <Group gap="sm" mb="md">
                    <IconDatabase size={20} />
                    <Title order={3} size="h4">Data Management</Title>
                </Group>

                <Stack gap="md">
                    <Group justify="space-between">
                        <div>
                            <Text size="sm" fw={500}>Export Data</Text>
                            <Text size="xs" c="dimmed">
                                Download your connections and settings
                            </Text>
                        </div>
                        <Button
                            variant="light"
                            size="xs"
                            leftSection={<IconDownload size={14} />}
                            onClick={handleExportData}
                            style={{ transition: themeUtils.transitions.normal }}
                        >
                            Export
                        </Button>
                    </Group>

                    <Group justify="space-between">
                        <div>
                            <Text size="sm" fw={500}>Clear Cache</Text>
                            <Text size="xs" c="dimmed">
                                Remove cached logs and temporary data
                            </Text>
                        </div>
                        <Button
                            variant="light"
                            color="orange"
                            size="xs"
                            leftSection={<IconTrash size={14} />}
                            onClick={handleClearCache}
                            style={{ transition: themeUtils.transitions.normal }}
                        >
                            Clear
                        </Button>
                    </Group>

                    <Divider />

                    <Alert
                        icon={<IconInfoCircle size={16} />}
                        color="yellow"
                        variant="light"
                        style={{ transition: themeUtils.transitions.normal }}
                    >
                        <Text size="sm" fw={500} mb="xs">Storage Usage</Text>
                        <Group gap="md">
                            <div>
                                <Text size="xs" c="dimmed">Connections: {formatBytes(storageUsage.connections)}</Text>
                                <Text size="xs" c="dimmed">Cache: {formatBytes(storageUsage.cache)}</Text>
                                <Text size="xs" c="dimmed">Settings: {formatBytes(storageUsage.settings)}</Text>
                            </div>
                            <Group gap="xs">
                                <Badge variant="light" color="blue">
                                    Total: {formatBytes(storageUsage.total)}
                                </Badge>
                                {connections.length > 0 && (
                                    <Badge variant="light" color="green">
                                        {connections.length} connection{connections.length !== 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </Group>
                        </Group>
                    </Alert>
                </Stack>
            </Card>

            {/* About */}
            <Card
                padding="lg"
                radius="md"
                withBorder
            >
                <Stack gap="md">
                    <Group gap="md">
                        <div style={{
                            width: 40,
                            height: 40,
                            background: themeUtils.getGradient('primary'),
                            borderRadius: theme.radius.md,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: themeUtils.transitions.normal,
                        }}>
                            <Text c="white" fw={700} size="lg">L</Text>
                        </div>
                        <div>
                            <Text fw={600}>Logged</Text>
                            <Text size="sm" c="dimmed">Version 1.0.0</Text>
                        </div>
                    </Group>

                    <Text size="sm" c="dimmed">
                        A modern web-based log viewer for remote servers.
                        Built with React, Mantine, and real-time WebSocket connections.
                    </Text>

                    <Group gap="xs">
                        <Badge variant="light" color="blue">React</Badge>
                        <Badge variant="light" color="green">Mantine</Badge>
                        <Badge variant="light" color="orange">TypeScript</Badge>
                        <Badge variant="light" color="violet">WebSocket</Badge>
                        <Badge variant="light" color="teal">SSH</Badge>
                        <Badge variant="light" color="grape">Dark Mode</Badge>
                    </Group>
                </Stack>
            </Card>
        </Stack>
    );
}; 