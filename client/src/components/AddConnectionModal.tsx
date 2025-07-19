import {
    Alert,
    Button,
    FileInput,
    Group,
    Modal,
    NumberInput,
    PasswordInput,
    Radio,
    Stack,
    Text,
    TextInput,
    Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
    IconKey,
    IconPlugConnected,
    IconPlugConnectedX,
    IconUpload
} from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { encryptionManager } from '../lib/encryption';
import type { CreateConnectionData } from '../services/connections';
import {
    useCreateConnection,
    useTestConnection,
    useUpdateConnection,
} from '../services/connections';
import { addConnectionModalAtom, encryptionEnabledAtom, isGuestModeAtom } from '../store/atoms';
import { MasterKeySetup } from './MasterKeySetup';

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


export const AddConnectionModal = () => {
    const [modalState, setModalState] = useAtom(addConnectionModalAtom);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isGuestMode] = useAtom(isGuestModeAtom);
    const [encryptionEnabled] = useAtom(encryptionEnabledAtom);
    const [showMasterKeySetup, setShowMasterKeySetup] = useState(false);
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
    };

    const handleSubmit = async (values: ConnectionForm) => {
        if (!isGuestMode && !encryptionEnabled) {
            setShowMasterKeySetup(true);
            return;
        }

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
                        encryptedPassword: encryptionManager.encryptPassword(values.password)
                    })
                    : (isGuestMode ? {
                        tempPrivateKey: privateKeyContent,
                        tempPassphrase: values.passphrase
                    } : {
                        encryptedPrivateKey: encryptionManager.encryptPrivateKey(privateKeyContent),
                        encryptedPassphrase: values.passphrase ? encryptionManager.encryptPassword(values.passphrase) : undefined
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
            navigate(toPath('/connections'));
        } catch (error) {
            console.error('Error saving connection:', error);
            if (error instanceof Error && error.message.includes('encryption')) {
                setTestResult({
                    success: false,
                    message: 'Encryption error: ' + error.message
                });
            }
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

    useEffect(() => {
        if (modalState.editingConnection) {
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
        } else {
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalState.editingConnection]);

    const handleMasterKeySetup = (newMasterKey: string) => {
        encryptionManager.setMasterKey(newMasterKey);
        setShowMasterKeySetup(false);
    };

    return (
        <>
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
                            <Radio value="password" label="Password" mt="md" />
                            <Radio value="key" label="SSH Key" mt="md" />
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

            <MasterKeySetup
                opened={showMasterKeySetup}
                onClose={() => setShowMasterKeySetup(false)}
                onSetup={handleMasterKeySetup}
            />
        </>
    );
};