
import { useUser } from '@clerk/clerk-react';
import {
    ActionIcon,
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Center,
    Group,
    Skeleton,
    Stack,
    Text,
    ThemeIcon,
    Title,
    SimpleGrid,
    Box,
} from '@mantine/core';
import {
    IconActivity,
    IconDatabase,
    IconInfoCircle,
    IconPlus,
    IconServer,
    IconSettings,
    IconTerminal2,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAtom, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { addConnectionModalAtom } from '../store/atoms';
import { useConnections } from '../services/connections';
import {
    authModalAtom,
    isGuestModeAtom,
    logStreamingAtom,
    socketConnectedAtom
} from '../store/atoms';

dayjs.extend(relativeTime);

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ size?: number }>;
    color: string;
    description: string;
}

const StatsCard = ({ title, value, icon: Icon, color, description }: StatsCardProps) => {
    return (
        <Card padding="lg" radius="md" withBorder style={{ padding: 'clamp(0.75rem, 2vw, 1.25rem)' }}>
            <Group justify="space-between" align="flex-start">
                <Box>
                    <Text size="sm" c="dimmed" fw={500} mb={4}>
                        {title}
                    </Text>
                    <Text size="xl" fw={700} mb={2} style={{ fontSize: 'clamp(1.125rem, 3vw, 1.25rem)' }}>
                        {value}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {description}
                    </Text>
                </Box>
                <ThemeIcon color={color} variant="light" size="lg">
                    <Icon size={20} />
                </ThemeIcon>
            </Group>
        </Card>
    );
};

interface ConnectionCardProps {
    connection: {
        id: string;
        name: string;
        host: string;
        port: number;
        username: string;
        lastUsed?: string;
    };
    onEdit?: () => void;
    onConnect?: () => void;
}

const ConnectionCard = ({ connection, onEdit, onConnect }: ConnectionCardProps) => {
    const isConnected = connection.lastUsed &&
        new Date(connection.lastUsed) > new Date(Date.now() - 5 * 60 * 1000);

    return (
        <Card padding="md" radius="md" withBorder style={{ padding: 'clamp(0.5rem, 2vw, 1rem)' }}>
            <Stack gap="sm">
                <Group justify="space-between" align="center">
                    <Group gap="md" wrap="nowrap">
                        <Avatar color="blue" size="md" radius="md">
                            <IconServer size={18} />
                        </Avatar>
                        <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={600} truncate>
                                {connection.name}
                            </Text>
                            <Text size="xs" c="dimmed" truncate>
                                {connection.username}@{connection.host}:{connection.port}
                            </Text>
                            {connection.lastUsed && (
                                <Text size="xs" c="dimmed" hiddenFrom="sm">
                                    {dayjs(connection.lastUsed).fromNow()}
                                </Text>
                            )}
                        </Box>
                    </Group>

                    <Group gap="xs" wrap="nowrap">
                        <Badge
                            color={isConnected ? 'green' : 'gray'}
                            variant="light"
                            size="sm"
                        >
                            {isConnected ? 'Active' : 'Inactive'}
                        </Badge>
                        {onConnect && (
                            <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                onClick={onConnect}
                            >
                                <IconTerminal2 size={14} />
                            </ActionIcon>
                        )}
                        {onEdit && (
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                onClick={onEdit}
                                visibleFrom="sm"
                            >
                                <IconSettings size={14} />
                            </ActionIcon>
                        )}
                    </Group>
                </Group>
                {connection.lastUsed && (
                    <Text size="xs" c="dimmed" visibleFrom="sm">
                        Last used {dayjs(connection.lastUsed).fromNow()}
                    </Text>
                )}
            </Stack>
        </Card>
    );
};

export const Dashboard = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [isGuestMode] = useAtom(isGuestModeAtom);
    const [, setAuthModal] = useAtom(authModalAtom);
    const [socketConnected] = useAtom(socketConnectedAtom);
    const [logStreaming] = useAtom(logStreamingAtom);
    const setShowAddConnectionModal = useSetAtom(addConnectionModalAtom);
    const { data: connections, isLoading: connectionsLoading } = useConnections();
    const { logs } = useSocket();

    const connectedConnections = connections?.filter(conn => {
        if (conn.lastUsed) {
            const lastUsed = new Date(conn.lastUsed);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return lastUsed > fiveMinutesAgo;
        }
        return false;
    }) || [];

    const toPath = (base: string) => (isGuestMode ? `/guest${base}` : base);

    const stats = [
        {
            title: 'Connections',
            value: connections?.length || 0,
            icon: IconDatabase,
            color: 'blue',
            description: isGuestMode ? 'Local storage' : 'Saved securely',
        },
        {
            title: 'Active Sessions',
            value: connectedConnections.length,
            icon: IconActivity,
            color: 'green',
            description: 'Currently connected',
        },
        {
            title: 'Socket Status',
            value: socketConnected ? 'Connected' : 'Disconnected',
            icon: IconServer,
            color: socketConnected ? 'green' : 'red',
            description: 'Real-time status',
        },
        {
            title: 'Log Entries',
            value: logs?.length || 0,
            icon: IconTerminal2,
            color: logStreaming ? 'orange' : 'gray',
            description: logStreaming ? 'Live streaming' : 'Cached',
        },
    ];

    return (
        <Stack gap="xl">
            {/* Header Section */}
            <Card padding="xl" radius="md" withBorder style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                <Stack gap="md">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                            <Title order={2} mb="xs" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>
                                Welcome back, {isGuestMode ? 'Guest' : user?.firstName || 'User'}! 👋
                            </Title>
                            <Text c="dimmed" size="sm" mb="md">
                                {isGuestMode
                                    ? 'You\'re in guest mode. Sign up to save your data permanently.'
                                    : 'Here\'s your server management overview.'
                                }
                            </Text>
                        </Box>

                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={() => setShowAddConnectionModal({ open: true, editingConnection: null })}
                            size="sm"
                            visibleFrom="xs"
                        >
                            <Text hiddenFrom="sm">Add</Text>
                            <Text visibleFrom="sm">Add Connection</Text>
                        </Button>
                    </Group>

                    {isGuestMode && (
                        <Alert
                            icon={<IconInfoCircle size={16} />}
                            color="blue"
                            variant="light"
                        >
                            <Stack gap="xs">
                                <Text size="sm">
                                    Create an account to save connections and access all features
                                </Text>
                                <Button
                                    size="xs"
                                    variant="light"
                                    onClick={() => setAuthModal({ open: true, mode: 'signUp' })}
                                    style={{ width: '100%' }}
                                >
                                    Sign Up
                                </Button>
                            </Stack>
                        </Alert>
                    )}

                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setShowAddConnectionModal({ open: true, editingConnection: null })}
                        hiddenFrom="xs"
                        fullWidth
                    >
                        Add Connection
                    </Button>
                </Stack>
            </Card>

            {/* Stats Overview */}
            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </SimpleGrid>

            {/* Connections Section */}
            <Card padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="lg">
                    <Title order={3} size="h4">
                        Recent Connections
                    </Title>
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => navigate(toPath('/connections'))}
                    >
                        View All
                    </Button>
                </Group>

                {connectionsLoading ? (
                    <Stack gap="sm">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} height={70} radius="md" />
                        ))}
                    </Stack>
                ) : connections && connections.length > 0 ? (
                    <Stack gap="sm">
                        {connections.slice(0, 4).map((connection) => (
                            <ConnectionCard
                                key={connection.id}
                                connection={connection}
                                onEdit={() => navigate(toPath('/connections'))}
                                onConnect={() => navigate(toPath('/logs'))}
                            />
                        ))}
                    </Stack>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="md">
                            <ThemeIcon size="xl" variant="light" color="gray">
                                <IconServer size={28} />
                            </ThemeIcon>
                            <Box ta="center">
                                <Text fw={500} mb="xs">
                                    No connections yet
                                </Text>
                                <Text size="sm" c="dimmed" mb="lg">
                                    Add your first server connection to get started
                                </Text>
                                <Button
                                    leftSection={<IconPlus size={16} />}
                                    onClick={() => navigate(toPath('/connections'))}
                                >
                                    Add Connection
                                </Button>
                            </Box>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}; 