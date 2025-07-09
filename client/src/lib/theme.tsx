/* eslint-disable react-refresh/only-export-components */
import { useMantineColorScheme } from '@mantine/core';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ColorScheme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
    colorScheme: ColorScheme;
    resolvedColorScheme: 'light' | 'dark';
    setColorScheme: (scheme: ColorScheme) => void;
    toggleColorScheme: () => void;
    isDark: boolean;
    isLight: boolean;
    isAuto: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'logged-color-scheme';

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const { colorScheme: mantineColorScheme, setColorScheme: setMantineColorScheme } = useMantineColorScheme();
    const [colorScheme, setColorSchemeState] = useState<ColorScheme>('auto');

    useEffect(() => {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            if (stored && ['light', 'dark', 'auto'].includes(stored)) {
                const storedScheme = stored as ColorScheme;
                setColorSchemeState(storedScheme);

                if (storedScheme === 'auto') {
                    setMantineColorScheme('auto');
                } else {
                    setMantineColorScheme(storedScheme);
                }
            }
        } catch (error) {
            console.warn('Failed to load theme preference:', error);
        }
    }, [setMantineColorScheme]);

    const setColorScheme = (scheme: ColorScheme) => {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, scheme);
            setColorSchemeState(scheme);

            if (scheme === 'auto') {
                setMantineColorScheme('auto');
            } else {
                setMantineColorScheme(scheme);
            }
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    };

    const toggleColorScheme = () => {
        const newScheme = resolvedColorScheme === 'dark' ? 'light' : 'dark';
        setColorScheme(newScheme);
    };

    const resolvedColorScheme: 'light' | 'dark' =
        mantineColorScheme === 'auto'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : mantineColorScheme;

    const isDark = resolvedColorScheme === 'dark';
    const isLight = resolvedColorScheme === 'light';
    const isAuto = colorScheme === 'auto';

    const value: ThemeContextType = {
        colorScheme,
        resolvedColorScheme,
        setColorScheme,
        toggleColorScheme,
        isDark,
        isLight,
        isAuto,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const themeUtils = {
    getThemedColor: (lightColor: string, darkColor: string, isDark: boolean): string => {
        return isDark ? darkColor : lightColor;
    },

    getSemanticColor: (color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info') => {
        const colors = {
            primary: '#0ea5e9',
            secondary: '#8b5cf6',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
        };
        return colors[color];
    },

    getGradient: (type: 'primary' | 'secondary' | 'success' | 'danger' | 'dark') => {
        const gradients = {
            primary: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
            secondary: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        };
        return gradients[type];
    },

    getSurfaceColors: (isDark: boolean) => ({
        background: isDark ? '#0f172a' : '#ffffff',
        paper: isDark ? '#1e293b' : '#f8fafc',
        border: isDark ? '#334155' : '#e2e8f0',
        text: isDark ? '#f1f5f9' : '#1e293b',
        textSecondary: isDark ? '#94a3b8' : '#64748b',
        accent: '#0ea5e9',
    }),

    getStatusColor: (status: 'success' | 'error' | 'warning' | 'info' | 'default') => {
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
            default: '#71717a',
        };
        return colors[status];
    },

    shadows: {
        xs: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.05), 0 20px 25px rgba(0, 0, 0, 0.1)',
        xl: '0 25px 50px rgba(0, 0, 0, 0.25)',
    },

    transitions: {
        fast: 'all 0.15s ease',
        normal: 'all 0.2s ease',
        slow: 'all 0.3s ease',
        bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
};

export const themeAtom = {
    colorScheme: 'auto' as ColorScheme,
};

export const cssVariables = {
    light: {
        '--logged-bg': '#ffffff',
        '--logged-bg-paper': '#f8fafc',
        '--logged-border': '#e2e8f0',
        '--logged-text': '#1e293b',
        '--logged-text-secondary': '#64748b',
        '--logged-accent': '#0ea5e9',
        '--logged-shadow': '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    dark: {
        '--logged-bg': '#0f172a',
        '--logged-bg-paper': '#1e293b',
        '--logged-border': '#334155',
        '--logged-text': '#f1f5f9',
        '--logged-text-secondary': '#94a3b8',
        '--logged-accent': '#0ea5e9',
        '--logged-shadow': '0 4px 6px rgba(0, 0, 0, 0.2), 0 10px 15px rgba(0, 0, 0, 0.3)',
    },
};

export const applyCSSVariables = (isDark: boolean) => {
    const variables = isDark ? cssVariables.dark : cssVariables.light;
    Object.entries(variables).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
    });
}; 