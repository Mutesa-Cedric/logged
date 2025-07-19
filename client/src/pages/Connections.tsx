import {
    ActionIcon,
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Group,
    Loader,
    Menu,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import {
    IconDots,
    IconEdit,
    IconInfoCircle,
    IconPlugConnected,
    IconPlugConnectedX,
    IconPlus,
    IconServer,
    IconTrash,
} from '@tabler/icons-react';
import {
    useConnections,
    useDeleteConnection,
    useTestConnection,
    useConnectToServer,
    useDisconnectFromServer
} from '../services/connections';
import type {
    ServerConnection,
} from '../services/connections';
import { useAtom } from 'jotai';
import { isGuestModeAtom, addConnectionModalAtom } from '../store/atoms';


export const ConnectionsPage = () => {
    const [isGuestMode] = useAtom(isGuestModeAtom);
    const [, setAddConnectionModal] = useAtom(addConnectionModalAtom);

    const { data: connections, isLoading } = useConnections();
    const deleteConnection = useDeleteConnection();
    const testConnection = useTestConnection();
    const connectToServer = useConnectToServer();
    const disconnectFromServer = useDisconnectFromServer();


    const handleEdit = (connection: ServerConnection) => {
        setAddConnectionModal({ open: true, editingConnection: connection });
    };

    const handleDelete = async (connection: ServerConnection) => {
        try {
            await deleteConnection.mutateAsync(connection.id);
        } catch (error) {
            console.error('Error deleting connection:', error);
        }
    };

    const handleTestConnection = async (connection: ServerConnection) => {
        try {
            await testConnection.mutateAsync({
                host: connection.host,
                port: connection.port,
                username: connection.username,
                password: 'test-password'
            });
        } catch (error) {
            console.error('Error testing connection:', error);
        }
    };


    const handleConnect = async (connection: ServerConnection) => {
        try {
            await connectToServer.mutateAsync(connection.id);
        } catch (error) {
            console.error('Error connecting:', error);
        }
    };

    const handleDisconnect = async (connection: ServerConnection) => {
        try {
            await disconnectFromServer.mutateAsync(connection.id);
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    const getConnectionStatus = (connection: ServerConnection): 'connected' | 'disconnected' => {
        if (connection.lastUsed) {
            const lastUsed = new Date(connection.lastUsed);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return lastUsed > fiveMinutesAgo ? 'connected' : 'disconnected';
        }
        return 'disconnected';
    };

    if (isLoading) {
        return (
            <Stack gap="lg" align="center" justify="center" h={400}>
                <Loader size="lg" />
                <Text c="dimmed">Loading connections...</Text>
            </Stack>
        );
    }

    return (
        <Stack gap="lg">
            <Group justify="space-between">
                <div>
                    <Title order={2}>Server Connections</Title>
                    <Text c="dimmed" size="sm">
                        Manage your SSH server connections
                    </Text>
                </div>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => setAddConnectionModal({ open: true, editingConnection: null })}
                >
                    Add Connection
                </Button>
            </Group>

            <Alert icon={<IconInfoCircle size={16} />} color={isGuestMode ? "orange" : "blue"} variant="light">
                <Text size="sm">
                    {isGuestMode
                        ? "Guest mode: Connections are stored locally and won't be saved permanently. Sign up to save your connections securely."
                        : "Your connections are encrypted and stored securely. You can test connections before saving them."
                    }
                </Text>
            </Alert>

            {connections && connections.length > 0 ? (
                <Stack gap="sm">
                    {connections.map((connection) => {
                        const status = getConnectionStatus(connection);
                        return (
                            <Card key={connection.id} padding="lg" radius="md" withBorder>
                                <Group justify="space-between" align="center">
                                    <Group gap="md">
                                        <Avatar color="blue" size="md" radius="md">
                                            <IconServer size={18} />
                                        </Avatar>
                                        <div>
                                            <Text fw={600} size="sm">
                                                {connection.name}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {connection.username}@{connection.host}:{connection.port}
                                            </Text>
                                            {connection.lastUsed && (
                                                <Text size="xs" c="dimmed">
                                                    Last used {new Date(connection.lastUsed).toLocaleDateString()}
                                                </Text>
                                            )}
                                        </div>
                                    </Group>

                                    <Group gap="xs">
                                        <Badge
                                            color={status === 'connected' ? 'green' : 'gray'}
                                            variant="light"
                                            size="sm"
                                        >
                                            {status === 'connected' ? 'Active' : 'Inactive'}
                                        </Badge>

                                        <Button
                                            variant="light"
                                            size="xs"
                                            leftSection={<IconPlugConnected size={14} />}
                                            onClick={() => handleTestConnection(connection)}
                                            loading={testConnection.isPending}
                                        >
                                            Test
                                        </Button>

                                        <Button
                                            variant="light"
                                            size="xs"
                                            color="blue"
                                            leftSection={<IconPlugConnected size={14} />}
                                            onClick={() => handleConnect(connection)}
                                            loading={connectToServer.isPending}
                                        >
                                            Connect
                                        </Button>

                                        <Menu width={180}>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray">
                                                    <IconDots size={16} />
                                                </ActionIcon>
                                            </Menu.Target>

                                            <Menu.Dropdown>
                                                <Menu.Item
                                                    leftSection={<IconEdit size={14} />}
                                                    onClick={() => handleEdit(connection)}
                                                >
                                                    Edit Connection
                                                </Menu.Item>
                                                <Menu.Item
                                                    leftSection={<IconPlugConnectedX size={14} />}
                                                    onClick={() => handleDisconnect(connection)}
                                                    disabled={disconnectFromServer.isPending}
                                                >
                                                    Disconnect
                                                </Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Item
                                                    leftSection={<IconTrash size={14} />}
                                                    color="red"
                                                    onClick={() => handleDelete(connection)}
                                                    disabled={deleteConnection.isPending}
                                                >
                                                    Delete
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </Group>
                            </Card>
                        );
                    })}
                </Stack>
            ) : (
                <Card padding="xl" radius="md" withBorder>
                    <Stack align="center" gap="md" py="xl">
                        <IconServer size={48} color="gray" />
                        <div style={{ textAlign: 'center' }}>
                            <Text fw={500} mb="xs">
                                No connections yet
                            </Text>
                            <Text size="sm" c="dimmed" mb="lg">
                                Add your first server connection to get started
                            </Text>
                            <Button
                                leftSection={<IconPlus size={16} />}
                                onClick={() => setAddConnectionModal({ open: true, editingConnection: null })}
                            >
                                Add Connection
                            </Button>
                        </div>
                    </Stack>
                </Card>
            )}

        </Stack>
    );
}; 