import { useClerk, useUser } from '@clerk/clerk-react';
import {
    Avatar,
    Badge,
    Box,
    Button,
    Center,
    Container,
    Group,
    Image,
    Menu,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconBrandGithub,
    IconCode,
    IconDashboard,
    IconDeviceFloppy,
    IconDownload,
    IconEye,
    IconKey,
    IconLogout,
    IconMoon,
    IconRobot,
    IconSettings,
    IconShield,
    IconSun,
    IconTerminal2,
    IconUser
} from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { Link, useNavigate } from 'react-router-dom';
import { themeUtils, useTheme } from '../lib/theme';
import { authModalAtom } from '../store/atoms';
import ThemeToggle from './ThemeToggle';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { user, isSignedIn, isLoaded } = useUser();
    const { signOut } = useClerk();
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

    const handleSignOut = async () => {
        try {
            await signOut();
            notifications.show({
                title: 'Signed Out',
                message: 'You have been successfully signed out',
                color: 'blue',
            });
        } catch {
            notifications.show({
                title: 'Error',
                message: 'Failed to sign out',
                color: 'red',
            });
        }
    };

    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };

    const features = [
        {
            icon: IconTerminal2,
            title: 'Real-time Log Streaming',
            description: 'Monitor server logs live with WebSocket connectivity. See changes instantly as they happen.',
        },
        {
            icon: IconRobot,
            title: 'AI-Powered Analysis',
            description: 'Get intelligent insights about your logs. Find errors, patterns, and security issues automatically.',
        },
        {
            icon: IconShield,
            title: 'Zero-Knowledge Security',
            description: 'AES-256 encrypted credentials that never leave your browser in plaintext. Your data stays private.',
        },
        {
            icon: IconKey,
            title: 'SSH Key Support',
            description: 'Connect using password or SSH keys. Support for RSA, EC, OpenSSH and encrypted private keys.',
        },
        {
            icon: IconDownload,
            title: 'Export & Download',
            description: 'Download logs in TXT or JSON format with metadata. Perfect for sharing and analysis.',
        },
        {
            icon: isDark ? IconMoon : IconSun,
            title: 'Beautiful Dark Mode',
            description: 'Gorgeous themes that adapt to your system preference. Easy on the eyes during long sessions.',
        },
    ];

    // Get the appropriate screenshot based on theme
    const getScreenshot = (lightImage: string, darkImage: string) => {
        return isDark ? darkImage : lightImage;
    };

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
                        <Button
                            variant="subtle"
                            leftSection={<IconBrandGithub size={16} />}
                            component="a"
                            href="https://github.com/Mutesa-Cedric/logged"
                            target="_blank"
                            rel="noopener noreferrer"
                            size="sm"
                        >
                            GitHub
                        </Button>
                        <ThemeToggle variant="menu" />
                        {isLoaded && isSignedIn ? (
                            <Menu width={200}>
                                <Menu.Target>
                                    <UnstyledButton>
                                        <Group gap="xs">
                                            <Avatar
                                                src={user?.imageUrl}
                                                size="sm"
                                                radius="xl"
                                            >
                                                {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
                                            </Avatar>
                                            <Text size="sm" fw={500} visibleFrom="sm">
                                                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                                            </Text>
                                        </Group>
                                    </UnstyledButton>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>Account</Menu.Label>
                                    <Menu.Item
                                        leftSection={<IconDashboard size={14} />}
                                        onClick={handleGoToDashboard}
                                    >
                                        Dashboard
                                    </Menu.Item>
                                    <Menu.Item leftSection={<IconUser size={14} />}>
                                        Profile
                                    </Menu.Item>
                                    <Menu.Item leftSection={<IconSettings size={14} />}>
                                        Settings
                                    </Menu.Item>

                                    <Menu.Divider />

                                    <Menu.Item
                                        leftSection={<IconLogout size={14} />}
                                        onClick={handleSignOut}
                                        color="red"
                                    >
                                        Sign Out
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        ) : (
                            <>
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
                            </>
                        )}
                    </Group>
                </Group>
            </Container>

            {/* Hero Section */}
            <Container size="lg" py={80}>
                <Stack align="center" gap="xl" ta="center">
                    <Stack align="center" gap="lg">
                        <Group gap="xs" justify="center">
                            <Badge
                                variant="gradient"
                                gradient={{ from: 'blue', to: 'violet' }}
                                size="lg"
                            >
                                ✨ AI-Powered
                            </Badge>
                        </Group>

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
                            Server Log Monitoring
                            <br />
                            <Text
                                style={{
                                    background: themeUtils.getGradient('primary'),
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    marginTop: '10px',
                                }}
                            >
                                Made Simple
                            </Text>
                        </Title>

                        <Text
                            size="xl"
                            c="dimmed"
                            maw={700}
                            lh={1.6}
                        >
                            Monitor server logs in real-time with secure SSH connections, AI-powered analysis,
                            and beautiful dark mode. Your credentials are encrypted client-side with AES-256.
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
                            Try as Guest
                        </Button>
                        <Button
                            onClick={handleSignUp}
                            size="lg"
                            variant="outline"
                            leftSection={<IconDeviceFloppy size={18} />}
                        >
                            Sign Up & Save
                        </Button>
                    </Group>

                    <Text size="sm" c="dimmed">
                        Free forever • Zero-knowledge encryption • No credit card required
                    </Text>
                </Stack>
            </Container>

            {/* Hero Screenshot */}
            <Container size="xl" py={40}>
                <Center>
                    <Image
                        src={getScreenshot(
                            '/assets/screenshots/dashboard-light-mac.png',
                            '/assets/screenshots/dashboard-dark-mac.png'
                        )}
                        alt="Logged Dashboard"
                        style={{
                            maxWidth: '900px',
                            width: '100%',
                            borderRadius: '16px',
                            boxShadow: isDark
                                ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                                : '0 20px 60px rgba(0, 0, 0, 0.15)',
                        }}
                    />
                </Center>
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
                            Powerful features designed for developers who need reliable log monitoring
                        </Text>
                    </Stack>

                    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xl" w="100%">
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

            {/* Feature Screenshots Section */}
            <Container size="xl" py={80}>
                <Stack gap={80}>
                    {/* AI Analysis Feature */}
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" style={{ alignItems: 'center' }}>
                        <Stack gap="lg">
                            <Badge variant="light" color="violet" size="md" w="fit-content">
                                AI-Powered
                            </Badge>
                            <Title order={2} size="h1" fw={600}>
                                Get Instant Insights
                            </Title>
                            <Text size="lg" c="dimmed" lh={1.6}>
                                Ask questions about your logs and get intelligent answers. Find errors,
                                security issues, and performance problems automatically with GPT-4.
                            </Text>
                            <Group gap="md">
                                <Text size="sm" c="dimmed">✓ Error detection</Text>
                                <Text size="sm" c="dimmed">✓ Pattern analysis</Text>
                                <Text size="sm" c="dimmed">✓ Security alerts</Text>
                            </Group>
                        </Stack>
                        <Image
                            src={getScreenshot(
                                '/assets/screenshots/ai-analysis-light-mac.png',
                                '/assets/screenshots/ai-analysis-dark-mac.png'
                            )}
                            alt="AI Log Analysis"
                            style={{ borderRadius: '12px' }}
                        />
                    </SimpleGrid>

                    {/* Connection Management Feature */}
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" style={{ alignItems: 'center' }}>
                        <Image
                            src={getScreenshot(
                                '/assets/screenshots/connections-light-mac.png',
                                '/assets/screenshots/connections-dark-mac.png'
                            )}
                            alt="Connection Management"
                            style={{ borderRadius: '12px' }}
                        />
                        <Stack gap="lg">
                            <Badge variant="light" color="blue" size="md" w="fit-content">
                                Secure
                            </Badge>
                            <Title order={2} size="h1" fw={600}>
                                Manage Connections
                            </Title>
                            <Text size="lg" c="dimmed" lh={1.6}>
                                Save multiple server connections with encrypted credentials. Support for
                                password and SSH key authentication with zero-knowledge encryption.
                            </Text>
                            <Group gap="md">
                                <Text size="sm" c="dimmed">✓ AES-256 encryption</Text>
                                <Text size="sm" c="dimmed">✓ SSH key support</Text>
                                <Text size="sm" c="dimmed">✓ Zero-knowledge</Text>
                            </Group>
                        </Stack>
                    </SimpleGrid>

                    {/* Log Monitoring Feature */}
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" style={{ alignItems: 'center' }}>
                        <Stack gap="lg">
                            <Badge variant="light" color="green" size="md" w="fit-content">
                                Real-time
                            </Badge>
                            <Title order={2} size="h1" fw={600}>
                                Live Log Streaming
                            </Title>
                            <Text size="lg" c="dimmed" lh={1.6}>
                                Watch logs update in real-time with WebSocket streaming. Filter, search,
                                and export logs with syntax highlighting and smart formatting.
                            </Text>
                            <Group gap="md">
                                <Text size="sm" c="dimmed">✓ WebSocket streaming</Text>
                                <Text size="sm" c="dimmed">✓ Export options</Text>
                                <Text size="sm" c="dimmed">✓ Syntax highlighting</Text>
                            </Group>
                        </Stack>
                        <Image
                            src={getScreenshot(
                                '/assets/screenshots/dashboard-light-mac.png',
                                '/assets/screenshots/dashboard-dark-mac.png'
                            )}
                            alt="Log Monitoring"
                            style={{ borderRadius: '12px' }}
                        />
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
                                Ready to Start Monitoring?
                            </Title>
                            <Text
                                size="lg"
                                c="white"
                                opacity={0.9}
                                maw={500}
                            >
                                Join developers who trust Logged for their server monitoring.

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
                                Create account
                            </Button>
                        </Group>
                    </Stack>
                </Box>
            </Container>

            {/* Footer */}
            <Container size="xl" py="xl">
                <Group justify="center">
                    <Text size="sm" c="dimmed">
                        © {new Date().getFullYear()} <Link to="https://mcedric.dev" target="_blank" rel="noopener noreferrer">Cedric Mutesa</Link>. Secure log monitoring for everyone.
                    </Text>
                </Group>
            </Container>
        </Box>
    );
};