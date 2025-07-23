import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Collapse,
    Group,
    Menu,
    ScrollArea,
    SegmentedControl,
    Select,
    Stack,
    Switch,
    Text,
    TextInput,
    Title,
    Tooltip,
    useMantineTheme
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconAlertCircle,
    IconAlertTriangle,
    IconArrowDown,
    IconBrain,
    IconCheck,
    IconClearAll,
    IconDownload,
    IconFilter,
    IconPlugConnected,
    IconRefresh,
    IconSearch,
    IconTerminal2,
    IconX
} from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { AIChatModal } from '../components/AIChatModal';
import { useSocket } from '../hooks/useSocket';
import { themeUtils, useTheme } from '../lib/theme';
import { useConnections, useConnectToServer } from '../services/connections';
import {
    activeConnectionIdAtom,
    addConnectionModalAtom,
    connectionStatusAtom,
    logStreamingAtom,
    userPreferencesAtom
} from '../store/atoms';

interface LogCommand {
    type: 'command' | 'file';
    value: string;
    follow?: boolean;
}

export const LogsPage = () => {
    const theme = useMantineTheme();
    const { isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [command, setCommand] = useState('docker logs -f myapp -n 1000');
    const [commandType, setCommandType] = useState<'command' | 'file'>('command');
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [commandHistory, setCommandHistory] = useState<Array<{ command: string, timestamp: Date, success: boolean, error?: string }>>([]);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [, setAddConnectionModal] = useAtom(addConnectionModalAtom);
    const surfaceColors = themeUtils.getSurfaceColors(isDark);

    const [activeConnectionId, setActiveConnectionId] = useAtom(activeConnectionIdAtom);
    const [connectionStatus] = useAtom(connectionStatusAtom);
    const [isStreaming, setIsStreaming] = useAtom(logStreamingAtom);
    const [userPreferences, setUserPreferences] = useAtom(userPreferencesAtom);

    const { data: connections } = useConnections();
    const connectToServer = useConnectToServer();
    const {
        logs,
        activeSession,
        startLogStream,
        stopLogStream,
        downloadLogs,
        clearLogs
    } = useSocket();

    const logContainerRef = useRef<HTMLDivElement>(null);
    const endOfLogsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (userPreferences.autoScroll && endOfLogsRef.current) {
            endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, userPreferences.autoScroll]);

    useEffect(() => {
        const container = logContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setUserPreferences({ ...userPreferences, autoScroll: isNearBottom });
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [userPreferences, setUserPreferences]);

    useEffect(() => {
        if (connections?.length && !activeConnectionId) {
            setActiveConnectionId(connections[0].id);
        }
    }, [connections, activeConnectionId, setActiveConnectionId]);

    const activeConnection = connections?.find(conn => conn.id === activeConnectionId);

    const getLogLevel = (content: string): 'error' | 'warn' | 'info' | 'debug' | 'default' => {
        if (!content || typeof content !== 'string') return 'default';

        const lower = content.toLowerCase();

        if (lower.startsWith('command info:')) return 'info';
        if (lower.startsWith('stderr:')) {
            const stderrContent = lower.substring(7);
            if (stderrContent.includes('error response from daemon') ||
                stderrContent.includes('no such container') ||
                stderrContent.includes('permission denied') ||
                stderrContent.includes('connection refused') ||
                stderrContent.includes('command not found')) {
                return 'error';
            }
            if (stderrContent.includes('error') || stderrContent.includes('failed') ||
                stderrContent.includes('exception') || stderrContent.includes('fatal')) {
                return 'error';
            }
            return 'warn';
        }
        if (lower.startsWith('server error:')) return 'error';
        if (lower.startsWith('stream error:')) return 'error';
        if (lower.startsWith('command exited:')) return 'warn';

        if (lower.includes('error') || lower.includes('err') || lower.includes('failed') ||
            lower.includes('exception') || lower.includes('fatal') || lower.includes('panic') ||
            lower.includes('critical') || lower.match(/\berr\b/)) {
            return 'error';
        }

        if (lower.includes('warn') || lower.includes('warning') || lower.includes('caution') ||
            lower.includes('deprecated') || lower.match(/\bwarn\b/)) {
            return 'warn';
        }

        if (lower.includes('info') || lower.includes('information') || lower.includes('notice') ||
            lower.match(/\binfo\b/) || lower.includes('log:')) {
            return 'info';
        }

        if (lower.includes('debug') || lower.includes('trace') || lower.includes('verbose') ||
            lower.match(/\bdebug\b/) || lower.match(/\btrace\b/)) {
            return 'debug';
        }

        if (lower.match(/^\d{4}-\d{2}-\d{2}.*\berror\b/)) return 'error';
        if (lower.match(/^\d{4}-\d{2}-\d{2}.*\bwarn\b/)) return 'warn';
        if (lower.match(/^\d{4}-\d{2}-\d{2}.*\binfo\b/)) return 'info';
        if (lower.match(/^\d{4}-\d{2}-\d{2}.*\bdebug\b/)) return 'debug';

        if (lower.match(/\[error\]|\berr:/)) return 'error';
        if (lower.match(/\[warn\]|\bwarn:/)) return 'warn';
        if (lower.match(/\[info\]|\binfo:/)) return 'info';
        if (lower.match(/\[debug\]|\bdebug:/)) return 'debug';

        return 'default';
    };

    const filteredLogs = logs.filter(log => {
        if (!log || !log.data) return false;

        const matchesSearch = searchQuery === '' ||
            log.data.toLowerCase().includes(searchQuery.toLowerCase());

        const logLevel = getLogLevel(log.data);
        const matchesLevel = selectedLevel === null || selectedLevel === '' ||
            logLevel === selectedLevel;

        return matchesSearch && matchesLevel;
    });

    useEffect(() => {
        if (import.meta.env.DEV && logs.length > 0) {
            logs.reduce((acc, log) => {
                const level = getLogLevel(log.data);
                acc[level] = (acc[level] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        }
    }, [logs]);

    const handleExecuteOnce = async () => {
        if (!activeConnectionId) {
            notifications.show({
                title: 'No Connection',
                message: 'Please select a connection first',
                color: 'orange',
            });
            return;
        }

        if (isExecuting) {
            notifications.show({
                title: 'Command In Progress',
                message: 'Please wait for the current command to finish',
                color: 'yellow',
            });
            return;
        }

        setIsExecuting(true);
        setLastError(null);

        try {
            const logCommand: LogCommand = {
                type: commandType,
                value: command,
                follow: false
            };

            notifications.show({
                id: 'command-execution',
                title: 'Executing Command',
                message: `Running: ${command}`,
                color: 'blue',
                loading: true,
                autoClose: false,
            });

            startLogStream(activeConnectionId, logCommand);

            setCommandHistory(prev => [
                { command, timestamp: new Date(), success: true },
                ...prev.slice(0, 9)
            ]);

            setTimeout(() => {
                notifications.update({
                    id: 'command-execution',
                    title: 'Command Sent',
                    message: 'Check log output below',
                    color: 'green',
                    loading: false,
                    autoClose: 3000,
                });
            }, 1000);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setLastError(errorMessage);

            setCommandHistory(prev => [
                { command, timestamp: new Date(), success: false, error: errorMessage },
                ...prev.slice(0, 9)
            ]);

            notifications.update({
                id: 'command-execution',
                title: 'Command Failed',
                message: errorMessage,
                color: 'red',
                loading: false,
                autoClose: 5000,
            });
        } finally {
            setIsExecuting(false);
        }
    };

    const handleToggleStreaming = async () => {
        if (!activeConnectionId) {
            notifications.show({
                title: 'No Connection',
                message: 'Please select a connection first',
                color: 'orange',
            });
            return;
        }

        if (isStreaming) {
            stopLogStream(activeSession || undefined);
            setIsStreaming(false);
            notifications.show({
                title: 'Stream Stopped',
                message: 'Log streaming has been stopped',
                color: 'blue',
                autoClose: 2000,
            });
        } else {
            try {
                setLastError(null);
                const logCommand: LogCommand = {
                    type: commandType,
                    value: command,
                    follow: true
                };

                startLogStream(activeConnectionId, logCommand);
                setIsStreaming(true);

                notifications.show({
                    title: 'Stream Started',
                    message: `Streaming: ${command}`,
                    color: 'green',
                    autoClose: 3000,
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setLastError(errorMessage);
                notifications.show({
                    title: 'Stream Failed',
                    message: errorMessage,
                    color: 'red',
                    autoClose: 5000,
                });
            }
        }
    };

    const retryLastCommand = () => {
        if (commandHistory.length > 0) {
            const lastCommand = commandHistory[0];
            setCommand(lastCommand.command);
            if (lastCommand.success) {
                handleExecuteOnce();
            } else {
                notifications.show({
                    title: 'Command Ready',
                    message: 'Previous command loaded. Click Execute to retry.',
                    color: 'blue',
                    autoClose: 3000,
                });
            }
        }
    };

    const handleDownloadLogs = async (format: 'txt' | 'json') => {
        if (!activeConnectionId) {
            notifications.show({
                title: 'No Connection',
                message: 'Please select a connection first',
                color: 'orange',
            });
            return;
        }

        try {
            setDownloadProgress(0);

            const logCommand: LogCommand = {
                type: commandType,
                value: command,
                follow: false
            };

            notifications.show({
                id: 'download-starting',
                title: 'Download Starting',
                message: 'Preparing log download...',
                color: 'blue',
                loading: true,
                autoClose: false,
            });

            await downloadLogs(activeConnectionId, logCommand, format, (progress) => {
                setDownloadProgress(progress);
                notifications.update({
                    id: 'download-starting',
                    title: 'Downloading Logs',
                    message: `Download progress: ${progress}%`,
                    color: 'blue',
                    loading: progress < 100,
                    autoClose: progress === 100 ? 3000 : false,
                });
            });

            setDownloadProgress(null);
            notifications.update({
                id: 'download-starting',
                title: 'Download Complete',
                message: `Log file has been downloaded as ${format.toUpperCase()}`,
                color: 'green',
                loading: false,
                autoClose: 3000,
            });

        } catch (error) {
            setDownloadProgress(null);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            notifications.update({
                id: 'download-starting',
                title: 'Download Failed',
                message: errorMessage,
                color: 'red',
                loading: false,
                autoClose: 5000,
            });
        }
    };

    const scrollToBottom = () => {
        if (endOfLogsRef.current) {
            endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
            setUserPreferences({ ...userPreferences, autoScroll: true });
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error': return 'red';
            case 'warn': return 'yellow';
            case 'info': return 'blue';
            case 'debug': return 'gray';
            default: return 'gray';
        }
    };

    const formatTimestamp = (timestamp: Date) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    };

    const highlightSearchTerm = (content: string, term: string): React.ReactElement => {
        if (!term) return <span>{content}</span>;

        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = content.split(regex);

        return (
            <span>
                {parts.map((part, index) =>
                    regex.test(part) ? (
                        <mark key={index} style={{
                            backgroundColor: themeUtils.getThemedColor(theme.colors.yellow[2], theme.colors.yellow[8], isDark),
                            color: surfaceColors.text,
                            borderRadius: theme.radius.xs,
                            padding: '1px 2px',
                        }}>
                            {part}
                        </mark>
                    ) : (
                        <span key={index}>{part}</span>
                    )
                )}
            </span>
        );
    };

    const commonCommands = [
        'docker logs -f myapp -n 1000',
        'docker logs -f myapp --since 1h',
        'tail -f /var/log/nginx/access.log',
        'tail -f /var/log/nginx/error.log',
        'journalctl -f -u myservice',
        'tail -f /var/log/syslog'
    ];

    const getCommandStatusIcon = (success: boolean) => {
        return success ? (
            <IconCheck size={14} style={{ color: 'var(--mantine-color-green-6)' }} />
        ) : (
            <IconX size={14} style={{ color: 'var(--mantine-color-red-6)' }} />
        );
    };

    const handleConnect = async () => {
        if (!activeConnectionId) {
            notifications.show({
                title: 'No Connection Selected',
                message: 'Please select a connection first',
                color: 'orange',
            });
            return;
        }

        try {
            await connectToServer.mutateAsync(activeConnectionId);
        } catch {
            // Error notification is handled in the service hook
        }
    };

    return (
        <Stack gap="md">
            {/* Header */}
            <Stack gap="sm">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Box style={{ minWidth: 0, flex: 1 }}>
                        <Title order={2} style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>Log Viewer</Title>
                        <Text c="dimmed" size="sm" truncate>
                            Real-time server logs and monitoring
                            {activeConnection && (
                                <> • {activeConnection.name} ({activeConnection.username}@{activeConnection.host})</>
                            )}
                        </Text>
                    </Box>
                    <Group gap="xs" visibleFrom="sm">
                        {isStreaming && (
                            <Badge color="red" variant="light" size="sm">
                                LIVE
                            </Badge>
                        )}
                        {isExecuting && (
                            <Badge color="blue" variant="light" size="sm">
                                EXEC
                            </Badge>
                        )}
                        <Text size="xs" c="dimmed">
                            {filteredLogs.length} / {logs.length}
                        </Text>
                    </Group>
                </Group>
                
                <Group gap="xs" style={{ flexWrap: 'wrap' }}>
                    <Select
                        placeholder={connections?.length ? "Select connection" : "No connections"}
                        data={connections?.map(conn => ({
                            value: conn.id,
                            label: `${conn.name} (${conn.username}@${conn.host})`
                        })) || []}
                        value={activeConnectionId}
                        onChange={setActiveConnectionId}
                        style={{ minWidth: 200, flex: 1 }}
                        variant="filled"
                        size="sm"
                        disabled={!connections?.length}
                    />
                    <Tooltip label={connectionStatus === 'connected' ? "Already connected" : "Connect to server"}>
                        <Button
                            size="sm"
                            variant={connectionStatus === 'connected' ? 'filled' : 'light'}
                            color={connectionStatus === 'connected' ? 'green' : 'blue'}
                            leftSection={<IconPlugConnected size={14} />}
                            onClick={handleConnect}
                            loading={connectToServer.isPending || connectionStatus === 'connecting'}
                            disabled={!activeConnectionId || connectionStatus === 'connected'}
                        >
                            {connectionStatus === 'connected' ? 'Connected' : 'Connect'}
                        </Button>
                    </Tooltip>
                </Group>

                <Group gap="xs" hiddenFrom="sm" style={{ flexWrap: 'wrap' }}>
                    {isStreaming && (
                        <Badge color="red" variant="light" size="sm">
                            LIVE STREAMING
                        </Badge>
                    )}
                    {isExecuting && (
                        <Badge color="blue" variant="light" size="sm">
                            EXECUTING
                        </Badge>
                    )}
                    <Text size="xs" c="dimmed">
                        {filteredLogs.length} / {logs.length} lines
                    </Text>
                </Group>
            </Stack>

            {/* Error Alert */}
            {lastError && (
                <Alert
                    icon={<IconAlertTriangle size={16} />}
                    title="Command Error"
                    color="red"
                    variant="light"
                    withCloseButton
                    onClose={() => setLastError(null)}
                >
                    <Text size="sm" mb="xs">{lastError}</Text>
                    <Group gap="xs">
                        <Button size="xs" variant="light" leftSection={<IconRefresh size={14} />} onClick={retryLastCommand}>
                            Retry
                        </Button>
                        <Button size="xs" variant="subtle" onClick={() => setLastError(null)}>
                            Dismiss
                        </Button>
                    </Group>
                </Alert>
            )}

            {/* Command Bar */}
            <Card shadow="sm" padding="md" radius="md" withBorder>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Group gap="xs">
                            <IconTerminal2 size={16} />
                            <Text size="sm" fw={500}>Command Center</Text>
                        </Group>
                        <Group gap="xs">
                            <SegmentedControl
                                size="xs"
                                value={commandType}
                                onChange={(value) => setCommandType(value as 'command' | 'file')}
                                data={[
                                    { label: 'Command', value: 'command' },
                                    { label: 'File', value: 'file' }
                                ]}
                            />
                        </Group>
                    </Group>

                    <Group gap="md" align="flex-end">
                        <TextInput
                            style={{ flex: 1 }}
                            placeholder={commandType === 'command' ? 'docker logs -f myapp -n 1000' : '/var/log/app.log'}
                            value={command}
                            onChange={(e) => setCommand(e.currentTarget.value)}
                            leftSection={<IconTerminal2 size={16} />}
                            styles={{ input: { fontFamily: 'monospace' } }}
                        />

                        <Group gap="xs">
                            <Button
                                onClick={handleExecuteOnce}
                                loading={isExecuting}
                                disabled={!activeConnectionId || !command.trim()}
                                variant="filled"
                                size="sm"
                            >
                                Execute
                            </Button>

                            <Button
                                onClick={handleToggleStreaming}
                                disabled={!activeConnectionId || !command.trim()}
                                color={isStreaming ? 'red' : 'blue'}
                                variant={isStreaming ? 'filled' : 'light'}
                                size="sm"
                            >
                                {isStreaming ? 'Stop Stream' : 'Stream'}
                            </Button>
                        </Group>
                    </Group>

                    {/* Quick Commands */}
                    <Group gap="xs">
                        <Text size="xs" c="dimmed" style={{ minWidth: 'fit-content' }}>Quick:</Text>
                        <Group gap={4} style={{ flexWrap: 'wrap' }}>
                            {commonCommands.map((cmd, index) => (
                                <Button
                                    key={index}
                                    size="xs"
                                    variant="subtle"
                                    onClick={() => setCommand(cmd)}
                                    styles={{ root: { fontFamily: 'monospace' } }}
                                >
                                    {cmd.length > 35 ? cmd.substring(0, 35) + '...' : cmd}
                                </Button>
                            ))}
                        </Group>
                    </Group>

                    {/* Command History */}
                    {commandHistory.length > 0 && (
                        <Collapse in={true}>
                            <Stack gap="xs">
                                <Text size="xs" c="dimmed">Recent Commands:</Text>
                                <Group gap="xs" style={{ flexWrap: 'wrap' }}>
                                    {commandHistory.slice(0, 5).map((cmd, index) => (
                                        <Button
                                            key={index}
                                            size="xs"
                                            variant="subtle"
                                            color={cmd.success ? 'blue' : 'red'}
                                            leftSection={getCommandStatusIcon(cmd.success)}
                                            onClick={() => setCommand(cmd.command)}
                                            title={cmd.error || `Executed at ${cmd.timestamp.toLocaleTimeString()}`}
                                            styles={{ root: { fontFamily: 'monospace' } }}
                                        >
                                            {cmd.command.length > 30 ? cmd.command.substring(0, 30) + '...' : cmd.command}
                                        </Button>
                                    ))}
                                </Group>
                            </Stack>
                        </Collapse>
                    )}
                </Stack>
            </Card>

            {/* Toolbar */}
            <Stack gap="sm">
                <Group gap="sm" style={{ flexWrap: 'wrap' }}>
                    <TextInput
                        placeholder="Search logs..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ minWidth: 200, flex: 1 }}
                        variant={searchQuery ? 'filled' : 'default'}
                        rightSection={searchQuery && (
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                onClick={() => setSearchQuery('')}
                            >
                                ×
                            </ActionIcon>
                        )}
                    />

                    <Select
                        placeholder="Filter level"
                        leftSection={<IconFilter size={16} />}
                        data={[
                            { value: 'error', label: 'Error' },
                            { value: 'warn', label: 'Warning' },
                            { value: 'info', label: 'Info' },
                            { value: 'debug', label: 'Debug' },
                        ]}
                        value={selectedLevel}
                        onChange={setSelectedLevel}
                        clearable
                        style={{ minWidth: 120 }}
                        variant={selectedLevel ? 'filled' : 'default'}
                        rightSection={selectedLevel && (
                            <Badge size="xs" color="blue" variant="dot" />
                        )}
                    />
                </Group>

                <Group gap="xs" justify="space-between" style={{ flexWrap: 'wrap' }}>
                    <Switch
                        size="sm"
                        label="Auto-scroll"
                        checked={userPreferences.autoScroll}
                        onChange={(e) => setUserPreferences({
                            ...userPreferences,
                            autoScroll: e.currentTarget.checked
                        })}
                    />

                    <Group gap="xs">
                        {(searchQuery || selectedLevel) && (
                            <Tooltip label="Clear all filters">
                                <ActionIcon
                                    variant="light"
                                    color="red"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedLevel(null);
                                    }}
                                >
                                    ×
                                </ActionIcon>
                            </Tooltip>
                        )}

                        <Tooltip label="Scroll to bottom">
                            <ActionIcon
                                variant="light"
                                size="sm"
                                onClick={scrollToBottom}
                                disabled={userPreferences.autoScroll}
                            >
                                <IconArrowDown size={16} />
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Clear logs">
                            <ActionIcon
                                variant="light"
                                color="orange"
                                size="sm"
                                onClick={clearLogs}
                                disabled={logs.length === 0}
                            >
                                <IconClearAll size={16} />
                            </ActionIcon>
                        </Tooltip>

                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <Tooltip label="Download logs">
                                    <ActionIcon
                                        variant="light"
                                        color="blue"
                                        size="sm"
                                        loading={downloadProgress !== null}
                                    >
                                        <IconDownload size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>
                                    Download Format
                                    {downloadProgress !== null && (
                                        <Text size="xs" c="dimmed" mt="xs">
                                            Progress: {downloadProgress}%
                                        </Text>
                                    )}
                                </Menu.Label>
                                <Menu.Item
                                    onClick={() => handleDownloadLogs('txt')}
                                    disabled={!activeConnectionId || downloadProgress !== null}
                                >
                                    Download as TXT
                                </Menu.Item>
                                <Menu.Item
                                    onClick={() => handleDownloadLogs('json')}
                                    disabled={!activeConnectionId || downloadProgress !== null}
                                >
                                    Download as JSON
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </Stack>

            {/* Log Display */}
            <Card padding={0} radius="md" withBorder style={{ minHeight: 500 }}>
                <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                    <Group gap="xs">
                        <IconTerminal2 size={16} />
                        <Text size="sm" fw={500}>
                            Log Output
                        </Text>
                        {isStreaming && (
                            <Badge size="xs" color="red" variant="dot">
                                LIVE
                            </Badge>
                        )}
                    </Group>
                    <Group gap="xs">
                        <Text size="xs" c="dimmed">
                            {filteredLogs.length} entries shown
                        </Text>
                        {logs.length > 0 && (
                            <Button
                                onClick={() => setIsAIChatOpen(true)}
                                size="xs"
                                variant="light"
                                color="blue"
                                leftSection={<IconBrain size={14} />}
                            >
                                Ask AI
                            </Button>
                        )}
                    </Group>
                </Group>

                <ScrollArea h={450} p="md" ref={logContainerRef}>
                    <Stack gap="xs">
                        {filteredLogs.length === 0 ? (
                            <Group justify="center" py="xl">
                                <Stack align="center" gap="md">
                                    <IconAlertCircle size={32} color="var(--mantine-color-gray-5)" />
                                    <Text c="dimmed" size="sm" ta="center">
                                        {!connections?.length ?
                                            'No server connections available. Please add a connection first.' :
                                            !activeConnectionId ?
                                                'Select a connection and enter a command to view logs' :
                                                'No logs yet. Execute a command or start streaming to see logs'
                                        }
                                    </Text>
                                    {!connections?.length && (
                                        <Button
                                            size="sm"
                                            variant="light"
                                            onClick={() => setAddConnectionModal({ open: true, editingConnection: null })}
                                        >
                                            Add Connection
                                        </Button> 
                                    )}
                                </Stack>
                            </Group>
                        ) : (
                            filteredLogs.map((log, index) => {
                                const level = getLogLevel(log.data);
                                return (
                                    <Group key={index} gap="md" wrap="nowrap" align="flex-start">
                                        <Text size="xs" c="dimmed" style={{ minWidth: 80, fontFamily: 'monospace' }}>
                                            {formatTimestamp(log.timestamp)}
                                        </Text>

                                        {level !== 'default' && (
                                            <Badge
                                                color={getLevelColor(level)}
                                                variant="light"
                                                size="xs"
                                                style={{ minWidth: 50 }}
                                            >
                                                {level.toUpperCase()}
                                            </Badge>
                                        )}

                                        <Text size="sm" style={{ flex: 1, fontFamily: 'monospace' }}>
                                            {highlightSearchTerm(log.data, searchQuery)}
                                        </Text>
                                    </Group>
                                );
                            })
                        )}
                    </Stack>
                    <div ref={endOfLogsRef} />
                </ScrollArea>
            </Card>

            {/* AI Chat Modal */}
            <AIChatModal
                isOpen={isAIChatOpen}
                onClose={() => setIsAIChatOpen(false)}
                logs={logs}
            />
        </Stack>
    );
}; 