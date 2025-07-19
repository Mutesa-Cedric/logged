import {
    Modal,
    Stack,
    Text,
    PasswordInput,
    Button,
    Group,
    Alert,
    Progress,
    List,
    ThemeIcon,
    Title
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { IconCheck, IconX, IconKey, IconShield, IconLock } from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { useUser } from '@clerk/clerk-react';
import { masterKeyAtom, encryptionEnabledAtom } from '../store/atoms';
import { encryptionManager } from '../lib/encryption';

interface MasterKeySetupProps {
    opened: boolean;
    onClose: () => void;
    onSetup: (masterKey: string) => void;
}

export const MasterKeySetup = ({ opened, onClose, onSetup }: MasterKeySetupProps) => {
    const [masterKey, setMasterKey] = useState('');
    const [confirmKey, setConfirmKey] = useState('');
    const [, setMasterKeyAtom] = useAtom(masterKeyAtom);
    const [, setEncryptionEnabled] = useAtom(encryptionEnabledAtom);
    const [error, setError] = useState('');
    const { user } = useUser();

    const getPasswordStrength = (password: string) => {
        let score = 0;
        if (password.length >= 8) score += 20;
        if (password.length >= 12) score += 20;
        if (/[a-z]/.test(password)) score += 15;
        if (/[A-Z]/.test(password)) score += 15;
        if (/[0-9]/.test(password)) score += 15;
        if (/[^A-Za-z0-9]/.test(password)) score += 15;
        return score;
    };

    const passwordStrength = getPasswordStrength(masterKey);
    const isPasswordStrong = passwordStrength >= 80;
    const passwordsMatch = masterKey === confirmKey && masterKey.length > 0;

    const getStrengthColor = () => {
        if (passwordStrength < 40) return 'red';
        if (passwordStrength < 80) return 'yellow';
        return 'green';
    };

    const getStrengthLabel = () => {
        if (passwordStrength < 40) return 'Weak';
        if (passwordStrength < 80) return 'Medium';
        return 'Strong';
    };

    const handleSetup = async () => {
        if (!isPasswordStrong) {
            setError('Password is too weak. Please choose a stronger password.');
            return;
        }

        if (!passwordsMatch) {
            setError('Passwords do not match.');
            return;
        }

        if (masterKey.length < 8) {
            setError('Master key must be at least 8 characters long.');
            return;
        }

        if (!user?.id) {
            setError('User not authenticated. Please sign in first.');
            return;
        }

        try {
            encryptionManager.setMasterKey(masterKey);
            await encryptionManager.saveMasterKeyToDatabase(masterKey, user.id);
            setMasterKeyAtom(masterKey);
            setEncryptionEnabled(true);
            onSetup(masterKey);
            onClose();
        } catch (error) {
            setError('Failed to set up encryption: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleGenerateKey = () => {
        const generated = encryptionManager.generateSecurePassword(16);
        setMasterKey(generated);
        setConfirmKey(generated);
    };

    useEffect(() => {
        setError('');
    }, [masterKey, confirmKey]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <ThemeIcon variant="light" color="blue" size="sm">
                        <IconKey size={16} />
                    </ThemeIcon>
                    <Title order={4}>Set Up Encryption</Title>
                </Group>
            }
            size="md"
            closeOnClickOutside={false}
            closeOnEscape={false}
        >
            <Stack gap="md">
                <Alert icon={<IconShield size={16} />} color="blue" variant="light">
                    <Text size="sm">
                        Create a master key to encrypt your connection credentials. 
                        This key will be used to securely store passwords and SSH keys.
                    </Text>
                </Alert>

                <Stack gap="xs">
                    <Text size="sm" fw={500}>Security Requirements:</Text>
                    <List size="xs" spacing="xs">
                        <List.Item
                            icon={
                                <ThemeIcon size={16} color={masterKey.length >= 8 ? 'green' : 'gray'} variant="light">
                                    {masterKey.length >= 8 ? <IconCheck size={12} /> : <IconX size={12} />}
                                </ThemeIcon>
                            }
                        >
                            At least 8 characters long
                        </List.Item>
                        <List.Item
                            icon={
                                <ThemeIcon size={16} color={/[A-Z]/.test(masterKey) ? 'green' : 'gray'} variant="light">
                                    {/[A-Z]/.test(masterKey) ? <IconCheck size={12} /> : <IconX size={12} />}
                                </ThemeIcon>
                            }
                        >
                            Contains uppercase letters
                        </List.Item>
                        <List.Item
                            icon={
                                <ThemeIcon size={16} color={/[a-z]/.test(masterKey) ? 'green' : 'gray'} variant="light">
                                    {/[a-z]/.test(masterKey) ? <IconCheck size={12} /> : <IconX size={12} />}
                                </ThemeIcon>
                            }
                        >
                            Contains lowercase letters
                        </List.Item>
                        <List.Item
                            icon={
                                <ThemeIcon size={16} color={/[0-9]/.test(masterKey) ? 'green' : 'gray'} variant="light">
                                    {/[0-9]/.test(masterKey) ? <IconCheck size={12} /> : <IconX size={12} />}
                                </ThemeIcon>
                            }
                        >
                            Contains numbers
                        </List.Item>
                        <List.Item
                            icon={
                                <ThemeIcon size={16} color={/[^A-Za-z0-9]/.test(masterKey) ? 'green' : 'gray'} variant="light">
                                    {/[^A-Za-z0-9]/.test(masterKey) ? <IconCheck size={12} /> : <IconX size={12} />}
                                </ThemeIcon>
                            }
                        >
                            Contains special characters
                        </List.Item>
                    </List>
                </Stack>

                <PasswordInput
                    label="Master Key"
                    placeholder="Enter a strong master key"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.currentTarget.value)}
                    required
                    leftSection={<IconLock size={16} />}
                />

                {masterKey && (
                    <Stack gap="xs">
                        <Text size="xs" c="dimmed">Password Strength: {getStrengthLabel()}</Text>
                        <Progress value={passwordStrength} color={getStrengthColor()} size="sm" />
                    </Stack>
                )}

                <PasswordInput
                    label="Confirm Master Key"
                    placeholder="Confirm your master key"
                    value={confirmKey}
                    onChange={(e) => setConfirmKey(e.currentTarget.value)}
                    required
                    error={confirmKey && !passwordsMatch ? 'Passwords do not match' : undefined}
                    leftSection={<IconLock size={16} />}
                />

                {error && (
                    <Alert icon={<IconX size={16} />} color="red" variant="light">
                        {error}
                    </Alert>
                )}

                <Button
                    variant="subtle"
                    onClick={handleGenerateKey}
                    leftSection={<IconKey size={16} />}
                >
                    Generate Secure Key
                </Button>

                <Group justify="space-between" mt="md">
                    <Button variant="subtle" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSetup}
                        disabled={!isPasswordStrong || !passwordsMatch}
                        leftSection={<IconShield size={16} />}
                    >
                        Enable Encryption
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};