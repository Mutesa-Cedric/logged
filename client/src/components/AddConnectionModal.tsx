import {
    Alert,
    Button,
    Group,
    Modal,
    NumberInput,
    PasswordInput,
    Radio,
    Stack,
    Text,
    TextInput,
    Textarea,
    FileInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
    IconPlugConnected,
    IconPlugConnectedX,
    IconUpload,
    IconKey
} from '@tabler/icons-react';
import { useState } from 'react';
import {
    useCreateConnection,
    useUpdateConnection,
    useTestConnection,
} from '../services/connections';
import type {
    ServerConnection,
    CreateConnectionData
} from '../services/connections';
import { useAtom } from 'jotai';
import { isGuestModeAtom, addConnectionModalAtom } from '../store/atoms';
import { useNavigate } from 'react-router-dom';

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

interface AddConnectionModalProps {
    editingConnection?: ServerConnection | null;
}

export const AddConnectionModal = ({ editingConnection }: AddConnectionModalProps) => {
    const [modalState, setModalState] = useAtom(addConnectionModalAtom);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isGuestMode] = useAtom(isGuestModeAtom);
    const navigate = useNavigate();
    const createConnection = useCreateConnection();
    const updateConnection = useUpdateConnection();
    const testConnection = useTestConnection();

    const toPath = (base: string) => (isGuestMode ? `/guest${base}` : base);

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

    const handleClose = () => {
        setModalState({ open: false, editingConnection: null });
        form.reset();
        setTestResult(null);
        navigate(toPath('/connections'));
    };

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

            if (modalState.editingConnection) {
                await updateConnection.mutateAsync({
                    id: modalState.editingConnection.id,
                    data: connectionData
                });
            } else {
                await createConnection.mutateAsync(connectionData);
            }

            handleClose();
        } catch (error) {
            console.error('Error saving connection:', error);
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

    // Update form when editing connection changes
    if (modalState.editingConnection && modalState.editingConnection !== editingConnection) {
        const connection = modalState.editingConnection;
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
    }

    return (
        <Modal
            opened={modalState.open}
            onClose={handleClose}
            title={modalState.editingConnection ? 'Edit Connection' : 'Add New Connection'}
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
                            <Button variant="subtle" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={createConnection.isPending || updateConnection.isPending}
                                disabled={!form.isValid()}
                            >
                                {modalState.editingConnection ? 'Update' : 'Add'} Connection
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};