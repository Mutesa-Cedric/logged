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
    Radio,
    Stack,
    Text,
    TextInput,
    Textarea,
    Title,
    FileInput,
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
    IconTrash,
    IconUpload,
    IconKey
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
import { useAtom } from 'jotai';
import { isGuestModeAtom } from '../store/atoms';

interface ConnectionForm {
    name: string;
    host: string;
    port: number;
    username: string;
    authType: 'password' | 'key';
    password: string;
    privateKey: string;
    passphrase: string;
}

const validatePrivateKey = (key: string): boolean => {
    if (!key.trim()) return false;
    
    const validHeaders = [
        '-----BEGIN PRIVATE KEY-----',
        '-----BEGIN RSA PRIVATE KEY-----',
        '-----BEGIN OPENSSH PRIVATE KEY-----',
        '-----BEGIN EC PRIVATE KEY-----',
        '-----BEGIN DSA PRIVATE KEY-----',
        '-----BEGIN ENCRYPTED PRIVATE KEY-----'
    ];
    
    const validFooters = [
        '-----END PRIVATE KEY-----',
        '-----END RSA PRIVATE KEY-----',
        '-----END OPENSSH PRIVATE KEY-----',
        '-----END EC PRIVATE KEY-----',
        '-----END DSA PRIVATE KEY-----',
        '-----END ENCRYPTED PRIVATE KEY-----'
    ];
    
    const hasValidHeader = validHeaders.some(header => key.includes(header));
    const hasValidFooter = validFooters.some(footer => key.includes(footer));
    
    return hasValidHeader && hasValidFooter;
};

export const ConnectionsPage = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [editingConnection, setEditingConnection] = useState<ServerConnection | null>(null);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isGuestMode] = useAtom(isGuestModeAtom);

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
            authType: 'password',
            password: '',
            privateKey: '',
            passphrase: '',
        },
        validate: {
            name: (value) => (value.length < 1 ? 'Name is required' : null),
            host: (value) => (value.length < 1 ? 'Host is required' : null),
            username: (value) => (value.length < 1 ? 'Username is required' : null),
            password: (value, values) => {
                if (values.authType === 'password' && value.length < 1) {
                    return 'Password is required';
                }
                return null;
            },
            privateKey: (value, values) => {
                if (values.authType === 'key') {
                    if (!value) {
                        return 'Private key is required';
                    }
                    if (!validatePrivateKey(value)) {
                        return 'Invalid private key format. Please ensure it starts with -----BEGIN and ends with -----END.';
                    }
                }
                return null;
            },
            port: (value) => (value < 1 || value > 65535 ? 'Port must be between 1-65535' : null),
        },
    });

        const handleSubmit = async (values: ConnectionForm) => {
        try {
            const privateKeyContent = values.authType === 'key' ? values.privateKey : '';

            const connectionData: CreateConnectionData = {
                name: values.name,
                host: values.host,
                port: values.port,
                username: values.username,
                ...(values.authType === 'password' 
                    ? (isGuestMode ? {
                        tempPassword: values.password
                    } : {
                        encryptedPassword: {
                            encryptedData: btoa(values.password),
                            salt: 'demo-salt'
                        }
                    })
                    : (isGuestMode ? {
                        tempPrivateKey: privateKeyContent,
                        tempPassphrase: values.passphrase
                    } : {
                        encryptedPrivateKey: {
                            encryptedData: btoa(privateKeyContent),
                            salt: 'demo-salt'
                        },
                        encryptedPassphrase: values.passphrase ? {
                            encryptedData: btoa(values.passphrase),
                            salt: 'demo-salt'
                        } : undefined
                    })
                )
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
        
        const hasKey = connection.encryptedPrivateKey || connection.tempPrivateKey;
        
        form.setValues({
            name: connection.name,
            host: connection.host,
            port: connection.port,
            username: connection.username,
            authType: hasKey ? 'key' : 'password',
            password: '',
            privateKey: '',
            passphrase: '',
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
            const privateKeyContent = values.authType === 'key' ? values.privateKey : '';

            const testData = {
                host: values.host,
                port: values.port,
                username: values.username,
                ...(values.authType === 'password' 
                    ? { password: values.password }
                    : { 
                        privateKey: privateKeyContent,
                        passphrase: values.passphrase || undefined
                    }
                )
            };

            const success = await testConnection.mutateAsync(testData);

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
                </Card>
            )}

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

                        <Radio.Group label="Authentication Type" {...form.getInputProps('authType')}>
                            <Radio value="password" label="Password" className='mt-2' />
                            <Radio value="key" label="SSH Key" className='mt-2' />
                        </Radio.Group>

                        {form.values.authType === 'password' && (
                            <PasswordInput
                                label="Password"
                                placeholder="••••••••"
                                required
                                {...form.getInputProps('password')}
                            />
                        )}

                        {form.values.authType === 'key' && (
                            <>
                                <div>
                                    <Text size="sm" fw={500} mb="xs">
                                        Private Key
                                    </Text>
                                    <Group gap="xs" mb="xs">
                                        <FileInput
                                            placeholder="Upload key file"
                                            accept=".pem,.key,.ppk"
                                            leftSection={<IconUpload size={14} />}
                                            style={{ flex: 1 }}
                                            onChange={async (file) => {
                                                if (file) {
                                                    const content = await file.text();
                                                    form.setFieldValue('privateKey', content);
                                                }
                                            }}
                                        />
                                        <Button
                                            variant="light"
                                            size="xs"
                                            leftSection={<IconKey size={14} />}
                                            onClick={() => form.setFieldValue('privateKey', '')}
                                        >
                                            Clear
                                        </Button>
                                    </Group>
                                    <Textarea
                                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                                        minRows={4}
                                        maxRows={8}
                                        {...form.getInputProps('privateKey')}
                                        autosize
                                    />
                                </div>
                                <PasswordInput
                                    label="Passphrase (optional)"
                                    placeholder="Enter passphrase if your key is encrypted"
                                    {...form.getInputProps('passphrase')}
                                />
                            </>
                        )}

                        {testResult && (
                            <Alert
                                icon={testResult.success ? <IconPlugConnected size={16} /> : <IconPlugConnectedX size={16} />}
                                color={testResult.success ? 'green' : 'red'}
                                variant="light"
                            >
                                {testResult.message}
                            </Alert>
                        )}

                        <Group justify="apart" mt="sm">
                            <Button
                                variant="light"
                                color="blue"
                                leftSection={<IconPlugConnected size={16} />}
                                onClick={() => handleTestFormConnection(form.values)}
                                loading={isTestingConnection}
                                disabled={
                                    !form.isValid() ||
                                    form.values.name === '' ||
                                    form.values.host === '' ||
                                    form.values.username === '' ||
                                    (form.values.authType === 'password' && form.values.password === '') ||
                                    (form.values.authType === 'key' && form.values.privateKey === '')
                                }
                                w="100%"
                            >
                                Test Connection
                            </Button>

                            <Group w="100%" mt={'lg'}>
                                <Button variant="subtle" >
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