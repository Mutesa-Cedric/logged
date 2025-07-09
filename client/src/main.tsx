import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { Provider as JotaiProvider } from 'jotai'
import { queryClient } from './lib/queryClient'
import { SocketProvider } from './components/SocketProvider'
import { ThemeProvider } from './lib/theme'
import './index.css'
import App from './App.tsx'
import '@mantine/core/styles.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '600',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
  lineHeights: {
    xs: '1.4',
    sm: '1.45',
    md: '1.5',
    lg: '1.6',
    xl: '1.65',
  },
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.05), 0 20px 25px rgba(0, 0, 0, 0.1)',
    xl: '0 25px 50px rgba(0, 0, 0, 0.25)',
  },
  colors: {
    brand: [
      '#f0f9ff', // 50
      '#e0f2fe', // 100
      '#bae6fd', // 200
      '#7dd3fc', // 300
      '#38bdf8', // 400
      '#0ea5e9', // 500 - primary
      '#0284c7', // 600
      '#0369a1', // 700
      '#075985', // 800
      '#0c4a6e', // 900
    ],
    success: [
      '#f0fdf4',
      '#dcfce7',
      '#bbf7d0',
      '#86efac',
      '#4ade80',
      '#22c55e',
      '#16a34a',
      '#15803d',
      '#166534',
      '#14532d',
    ],
    error: [
      '#fef2f2',
      '#fee2e2',
      '#fecaca',
      '#fca5a5',
      '#f87171',
      '#ef4444',
      '#dc2626',
      '#b91c1c',
      '#991b1b',
      '#7f1d1d',
    ],
    warning: [
      '#fffbeb',
      '#fef3c7',
      '#fde68a',
      '#fcd34d',
      '#fbbf24',
      '#f59e0b',
      '#d97706',
      '#b45309',
      '#92400e',
      '#78350f',
    ],
    gray: [
      '#fafafa',
      '#f4f4f5',
      '#e4e4e7',
      '#d4d4d8',
      '#a1a1aa',
      '#71717a',
      '#52525b',
      '#3f3f46',
      '#27272a',
      '#18181b',
    ],
  },
  other: {
    logged: {
      primary: '#0ea5e9',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    darkColors: {
      background: '#0f172a',
      paper: '#1e293b',
      border: '#334155',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      accent: '#0ea5e9',
    },
    lightColors: {
      background: '#ffffff',
      paper: '#f8fafc',
      border: '#e2e8f0',
      text: '#1e293b',
      textSecondary: '#64748b',
      accent: '#0ea5e9',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
      secondary: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    },
  },
  components: {
    Button: {
      styles: {
        root: {
          fontWeight: '500',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
        },
      },
    },
    Card: {
      styles: {
        root: {
          borderRadius: '12px',
          transition: 'all 0.2s ease',
        },
      },
    },
    AppShell: {
      styles: {
        navbar: {
          borderRight: '1px solid var(--mantine-color-gray-2)',
          transition: 'all 0.2s ease',
        },
        header: {
          borderBottom: '1px solid var(--mantine-color-gray-2)',
          backdropFilter: 'blur(8px)',
        },
      },
    },
    Text: {
      styles: {
        root: {
          lineHeight: '1.5',
        },
      },
    },
    Title: {
      styles: {
        root: {
          lineHeight: '1.2',
          fontWeight: '600',
        },
      },
    },
    Badge: {
      styles: {
        root: {
          fontWeight: '500',
        },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <ThemeProvider>
            <ModalsProvider>
              <Notifications position="top-right" />
              <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
                <BrowserRouter>
                  <SocketProvider>
                    <App />
                  </SocketProvider>
                </BrowserRouter>
              </ClerkProvider>
            </ModalsProvider>
          </ThemeProvider>
        </MantineProvider>
      </JotaiProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
