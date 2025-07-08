import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    Group,
    ScrollArea,
    Select,
    Stack,
    Switch,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconAlertCircle,
    IconDownload,
    IconFilter,
    IconPlayerPause,
    IconPlayerPlay,
    IconRefresh,
    IconSearch,
    IconTerminal2,
} from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useConnections } from '../services/connections';
import {
    activeConnectionIdAtom,
    logStreamingAtom,
    socketConnectedAtom,
    userPreferencesAtom
} from '../store/atoms';

interface LogCommand {
    type: 'command' | 'file';
    value: string;
    follow?: boolean;
}

export const LogsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [downloadFormat, setDownloadFormat] = useState<'txt' | 'json'>('txt');
    const [command, setCommand] = useState('docker logs -f myapp -n 1000');
    const [commandType, setCommandType] = useState<'command' | 'file'>('command');

    // Atoms
    const [activeConnectionId, setActiveConnectionId] = useAtom(activeConnectionIdAtom);
    const [isStreaming, setIsStreaming] = useAtom(logStreamingAtom);
    const [socketConnected] = useAtom(socketConnectedAtom);
    const [userPreferences, setUserPreferences] = useAtom(userPreferencesAtom);

    // Hooks
    const { data: connections } = useConnections();
    const {
        logs,
        activeSession,
        startLogStream,
        stopLogStream,
        downloadLogs
    } = useSocket();

    // Refs
    const logContainerRef = useRef<HTMLDivElement>(null);
    const endOfLogsRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (userPreferences.autoScroll && endOfLogsRef.current) {
            endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, userPreferences.autoScroll]);

    // Check if user scrolled up to disable auto-scroll
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

    const activeConnection = connections?.find(conn => conn.id === activeConnectionId);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = searchQuery === '' ||
            log.data.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLevel = selectedLevel === null ||
            getLogLevel(log.data) === selectedLevel;

        return matchesSearch && matchesLevel;
    });

    const handleToggleStreaming = () => {
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
        } else {
            const logCommand: LogCommand = {
                type: commandType,
                value: command,
                follow: true
            };
            startLogStream(activeConnectionId, logCommand);
            setIsStreaming(true);
        }
    };

    const handleExecuteOnce = () => {
        if (!activeConnectionId) {
            notifications.show({
                title: 'No Connection',
                message: 'Please select a connection first',
                color: 'orange',
            });
            return;
        }

        const logCommand: LogCommand = {
            type: commandType,
            value: command,
            follow: false
        };
        startLogStream(activeConnectionId, logCommand);
    };

    const handleDownloadLogs = async () => {
        if (!activeConnectionId) {
            notifications.show({
                title: 'No Connection',
                message: 'Please select a connection first',
                color: 'orange',
            });
            return;
        }

        try {
            const logCommand: LogCommand = {
                type: commandType,
                value: command,
                follow: false
            };
            await downloadLogs(activeConnectionId, logCommand, downloadFormat);
            notifications.show({
                title: 'Download Started',
                message: 'Log file will be downloaded shortly',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Download Failed',
                message: 'Failed to download logs: ' + (error instanceof Error ? error.message : 'Unknown error'),
                color: 'red',
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

    const getLogLevel = (content: string): 'error' | 'warn' | 'info' | 'debug' | 'default' => {
        const lower = content.toLowerCase();
        if (lower.includes('error') || lower.includes('err') || lower.includes('failed') || lower.includes('exception')) return 'error';
        if (lower.includes('warn') || lower.includes('warning')) return 'warn';
        if (lower.includes('info') || lower.includes('information')) return 'info';
        if (lower.includes('debug') || lower.includes('trace')) return 'debug';
        return 'default';
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
                        <mark key={index} style={{ backgroundColor: 'var(--mantine-color-yellow-2)', color: 'var(--mantine-color-dark-9)' }}>
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

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between">
                <div>
                    <Title order={2}>Log Viewer</Title>
                    <Text c="dimmed" size="sm">
                        Real-time server logs and monitoring
                        {activeConnection && (
                            <> • {activeConnection.name} ({activeConnection.username}@{activeConnection.host})</>
                        )}
                    </Text>
                </div>
                <Group gap="sm">
                    <Button
                        variant="light"
                        leftSection={<IconDownload size={16} />}
                        onClick={handleDownloadLogs}
                        disabled={!activeConnectionId}
                    >
                        Download
                    </Button>
                    <Button
                        variant={isStreaming ? 'filled' : 'light'}
                        color={isStreaming ? 'red' : 'green'}
                        leftSection={isStreaming ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                        onClick={handleToggleStreaming}
                        disabled={!activeConnectionId}
                    >
                        {isStreaming ? 'Stop' : 'Start'} Stream
                    </Button>
                </Group>
            </Group>

            {/* Connection Status */}
            <Alert
                icon={<IconTerminal2 size={16} />}
                color={socketConnected && activeConnectionId ? 'green' : 'gray'}
                variant="light"
            >
                <Group justify="space-between">
                    <Text size="sm">
                        {socketConnected ?
                            (activeConnectionId ?
                                `Connected to ${activeConnection?.name || 'server'} - ${isStreaming ? 'streaming live logs' : 'ready to stream'}`
                                : 'Socket connected - select a connection to view logs'
                            )
                            : 'Not connected to socket server'
                        }
                    </Text>
                    <Badge color={socketConnected && activeConnectionId ? 'green' : 'gray'} variant="light">
                        {isStreaming ? 'LIVE' : socketConnected ? 'READY' : 'OFFLINE'}
                    </Badge>
                </Group>
            </Alert>

            {/* Command Input */}
            <Card shadow="sm" padding="md" radius="md" withBorder>
                <Stack gap="md">
                    <Group gap="md">
                        <Select
                            placeholder="Select connection"
                            data={connections?.map(conn => ({
                                value: conn.id,
                                label: `${conn.name} (${conn.username}@${conn.host})`
                            })) || []}
                            value={activeConnectionId}
                            onChange={setActiveConnectionId}
                            style={{ flex: 1 }}
                        />
                        <Group gap="sm">
                            <Switch
                                size="xs"
                                checked={commandType === 'command'}
                                onChange={(e) => setCommandType(e.currentTarget.checked ? 'command' : 'file')}
                                label="Command"
                            />
                        </Group>
                    </Group>

                    <Group gap="sm">
                        <TextInput
                            placeholder={commandType === 'command' ? 'docker logs -f myapp -n 1000' : '/var/log/app.log'}
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Button
                            variant="light"
                            size="sm"
                            onClick={handleExecuteOnce}
                            disabled={!activeConnectionId || !command}
                        >
                            Execute Once
                        </Button>
                    </Group>

                    {/* Quick Commands */}
                    {commandType === 'command' && (
                        <Group gap="xs">
                            {commonCommands.map((cmd, index) => (
                                <Button
                                    key={index}
                                    variant="subtle"
                                    size="xs"
                                    onClick={() => setCommand(cmd)}
                                >
                                    {cmd.length > 30 ? cmd.substring(0, 30) + '...' : cmd}
                                </Button>
                            ))}
                        </Group>
                    )}
                </Stack>
            </Card>

            {/* Controls */}
            <Card shadow="sm" padding="md" radius="md" withBorder>
                <Group gap="md" align="flex-end">
                    <TextInput
                        placeholder="Search logs..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1 }}
                    />

                    <Select
                        placeholder="Filter by level"
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
                        w={150}
                    />

                    <Switch
                        label="Auto-scroll"
                        checked={userPreferences.autoScroll}
                        onChange={(e) => setUserPreferences({
                            ...userPreferences,
                            autoScroll: e.currentTarget.checked
                        })}
                    />

                    <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={scrollToBottom}
                    >
                        <IconRefresh size={16} />
                    </ActionIcon>

                    <Select
                        value={downloadFormat}
                        onChange={(value) => setDownloadFormat(value as 'txt' | 'json')}
                        data={[
                            { value: 'txt', label: 'TXT' },
                            { value: 'json', label: 'JSON' },
                        ]}
                        w={80}
                    />
                </Group>
            </Card>

            {/* Log Output */}
            <Card shadow="sm" padding={0} radius="md" withBorder style={{ minHeight: 500 }}>
                <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                    <Group gap="xs">
                        <IconTerminal2 size={16} />
                        <Text size="sm" fw={500}>
                            Log Output
                        </Text>
                        {isStreaming && (
                            <Badge size="xs" color="red" variant="light">
                                STREAMING
                            </Badge>
                        )}
                    </Group>
                    <Text size="xs" c="dimmed">
                        {filteredLogs.length} entries shown
                    </Text>
                </Group>

                <ScrollArea h={450} p="md" ref={logContainerRef}>
                    <Stack gap="xs">
                        {filteredLogs.length === 0 ? (
                            <Group justify="center" py="xl">
                                <Stack align="center" gap="md">
                                    <IconAlertCircle size={32} color="var(--mantine-color-gray-5)" />
                                    <Text c="dimmed" size="sm">
                                        {!activeConnectionId ?
                                            'Select a connection and enter a command to view logs' :
                                            'No logs yet. Execute a command or start streaming to see logs'
                                        }
                                    </Text>
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

                                        <Badge
                                            color={getLevelColor(level)}
                                            variant="light"
                                            size="xs"
                                            style={{ minWidth: 60 }}
                                        >
                                            {level.toUpperCase()}
                                        </Badge>

                                        <Text size="sm" style={{ flex: 1, fontFamily: 'monospace' }}>
                                            {highlightSearchTerm(log.data, searchQuery)}
                                        </Text>
                                    </Group>
                                );
                            })
                        )}
                    </Stack>
                    <div ref={endOfLogsRef} className="h-4" />
                </ScrollArea>
            </Card>

            {/* Quick Stats */}
            <Group gap="md">
                <Card shadow="sm" padding="sm" radius="md" withBorder style={{ flex: 1 }}>
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed">Total Lines</Text>
                        <Badge color="blue" variant="light" size="sm">{logs.length}</Badge>
                    </Group>
                </Card>

                <Card shadow="sm" padding="sm" radius="md" withBorder style={{ flex: 1 }}>
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed">Filtered</Text>
                        <Badge color="green" variant="light" size="sm">{filteredLogs.length}</Badge>
                    </Group>
                </Card>

                <Card shadow="sm" padding="sm" radius="md" withBorder style={{ flex: 1 }}>
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed">Session</Text>
                        <Badge color={activeSession ? 'orange' : 'gray'} variant="light" size="sm">
                            {activeSession ? 'ACTIVE' : 'IDLE'}
                        </Badge>
                    </Group>
                </Card>
            </Group>
        </Stack>
    );
}; 