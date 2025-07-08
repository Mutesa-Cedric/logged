import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();

    // Redirect if already signed in
    if (isSignedIn) {
        navigate('/dashboard');
        return null;
    }

    const handleGuestAccess = () => {
        navigate('/guest');
    };

    const handleSignIn = () => {
        navigate('/login');
    };

    const handleSignUp = () => {
        navigate('/signup');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Navigation */}
            <nav className="px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Logged
                        </span>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleSignIn}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={handleSignUp}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Modern Log Viewing
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Made Simple
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Say goodbye to terminal struggles. View, search, and manage your server logs
                        through a beautiful web interface with real-time streaming and powerful search capabilities.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={handleSignUp}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                            Create Free Account
                        </button>
                        <button
                            onClick={handleGuestAccess}
                            className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all"
                        >
                            Continue as Guest
                        </button>
                    </div>

                    <p className="text-sm text-gray-500 mt-4">
                        Guest mode: Try all features without an account (connections won't be saved)
                    </p>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Everything you need for log management
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Professional-grade features that make server log management effortless
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Streaming</h3>
                        <p className="text-gray-600">
                            Stream logs in real-time with WebSocket connections. Never miss critical events as they happen.
                        </p>
                    </div>

                    <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Search</h3>
                        <p className="text-gray-600">
                            Powerful search and filtering capabilities with instant results and highlighted matches.
                        </p>
                    </div>

                    <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Connections</h3>
                        <p className="text-gray-600">
                            Connect securely to your servers with SSH key or password authentication. Your credentials stay safe.
                        </p>
                    </div>
                </div>
            </div>


        </div>
    );
}; 