import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage, SignUpPage, ConnectionsPage, LogsPage, SettingsPage } from './pages';
import { Dashboard } from './components/Dashboard';
import { AppLayout } from './components/layout/AppLayout';
import { tokenManager } from './lib/api';

function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  // Initialize token when user signs in
  useEffect(() => {
    const initializeAuth = async () => {
      if (isLoaded && isSignedIn) {
        try {
          console.log('🔐 Getting token from Clerk...', { userId: user?.id });
          const token = await getToken();
          console.log('🔐 Token received:', {
            hasToken: !!token,
            tokenLength: token?.length,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
          });
          tokenManager.setToken(token);
        } catch (error) {
          console.error('❌ Failed to initialize auth token:', error);
        }
      } else if (isLoaded && !isSignedIn) {
        // Clear token when user is not signed in
        console.log('🔐 Clearing token - user not signed in');
        tokenManager.setToken(null);
      }
    };

    initializeAuth();
  }, [isLoaded, isSignedIn, getToken, user]);

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Logged</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isSignedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />
        }
      />

      <Route
        path="/login"
        element={
          isSignedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      <Route
        path="/signup"
        element={
          isSignedIn ? <Navigate to="/dashboard" replace /> : <SignUpPage />
        }
      />

      <Route
        path="/guest"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />

      {/* Protected routes with layout */}
      <Route
        path="/dashboard"
        element={
          isSignedIn ? (
            <AppLayout>
              <Dashboard />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/connections"
        element={
          isSignedIn ? (
            <AppLayout>
              <ConnectionsPage />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/logs"
        element={
          isSignedIn ? (
            <AppLayout>
              <LogsPage />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/settings"
        element={
          isSignedIn ? (
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;
