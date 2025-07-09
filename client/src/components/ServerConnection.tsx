import { Button } from '@mantine/core';
import { useState } from 'react';

interface ServerConnectionData {
    name: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    passphrase?: string;
}

interface ServerConnectionProps {
    onAdd: (connection: ServerConnectionData) => void;
    onCancel: () => void;
    onTest: (connection: ServerConnectionData & { id: string }) => Promise<boolean>;
}

export const ServerConnection = ({ onAdd, onCancel, onTest }: ServerConnectionProps) => {
    const [formData, setFormData] = useState<ServerConnectionData>({
        name: '',
        host: '',
        port: 22,
        username: '',
        password: '',
    });
    const [authType, setAuthType] = useState<'password' | 'key'>('password');
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'port' ? parseInt(value) || 22 : value
        }));
        setTestResult(null); // Clear test result when form changes
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const connectionData = { ...formData };

        if (authType === 'password') {
            delete connectionData.privateKey;
            delete connectionData.passphrase;
        } else {
            delete connectionData.password;
        }

        onAdd(connectionData);
    };

    const handleTest = async () => {
        setIsLoading(true);
        setTestResult(null);

        try {
            const testData = {
                ...formData,
                id: 'test-' + Date.now()
            };

            if (authType === 'password') {
                delete testData.privateKey;
                delete testData.passphrase;
            } else {
                delete testData.password;
            }

            const success = await onTest(testData);
            setTestResult({
                success,
                message: success ? 'Connection successful!' : 'Connection failed. Please check your credentials.'
            });
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
            });
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = formData.name && formData.host && formData.username &&
        (authType === 'password' ? formData.password : formData.privateKey);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Add Server Connection</h2>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Connection Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="My Server"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-1">
                                    Host
                                </label>
                                <input
                                    type="text"
                                    id="host"
                                    name="host"
                                    value={formData.host}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="192.168.1.100"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
                                    Port
                                </label>
                                <input
                                    type="number"
                                    id="port"
                                    name="port"
                                    value={formData.port}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="1"
                                    max="65535"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="root"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Authentication Type
                            </label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="password"
                                        checked={authType === 'password'}
                                        onChange={(e) => setAuthType(e.target.value as 'password' | 'key')}
                                        className="mr-2"
                                    />
                                    Password
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="key"
                                        checked={authType === 'key'}
                                        onChange={(e) => setAuthType(e.target.value as 'password' | 'key')}
                                        className="mr-2"
                                    />
                                    Private Key
                                </label>
                            </div>
                        </div>

                        {authType === 'password' ? (
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required={authType === 'password'}
                                />
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700 mb-1">
                                        Private Key
                                    </label>
                                    <textarea
                                        id="privateKey"
                                        name="privateKey"
                                        value={formData.privateKey || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, privateKey: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={4}
                                        placeholder="-----BEGIN PRIVATE KEY-----"
                                        required={authType === 'key'}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 mb-1">
                                        Passphrase (optional)
                                    </label>
                                    <input
                                        type="password"
                                        id="passphrase"
                                        name="passphrase"
                                        value={formData.passphrase || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </>
                        )}

                        {testResult && (
                            <div className={`p-3 rounded-md ${testResult.success
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                <div className="flex items-center">
                                    <svg className={`w-4 h-4 mr-2 ${testResult.success ? 'text-green-500' : 'text-red-500'}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {testResult.success ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        )}
                                    </svg>
                                    <span className="text-sm">{testResult.message}</span>
                                </div>
                            </div>
                        )}

                        <div className='pt-4 w-full'>
                            <Button
                                type="button"
                                onClick={handleTest}
                                disabled={!isFormValid || isLoading}
                                fullWidth
                            >
                                {isLoading ? 'Testing...' : 'Test Connection'}
                            </Button>
                            <div className="flex justify-between space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!isFormValid}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Server
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}; 