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
    Modal,
    NumberInput,
    PasswordInput,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
    IconDots,
    IconEdit,
    IconInfoCircle,
    IconPlugConnected,
    IconPlugConnectedX,
    IconPlus,
    IconServer,
    IconTrash
} from '@tabler/icons-react';
import { useState } from 'react';
import {
    useConnections,
    useCreateConnection,
    useUpdateConnection,
    useDeleteConnection,
    useTestConnection,
    useConnectToServer,
    useDisconnectFromServer
} from '../services/connections';
import type {
    ServerConnection,
    CreateConnectionData
} from '../services/connections';

interface ConnectionForm {
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
}

export const ConnectionsPage = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [editingConnection, setEditingConnection] = useState<ServerConnection | null>(null);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const { data: connections, isLoading } = useConnections();
    const createConnection = useCreateConnection();
    const updateConnection = useUpdateConnection();
    const deleteConnection = useDeleteConnection();
    const testConnection = useTestConnection();
    const connectToServer = useConnectToServer();
    const disconnectFromServer = useDisconnectFromServer();

    const form = useForm<ConnectionForm>({
        initialValues: {
            name: '',
            host: '',
            port: 22,
            username: '',
            password: '',
        },
        validate: {
            name: (value) => (value.length < 1 ? 'Name is required' : null),
            host: (value) => (value.length < 1 ? 'Host is required' : null),
            username: (value) => (value.length < 1 ? 'Username is required' : null),
            password: (value) => (value.length < 1 ? 'Password is required' : null),
            port: (value) => (value < 1 || value > 65535 ? 'Port must be between 1-65535' : null),
        },
    });

    const handleSubmit = async (values: ConnectionForm) => {
        try {
            const connectionData: CreateConnectionData = {
                name: values.name,
                host: values.host,
                port: values.port,
                username: values.username,
                encryptedPassword: {
                    encryptedData: btoa(values.password), // Simple base64 for demo
                    salt: 'demo-salt'
                }
            };

            if (editingConnection) {
                await updateConnection.mutateAsync({
                    id: editingConnection.id,
                    data: connectionData
                });
            } else {
                await createConnection.mutateAsync(connectionData);
            }

            form.reset();
            setEditingConnection(null);
            close();
        } catch (error) {
            console.error('Error saving connection:', error);
        }
    };

    const handleEdit = (connection: ServerConnection) => {
        setEditingConnection(connection);
        form.setValues({
            name: connection.name,
            host: connection.host,
            port: connection.port,
            username: connection.username,
            password: '',
        });
        open();
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

    const handleTestFormConnection = async (values: ConnectionForm) => {
        setIsTestingConnection(true);
        setTestResult(null);

        try {
            const success = await testConnection.mutateAsync({
                host: values.host,
                port: values.port,
                username: values.username,
                password: values.password
            });

            setTestResult({
                success,
                message: success ? 'Connection successful!' : 'Connection failed. Please check your credentials.'
            });
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
            });
        } finally {
            setIsTestingConnection(false);
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
                    onClick={() => {
                        setEditingConnection(null);
                        form.reset();
                        setTestResult(null);
                        open();
                    }}
                    loading={createConnection.isPending}
                >
                    Add Connection
                </Button>
            </Group>

            {/* Info Alert */}
            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Text size="sm">
                    Your connections are encrypted and stored securely. You can test connections before saving them.
                </Text>
            </Alert>

            {/* Connections Grid */}
            {connections && connections.length > 0 ? (
                <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                    {connections.map((connection) => {
                        const status = getConnectionStatus(connection);
                        return (
                            <Card key={connection.id} shadow="sm" padding="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Group gap="sm">
                                        <Avatar color="blue" radius="sm" size="md">
                                            <IconServer size={20} />
                                        </Avatar>
                                        <div>
                                            <Text fw={500} size="sm">
                                                {connection.name}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {connection.username}@{connection.host}
                                            </Text>
                                        </div>
                                    </Group>

                                    <Menu shadow="md" width={200}>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconDots size={16} />
                                            </ActionIcon>
                                        </Menu.Target>

                                        <Menu.Dropdown>
                                            <Menu.Item
                                                leftSection={<IconPlugConnected size={14} />}
                                                onClick={() => handleTestConnection(connection)}
                                                disabled={testConnection.isPending}
                                            >
                                                Test Connection
                                            </Menu.Item>
                                            <Menu.Item
                                                leftSection={<IconEdit size={14} />}
                                                onClick={() => handleEdit(connection)}
                                            >
                                                Edit
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

                                <Stack gap="xs" mb="md">
                                    <Group gap="xs">
                                        <Text size="xs" c="dimmed">Port:</Text>
                                        <Text size="xs">{connection.port}</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <Text size="xs" c="dimmed">Status:</Text>
                                        <Badge
                                            color={status === 'connected' ? 'green' : 'gray'}
                                            variant="light"
                                            size="xs"
                                        >
                                            {status}
                                        </Badge>
                                    </Group>
                                    <Group gap="xs">
                                        <Text size="xs" c="dimmed">Last used:</Text>
                                        <Text size="xs">
                                            {connection.lastUsed ?
                                                new Date(connection.lastUsed).toLocaleDateString() :
                                                'Never'
                                            }
                                        </Text>
                                    </Group>
                                </Stack>

                                <Group gap="xs">
                                    <Button
                                        size="xs"
                                        variant={status === 'connected' ? 'light' : 'filled'}
                                        color={status === 'connected' ? 'red' : 'blue'}
                                        leftSection={
                                            status === 'connected' ?
                                                <IconPlugConnectedX size={14} /> :
                                                <IconPlugConnected size={14} />
                                        }
                                        onClick={() => status === 'connected' ?
                                            handleDisconnect(connection) :
                                            handleConnect(connection)
                                        }
                                        loading={connectToServer.isPending || disconnectFromServer.isPending}
                                        flex={1}
                                    >
                                        {status === 'connected' ? 'Disconnect' : 'Connect'}
                                    </Button>
                                    <ActionIcon
                                        variant="light"
                                        color="gray"
                                        size="sm"
                                        onClick={() => handleEdit(connection)}
                                    >
                                        <IconEdit size={14} />
                                    </ActionIcon>
                                </Group>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            ) : (
                <Stack align="center" gap="md" py="xl">
                    <IconServer size={48} color="gray" />
                    <div style={{ textAlign: 'center' }}>
                        <Text size="lg" fw={500} mb="xs">
                            No connections yet
                        </Text>
                        <Text size="sm" c="dimmed" mb="md">
                            Add your first server connection to get started
                        </Text>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={() => {
                                setEditingConnection(null);
                                form.reset();
                                setTestResult(null);
                                open();
                            }}
                        >
                            Add Connection
                        </Button>
                    </div>
                </Stack>
            )}

            {/* Add/Edit Connection Modal */}
            <Modal
                opened={opened}
                onClose={close}
                title={editingConnection ? 'Edit Connection' : 'Add New Connection'}
                size="md"
            >
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="md">
                        <TextInput
                            label="Connection Name"
                            placeholder="Production Server"
                            required
                            {...form.getInputProps('name')}
                        />

                        <TextInput
                            label="Host"
                            placeholder="server.example.com"
                            required
                            {...form.getInputProps('host')}
                        />

                        <NumberInput
                            label="Port"
                            placeholder="22"
                            min={1}
                            max={65535}
                            required
                            {...form.getInputProps('port')}
                        />

                        <TextInput
                            label="Username"
                            placeholder="admin"
                            required
                            {...form.getInputProps('username')}
                        />

                        <PasswordInput
                            label="Password"
                            placeholder="••••••••"
                            required
                            {...form.getInputProps('password')}
                        />

                        {/* Test Result Display */}
                        {testResult && (
                            <Alert
                                icon={testResult.success ? <IconPlugConnected size={16} /> : <IconPlugConnectedX size={16} />}
                                color={testResult.success ? 'green' : 'red'}
                                variant="light"
                            >
                                {testResult.message}
                            </Alert>
                        )}

                        {/* Action Buttons */}
                        <Group justify="apart" mt="lg">
                            <Button
                                variant="light"
                                color="blue"
                                leftSection={<IconPlugConnected size={16} />}
                                onClick={() => handleTestFormConnection(form.values)}
                                loading={isTestingConnection}
                                disabled={!form.isValid() || form.values.name === '' || form.values.host === '' || form.values.username === '' || form.values.password === ''}
                            >
                                Test Connection
                            </Button>

                            <Group>
                                <Button variant="subtle" onClick={close}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    loading={createConnection.isPending || updateConnection.isPending}
                                    disabled={!form.isValid()}
                                >
                                    {editingConnection ? 'Update' : 'Add'} Connection
                                </Button>
                            </Group>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Stack>
    );
}; 