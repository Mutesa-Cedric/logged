import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // In production, you'd want to log this to an error reporting service
        if (import.meta.env.PROD) {
            // Example: logErrorToService(error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Card padding="xl" radius="md" withBorder style={{ maxWidth: '600px', width: '100%' }}>
                        <Stack gap="lg">
                            <Group gap="md">
                                <IconAlertTriangle size={32} color="var(--mantine-color-red-6)" />
                                <div>
                                    <Title order={2} c="red">Something went wrong</Title>
                                    <Text c="dimmed" size="sm">
                                        An unexpected error occurred in the application
                                    </Text>
                                </div>
                            </Group>

                            <Alert
                                icon={<IconAlertTriangle size={16} />}
                                color="red"
                                variant="light"
                                title="Error Details"
                            >
                                <Text size="sm" mb="xs">
                                    {this.state.error?.message || 'Unknown error occurred'}
                                </Text>
                                {import.meta.env.DEV && this.state.error?.stack && (
                                    <details>
                                        <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                                            <Text size="xs" c="dimmed">View stack trace</Text>
                                        </summary>
                                        <pre style={{
                                            fontSize: '11px',
                                            color: 'var(--mantine-color-gray-6)',
                                            whiteSpace: 'pre-wrap',
                                            maxHeight: '200px',
                                            overflow: 'auto',
                                            backgroundColor: 'var(--mantine-color-gray-0)',
                                            padding: '0.5rem',
                                            borderRadius: '4px'
                                        }}>
                                            {this.state.error.stack}
                                        </pre>
                                    </details>
                                )}
                            </Alert>

                            <Group justify="center" gap="md">
                                <Button
                                    leftSection={<IconRefresh size={16} />}
                                    onClick={this.handleReset}
                                    variant="light"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    leftSection={<IconHome size={16} />}
                                    onClick={this.handleGoHome}
                                    variant="outline"
                                >
                                    Go Home
                                </Button>
                            </Group>

                            <Text size="xs" c="dimmed" ta="center">
                                If this problem persists, please refresh the page or contact support.
                            </Text>
                        </Stack>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WrappedComponent(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
} 