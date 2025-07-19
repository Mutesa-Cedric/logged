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
import AuthModal from './components/AuthModal';
import { AddConnectionModal } from './components/AddConnectionModal';

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
      // Check if we're on a guest path directly
      const isGuestPath = location.pathname.startsWith('/guest');
      
      if (isLoaded && isSignedIn && !isGuestMode && !isGuestPath) {
        try {
          const token = await getToken();
          tokenManager.setToken(token);
        } catch (error) {
          console.error('Failed to initialize auth token:', error);
        }
      } else if ((isLoaded && !isSignedIn) || isGuestMode || isGuestPath) {
        const token = (isGuestMode || isGuestPath) ? 'guest-token' : null;

        tokenManager.setToken(token);
      }
    };

    initializeAuth();
  }, [isLoaded, isSignedIn, getToken, user, isGuestMode, location.pathname]);

  if (!isLoaded && !isGuestMode && location.pathname !== '/') {
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
    <>
    <Routes>
      <Route
        path="/"
        element={
          isLoaded && isSignedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LandingPage />
          )
        }
      />

      <Route
        path="/login"
        element={
          !isLoaded ? (
            <AppLoadingScreen />
          ) : isSignedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/signup"
        element={
          !isLoaded ? (
            <AppLoadingScreen />
          ) : isSignedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <SignUpPage />
          )
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
          !isLoaded ? (
            <AppLoadingScreen />
          ) : isSignedIn ? (
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
          !isLoaded ? (
            <AppLoadingScreen />
          ) : isSignedIn ? (
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
          !isLoaded ? (
            <AppLoadingScreen />
          ) : isSignedIn ? (
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
          !isLoaded ? (
            <AppLoadingScreen />
          ) : isSignedIn ? (
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
    <AuthModal />
    <AddConnectionModal />
    </>
  );
}

const AppWithErrorBoundary = withErrorBoundary(App);

export default AppWithErrorBoundary;