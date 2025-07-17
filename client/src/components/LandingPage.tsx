
import {
    Box,
    Button,
    Container,
    Group,
    Stack,
    Text,
    Title,
    SimpleGrid,
    ThemeIcon,
} from '@mantine/core';
import {
    IconCode,
    IconEye,
    IconShield,
    IconTerminal2,
    IconBolt,
    IconDeviceFloppy,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme, themeUtils } from '../lib/theme';
import ThemeToggle from './ThemeToggle';
import { useAtom } from 'jotai';
import { authModalAtom } from '../store/atoms';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [, setAuthModal] = useAtom(authModalAtom);

    const handleGuestAccess = () => {
        navigate('/guest');
    };

    const handleSignIn = () => {
        setAuthModal({ open: true, mode: 'signIn' });
    };

    const handleSignUp = () => {
        setAuthModal({ open: true, mode: 'signUp' });
    };

    const features = [
        {
            icon: IconTerminal2,
            title: 'Log Management',
            description: 'Stream and view server logs in real-time',
        },
        {
            icon: IconShield,
            title: 'Secure Access',
            description: 'SSH connections with encrypted credentials',
        },
        {
            icon: IconBolt,
            title: 'Live Updates',
            description: 'WebSocket-powered real-time streaming',
        },
    ];

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            }}
        >
            {/* Header */}
            <Container size="xl">
                <Group justify="space-between" py="lg">
                    <Group gap="xs">
                        <ThemeIcon
                            variant="filled"
                            gradient={{ from: 'blue', to: 'violet' }}
                            size="lg"
                            radius="md"
                        >
                            <IconCode size={20} />
                        </ThemeIcon>
                        <Title
                            order={2}
                            style={{
                                background: themeUtils.getGradient('primary'),
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Logged
                        </Title>
                    </Group>

                    <Group gap="sm">
                        <ThemeToggle variant="icon" />
                        <Button
                            variant="subtle"
                            onClick={handleSignIn}
                            size="sm"
                        >
                            Sign In
                        </Button>
                        <Button
                            onClick={handleSignUp}
                            size="sm"
                            gradient={{ from: 'blue', to: 'violet' }}
                            variant="gradient"
                        >
                            Sign Up
                        </Button>
                    </Group>
                </Group>
            </Container>

            {/* Hero Section */}
            <Container size="lg" py={120}>
                <Stack align="center" gap="xl" ta="center">
                    <Stack align="center" gap="lg">
                        <Title
                            order={1}
                            size={64}
                            fw={700}
                            lh={1.1}
                            maw={800}
                            style={{
                                color: themeUtils.getThemedColor('#1e293b', '#f1f5f9', isDark),
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Simple Log Management
                        </Title>

                        <Text
                            size="xl"
                            c="dimmed"
                            maw={600}
                            lh={1.6}
                        >
                            View and manage your server logs with real-time streaming,
                            secure connections, and an intuitive interface. Completely free to use.
                        </Text>
                    </Stack>

                    <Group gap="md" justify="center">
                        <Button
                            onClick={handleGuestAccess}
                            size="lg"
                            gradient={{ from: 'blue', to: 'violet' }}
                            variant="gradient"
                            leftSection={<IconEye size={18} />}
                        >
                            Continue as Guest
                        </Button>
                        <Button
                            onClick={handleSignUp}
                            size="lg"
                            variant="outline"
                            leftSection={<IconDeviceFloppy size={18} />}
                        >
                            Sign Up & Save Data
                        </Button>
                    </Group>

                    <Text size="sm" c="dimmed">
                        Free to use • Sign up to save your connections and settings
                    </Text>
                </Stack>
            </Container>

            {/* Features Section */}
            <Container size="lg" py={80}>
                <Stack align="center" gap="xl">
                    <Stack align="center" gap="md" ta="center">
                        <Title
                            order={2}
                            size="h1"
                            fw={600}
                            style={{
                                color: themeUtils.getThemedColor('#1e293b', '#f1f5f9', isDark),
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Everything You Need
                        </Title>
                        <Text
                            size="lg"
                            c="dimmed"
                            maw={600}
                        >
                            Simple tools for viewing and managing server logs
                        </Text>
                    </Stack>

                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" w="100%">
                        {features.map((feature, index) => (
                            <Stack align="center" gap="md" ta="center" key={index}>
                                <ThemeIcon
                                    color="blue"
                                    variant="light"
                                    size={60}
                                    radius="md"
                                >
                                    <feature.icon size={28} />
                                </ThemeIcon>

                                <Title order={3} size="h3" fw={600}>
                                    {feature.title}
                                </Title>

                                <Text c="dimmed" lh={1.6}>
                                    {feature.description}
                                </Text>
                            </Stack>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Container>

            {/* CTA Section */}
            <Container size="lg" py={80}>
                <Box
                    p="xl"
                    style={{
                        background: themeUtils.getGradient('primary'),
                        borderRadius: '16px',
                        textAlign: 'center',
                    }}
                >
                    <Stack align="center" gap="lg">
                        <Stack align="center" gap="md">
                            <Title
                                order={2}
                                size="h1"
                                c="white"
                                fw={600}
                            >
                                Ready to Get Started?
                            </Title>
                            <Text
                                size="lg"
                                c="white"
                                opacity={0.9}
                                maw={500}
                            >
                                Start viewing your logs right away, or create an account to save your settings.
                            </Text>
                        </Stack>

                        <Group gap="md">
                            <Button
                                onClick={handleGuestAccess}
                                size="lg"
                                variant="white"
                                color="dark"
                                fw={600}
                            >
                                Continue as Guest
                            </Button>
                            <Button
                                onClick={handleSignUp}
                                size="lg"
                                variant="outline"
                                c="white"
                                style={{ borderColor: 'white' }}
                            >
                                Sign Up & Save Data
                            </Button>
                        </Group>
                    </Stack>
                </Box>
            </Container>

            {/* Footer */}
            <Container size="xl" py="xl">
                <Group justify="center">
                    <Text size="sm" c="dimmed">
                        © {new Date().getFullYear()} <Link to="https://mcedric.dev" target="_blank" rel="noopener noreferrer">Cedric Mutesa</Link>. Free log management for everyone.
                    </Text>
                </Group>
            </Container>
        </Box>
    );
}; 