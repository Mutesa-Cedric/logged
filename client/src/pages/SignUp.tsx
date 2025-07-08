import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export const SignUpPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Logged
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h1>
                    <p className="text-gray-600">Create your free account and start managing server logs</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <SignUp
                        afterSignUpUrl="/dashboard"
                        signInUrl="/login"
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "shadow-none border-none bg-transparent",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsIconButton: "border-gray-200 hover:border-gray-300",
                                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                                formFieldInput: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                                footerActionLink: "text-blue-600 hover:text-blue-700"
                            }
                        }}
                    />
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Or{' '}
                        <Link
                            to="/guest"
                            className="text-gray-600 hover:text-gray-700 font-medium underline"
                        >
                            continue as guest
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}; 