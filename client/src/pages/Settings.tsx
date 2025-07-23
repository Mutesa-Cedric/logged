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
    IconCheck,
    IconDatabase,
    IconDownload,
    IconInfoCircle,
    IconPalette,
    IconSettings,
    IconShield,
    IconTrash
} from '@tabler/icons-react';
import { useState } from 'react';
import { ThemeActions } from '../components/ThemeToggle';
import { themeUtils } from '../lib/theme';

export const SettingsPage = () => {
    const theme = useMantineTheme();
    const [notifications_, setNotifications] = useState(true);
    const [autoConnect, setAutoConnect] = useState(false);
    const [logLevel, setLogLevel] = useState('info');
    const [refreshInterval, setRefreshInterval] = useState(5);
    const [autoScroll, setAutoScroll] = useState(true);

    const handleSaveSettings = () => {
        notifications.show({
            title: 'Settings Saved',
            message: 'Your preferences have been updated successfully',
            color: 'green',
        });
    };

    const handleExportData = () => {
        notifications.show({
            title: 'Exporting Data',
            message: 'Your data will be downloaded as a JSON file',
            color: 'blue',
        });
    };

    const handleClearCache = () => {
        notifications.show({
            title: 'Cache Cleared',
            message: 'All cached data has been removed',
            color: 'orange',
        });
    };

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
                    <Button
                        leftSection={<IconCheck size={16} />}
                        onClick={handleSaveSettings}
                        size="sm"
                        visibleFrom="xs"
                    >
                        <Text hiddenFrom="sm">Save</Text>
                        <Text visibleFrom="sm">Save Changes</Text>
                    </Button>
                </Group>
                <Button
                    leftSection={<IconCheck size={16} />}
                    onClick={handleSaveSettings}
                    hiddenFrom="xs"
                    fullWidth
                >
                    Save Changes
                </Button>
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
                            checked={notifications_}
                            onChange={(e) => setNotifications(e.currentTarget.checked)}
                            color="blue"
                            style={{ transition: themeUtils.transitions.normal }}
                        />
                    </Group>

                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={500}>Auto-connect on startup</Text>
                            <Text size="xs" c="dimmed">
                                Automatically connect to the last used server
                            </Text>
                        </Box>
                        <Switch
                            checked={autoConnect}
                            onChange={(e) => setAutoConnect(e.currentTarget.checked)}
                            color="blue"
                            style={{ transition: themeUtils.transitions.normal }}
                        />
                    </Group>

                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={500}>Log Level</Text>
                            <Text size="xs" c="dimmed">
                                Minimum log level to display
                            </Text>
                        </Box>
                        <Select
                            data={[
                                { value: 'debug', label: 'Debug' },
                                { value: 'info', label: 'Info' },
                                { value: 'warn', label: 'Warning' },
                                { value: 'error', label: 'Error' },
                            ]}
                            value={logLevel}
                            onChange={(value) => setLogLevel(value || 'info')}
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
                                Seconds between automatic updates
                            </Text>
                        </Box>
                        <NumberInput
                            value={refreshInterval}
                            onChange={(value) => setRefreshInterval(Number(value))}
                            min={1}
                            max={60}
                            w={100}
                            suffix="s"
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
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.currentTarget.checked)}
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
                            Your connection credentials are encrypted and stored securely.
                            We recommend using SSH keys instead of passwords when possible.
                        </Text>
                    </Alert>

                    <Group justify="space-between">
                        <div>
                            <Text size="sm" fw={500}>Session Timeout</Text>
                            <Text size="xs" c="dimmed">
                                Auto-logout after inactivity (minutes)
                            </Text>
                        </div>
                        <Select
                            data={[
                                { value: '15', label: '15 minutes' },
                                { value: '30', label: '30 minutes' },
                                { value: '60', label: '1 hour' },
                                { value: '120', label: '2 hours' },
                            ]}
                            defaultValue="30"
                            w={130}
                            styles={{
                                input: {
                                    transition: themeUtils.transitions.normal,
                                },
                            }}
                        />
                    </Group>
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
                                <Text size="xs" c="dimmed">Connections: 2.1 KB</Text>
                                <Text size="xs" c="dimmed">Logs Cache: 15.7 MB</Text>
                                <Text size="xs" c="dimmed">Settings: 0.8 KB</Text>
                            </div>
                            <Badge variant="light" color="blue">
                                Total: 15.7 MB
                            </Badge>
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