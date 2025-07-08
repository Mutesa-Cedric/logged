import {
    Alert,
    Badge,
    Button,
    Card,
    Divider,
    Group,
    NumberInput,
    Select,
    Stack,
    Switch,
    Text,
    Title
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

export const SettingsPage = () => {
    const [notifications_, setNotifications] = useState(true);
    const [autoConnect, setAutoConnect] = useState(false);
    const [logLevel, setLogLevel] = useState('info');
    const [refreshInterval, setRefreshInterval] = useState(5);
    const [darkMode, setDarkMode] = useState(false);
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
            <Group justify="space-between">
                <div>
                    <Title order={2}>Settings</Title>
                    <Text c="dimmed" size="sm">
                        Configure your application preferences
                    </Text>
                </div>
                <Button
                    leftSection={<IconCheck size={16} />}
                    onClick={handleSaveSettings}
                >
                    Save Changes
                </Button>
            </Group>

            {/* General Settings */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group gap="sm" mb="md">
                    <IconSettings size={20} />
                    <Title order={3} size="h4">General</Title>
                </Group>

                <Stack gap="md">
                    <Group justify="space-between">
                        <div>
                            <Text size="sm" fw={500}>Enable Notifications</Text>
                            <Text size="xs" c="dimmed">
                                Receive alerts for connection status and errors
                            </Text>
                        </div>
                        <Switch
                            checked={notifications_}
                            onChange={(e) => setNotifications(e.currentTarget.checked)}
                        />
                    </Group>

                    <Group justify="space-between">
                        <div>
                            <Text size="sm" fw={500}>Auto-connect on startup</Text>
                            <Text size="xs" c="dimmed">
                                Automatically connect to the last used server
                            </Text>
                        </div>
                        <Switch
                            checked={autoConnect}
                            onChange={(e) => setAutoConnect(e.currentTarget.checked)}
                        />
                    </Group>

                    <Group justify="space-between">
                        <div>
                            <Text size="sm" fw={500}>Log Level</Text>
                            <Text size="xs" c="dimmed">
                                Minimum log level to display
                            </Text>
                        </div>
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
                        />
                    </Group>

                    <Group justify="space-between">
                        <div>
                            <Text size="sm" fw={500}>Refresh Interval</Text>
                            <Text size="xs" c="dimmed">
                                Seconds between automatic updates
                            </Text>
                        </div>
                        <NumberInput
                            value={refreshInterval}
                            onChange={(value) => setRefreshInterval(Number(value))}
                            min={1}
                            max={60}
                            w={100}
                            suffix="s"
                        />
                    </Group>
                </Stack>
            </Card>

            {/* Appearance */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group gap="sm" mb="md">
                    <IconPalette size={20} />
                    <Title order={3} size="h4">Appearance</Title>
                </Group>

                <Stack gap="md">
                    <Group justify="space-between">
                        <div>
                            <Text size="sm" fw={500}>Dark Mode</Text>
                            <Text size="xs" c="dimmed">
                                Switch to dark theme
                            </Text>
                        </div>
                        <Switch
                            checked={darkMode}
                            onChange={(e) => setDarkMode(e.currentTarget.checked)}
                        />
                    </Group>

                    <Group justify="space-between">
                        <div>
                            <Text size="sm" fw={500}>Auto-scroll Logs</Text>
                            <Text size="xs" c="dimmed">
                                Automatically scroll to newest log entries
                            </Text>
                        </div>
                        <Switch
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.currentTarget.checked)}
                        />
                    </Group>
                </Stack>
            </Card>

            {/* Security */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group gap="sm" mb="md">
                    <IconShield size={20} />
                    <Title order={3} size="h4">Security</Title>
                </Group>

                <Stack gap="md">
                    <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
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
                        />
                    </Group>
                </Stack>
            </Card>

            {/* Data Management */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
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
                        >
                            Clear
                        </Button>
                    </Group>

                    <Divider />

                    <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
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
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                    <Group gap="md">
                        <div style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-violet-6))',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
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
                    </Group>
                </Stack>
            </Card>
        </Stack>
    );
}; 