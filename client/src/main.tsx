import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { Provider as JotaiProvider } from 'jotai'
import { queryClient } from './lib/queryClient'
import { SocketProvider } from './components/SocketProvider'
import './index.css'
import App from './App.tsx'
import '@mantine/core/styles.css'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <MantineProvider
          theme={{
            primaryColor: 'blue',
            fontFamily: 'Inter, system-ui, sans-serif',
            headings: { fontFamily: 'Inter, system-ui, sans-serif' },
            colors: {
              brand: [
                '#f0f9ff',
                '#e0f2fe',
                '#bae6fd',
                '#7dd3fc',
                '#38bdf8',
                '#0ea5e9',
                '#0284c7',
                '#0369a1',
                '#075985',
                '#0c4a6e',
              ],
            },
            other: {
              loggedPrimary: '#2563eb',
              loggedSecondary: '#9333ea',
            },
          }}
        >
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
        </MantineProvider>
      </JotaiProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
