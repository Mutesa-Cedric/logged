import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { LandingPage } from './components/LandingPage';
import { LoginPage, SignUpPage, ConnectionsPage, LogsPage, SettingsPage } from './pages';
import { Dashboard } from './components/Dashboard';
import { AppLayout } from './components/layout/AppLayout';
import { AppLoadingScreen } from './components/LoadingScreen';
import { tokenManager } from './lib/api';
import { isGuestModeAtom } from './store/atoms';
import { withErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const [isGuestMode, setIsGuestMode] = useAtom(isGuestModeAtom);

  useEffect(() => {
    const isGuestPath = location.pathname.startsWith('/guest');
    setIsGuestMode(isGuestPath);
  }, [location.pathname, setIsGuestMode]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (isLoaded && isSignedIn && !isGuestMode) {
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
      } else if ((isLoaded && !isSignedIn) || isGuestMode) {
        tokenManager.setToken(isGuestMode ? 'guest-token' : null);
      }
    };

    initializeAuth();
  }, [isLoaded, isSignedIn, getToken, user, isGuestMode]);

  if (!isLoaded && !isGuestMode) {
    return (
      <AppLoadingScreen />
    );
  }

  const GuestLayout = ({ children }: { children: React.ReactNode }) => (
    <AppLayout>
      {children}
    </AppLayout>
  );

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

      {/* Guest routes - accessible without authentication */}
      <Route
        path="/guest"
        element={
          <GuestLayout>
            <Dashboard />
          </GuestLayout>
        }
      />

      <Route
        path="/guest/dashboard"
        element={
          <GuestLayout>
            <Dashboard />
          </GuestLayout>
        }
      />

      <Route
        path="/guest/connections"
        element={
          <GuestLayout>
            <ConnectionsPage />
          </GuestLayout>
        }
      />

      <Route
        path="/guest/logs"
        element={
          <GuestLayout>
            <LogsPage />
          </GuestLayout>
        }
      />

      <Route
        path="/guest/settings"
        element={
          <GuestLayout>
            <SettingsPage />
          </GuestLayout>
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

const AppWithErrorBoundary = withErrorBoundary(App);

export default AppWithErrorBoundary;