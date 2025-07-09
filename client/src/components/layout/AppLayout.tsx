/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAuth, useClerk, useUser } from '@clerk/clerk-react';
import {
    ActionIcon,
    AppShell,
    Avatar,
    Badge,
    Burger,
    Group,
    Indicator,
    Menu,
    ScrollArea,
    Stack,
    Text,
    Tooltip,
    UnstyledButton,
    useMantineTheme
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconActivity,
    IconBell,
    IconCode,
    IconDashboard,
    IconDatabase,
    IconLogout,
    IconPlus,
    IconSearch,
    IconSettings,
    IconTerminal2,
    IconUser
} from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { tokenManager } from '../../lib/api';
import { themeUtils, useTheme } from '../../lib/theme';
import {
    connectionStatusAtom,
    isGuestModeAtom,
    logStreamingAtom,
    sidebarCollapsedAtom,
    socketConnectedAtom
} from '../../store/atoms';
import ThemeToggle from '../ThemeToggle';

interface NavItem {
    icon: React.ComponentType<any>;
    label: string;
    href: string;
    badge?: string | number;
    color?: string;
}

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
    const { user } = useUser();
    const { signOut } = useClerk();
    const { getToken } = useAuth();
    const location = useLocation();
    const theme = useMantineTheme();
    const { isDark } = useTheme();

    const [sidebarCollapsed, setSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
    const [connectionStatus] = useAtom(connectionStatusAtom);
    const [isGuestMode] = useAtom(isGuestModeAtom);
    const [logStreaming] = useAtom(logStreamingAtom);
    const [socketConnected] = useAtom(socketConnectedAtom);


    useEffect(() => {
        const updateToken = async () => {
            try {
                if (user) {
                    const token = await getToken();
                    tokenManager.setToken(token);
                } else {
                    tokenManager.setToken(null);
                }
            } catch (error) {
                tokenManager.setToken(null);
            }
        };

        updateToken();

        const interval = setInterval(updateToken, 30000);

        return () => clearInterval(interval);
    }, [getToken, user]);

    const navItems: NavItem[] = [
        {
            icon: IconDashboard,
            label: 'Dashboard',
            href: isGuestMode ? '/guest/dashboard' : '/dashboard',
        },
        {
            icon: IconDatabase,
            label: 'Connections',
            href: isGuestMode ? '/guest/connections' : '/connections',
            badge: connectionStatus === 'connected' ? '1' : undefined,
            color: connectionStatus === 'connected' ? 'green' : undefined,
        },
        {
            icon: IconTerminal2,
            label: 'Log Viewer',
            href: isGuestMode ? '/guest/logs' : '/logs',
            badge: logStreaming ? 'LIVE' : undefined,
            color: logStreaming ? 'red' : undefined,
        },
        {
            icon: IconSettings,
            label: 'Settings',
            href: isGuestMode ? '/guest/settings' : '/settings',
        },
    ];

    const handleSignOut = async () => {
        try {
            await signOut();
            notifications.show({
                title: 'Signed Out',
                message: 'You have been successfully signed out',
                color: 'blue',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to sign out',
                color: 'red',
            });
        }
    };

    const NavbarContent = () => (
        <Stack gap={0} h="100%">
            <div style={{ padding: theme.spacing.md }}>
                <Group gap="xs">
                    <ActionIcon
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'violet' }}
                        size="md"
                        radius="md"
                        style={{ transition: themeUtils.transitions.normal }}
                    >
                        <IconCode size={18} />
                    </ActionIcon>
                    {!sidebarCollapsed && (
                        <Text
                            size="lg"
                            fw={700}
                            style={{
                                background: themeUtils.getGradient('primary'),
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                transition: themeUtils.transitions.normal,
                            }}
                        >
                            Logged
                        </Text>
                    )}
                </Group>
            </div>

            <ScrollArea flex={1} px="xs">
                <Stack gap="xs">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Tooltip
                                key={item.href}
                                label={item.label}
                                position="right"
                                disabled={!sidebarCollapsed}
                            >
                                <UnstyledButton
                                    component={Link}
                                    to={item.href}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: theme.spacing.sm,
                                        padding: theme.spacing.sm,
                                        borderRadius: theme.radius.md,
                                        backgroundColor: isActive
                                            ? themeUtils.getThemedColor(theme.colors.blue[0], theme.colors.blue[9], isDark)
                                            : 'transparent',
                                        color: isActive
                                            ? theme.colors.blue[6]
                                            : themeUtils.getThemedColor(theme.colors.gray[7], theme.colors.gray[3], isDark),
                                        fontWeight: isActive ? 600 : 400,
                                        transition: themeUtils.transitions.normal,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor =
                                                themeUtils.getThemedColor(theme.colors.gray[0], theme.colors.gray[8], isDark);
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    <Indicator
                                        disabled={!item.badge}
                                        label={item.badge}
                                        size={16}
                                        color={item.color}
                                    >
                                        <item.icon size={20} />
                                    </Indicator>
                                    {!sidebarCollapsed && (
                                        <Text size="sm" flex={1}>
                                            {item.label}
                                        </Text>
                                    )}
                                    {!sidebarCollapsed && item.badge && (
                                        <Badge size="xs" color={item.color || 'blue'} variant="light">
                                            {item.badge}
                                        </Badge>
                                    )}
                                </UnstyledButton>
                            </Tooltip>
                        );
                    })}
                </Stack>
            </ScrollArea>

            <div style={{
                padding: theme.spacing.sm,
                borderTop: `1px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[7], isDark)}`,
                transition: themeUtils.transitions.normal,
            }}>
                <Group gap="xs" justify={sidebarCollapsed ? 'center' : 'space-between'}>
                    {!sidebarCollapsed && (
                        <Text size="xs" c="dimmed">
                            Connection
                        </Text>
                    )}
                    <Tooltip label={`Socket ${socketConnected ? 'Connected' : 'Disconnected'}`}>
                        <IconActivity
                            size={16}
                            style={{
                                color: socketConnected ? theme.colors.green[6] : theme.colors.red[6],
                                transition: themeUtils.transitions.normal,
                            }}
                        />
                    </Tooltip>
                </Group>
            </div>
        </Stack>
    );

    return (
        <AppShell
            navbar={{
                width: sidebarCollapsed ? 70 : 280,
                breakpoint: 'sm',
                collapsed: { mobile: sidebarCollapsed }
            }}
            header={{ height: 60 }}
            padding="md"
            styles={{
                navbar: {
                    borderRight: `1px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[7], isDark)}`,
                    transition: themeUtils.transitions.normal,
                },
                header: {
                    borderBottom: `1px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[7], isDark)}`,
                    backdropFilter: 'blur(8px)',
                    transition: themeUtils.transitions.normal,
                },
            }}
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger
                            opened={!sidebarCollapsed}
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            size="sm"
                        />

                        <ActionIcon variant="subtle" color="gray" size="lg">
                            <IconSearch size={18} />
                        </ActionIcon>
                    </Group>

                    <Group gap="xs">
                        <Tooltip label="Add New Connection">
                            <ActionIcon variant="light" color="blue" size="lg">
                                <IconPlus size={18} />
                            </ActionIcon>
                        </Tooltip>

                        <ThemeToggle variant="menu" size="lg" />

                        <Tooltip label="Notifications">
                            <ActionIcon variant="subtle" color="gray" size="lg">
                                <IconBell size={18} />
                            </ActionIcon>
                        </Tooltip>

                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <UnstyledButton>
                                    <Group gap="xs">
                                        <Avatar
                                            src={user?.imageUrl}
                                            size="sm"
                                            radius="xl"
                                            style={{ backgroundColor: isGuestMode ? 'var(--mantine-color-gray-3)' : undefined }}
                                        >
                                            {isGuestMode ? 'G' : user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
                                        </Avatar>
                                        <Text size="sm" fw={500} visibleFrom="sm">
                                            {isGuestMode ? 'Guest' : (user?.firstName || user?.emailAddresses[0]?.emailAddress)}
                                        </Text>
                                    </Group>
                                </UnstyledButton>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Label>Account</Menu.Label>
                                <Menu.Item leftSection={<IconUser size={14} />}>
                                    Profile
                                </Menu.Item>
                                <Menu.Item leftSection={<IconSettings size={14} />}>
                                    Settings
                                </Menu.Item>

                                <Menu.Divider />

                                {!isGuestMode && (
                                    <Menu.Item
                                        leftSection={<IconLogout size={14} />}
                                        onClick={handleSignOut}
                                        color="red"
                                    >
                                        Sign Out
                                    </Menu.Item>
                                )}

                                {isGuestMode && (
                                    <Menu.Item
                                        leftSection={<IconUser size={14} />}
                                        component={Link}
                                        to="/login"
                                        color="blue"
                                    >
                                        Sign In
                                    </Menu.Item>
                                )}
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar>
                <NavbarContent />
            </AppShell.Navbar>

            <AppShell.Main>
                {children}
            </AppShell.Main>
        </AppShell>
    );
}; 