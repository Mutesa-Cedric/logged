import { useUser } from '@clerk/clerk-react';
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Code,
    Group,
    List,
    Loader,
    Modal,
    ScrollArea,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
    Tooltip,
    Transition,
    useMantineTheme
} from '@mantine/core';
import { IconBrain, IconLogin, IconMaximize, IconMessage, IconMinimize, IconSend, IconTrash } from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAIChat } from '../hooks/useAIChat';
import { api } from '../lib/api';
import { themeUtils, useTheme } from '../lib/theme';
import { authModalAtom, isGuestModeAtom } from '../store/atoms';

interface LogEntry {
    sessionId: string;
    data: string;
    timestamp: Date;
}

interface AIChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: LogEntry[];
}

export const AIChatModal = ({ isOpen, onClose, logs }: AIChatModalProps) => {
    const theme = useMantineTheme();
    const { isDark } = useTheme();
    const { user } = useUser();
    const [isGuestMode] = useAtom(isGuestModeAtom);
    const [, setAuthModal] = useAtom(authModalAtom);
    const [aiAvailable, setAiAvailable] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check if user is authenticated for AI features
    const isAuthenticated = !isGuestMode && user;

    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        clearMessages
    } = useAIChat(logs);

    useEffect(() => {
        if (isOpen) {
            checkAIStatus();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const checkAIStatus = async () => {
        try {
            const response = await api.get('/ai/status');
            setAiAvailable(response.data.available);
        } catch (error) {
            console.error('Failed to check AI status:', error);
            setAiAvailable(false);
        }
    };

    const formatAIResponse = (content: string) => {
        return (
            <ReactMarkdown
                components={{
                    h1: ({ children }) => (
                        <Title order={2} mt="lg" mb="xs" c="blue">
                            {children}
                        </Title>
                    ),
                    h2: ({ children }) => (
                        <Title order={3} mt="lg" mb="xs" c="blue">
                            {children}
                        </Title>
                    ),
                    h3: ({ children }) => (
                        <Title order={4} mt="md" mb="xs" c="blue">
                            {children}
                        </Title>
                    ),
                    p: ({ children }) => (
                        <Text size="sm" mb="xs" style={{ lineHeight: 1.6 }}>
                            {children}
                        </Text>
                    ),
                    ul: ({ children }) => (
                        <List type="unordered" size="sm" mb="xs" withPadding>
                            {children}
                        </List>
                    ),
                    ol: ({ children }) => (
                        <List type="ordered" size="sm" mb="xs" withPadding>
                            {children}
                        </List>
                    ),
                    li: ({ children }) => (
                        <List.Item mb={2}>
                            {children}
                        </List.Item>
                    ),
                    code: ({ children, className }) => {
                        const isInline = !className;
                        if (isInline) {
                            return (
                                <Code c="blue" bg={isDark ? 'dark.5' : 'gray.0'} fz="xs">
                                    {children}
                                </Code>
                            );
                        }
                        return (
                            <Code
                                block
                                c="blue"
                                bg={isDark ? 'dark.5' : 'gray.0'}
                                fz="xs"
                                p="xs"
                                style={{ whiteSpace: 'pre-wrap' }}
                            >
                                {children}
                            </Code>
                        );
                    },
                    strong: ({ children }) => (
                        <Text component="span" fw={600} c="blue">
                            {children}
                        </Text>
                    ),
                    em: ({ children }) => (
                        <Text component="span" fs="italic">
                            {children}
                        </Text>
                    ),
                    blockquote: ({ children }) => (
                        <Box
                            p="sm"
                            bg={isDark ? 'dark.5' : 'gray.0'}
                            style={{
                                borderLeft: `3px solid ${theme.colors.blue[6]}`,
                                borderRadius: theme.radius.sm
                            }}
                            mb="xs"
                        >
                            {children}
                        </Box>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        );
    };

    const handleFullscreenToggle = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleAuthRequired = () => {
        setAuthModal({ open: true, mode: 'signIn' });
    };

    const suggestedQuestions = [
        'What errors are present in these logs?',
        'Are there any performance issues?',
        'What patterns do you notice?',
        'Summarize the main events',
        'Are there any security concerns?'
    ];

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            size={isFullscreen ? "100%" : "xl"}
            centered={!isFullscreen}
            fullScreen={isFullscreen}
            transitionProps={{
                transition: isFullscreen ? 'fade' : 'pop',
                duration: 300,
                timingFunction: 'ease'
            }}
            title={
                <Group justify="space-between" w="100%">
                    <Group gap="sm">
                        <ThemeIcon color="blue" variant="light" size="md">
                            <IconBrain size={18} />
                        </ThemeIcon>
                        <Box>
                            <Group gap="xs" align="center">
                                <Text size="lg" fw={600}>
                                    AI Log Analysis
                                </Text>
                                {isFullscreen && (
                                    <Badge
                                        size="xs"
                                        variant="light"
                                        color="blue"
                                        style={{
                                            transition: 'all 0.2s ease',
                                            transform: 'scale(1)',
                                            animation: 'logged-fade-in 0.3s ease'
                                        }}
                                    >
                                        Fullscreen
                                    </Badge>
                                )}
                            </Group>
                            <Text size="sm" c="dimmed">
                                Ask questions about your {logs.length} log entries
                            </Text>
                        </Box>
                    </Group>
                    <Tooltip
                        label={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
                        position="bottom"
                        withArrow
                    >
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={handleFullscreenToggle}
                            size="lg"
                            style={{
                                transition: 'all 0.2s ease',
                                transform: isFullscreen ? 'scale(1.05)' : 'scale(1)',
                            }}
                        >
                            <Transition
                                mounted={!isFullscreen}
                                transition="rotate-left"
                                duration={300}
                                timingFunction="ease"
                            >
                                {(styles) => (
                                    <div style={styles}>
                                        <IconMaximize size={16} />
                                    </div>
                                )}
                            </Transition>
                            <Transition
                                mounted={isFullscreen}
                                transition="rotate-right"
                                duration={300}
                                timingFunction="ease"
                            >
                                {(styles) => (
                                    <div style={styles}>
                                        <IconMinimize size={16} />
                                    </div>
                                )}
                            </Transition>
                        </ActionIcon>
                    </Tooltip>
                </Group>
            }
            styles={{
                inner: {
                    padding: '20px',
                    '@media (max-width: 48em)': {
                        padding: '10px',
                    },
                },
                header: {
                    backgroundColor: themeUtils.getThemedColor('#ffffff', '#1a1b1e', isDark),
                    borderBottom: `1px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[7], isDark)}`,
                    transition: 'all 0.3s ease',
                },
                body: {
                    padding: 0,
                    backgroundColor: themeUtils.getThemedColor('#ffffff', '#1a1b1e', isDark),
                    transition: 'all 0.3s ease',
                },
                content: {
                    transition: 'all 0.3s ease',
                    transform: isFullscreen ? 'scale(1)' : 'scale(0.98)',
                    animation: isFullscreen ? 'modalExpand 0.3s ease' : 'modalContract 0.3s ease',
                    '@media (max-width: 48em)': {
                        margin: '10px',
                        height: 'calc(100vh - 20px)',
                    },
                },
            }}
        >
            <Stack
                h={isFullscreen ? "calc(100vh - 120px)" : 600}
                gap={0}
                style={{
                    transition: 'height 0.3s ease'
                }}
            >
                {/* Header Actions */}
                <Group justify="space-between" p="md" style={{
                    borderBottom: `1px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[7], isDark)}`,
                }}>
                    <Group gap="xs">
                        {!aiAvailable && (
                            <Badge color="red" variant="light" size="sm">
                                AI Unavailable
                            </Badge>
                        )}
                        {error && (
                            <Badge color="red" variant="light" size="sm">
                                Error
                            </Badge>
                        )}
                    </Group>
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={clearMessages}
                        title="Clear conversation"
                    >
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>

                {/* Authentication Check */}
                {!isAuthenticated ? (
                    <Stack align="center" justify="center" flex={1} p="xl" gap="lg">
                        <ThemeIcon color="blue" variant="light" size={60}>
                            <IconLogin size={30} />
                        </ThemeIcon>
                        <Box ta="center">
                            <Title order={3} mb="xs">
                                Sign In Required
                            </Title>
                            <Text size="sm" c="dimmed" mb="xl">
                                AI log analysis requires an account. Sign in to unlock AI-powered insights.
                            </Text>
                        </Box>
                        <Alert
                            color="blue"
                            variant="light"
                            style={{ maxWidth: 400 }}
                            icon={<IconBrain size={16} />}
                        >
                            <Text size="sm">
                                Get intelligent log analysis, pattern detection, and actionable recommendations with AI.
                            </Text>
                        </Alert>
                        <Button
                            leftSection={<IconLogin size={16} />}
                            onClick={handleAuthRequired}
                            size="md"
                        >
                            Sign In to Continue
                        </Button>
                    </Stack>
                ) : (
                    <>
                        {/* Messages Area */}
                        <ScrollArea flex={1} p="md">
                            {messages.length === 0 ? (
                                <Stack align="center" py="xl" gap="lg">
                                    <ThemeIcon color="blue" variant="light" size={60}>
                                        <IconBrain size={30} />
                                    </ThemeIcon>
                                    <Box ta="center">
                                        <Text size="lg" fw={600} mb="xs">
                                            Ask about your logs
                                        </Text>
                                        <Text size="sm" c="dimmed" mb="xl">
                                            I can help you analyze patterns, identify issues, and provide insights.
                                        </Text>
                                    </Box>

                                    <SimpleGrid cols={{ base: 1, sm: 2 }} w="100%">
                                        {suggestedQuestions.map((question, index) => (
                                            <Card
                                                key={index}
                                                padding="sm"
                                                withBorder
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: themeUtils.getThemedColor('#f8fafc', '#2c2e33', isDark),
                                                    borderColor: themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[6], isDark),
                                                }}
                                                onClick={() => handleInputChange({ target: { value: question } } as React.ChangeEvent<HTMLInputElement>)}
                                            >
                                                <Text size="sm" c="dimmed">
                                                    {question}
                                                </Text>
                                            </Card>
                                        ))}
                                    </SimpleGrid>
                                </Stack>
                            ) : (
                                <Stack gap="md">
                                    {messages.map((msg, index) => (
                                        <Group
                                            key={index}
                                            justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                                            align="flex-start"
                                        >
                                            <Card
                                                p="md"
                                                radius="md"
                                                maw="80%"
                                                style={{
                                                    backgroundColor: msg.role === 'user'
                                                        ? theme.colors.blue[6]
                                                        : themeUtils.getThemedColor('#f8fafc', '#2c2e33', isDark),
                                                    borderColor: msg.role === 'user'
                                                        ? theme.colors.blue[6]
                                                        : themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[6], isDark),
                                                }}
                                            >
                                                <Group gap="xs" mb="xs">
                                                    <ThemeIcon
                                                        color={msg.role === 'user' ? 'white' : 'blue'}
                                                        variant="light"
                                                        size="sm"
                                                    >
                                                        {msg.role === 'user' ? <IconMessage size={12} /> : <IconBrain size={12} />}
                                                    </ThemeIcon>
                                                    <Text size="xs" c={msg.role === 'user' ? 'white' : 'dimmed'} fw={500}>
                                                        {msg.role === 'user' ? 'You' : 'AI Assistant'}
                                                    </Text>
                                                </Group>
                                                {msg.role === 'user' ? (
                                                    <Text
                                                        size="sm"
                                                        c="white"
                                                        style={{ whiteSpace: 'pre-wrap' }}
                                                    >
                                                        {msg.content}
                                                    </Text>
                                                ) : (
                                                    <Box>
                                                        {formatAIResponse(msg.content)}
                                                    </Box>
                                                )}
                                            </Card>
                                        </Group>
                                    ))}

                                    {isLoading && (
                                        <Group justify="flex-start" align="flex-start">
                                            <Card
                                                p="md"
                                                radius="md"
                                                style={{
                                                    backgroundColor: themeUtils.getThemedColor('#f8fafc', '#2c2e33', isDark),
                                                    borderColor: themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[6], isDark),
                                                }}
                                            >
                                                <Group gap="xs">
                                                    <Loader size="sm" />
                                                    <Text size="sm" c="dimmed">
                                                        Analyzing logs...
                                                    </Text>
                                                </Group>
                                            </Card>
                                        </Group>
                                    )}
                                </Stack>
                            )}
                            <div ref={messagesEndRef} />
                        </ScrollArea>

                        {/* Input Area */}
                        <Box p="md" style={{
                            borderTop: `1px solid ${themeUtils.getThemedColor(theme.colors.gray[2], theme.colors.gray[7], isDark)}`,
                        }}>
                            <form onSubmit={handleSubmit}>
                                <Group gap="sm" align="flex-end">
                                    <TextInput
                                        flex={1}
                                        value={input}
                                        onChange={handleInputChange}
                                        placeholder="Ask about your logs..."
                                        disabled={isLoading || !aiAvailable}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!input.trim() || isLoading || !aiAvailable}
                                        variant="light"
                                        color="blue"
                                        size="sm"
                                        leftSection={isLoading ? <Loader size="xs" /> : <IconSend size={16} />}
                                    >
                                        Send
                                    </Button>
                                </Group>
                            </form>
                        </Box>
                    </>
                )}
            </Stack>
        </Modal>
    );
}; 