import {
    Box,
    Center,
    Loader,
    Stack,
    Text,
    ThemeIcon,
    Title
} from '@mantine/core';
import { IconCode } from '@tabler/icons-react';
import React from 'react';
import { themeUtils, useTheme } from '../lib/theme';

interface LoadingScreenProps {
    title?: string;
    subtitle?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    title = 'Loading Logged',
    subtitle = 'Preparing your workspace...',
    size = 'md',
}) => {
    const { isDark } = useTheme();

    const sizeConfig = {
        sm: { icon: 'md' as const, loader: 'md' as const, titleSize: 'h3' as const },
        md: { icon: 'lg' as const, loader: 'lg' as const, titleSize: 'h2' as const },
        lg: { icon: 'xl' as const, loader: 'xl' as const, titleSize: 'h1' as const },
    };

    const config = sizeConfig[size];

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
            }}
        >
            <Center>
                <Stack align="center" gap="xl">
                    <ThemeIcon
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'violet' }}
                        size={config.icon}
                        radius="lg"
                        style={{
                            animation: 'pulse 2s infinite',
                            boxShadow: themeUtils.shadows.lg,
                        }}
                    >
                        <IconCode size={size === 'sm' ? 20 : size === 'md' ? 24 : 32} />
                    </ThemeIcon>

                    <Stack align="center" gap="sm">
                        <Title
                            order={size === 'sm' ? 3 : size === 'md' ? 2 : 1}
                            fw={600}
                            ta="center"
                            style={{
                                background: themeUtils.getGradient('primary'),
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            {title}
                        </Title>

                        <Text
                            size={size === 'sm' ? 'sm' : size === 'md' ? 'md' : 'lg'}
                            c="dimmed"
                            ta="center"
                        >
                            {subtitle}
                        </Text>
                    </Stack>

                    <Loader
                        color="blue"
                        size={config.loader}
                        type="dots"
                        style={{
                            filter: isDark ? 'brightness(1.2)' : 'brightness(1)',
                        }}
                    />
                </Stack>
            </Center>

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes pulse {
                        0%, 100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                        50% {
                            transform: scale(1.05);
                            opacity: 0.9;
                        }
                    }
                `
            }} />
        </Box>
    );
};

export const AppLoadingScreen: React.FC = () => (
    <LoadingScreen
        title="Loading Logged"
        subtitle="Initializing your log management workspace..."
        size="md"
    />
);

export const PageLoadingScreen: React.FC = () => (
    <LoadingScreen
        title="Loading..."
        subtitle="Please wait while we fetch your data"
        size="sm"
    />
);

export const ConnectionLoadingScreen: React.FC = () => (
    <LoadingScreen
        title="Connecting..."
        subtitle="Establishing secure connection to your server"
        size="sm"
    />
);

export default LoadingScreen; 