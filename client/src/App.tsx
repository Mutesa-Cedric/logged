import { useState } from 'react';
import { ServerConnection } from './components/ServerConnection';
import { LogViewer } from './components/LogViewer';
import { useSocket } from './hooks/useSocket';

interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  connected?: boolean;
}

function App() {
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

  const handleAddConnection = (newConnection: Omit<Connection, 'id'>) => {
    const connection: Connection = {
      ...newConnection,
      id: Date.now().toString(),
      connected: false
    };
    setConnections(prev => [...prev, connection]);
    setShowAddConnection(false);
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

  const handleDeleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    if (activeConnection?.id === connectionId) {
      setActiveConnection(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Logged</h1>
              <span className="ml-2 text-sm text-gray-500">Log Viewer</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${connectionStatus === 'connected'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {connectionStatus === 'connected' ? 'WebSocket Connected' : 'WebSocket Disconnected'}
              </div>
              <button
                onClick={() => setShowAddConnection(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Add Server
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Server Connections */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Server Connections</h2>

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
                          <div>
                            <h3 className="font-medium text-gray-900">{connection.name}</h3>
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
}

export default App;
