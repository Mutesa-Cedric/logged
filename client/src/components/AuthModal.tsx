import { Modal, useMantineTheme, Box, CloseButton, Stack, Skeleton, Text, ThemeIcon } from '@mantine/core';
import { IconLogin, IconUserPlus } from '@tabler/icons-react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useAtom } from 'jotai';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useCallback, useState } from 'react';
import { authModalAtom } from '../store/atoms';
import { useTheme, themeUtils } from '../lib/theme';

const AuthModal = () => {
    const theme = useMantineTheme();
    const { isDark } = useTheme();
    const [modal, setModal] = useAtom(authModalAtom);
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);

    const close = () => {
        setModal({ ...modal, open: false });
        setIsLoading(false);
        if (location.pathname === '/login' || location.pathname === '/signup') {
            navigate('/');
        }
    };

    const switchToSignUp = useCallback(() => {
        setModal({ ...modal, mode: 'signUp' });
    }, [modal, setModal]);

    const switchToSignIn = useCallback(() => {
        setModal({ ...modal, mode: 'signIn' });
    }, [modal, setModal]);

    // Handle loading state when modal opens
    useEffect(() => {
        if (modal.open) {
            setIsLoading(true);
            // Set a minimum loading time to show the skeleton
            const minLoadingTime = setTimeout(() => {
                setIsLoading(false);
            }, 1500); // Show loading for at least 1.5 seconds

            return () => clearTimeout(minLoadingTime);
        }
    }, [modal.open, modal.mode]);

    useEffect(() => {
        const handleClerkNavigation = (event: Event) => {
            const target = event.target as HTMLAnchorElement;
            if (target?.href?.includes('sign-up') || target?.textContent?.toLowerCase().includes('sign up')) {
                event.preventDefault();
                switchToSignUp();
            } else if (target?.href?.includes('sign-in') || target?.textContent?.toLowerCase().includes('sign in')) {
                event.preventDefault();
                switchToSignIn();
            }
        };

        if (modal.open) {
            const timer = setTimeout(() => {
                const modalElement = document.querySelector('.mantine-Modal-content');
                if (modalElement) {
                    modalElement.addEventListener('click', handleClerkNavigation);
                }
            }, 100);

            return () => {
                clearTimeout(timer);
                const modalElement = document.querySelector('.mantine-Modal-content');
                if (modalElement) {
                    modalElement.removeEventListener('click', handleClerkNavigation);
                }
            };
        }
    }, [modal.open, modal.mode, switchToSignIn, switchToSignUp]);

    const appearance = {
        variables: {
            colorPrimary: theme.colors.blue[6],
            colorBackground: 'transparent',
            colorInputBackground: themeUtils.getThemedColor('#ffffff', '#2c2e33', isDark),
            colorInputText: themeUtils.getThemedColor('#1e293b', '#f1f5f9', isDark),
            colorText: themeUtils.getThemedColor('#1e293b', '#f1f5f9', isDark),
            colorTextSecondary: themeUtils.getThemedColor('#64748b', '#94a3b8', isDark),
            colorShimmer: themeUtils.getThemedColor('#f1f5f9', '#334155', isDark),
            borderRadius: '8px',
            fontFamily: theme.fontFamily,
            fontSize: '14px',
            spacingUnit: '1rem',
        },
        elements: {
            rootBox: { 
                width: '100%',
                maxWidth: '420px',
                margin: '0 auto',
            },
            card: { 
                background: themeUtils.getThemedColor('#ffffff', '#1a1b1e', isDark),
                border: `1px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[7], isDark)}`,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'none',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
            },
            header: {
                marginBottom: '1rem',
                textAlign: 'center',
            },
            headerTitle: { 
                fontSize: '24px',
                fontWeight: '700',
                color: themeUtils.getThemedColor('#1e293b', '#f1f5f9', isDark),
                marginBottom: '8px',
                lineHeight: '1.2',
            },
            headerSubtitle: { 
                fontSize: '14px',
                color: themeUtils.getThemedColor('#64748b', '#94a3b8', isDark),
                lineHeight: '1.4',
            },
            main: {
                gap: '0.75rem',
            },
            formButtonPrimary: {
                background: themeUtils.getGradient('primary'),
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                padding: '12px 24px',
                fontSize: '14px',
                minHeight: '44px',
                width: '100%',
                cursor: 'pointer',
                transition: themeUtils.transitions.normal,
                '&:hover': {
                    background: themeUtils.getGradient('primary'),
                    transform: 'translateY(-1px)',
                    filter: 'brightness(1.05)',
                },
            },
            formFieldInput: {
                backgroundColor: themeUtils.getThemedColor('#ffffff', '#373a40', isDark),
                border: `2px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[5], isDark)}`,
                borderRadius: '8px',
                color: themeUtils.getThemedColor('#1e293b', '#ffffff', isDark),
                fontSize: '14px',
                padding: '12px 16px',
                minHeight: '44px',
                width: '100%',
                transition: themeUtils.transitions.normal,
                '&:focus': {
                    borderColor: theme.colors.blue[5],
                    outline: 'none',
                    backgroundColor: themeUtils.getThemedColor('#ffffff', '#3d4147', isDark),
                },
                '&::placeholder': {
                    color: themeUtils.getThemedColor('#94a3b8', '#9ca3af', isDark),
                },
            },
            formFieldLabel: {
                fontSize: '14px',
                fontWeight: '500',
                color: themeUtils.getThemedColor('#374151', '#f1f5f9', isDark),
                marginBottom: '2px',
            },
            formFieldRow: {
                marginBottom: '0.75rem',
            },
            socialButtonsIconButton: {
                backgroundColor: themeUtils.getThemedColor('#ffffff', '#373a40', isDark),
                border: `2px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[5], isDark)}`,
                borderRadius: '8px',
                transition: themeUtils.transitions.normal,
                color: themeUtils.getThemedColor('#374151', '#ffffff', isDark),
                padding: '12px',
                minHeight: '44px',
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: themeUtils.getThemedColor('#f8fafc', '#3d4147', isDark),
                    borderColor: themeUtils.getThemedColor(theme.colors.blue[3], theme.colors.blue[5], isDark),
                    transform: 'translateY(-1px)',
                },
            },
            socialButtonsBlockButton: {
                backgroundColor: themeUtils.getThemedColor('#ffffff', '#373a40', isDark),
                border: `2px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[5], isDark)}`,
                borderRadius: '8px',
                transition: themeUtils.transitions.normal,
                color: themeUtils.getThemedColor('#374151', '#ffffff', isDark),
                padding: '12px 16px',
                minHeight: '44px',
                width: '100%',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: themeUtils.getThemedColor('#f8fafc', '#3d4147', isDark),
                    borderColor: themeUtils.getThemedColor(theme.colors.blue[3], theme.colors.blue[5], isDark),
                    transform: 'translateY(-1px)',
                },
            },
            dividerLine: {
                backgroundColor: themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[6], isDark),
                height: '1px',
                margin: '0.75rem 0',
            },
            dividerText: {
                color: themeUtils.getThemedColor('#64748b', '#94a3b8', isDark),
                fontSize: '12px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
            },
            footer: {
                marginTop: '1rem',
                textAlign: 'center',
            },
            footerActionText: {
                fontSize: '14px',
                color: themeUtils.getThemedColor('#64748b', '#94a3b8', isDark),
            },
            footerActionLink: {
                color: theme.colors.blue[6],
                fontWeight: '600',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: themeUtils.transitions.normal,
                '&:hover': { 
                    color: theme.colors.blue[7],
                    textDecoration: 'underline',
                },
            },
            footerAction: {
                marginTop: '0.5rem',
            },
            alternativeMethodsBlockButton: {
                backgroundColor: 'transparent',
                border: `2px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[5], isDark)}`,
                borderRadius: '8px',
                color: themeUtils.getThemedColor('#64748b', '#e5e7eb', isDark),
                fontSize: '14px',
                fontWeight: '500',
                padding: '10px 16px',
                minHeight: '40px',
                width: '100%',
                cursor: 'pointer',
                transition: themeUtils.transitions.normal,
                '&:hover': {
                    backgroundColor: themeUtils.getThemedColor('#f8fafc', '#373a40', isDark),
                    borderColor: themeUtils.getThemedColor(theme.colors.gray[3], theme.colors.gray[4], isDark),
                },
            },
        },
    } as const;

    // Skeleton loading component
    const AuthSkeleton = () => (
        <Box
            w="100%"
            maw={420}
            mx="auto"
            style={{
                background: themeUtils.getThemedColor('#ffffff', '#1a1b1e', isDark),
                border: `1px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[7], isDark)}`,
                borderRadius: '16px',
                padding: '24px',
            }}
        >
            <Stack gap="lg" align="center">
                <ThemeIcon 
                    color="blue" 
                    variant="light" 
                    size={60}
                    style={{ opacity: 0.8 }}
                >
                    {modal.mode === 'signIn' ? <IconLogin size={30} /> : <IconUserPlus size={30} />}
                </ThemeIcon>
                
                <Stack gap="xs" align="center" w="100%">
                    <Skeleton height={32} width={280} radius="md" />
                    <Skeleton height={20} width={320} radius="sm" />
                </Stack>

                <Stack gap="md" w="100%" mt="lg">
                    <Skeleton height={44} radius="md" />
                    <Skeleton height={44} radius="md" />
                </Stack>

                <Stack gap="sm" w="100%">
                    <Skeleton height={44} radius="md" />
                </Stack>

                <Skeleton height={16} width={240} radius="sm" />
            </Stack>

            <Box ta="center" mt="lg">
                <Text size="sm" c="dimmed">
                    {modal.mode === 'signIn' 
                        ? 'Loading sign in form...' 
                        : 'Loading sign up form...'
                    }
                </Text>
            </Box>
        </Box>
    );

    return (
        <Modal
            opened={modal.open}
            onClose={close}
            withCloseButton={false}
            centered
            padding={0}
            radius="xl"
            size="auto"
            overlayProps={{
                backgroundOpacity: 0.4,
                blur: 8,
            }}
            styles={{
                content: {
                    background: 'transparent',
                    boxShadow: 'none',
                    overflow: 'visible',
                },
                body: {
                    padding: 0,
                    overflow: 'visible',
                },
                inner: {
                    padding: '20px',
                    '@media (max-width: 48em)': {
                        padding: '10px',
                    },
                },
            }}
        >
            <Box pos="relative" w="100%" maw={440} mx="auto" px={{ base: 'xs', sm: 0 }}>
                <CloseButton
                    onClick={close}
                    size="lg"
                    pos="absolute"
                    top={-48}
                    right={-12}
                    style={{
                        backgroundColor: themeUtils.getThemedColor('#ffffff', '#2c2e33', isDark),
                        border: `2px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[7], isDark)}`,
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        color: themeUtils.getThemedColor('#64748b', '#94a3b8', isDark),
                        boxShadow: 'none',
                        zIndex: 1000,
                        transition: themeUtils.transitions.normal,
                        cursor: 'pointer',
                        '&:hover': {
                            backgroundColor: themeUtils.getThemedColor('#f8fafc', '#373a40', isDark),
                            transform: 'scale(1.05)',
                            borderColor: themeUtils.getThemedColor(theme.colors.gray[3], theme.colors.gray[6], isDark),
                        },
                    }}
                />
                
                {isLoading ? (
                    <AuthSkeleton />
                ) : (
                    modal.mode === 'signIn' ? (
                        <SignIn 
                            afterSignInUrl="/dashboard" 
                            signUpUrl="#"
                            appearance={appearance}
                            routing="virtual"
                            afterSignUpUrl="/dashboard"
                        />
                    ) : (
                        <SignUp 
                            afterSignUpUrl="/dashboard" 
                            signInUrl="#"
                            appearance={appearance}
                            routing="virtual"
                            afterSignInUrl="/dashboard"
                        />
                    )
                )}
            </Box>
        </Modal>
    );
};

export default AuthModal; 