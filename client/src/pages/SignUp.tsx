import { SignUp } from '@clerk/clerk-react';
import { Container, Paper, Title, Text, Center, Group, ActionIcon, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconCode, IconArrowLeft } from '@tabler/icons-react';

export const SignUpPage = () => {
    return (
        <Container size="xs" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <Stack w="100%" gap="lg">
                {/* Header */}
                <Center>
                    <Group gap="xs">
                        <ActionIcon
                            variant="gradient"
                            gradient={{ from: 'blue', to: 'violet' }}
                            size="lg"
                            radius="md"
                        >
                            <IconCode size={20} />
                        </ActionIcon>
                        <Title
                            order={1}
                            size="h2"
                            style={{
                                background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-violet-6))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 700,
                            }}
                        >
                            Logged
                        </Title>
                    </Group>
                </Center>

                {/* Auth Card */}
                <Paper
                    shadow="xl"
                    p="xl"
                    radius="lg"
                    style={{
                        background: 'linear-gradient(145deg, #ffffff 0%, #fafafa 100%)',
                        border: '1px solid var(--mantine-color-gray-2)',
                    }}
                >
                    <Stack gap="md" align="center">
                        <div>
                            <Title order={2} ta="center" size="h3" mb="xs">
                                Get Started
                            </Title>
                            <Text ta="center" c="dimmed" size="sm">
                                Create your free account and start managing server logs
                            </Text>
                        </div>

                        <SignUp
                            afterSignUpUrl="/dashboard"
                            signInUrl="/login"
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    card: "shadow-none border-none bg-transparent",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    formButtonPrimary: {
                                        background: 'linear-gradient(135deg, var(--mantine-color-blue-6), var(--mantine-color-violet-6))',
                                        border: 'none',
                                        borderRadius: 'var(--mantine-radius-md)',
                                        fontWeight: 600,
                                        padding: '12px 24px',
                                        fontSize: '14px',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, var(--mantine-color-blue-7), var(--mantine-color-violet-7))',
                                            transform: 'translateY(-1px)',
                                            boxShadow: 'var(--mantine-shadow-md)',
                                        }
                                    }
                                }
                            }}
                        />
                    </Stack>
                </Paper>

                {/* Footer Links */}
                <Stack gap="xs" align="center">
                    <Group gap="xs">
                        <Text size="sm" c="dimmed">
                            Already have an account?
                        </Text>
                        <Link
                            to="/login"
                            style={{
                                color: 'var(--mantine-color-blue-6)',
                                textDecoration: 'none',
                                fontWeight: 500,
                            }}
                        >
                            Sign in
                        </Link>
                    </Group>

                    <Group gap="xs">
                        <Text size="sm" c="dimmed">
                            Or
                        </Text>
                        <Link
                            to="/guest"
                            style={{
                                color: 'var(--mantine-color-gray-6)',
                                textDecoration: 'underline',
                                fontWeight: 500,
                            }}
                        >
                            continue as guest
                        </Link>
                    </Group>

                    <Group gap="xs" mt="md">
                        <ActionIcon
                            variant="subtle"
                            component={Link}
                            to="/"
                            color="gray"
                            size="sm"
                        >
                            <IconArrowLeft size={16} />
                        </ActionIcon>
                        <Text size="xs" c="dimmed">
                            Back to home
                        </Text>
                    </Group>
                </Stack>
            </Stack>
        </Container>
    );
}; 