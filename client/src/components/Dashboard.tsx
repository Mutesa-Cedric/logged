/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ServerConnection } from './ServerConnection';
import { LogViewer } from './LogViewer';
import { useSocket } from '../hooks/useSocket';

interface Connection {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    connected?: boolean;
    saved?: boolean; // For authenticated users
}

interface DashboardProps {
    isGuest?: boolean;
}

export const Dashboard = ({ isGuest = false }: DashboardProps) => {
    const { user, isSignedIn } = useUser();
    const navigate = useNavigate();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
    const [showAddConnection, setShowAddConnection] = useState(false);

    const {
        connectionStatus,
        testConnection,
        connectToServer,
        disconnectFromServer,
        startLogStream,
        stopLogStream,
        logs,
        clearLogs
    } = useSocket();

    // Redirect guests if they shouldn't be here
    useEffect(() => {
        if (!isGuest && !isSignedIn) {
            navigate('/');
        }
    }, [isGuest, isSignedIn, navigate]);

    // Load saved connections for authenticated users
    useEffect(() => {
        if (isSignedIn && !isGuest) {
            // TODO: Load saved connections from database
            loadSavedConnections();
        }
    }, [isSignedIn, isGuest]);

    const loadSavedConnections = async () => {
        // TODO: Implement API call to load saved connections
        // For now, we'll use localStorage as a placeholder
        try {
            const saved = localStorage.getItem(`logged_connections_${user?.id}`);
            if (saved) {
                const savedConnections = JSON.parse(saved).map((conn: Connection) => ({
                    ...conn,
                    saved: true,
                    connected: false
                }));
                setConnections(savedConnections);
            }
        } catch (error) {
            console.error('Failed to load saved connections:', error);
        }
    };

    const saveConnection = async (connection: Connection) => {
        if (isSignedIn && !isGuest) {
            try {
                // TODO: Implement API call to save connection
                // For now, use localStorage
                const existingConnections = connections.filter(c => c.saved);
                const updatedConnections = [...existingConnections, { ...connection, saved: true }];
                localStorage.setItem(`logged_connections_${user?.id}`, JSON.stringify(updatedConnections));
            } catch (error) {
                console.error('Failed to save connection:', error);
            }
        }
    };

    const handleAddConnection = (newConnection: Omit<Connection, 'id'>) => {
        const connection: Connection = {
            ...newConnection,
            id: Date.now().toString(),
            connected: false,
            saved: false
        };
        setConnections(prev => [...prev, connection]);
        setShowAddConnection(false);
    };

    const handleSaveConnection = async (connection: Connection) => {
        if (isGuest) {
            alert('Sign up for a free account to save connections permanently!');
            return;
        }

        const updatedConnection = { ...connection, saved: true };
        setConnections(prev =>
            prev.map(conn =>
                conn.id === connection.id ? updatedConnection : conn
            )
        );
        await saveConnection(updatedConnection);
    };

    const handleConnect = async (connection: Connection) => {
        try {
            await connectToServer(connection);
            setConnections(prev =>
                prev.map(conn =>
                    conn.id === connection.id
                        ? { ...conn, connected: true }
                        : conn
                )
            );
            setActiveConnection({ ...connection, connected: true });
        } catch (error) {
            console.error('Connection failed:', error);
        }
    };

    const handleDisconnect = async (connection: Connection) => {
        try {
            await disconnectFromServer(connection.id);
            setConnections(prev =>
                prev.map(conn =>
                    conn.id === connection.id
                        ? { ...conn, connected: false }
                        : conn
                )
            );
            if (activeConnection?.id === connection.id) {
                setActiveConnection(null);
            }
        } catch (error) {
            console.error('Disconnection failed:', error);
        }
    };

    const handleDeleteConnection = async (connectionId: string) => {
        const connection = connections.find(c => c.id === connectionId);
        if (connection?.saved && !isGuest) {
            // TODO: Implement API call to delete saved connection
            try {
                const remainingConnections = connections.filter(c => c.id !== connectionId && c.saved);
                localStorage.setItem(`logged_connections_${user?.id}`, JSON.stringify(remainingConnections));
            } catch (error) {
                console.error('Failed to delete saved connection:', error);
            }
        }

        setConnections(prev => prev.filter(conn => conn.id !== connectionId));
        if (activeConnection?.id === connectionId) {
            setActiveConnection(null);
        }
    };

    const handleSignOut = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">Logged</span>
                            </div>

                            {isGuest && (
                                <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                                    Guest Mode
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${connectionStatus === 'connected'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                {connectionStatus === 'connected' ? 'WebSocket Connected' : 'WebSocket Disconnected'}
                            </div>

                            {!isGuest && isSignedIn && (
                                <button
                                    onClick={() => { }}
                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Saved Connections
                                </button>
                            )}

                            <button
                                onClick={() => setShowAddConnection(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Add Server
                            </button>

                            {isGuest ? (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => navigate('/')}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        Sign Up to Save
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-gray-600 hover:text-gray-900 text-sm"
                                    >
                                        Exit Guest
                                    </button>
                                </div>
                            ) : (
                                <UserButton
                                    afterSignOutUrl="/"
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8"
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isGuest && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-blue-800">
                                You're in guest mode. <strong>Connections won't be saved</strong> when you leave.
                                <button
                                    onClick={() => navigate('/')}
                                    className="ml-1 font-semibold underline hover:no-underline"
                                >
                                    Create a free account
                                </button> to save your server connections.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar - Server Connections */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Server Connections</h2>
                                    {!isGuest && (
                                        <span className="text-sm text-gray-500">
                                            {connections.filter(c => c.saved).length} saved
                                        </span>
                                    )}
                                </div>

                                {connections.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12l7-7m-7 7l7 7" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 text-sm">No servers configured</p>
                                        <button
                                            onClick={() => setShowAddConnection(true)}
                                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            Add your first server
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {connections.map((connection) => (
                                            <div
                                                key={connection.id}
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${activeConnection?.id === connection.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                onClick={() => setActiveConnection(connection)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="font-medium text-gray-900">{connection.name}</h3>
                                                            {connection.saved && (
                                                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500">{connection.username}@{connection.host}:{connection.port}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-2 h-2 rounded-full ${connection.connected ? 'bg-green-400' : 'bg-gray-300'
                                                            }`}></div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteConnection(connection.id);
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex space-x-2">
                                                    {connection.connected ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDisconnect(connection);
                                                            }}
                                                            className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 transition-colors"
                                                        >
                                                            Disconnect
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleConnect(connection);
                                                            }}
                                                            className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-md hover:bg-green-200 transition-colors"
                                                        >
                                                            Connect
                                                        </button>
                                                    )}

                                                    {!connection.saved && !isGuest && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSaveConnection(connection);
                                                            }}
                                                            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors"
                                                        >
                                                            Save
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Log Viewer */}
                    <div className="lg:col-span-2">
                        {activeConnection ? (
                            <LogViewer
                                connection={activeConnection}
                                onStartLogStream={startLogStream}
                                onStopLogStream={stopLogStream}
                                logs={logs}
                                onClearLogs={clearLogs}
                            />
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border">
                                <div className="p-12 text-center">
                                    <div className="text-gray-400 mb-4">
                                        <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Server Selected</h3>
                                    <p className="text-gray-500">Select a server connection to start viewing logs</p>
                                    {!isGuest && connections.length === 0 && (
                                        <p className="text-sm text-gray-400 mt-2">
                                            Or load your saved connections to get started quickly
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Connection Modal */}
            {showAddConnection && (
                <ServerConnection
                    onAdd={handleAddConnection}
                    onCancel={() => setShowAddConnection(false)}
                    onTest={testConnection}
                />
            )}
        </div>
    );
}; 