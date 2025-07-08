import { useState, useRef, useEffect } from 'react';

interface Connection {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    connected?: boolean;
}

interface LogCommand {
    type: 'command' | 'file';
    value: string;
    follow?: boolean;
}

interface LogEntry {
    sessionId: string;
    data: string;
    timestamp: Date;
}

interface LogViewerProps {
    connection: Connection;
    onStartLogStream: (connectionId: string, command: LogCommand) => void;
    onStopLogStream: (sessionId?: string) => void;
    logs: LogEntry[];
    onClearLogs: () => void;
}

export const LogViewer = ({
    connection,
    onStartLogStream,
    onStopLogStream,
    logs,
    onClearLogs
}: LogViewerProps) => {
    const [command, setCommand] = useState('docker logs -f myapp -n 1000');
    const [commandType, setCommandType] = useState<'command' | 'file'>('command');
    const [isStreaming, setIsStreaming] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const [downloadFormat, setDownloadFormat] = useState<'txt' | 'json'>('txt');

    const logContainerRef = useRef<HTMLDivElement>(null);
    const endOfLogsRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (autoScroll && endOfLogsRef.current) {
            endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll]);

    // Check if user scrolled up to disable auto-scroll
    useEffect(() => {
        const container = logContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setAutoScroll(isNearBottom);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Force scroll to bottom
    const scrollToBottom = () => {
        if (endOfLogsRef.current) {
            endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
            setAutoScroll(true);
        }
    };

    const handleStartStreaming = () => {
        if (!connection.connected) {
            alert('Please connect to the server first');
            return;
        }

        const logCommand: LogCommand = {
            type: commandType,
            value: command,
            follow: true
        };

        onStartLogStream(connection.id, logCommand);
        setIsStreaming(true);
    };

    const handleStopStreaming = () => {
        onStopLogStream();
        setIsStreaming(false);
    };

    const handleExecuteOnce = () => {
        if (!connection.connected) {
            alert('Please connect to the server first');
            return;
        }

        const logCommand: LogCommand = {
            type: commandType,
            value: command,
            follow: false
        };

        onStartLogStream(connection.id, logCommand);
    };

    const handleDownload = async () => {
        try {
            const logCommand: LogCommand = {
                type: commandType,
                value: command,
                follow: false
            };

            const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'}/api/servers/download-logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    connectionId: connection.id,
                    command: logCommand,
                    format: downloadFormat
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `logs-${connection.name}-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.${downloadFormat}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Download failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // Filter logs based on search term
    const filteredLogs = logs.filter(log =>
        searchTerm === '' || log.data.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get log level from log content
    const getLogLevel = (content: string): 'error' | 'warn' | 'info' | 'debug' | 'success' | 'default' => {
        const lower = content.toLowerCase();
        if (lower.includes('error') || lower.includes('err') || lower.includes('failed') || lower.includes('exception')) return 'error';
        if (lower.includes('warn') || lower.includes('warning')) return 'warn';
        if (lower.includes('info') || lower.includes('information')) return 'info';
        if (lower.includes('debug') || lower.includes('trace')) return 'debug';
        if (lower.includes('success') || lower.includes('ok') || lower.includes('completed')) return 'success';
        return 'default';
    };

    // Highlight search terms in content
    const highlightSearchTerm = (content: string, term: string): React.ReactElement => {
        if (!term) return <span>{content}</span>;

        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = content.split(regex);

        return (
            <span>
                {parts.map((part, index) =>
                    regex.test(part) ? (
                        <mark key={index} className="bg-yellow-300 text-black px-1 rounded">
                            {part}
                        </mark>
                    ) : (
                        <span key={index}>{part}</span>
                    )
                )}
            </span>
        );
    };

    // Format timestamp
    const formatTimestamp = (timestamp: Date): string => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
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
        <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{connection.name}</h3>
                        <p className="text-sm text-gray-500">{connection.username}@{connection.host}:{connection.port}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${connection.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {connection.connected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>

                {/* Command Input */}
                <div className="space-y-3">
                    <div className="flex space-x-2">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="command"
                                checked={commandType === 'command'}
                                onChange={(e) => setCommandType(e.target.value as 'command' | 'file')}
                                className="mr-2"
                            />
                            <span className="text-sm">Command</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="file"
                                checked={commandType === 'file'}
                                onChange={(e) => setCommandType(e.target.value as 'command' | 'file')}
                                className="mr-2"
                            />
                            <span className="text-sm">File Path</span>
                        </label>
                    </div>

                    <div className="flex space-x-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                placeholder={commandType === 'command' ? 'docker logs -f myapp -n 1000' : '/var/log/app.log'}
                            />
                        </div>
                        <div className="flex space-x-1">
                            {isStreaming ? (
                                <button
                                    onClick={handleStopStreaming}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                >
                                    Stop
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleStartStreaming}
                                        disabled={!connection.connected || !command}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        Stream
                                    </button>
                                    <button
                                        onClick={handleExecuteOnce}
                                        disabled={!connection.connected || !command}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        Execute
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quick Commands */}
                    {commandType === 'command' && (
                        <div className="flex flex-wrap gap-1">
                            {commonCommands.map((cmd, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCommand(cmd)}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                >
                                    {cmd.length > 30 ? cmd.substring(0, 30) + '...' : cmd}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Search logs..."
                        />
                        {searchTerm && (
                            <span className="text-sm text-gray-500">
                                {filteredLogs.length} / {logs.length} lines
                            </span>
                        )}
                    </div>

                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.target.checked)}
                            className="mr-2"
                        />
                        <span className="text-sm">Auto-scroll</span>
                    </label>

                    <button
                        onClick={scrollToBottom}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Scroll to Bottom
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    <select
                        value={downloadFormat}
                        onChange={(e) => setDownloadFormat(e.target.value as 'txt' | 'json')}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                        <option value="txt">TXT</option>
                        <option value="json">JSON</option>
                    </select>

                    <button
                        onClick={handleDownload}
                        disabled={!connection.connected || !command}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        Download
                    </button>

                    <button
                        onClick={onClearLogs}
                        className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Log Display */}
            <div className="flex-1 overflow-hidden">
                {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p>No logs yet</p>
                            <p className="text-sm mt-1">Execute a command or start streaming to see logs</p>
                        </div>
                    </div>
                ) : (
                    <div
                        ref={logContainerRef}
                        className="h-full overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 border-t"
                    >
                        <div className="divide-y divide-gray-200">
                            {filteredLogs.map((log, index) => {
                                const logLevel = getLogLevel(log.data);
                                const logLevelStyles = {
                                    error: 'bg-red-50 border-l-4 border-l-red-500 text-red-900',
                                    warn: 'bg-yellow-50 border-l-4 border-l-yellow-500 text-yellow-900',
                                    info: 'bg-blue-50 border-l-4 border-l-blue-500 text-blue-900',
                                    debug: 'bg-gray-50 border-l-4 border-l-gray-500 text-gray-700',
                                    success: 'bg-green-50 border-l-4 border-l-green-500 text-green-900',
                                    default: 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'
                                };

                                return (
                                    <div
                                        key={index}
                                        className={`px-4 py-3 transition-colors ${logLevelStyles[logLevel]}`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            {/* Line Number */}
                                            <div className="flex-shrink-0 w-12 text-xs text-gray-400 font-mono text-right select-none">
                                                {index + 1}
                                            </div>

                                            {/* Timestamp */}
                                            <div className="flex-shrink-0 text-xs text-gray-500 font-mono w-24">
                                                {formatTimestamp(log.timestamp)}
                                            </div>

                                            {/* Log Level Badge */}
                                            {logLevel !== 'default' && (
                                                <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${logLevel === 'error' ? 'bg-red-100 text-red-800' :
                                                        logLevel === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                                                            logLevel === 'info' ? 'bg-blue-100 text-blue-800' :
                                                                logLevel === 'debug' ? 'bg-gray-100 text-gray-800' :
                                                                    'bg-green-100 text-green-800'
                                                    }`}>
                                                    {logLevel}
                                                </div>
                                            )}

                                            {/* Log Content */}
                                            <div className="flex-1 text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
                                                {highlightSearchTerm(log.data, searchTerm)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div ref={endOfLogsRef} className="h-4" />
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 bg-gray-50 border-t text-sm text-gray-600 flex justify-between">
                <span>
                    {logs.length} total lines
                    {searchTerm && ` | ${filteredLogs.length} filtered`}
                </span>
                <span>
                    {isStreaming && (
                        <span className="text-blue-600 flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Streaming...
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}; 