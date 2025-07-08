/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Grid,
    Card,
    Text,
    Group,
    Stack,
    ActionIcon,
    Button,
    Badge,
    ScrollArea,
    Avatar,
    UnstyledButton,
    SimpleGrid,
    Center,
    ThemeIcon,
    Title,
    Skeleton,
    Alert,
} from '@mantine/core';
import {
    IconServer,
    IconTerminal2,
    IconActivity,
    IconPlus,
    IconEye,
    IconEdit,
    IconChevronRight,
    IconClock,
    IconCheck,
    IconX,
    IconDatabase,
    IconCloud,
    IconBolt,
    IconInfoCircle,
} from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    isGuestModeAtom,
    socketConnectedAtom,
    logStreamingAtom
} from '../store/atoms';
import { useConnections } from '../services/connections';
import { useUser } from '@clerk/clerk-react';
import { useSocket } from '../hooks/useSocket';

dayjs.extend(relativeTime);

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    change?: {
        value: number;
        period: string;
    };
    description?: string;
}

const StatCard = ({ title, value, icon: Icon, color, change, description }: StatCardProps) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed" fw={500}>
                {title}
            </Text>
            <ThemeIcon color={color} variant="light" size="lg">
                <Icon size={20} />
            </ThemeIcon>
        </Group>

        <Text size="xl" fw={700} mb="xs">
            {value}
        </Text>

        {description && (
            <Text size="xs" c="dimmed" mb="xs">
                {description}
            </Text>
        )}

        {change && (
            <Group gap="xs">
                <Text size="xs" c={change.value > 0 ? 'teal' : change.value < 0 ? 'red' : 'gray'}>
                    {change.value > 0 ? '+' : ''}{change.value}%
                </Text>
                <Text size="xs" c="dimmed">
                    vs last {change.period}
                </Text>
            </Group>
        )}
    </Card>
);

interface QuickActionProps {
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    color: string;
    onClick: () => void;
    disabled?: boolean;
}

const QuickAction = ({ icon: Icon, title, description, color, onClick, disabled }: QuickActionProps) => (
    <UnstyledButton
        onClick={onClick}
        disabled={disabled}
        style={{
            padding: 'var(--mantine-spacing-md)',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid var(--mantine-color-gray-2)',
            transition: 'all 0.2s ease',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => {
            if (!disabled) {
                e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                e.currentTarget.style.borderColor = `var(--mantine-color-${color}-3)`;
            }
        }}
        onMouseLeave={(e) => {
            if (!disabled) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--mantine-color-gray-2)';
            }
        }}
    >
        <Group gap="md">
            <ThemeIcon color={color} variant="light" size="lg">
                <Icon size={20} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
                <Text size="sm" fw={600}>
                    {title}
                </Text>
                <Text size="xs" c="dimmed">
                    {description}
                </Text>
            </div>
            <IconChevronRight size={16} style={{ color: 'var(--mantine-color-gray-5)' }} />
        </Group>
    </UnstyledButton>
);

export const Dashboard = () => {
    const { user, isLoaded, isSignedIn } = useUser();
    const navigate = useNavigate();
    const [isGuestMode] = useAtom(isGuestModeAtom);
    const [socketConnected] = useAtom(socketConnectedAtom);
    const [logStreaming] = useAtom(logStreamingAtom);

    // Only fetch connections when user is properly loaded and authenticated
    const { data: connections, isLoading: connectionsLoading } = useConnections();
    const { logs } = useSocket();

    console.log('📊 Dashboard render:', { isLoaded, isSignedIn, isGuestMode, connectionsCount: connections?.length });

    // Calculate stats from real data
    const connectedConnections = connections?.filter(conn => {
        if (conn.lastUsed) {
            const lastUsed = new Date(conn.lastUsed);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return lastUsed > fiveMinutesAgo;
        }
        return false;
    }) || [];

    // Recent activity from real logs and connections
    const recentActivity = [
        ...(connections?.slice(0, 2).map(conn => ({
            id: `conn-${conn.id}`,
            type: 'connection',
            title: `Connection: ${conn.name}`,
            description: `${conn.username}@${conn.host}:${conn.port}`,
            timestamp: conn.lastUsed ? new Date(conn.lastUsed) : new Date(conn.createdAt),
            status: conn.lastUsed &&
                new Date(conn.lastUsed) > new Date(Date.now() - 5 * 60 * 1000) ?
                'success' : 'info' as const,
        })) || []),
        ...(logs?.slice(-3).map((log, index) => ({
            id: `log-${index}`,
            type: 'logs',
            title: 'Log entry received',
            description: log.data.substring(0, 50) + (log.data.length > 50 ? '...' : ''),
            timestamp: log.timestamp,
            status: getLogStatus(log.data),
        })) || [])
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    function getLogStatus(logData: string): 'success' | 'error' | 'warning' | 'info' {
        const lower = logData.toLowerCase();
        if (lower.includes('error') || lower.includes('failed') || lower.includes('exception')) return 'error';
        if (lower.includes('warn') || lower.includes('warning')) return 'warning';
        if (lower.includes('success') || lower.includes('completed')) return 'success';
        return 'info';
    }

    const getActivityIcon = (type: string, status: string) => {
        if (status === 'error') return IconX;
        if (status === 'success') return IconCheck;
        if (type === 'connection') return IconServer;
        if (type === 'logs') return IconTerminal2;
        return IconActivity;
    };

    const getActivityColor = (status: string) => {
        switch (status) {
            case 'success': return 'green';
            case 'error': return 'red';
            case 'warning': return 'yellow';
            default: return 'blue';
        }
    };

    const stats = [
        {
            title: 'Total Connections',
            value: connections?.length || 0,
            icon: IconDatabase,
            color: 'blue',
            description: isGuestMode ? 'Guest mode - connections not saved' : 'Saved connections',
        },
        {
            title: 'Active Sessions',
            value: connectedConnections.length,
            icon: IconCloud,
            color: 'green',
            description: 'Currently connected servers',
        },
        {
            title: 'Socket Status',
            value: socketConnected ? 'Connected' : 'Disconnected',
            icon: IconActivity,
            color: socketConnected ? 'green' : 'red',
            description: 'Real-time connection status',
        },
        {
            title: 'Log Entries',
            value: logs?.length || 0,
            icon: IconTerminal2,
            color: logStreaming ? 'orange' : 'gray',
            description: logStreaming ? 'Currently streaming' : 'Cached entries',
        },
    ];

    const quickActions = [
        {
            icon: IconPlus,
            title: 'Add Connection',
            description: 'Connect to a new server',
            color: 'blue',
            onClick: () => navigate('/connections'),
        },
        {
            icon: IconTerminal2,
            title: 'View Logs',
            description: 'Open log viewer',
            color: 'green',
            onClick: () => navigate('/logs'),
            disabled: false, // Always allow access to logs page
        },
        {
            icon: IconActivity,
            title: 'Monitor Activity',
            description: 'Real-time monitoring',
            color: 'orange',
            onClick: () => navigate('/logs'),
        },
        {
            icon: IconServer,
            title: 'Manage Servers',
            description: 'Configure connections',
            color: 'violet',
            onClick: () => navigate('/connections'),
        },
    ];

    return (
        <Stack gap="lg">
            {/* Welcome Section */}
            <Card shadow="sm" padding="xl" radius="md" withBorder>
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2} mb="xs">
                            Welcome back, {isGuestMode ? 'Guest' : user?.firstName || 'User'}! 👋
                        </Title>
                        <Text c="dimmed" size="sm" mb="md">
                            {isGuestMode
                                ? 'You\'re using guest mode. Sign up to save your connections and settings.'
                                : 'Here\'s what\'s happening with your servers today.'
                            }
                        </Text>

                        {isGuestMode && (
                            <Alert
                                icon={<IconInfoCircle size={16} />}
                                color="blue"
                                variant="light"
                                mb="md"
                            >
                                <Group justify="space-between">
                                    <Text size="sm">
                                        Create an account to save connections and access advanced features
                                    </Text>
                                    <Button size="xs" variant="light" component={Link} to="/signup">
                                        Sign Up Free
                                    </Button>
                                </Group>
                            </Alert>
                        )}
                    </div>

                    <Group gap="xs">
                        <Button
                            leftSection={<IconPlus size={16} />}
                            size="sm"
                            onClick={() => navigate('/connections')}
                        >
                            Add Connection
                        </Button>
                        <Button
                            variant="light"
                            leftSection={<IconEye size={16} />}
                            size="sm"
                            onClick={() => navigate('/connections')}
                        >
                            View All
                        </Button>
                    </Group>
                </Group>
            </Card>

            {/* Stats Grid */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </SimpleGrid>

            {/* Main Content Grid */}
            <Grid>
                {/* Quick Actions */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                        <Group justify="space-between" mb="md">
                            <Title order={3} size="h4">
                                Quick Actions
                            </Title>
                            <ThemeIcon variant="light" color="blue">
                                <IconBolt size={16} />
                            </ThemeIcon>
                        </Group>

                        <Stack gap="sm">
                            {quickActions.map((action, index) => (
                                <QuickAction key={index} {...action} />
                            ))}
                        </Stack>
                    </Card>
                </Grid.Col>

                {/* Recent Activity */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                        <Group justify="space-between" mb="md">
                            <Title order={3} size="h4">
                                Recent Activity
                            </Title>
                            <ThemeIcon variant="light" color="orange">
                                <IconClock size={16} />
                            </ThemeIcon>
                        </Group>

                        <ScrollArea h={300}>
                            <Stack gap="sm">
                                {recentActivity.length === 0 ? (
                                    <Center py="xl">
                                        <Text c="dimmed" size="sm">
                                            No recent activity
                                        </Text>
                                    </Center>
                                ) : (
                                    recentActivity.map((activity) => {
                                        const Icon = getActivityIcon(activity.type, activity.status);
                                        const color = getActivityColor(activity.status);

                                        return (
                                            <Group key={activity.id} gap="md" wrap="nowrap">
                                                <ThemeIcon color={color} variant="light" size="md">
                                                    <Icon size={16} />
                                                </ThemeIcon>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Text size="sm" fw={500} truncate>
                                                        {activity.title}
                                                    </Text>
                                                    <Text size="xs" c="dimmed" truncate>
                                                        {activity.description}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {dayjs(activity.timestamp).fromNow()}
                                                    </Text>
                                                </div>
                                            </Group>
                                        );
                                    })
                                )}
                            </Stack>
                        </ScrollArea>
                    </Card>
                </Grid.Col>

                {/* Connections Overview */}
                <Grid.Col span={12}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Title order={3} size="h4">
                                Server Connections
                            </Title>
                            <Group gap="xs">
                                <Button
                                    variant="light"
                                    size="xs"
                                    leftSection={<IconPlus size={14} />}
                                    onClick={() => navigate('/connections')}
                                >
                                    Add Server
                                </Button>
                                <Button variant="subtle" size="xs" component={Link} to="/connections">
                                    View All
                                </Button>
                            </Group>
                        </Group>

                        {connectionsLoading ? (
                            <Stack gap="sm">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} height={60} radius="sm" />
                                ))}
                            </Stack>
                        ) : connections && connections.length > 0 ? (
                            <Stack gap="sm">
                                {connections.slice(0, 5).map((connection) => {
                                    const isConnected = connection.lastUsed &&
                                        new Date(connection.lastUsed) > new Date(Date.now() - 5 * 60 * 1000);

                                    return (
                                        <Group key={connection.id} justify="space-between" p="sm" style={{ border: '1px solid var(--mantine-color-gray-2)', borderRadius: 'var(--mantine-radius-sm)' }}>
                                            <Group gap="md">
                                                <Avatar color="blue" radius="sm">
                                                    <IconServer size={18} />
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={500}>
                                                        {connection.name}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {connection.username}@{connection.host}:{connection.port}
                                                    </Text>
                                                </div>
                                            </Group>

                                            <Group gap="xs">
                                                <Badge
                                                    color={isConnected ? 'green' : 'gray'}
                                                    variant="light"
                                                    size="sm"
                                                >
                                                    {isConnected ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <ActionIcon variant="subtle" color="gray" size="sm">
                                                    <IconEye size={14} />
                                                </ActionIcon>
                                                <ActionIcon variant="subtle" color="blue" size="sm">
                                                    <IconEdit size={14} />
                                                </ActionIcon>
                                            </Group>
                                        </Group>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Center py="xl">
                                <Stack align="center" gap="md">
                                    <ThemeIcon size="xl" variant="light" color="gray">
                                        <IconServer size={24} />
                                    </ThemeIcon>
                                    <div style={{ textAlign: 'center' }}>
                                        <Text size="lg" fw={500} mb="xs">
                                            No connections yet
                                        </Text>
                                        <Text size="sm" c="dimmed" mb="md">
                                            Add your first server connection to get started
                                        </Text>
                                        <Button
                                            leftSection={<IconPlus size={16} />}
                                            onClick={() => navigate('/connections')}
                                        >
                                            Add Connection
                                        </Button>
                                    </div>
                                </Stack>
                            </Center>
                        )}
                    </Card>
                </Grid.Col>
            </Grid>
        </Stack>
    );
}; 