import { SignIn } from '@clerk/clerk-react';
import { Container, Paper, Title, Text, Center, Group, ActionIcon, Stack, Box, useMantineTheme } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconCode, IconArrowLeft } from '@tabler/icons-react';
import { useTheme, themeUtils } from '../lib/theme';

export const LoginPage = () => {
    const theme = useMantineTheme();
    const { isDark } = useTheme();

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: isDark
                    ? themeUtils.getGradient('dark')
                    : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: theme.spacing.md,
            }}
        >
            <Container size="xs" w="100%">
                <Stack gap="xl">
                    {/* Header */}
                    <Center>
                        <Group gap="xs">
                            <ActionIcon
                                variant="gradient"
                                gradient={{ from: 'blue', to: 'violet' }}
                                size="lg"
                                radius="md"
                                style={{ transition: themeUtils.transitions.normal }}
                            >
                                <IconCode size={20} />
                            </ActionIcon>
                            <Title
                                order={1}
                                size="h2"
                                style={{
                                    background: themeUtils.getGradient('primary'),
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
                        radius="xl"
                        withBorder
                        style={{
                            background: themeUtils.getThemedColor(
                                'linear-gradient(145deg, #ffffff 0%, #fafafa 100%)',
                                'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                                isDark
                            ),
                            border: `1px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[7], isDark)}`,
                            transition: themeUtils.transitions.normal,
                        }}
                    >
                        <Stack gap="lg" align="center">
                            <div>
                                <Title order={2} ta="center" size="h3" mb="xs">
                                    Welcome Back
                                </Title>
                                <Text ta="center" c="dimmed" size="sm">
                                    Sign in to access your saved connections and settings
                                </Text>
                            </div>

                            <SignIn
                                afterSignInUrl="/dashboard"
                                signUpUrl="/signup"
                                appearance={{
                                    variables: {
                                        colorPrimary: theme.colors.blue[6],
                                        colorBackground: 'transparent',
                                        colorInputBackground: themeUtils.getThemedColor('#ffffff', '#1e293b', isDark),
                                        colorInputText: themeUtils.getThemedColor('#1e293b', '#f1f5f9', isDark),
                                        colorText: themeUtils.getThemedColor('#1e293b', '#f1f5f9', isDark),
                                        colorTextSecondary: themeUtils.getThemedColor('#64748b', '#94a3b8', isDark),
                                        colorShimmer: themeUtils.getThemedColor('#f1f5f9', '#334155', isDark),
                                        borderRadius: '8px',
                                        fontFamily: theme.fontFamily,
                                    },
                                    elements: {
                                        rootBox: {
                                            width: '100%',
                                        },
                                        card: {
                                            boxShadow: 'none',
                                            border: 'none',
                                            background: 'transparent',
                                        },
                                        headerTitle: {
                                            display: 'none',
                                        },
                                        headerSubtitle: {
                                            display: 'none',
                                        },
                                        formButtonPrimary: {
                                            background: themeUtils.getGradient('primary'),
                                            border: 'none',
                                            borderRadius: theme.radius.md,
                                            fontWeight: 600,
                                            padding: '12px 24px',
                                            fontSize: '14px',
                                            transition: themeUtils.transitions.normal,
                                            '&:hover': {
                                                background: themeUtils.getGradient('primary'),
                                                transform: 'translateY(-1px)',
                                                boxShadow: themeUtils.shadows.md,
                                                filter: 'brightness(1.1)',
                                            },
                                        },
                                        formFieldInput: {
                                            backgroundColor: themeUtils.getThemedColor('#ffffff', '#1e293b', isDark),
                                            border: `1px solid ${themeUtils.getThemedColor(theme.colors.gray[3], theme.colors.gray[6], isDark)}`,
                                            borderRadius: theme.radius.md,
                                            color: themeUtils.getThemedColor('#1e293b', '#f1f5f9', isDark),
                                            transition: themeUtils.transitions.normal,
                                            '&:focus': {
                                                borderColor: theme.colors.blue[5],
                                                boxShadow: `0 0 0 2px ${theme.colors.blue[1]}`,
                                            },
                                        },
                                        socialButtonsIconButton: {
                                            backgroundColor: themeUtils.getThemedColor('#ffffff', '#334155', isDark),
                                            border: `2px solid ${themeUtils.getThemedColor(theme.colors.gray[3], theme.colors.gray[6], isDark)}`,
                                            borderRadius: theme.radius.md,
                                            transition: themeUtils.transitions.normal,
                                            color: themeUtils.getThemedColor('#374151', '#f1f5f9', isDark),
                                            boxShadow: themeUtils.getThemedColor(themeUtils.shadows.sm, 'none', isDark),
                                            '&:hover': {
                                                backgroundColor: themeUtils.getThemedColor('#f8fafc', '#475569', isDark),
                                                borderColor: themeUtils.getThemedColor(theme.colors.blue[4], theme.colors.blue[5], isDark),
                                                transform: 'translateY(-1px)',
                                                boxShadow: themeUtils.shadows.md,
                                            },
                                        },
                                        dividerLine: {
                                            backgroundColor: themeUtils.getThemedColor(theme.colors.gray[3], theme.colors.gray[6], isDark),
                                        },
                                        dividerText: {
                                            color: themeUtils.getThemedColor('#64748b', '#94a3b8', isDark),
                                        },
                                        footerActionLink: {
                                            color: theme.colors.blue[6],
                                            fontWeight: 500,
                                            transition: themeUtils.transitions.normal,
                                            '&:hover': {
                                                color: theme.colors.blue[7],
                                            },
                                        },
                                    },
                                }}
                            />
                        </Stack>
                    </Paper>

                    {/* Footer Links */}
                    <Stack gap="md" align="center">
                        <Group gap="xs">
                            <Text size="sm" c="dimmed">
                                Don't have an account?
                            </Text>
                            <Text
                                component={Link}
                                to="/signup"
                                size="sm"
                                fw={500}
                                c="blue.6"
                                style={{
                                    textDecoration: 'none',
                                    transition: themeUtils.transitions.normal,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.textDecoration = 'underline';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.textDecoration = 'none';
                                }}
                            >
                                Sign up for free
                            </Text>
                        </Group>

                        <Group gap="xs">
                            <Text size="sm" c="dimmed">
                                Or
                            </Text>
                            <Text
                                component={Link}
                                to="/guest"
                                size="sm"
                                fw={500}
                                c="gray.6"
                                style={{
                                    textDecoration: 'underline',
                                    transition: themeUtils.transitions.normal,
                                }}
                            >
                                continue as guest
                            </Text>
                        </Group>

                        <Group gap="xs" mt="md">
                            <ActionIcon
                                variant="subtle"
                                component={Link}
                                to="/"
                                color="gray"
                                size="sm"
                                style={{ transition: themeUtils.transitions.normal }}
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
        </Box>
    );
}; 