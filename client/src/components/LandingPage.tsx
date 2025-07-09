import { useUser } from '@clerk/clerk-react';
import {
    Anchor,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Group,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    useMantineTheme
} from '@mantine/core';
import {
    IconArrowRight,
    IconBolt,
    IconCode,
    IconEye,
    IconSearch,
    IconShield,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { themeUtils, useTheme } from '../lib/theme';
import ThemeToggle from './ThemeToggle';

export const LandingPage = () => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const { isDark } = useTheme();

    if (isSignedIn) {
        navigate('/dashboard');
        return null;
    }

    const handleGuestAccess = () => {
        navigate('/guest');
    };

    const handleSignIn = () => {
        navigate('/login');
    };

    const handleSignUp = () => {
        navigate('/signup');
    };

    const features = [
        {
            icon: IconBolt,
            title: 'Real-time Streaming',
            description: 'Stream logs in real-time with WebSocket connections. Never miss critical events as they happen.',
            color: 'blue',
        },
        {
            icon: IconSearch,
            title: 'Advanced Search',
            description: 'Powerful search and filtering capabilities with instant results and highlighted matches.',
            color: 'violet',
        },
        {
            icon: IconShield,
            title: 'Secure Connections',
            description: 'Connect securely to your servers with SSH key or password authentication. Your credentials stay safe.',
            color: 'green',
        },
    ];

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: isDark
                    ? themeUtils.getGradient('dark')
                    : 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #faf5ff 100%)',
                transition: themeUtils.transitions.normal,
            }}
        >
            <Container size="xl">
                <Group justify="space-between" py="md">
                    <Group gap="xs">
                        <ThemeIcon
                            variant="gradient"
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

                    <Group gap="xs">
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
                            Get Started
                        </Button>
                    </Group>
                </Group>
            </Container>

            <Container size="xl" py={80}>
                <Stack align="center" gap="xl">
                    <Stack align="center" gap="md" ta="center">
                        <Title
                            order={1}
                            size="4rem"
                            fw={700}
                            lh={1.1}
                            maw={800}
                            style={{ color: themeUtils.getThemedColor(theme.colors.gray[9], theme.colors.gray[0], isDark) }}
                        >
                            Modern Log Viewing{' '}
                            <Text
                                component="span"
                                inherit
                                style={{
                                    background: themeUtils.getGradient('primary'),
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Made Simple
                            </Text>
                        </Title>

                        <Text
                            size="xl"
                            c="dimmed"
                            maw={600}
                            ta="center"
                            lh={1.6}
                        >
                            Say goodbye to terminal struggles. View, search, and manage your server logs
                            through a beautiful web interface with real-time streaming and powerful search capabilities.
                        </Text>
                    </Stack>

                    <Group gap="md" justify="center">
                        <Button
                            onClick={handleSignUp}
                            size="lg"
                            gradient={{ from: 'blue', to: 'violet' }}
                            variant="gradient"
                            rightSection={<IconArrowRight size={18} />}
                            style={{
                                boxShadow: themeUtils.shadows.lg,
                                transform: 'scale(1)',
                                transition: themeUtils.transitions.normal,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            Create Free Account
                        </Button>
                        <Button
                            onClick={handleGuestAccess}
                            size="lg"
                            variant="outline"
                            rightSection={<IconEye size={18} />}
                            style={{ transition: themeUtils.transitions.normal }}
                        >
                            Continue as Guest
                        </Button>
                    </Group>

                    <Badge
                        variant="light"
                        color="blue"
                        size="lg"
                        radius="md"
                        style={{ marginTop: theme.spacing.sm }}
                    >
                        Guest mode: Try all features without an account (connections won't be saved)
                    </Badge>
                </Stack>
            </Container>

            <Container size="xl" py={80}>
                <Stack align="center" gap="xl">
                    <Stack align="center" gap="md" ta="center">
                        <Title
                            order={2}
                            size="3rem"
                            fw={600}
                            style={{ color: themeUtils.getThemedColor(theme.colors.gray[9], theme.colors.gray[0], isDark) }}
                        >
                            Everything you need for log management
                        </Title>
                        <Text
                            size="xl"
                            c="dimmed"
                            maw={600}
                            ta="center"
                        >
                            Professional-grade features that make server log management effortless
                        </Text>
                    </Stack>

                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" w="100%">
                        {features.map((feature, index) => (
                            <Card
                                key={index}
                                shadow="md"
                                padding="xl"
                                radius="xl"
                                withBorder
                                style={{
                                    transition: themeUtils.transitions.normal,
                                    transform: 'scale(1)',
                                    cursor: 'default',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = themeUtils.shadows.xl;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = themeUtils.shadows.md;
                                }}
                            >
                                <Stack align="center" gap="md" ta="center">
                                    <ThemeIcon
                                        color={feature.color}
                                        variant="light"
                                        size="xl"
                                        radius="xl"
                                        style={{
                                            transform: 'scale(1)',
                                            transition: themeUtils.transitions.normal,
                                        }}
                                    >
                                        <feature.icon size={32} />
                                    </ThemeIcon>

                                    <Title order={3} size="h3" fw={600}>
                                        {feature.title}
                                    </Title>

                                    <Text c="dimmed" lh={1.6}>
                                        {feature.description}
                                    </Text>
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Container>

            <Container size="xl" py={80}>
                <Card
                    shadow="xl"
                    padding="xl"
                    radius="xl"
                    style={{
                        background: themeUtils.getGradient('primary'),
                        border: 'none',
                    }}
                >
                    <Stack align="center" gap="md" ta="center">
                        <Title
                            order={2}
                            size="2.5rem"
                            c="white"
                            fw={600}
                        >
                            Ready to simplify your log management?
                        </Title>
                        <Text
                            size="lg"
                            c="white"
                            opacity={0.9}
                            maw={500}
                        >
                            Join thousands of developers who have streamlined their workflow with Logged.
                        </Text>
                        <Group gap="md" mt="md">
                            <Button
                                onClick={handleSignUp}
                                size="lg"
                                variant="white"
                                color="dark"
                                fw={600}
                            >
                                Start Free Trial
                            </Button>
                            <Button
                                onClick={handleGuestAccess}
                                size="lg"
                                variant="outline"
                                c="white"
                                style={{ borderColor: 'white' }}
                            >
                                Try as Guest
                            </Button>
                        </Group>
                    </Stack>
                </Card>
            </Container>

            <Container size="xl" py="xl">
                <Group justify="center" gap="md">
                    <Text size="sm" c="dimmed" ta="center">
                        © {new Date().getFullYear()} Logged. Built with ❤️ by <Anchor href="https://github.com/mutesa-cedric" target="_blank">Mutesa Cedric</Anchor>
                    </Text>
                </Group>
            </Container>
        </Box>
    );
}; 