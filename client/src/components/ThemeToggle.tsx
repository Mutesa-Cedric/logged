/* eslint-disable react-refresh/only-export-components */
import {
    ActionIcon,
    Group,
    Menu,
    SegmentedControl,
    Stack,
    Text,
    Tooltip,
    UnstyledButton,
} from '@mantine/core';
import {
    IconCheck,
    IconDeviceDesktop,
    IconMoon,
    IconPalette,
    IconSun,
    type Icon,
    type IconProps,
} from '@tabler/icons-react';
import React from 'react';
import { useTheme, type ColorScheme } from '../lib/theme';

interface ThemeToggleProps {
    variant?: 'icon' | 'button' | 'menu' | 'segmented';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    withLabel?: boolean;
    compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
    variant = 'icon',
    size = 'md',
    withLabel = false,
    compact = false,
}) => {
    const { colorScheme, setColorScheme, isDark, isAuto } = useTheme();

    const themeOptions: Array<{ value: ColorScheme; label: string; icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>> }> = [
        { value: 'light', label: 'Light', icon: IconSun },
        { value: 'dark', label: 'Dark', icon: IconMoon },
        { value: 'auto', label: 'Auto', icon: IconDeviceDesktop },
    ];

    const getCurrentIcon = () => {
        if (isAuto) return IconDeviceDesktop;
        return isDark ? IconMoon : IconSun;
    };

    const getCurrentLabel = () => {
        if (isAuto) return 'Auto';
        return isDark ? 'Dark' : 'Light';
    };

    const handleThemeChange = (newScheme: ColorScheme) => {
        setColorScheme(newScheme);
    };

    if (variant === 'icon') {
        const CurrentIcon = getCurrentIcon();

        return (
            <Tooltip label={`Theme: ${getCurrentLabel()}`} position="bottom">
                <ActionIcon
                    variant="subtle"
                    color="gray"
                    size={size}
                    onClick={() => {
                        if (colorScheme === 'light') {
                            setColorScheme('dark');
                        } else if (colorScheme === 'dark') {
                            setColorScheme('auto');
                        } else {
                            setColorScheme('light');
                        }
                    }}
                    style={{ transition: 'all 0.2s ease' }}
                >
                    <CurrentIcon size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />
                </ActionIcon>
            </Tooltip>
        );
    }

    if (variant === 'button') {
        const CurrentIcon = getCurrentIcon();

        return (
            <UnstyledButton
                onClick={() => {
                    if (colorScheme === 'light') {
                        setColorScheme('dark');
                    } else if (colorScheme === 'dark') {
                        setColorScheme('auto');
                    } else {
                        setColorScheme('light');
                    }
                }}
                style={{
                    padding: compact ? '8px 12px' : '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--mantine-color-gray-3)',
                    backgroundColor: 'var(--mantine-color-body)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                    e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--mantine-color-body)';
                    e.currentTarget.style.borderColor = 'var(--mantine-color-gray-3)';
                }}
            >
                <CurrentIcon size={16} />
                {withLabel && (
                    <Text size="sm" fw={500}>
                        {getCurrentLabel()}
                    </Text>
                )}
            </UnstyledButton>
        );
    }

    if (variant === 'menu') {
        const CurrentIcon = getCurrentIcon();

        return (
            <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                    <Tooltip label="Change theme" position="bottom">
                        <ActionIcon variant="subtle" color="gray" size={size}>
                            <CurrentIcon size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />
                        </ActionIcon>
                    </Tooltip>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Label>
                        <Group gap={6}>
                            <IconPalette size={14} />
                            Theme
                        </Group>
                    </Menu.Label>

                    {themeOptions.map((option) => {
                        const OptionIcon = option.icon;
                        const isSelected = colorScheme === option.value;

                        return (
                            <Menu.Item
                                key={option.value}
                                leftSection={<OptionIcon size={16} />}
                                rightSection={isSelected ? <IconCheck size={14} /> : null}
                                onClick={() => handleThemeChange(option.value)}
                                style={{
                                    backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
                                    color: isSelected ? 'var(--mantine-color-blue-6)' : undefined,
                                }}
                            >
                                <Group justify="space-between" w="100%">
                                    <Text size="sm">{option.label}</Text>
                                    {option.value === 'auto' && (
                                        <Text size="xs" c="dimmed">
                                            {isDark ? 'Dark' : 'Light'}
                                        </Text>
                                    )}
                                </Group>
                            </Menu.Item>
                        );
                    })}
                </Menu.Dropdown>
            </Menu>
        );
    }

    if (variant === 'segmented') {
        return (
            <Stack gap="xs">
                {withLabel && (
                    <Text size="sm" fw={500} c="dimmed">
                        Theme
                    </Text>
                )}
                <SegmentedControl
                    value={colorScheme}
                    onChange={(value) => handleThemeChange(value as ColorScheme)}
                    data={themeOptions.map((option) => ({
                        value: option.value,
                        label: (
                            <Group gap="xs" justify="center">
                                <option.icon size={14} />
                                {!compact && <Text size="xs">{option.label}</Text>}
                            </Group>
                        ),
                    }))}
                    size={size}
                    radius="md"
                />
            </Stack>
        );
    }

    return null;
};

export const ThemeActions: React.FC = () => {
    const { isDark, colorScheme } = useTheme();

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Text size="sm" fw={500}>
                    Appearance
                </Text>
                <ThemeToggle variant="menu" />
            </Group>

            <ThemeToggle variant="segmented" withLabel={false} compact={false} />

            <Group gap="xs">
                <Text size="xs" c="dimmed">
                    Current: {colorScheme === 'auto' ? `Auto (${isDark ? 'Dark' : 'Light'})` : colorScheme}
                </Text>
            </Group>
        </Stack>
    );
};

export const themePresets = {
    professional: {
        light: { colorScheme: 'light' as const },
        dark: { colorScheme: 'dark' as const },
    },
    creative: {
        light: { colorScheme: 'light' as const },
        dark: { colorScheme: 'dark' as const },
    },
} as const;

export default ThemeToggle; 