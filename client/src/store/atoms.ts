import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// User preferences (persisted in localStorage)
export const userPreferencesAtom = atomWithStorage('user-preferences', {
    theme: 'light' as 'light' | 'dark' | 'auto',
    autoScroll: true,
    logLevelFilter: 'all' as 'all' | 'error' | 'warn' | 'info' | 'debug',
    maxLogLines: 1000,
    refreshInterval: 5000,
    notifications: true,
});

// UI State
export const sidebarCollapsedAtom = atom(false);
export const activePageAtom = atom('dashboard');
export const loadingAtom = atom(false);
export const commandPaletteOpenAtom = atom(false);

// Connection State
export const activeConnectionIdAtom = atom<string | null>(null);
export const connectionStatusAtom = atom<'connected' | 'disconnected' | 'connecting'>('disconnected');

// Log Viewer State
export const logSearchTermAtom = atom('');
export const logStreamingAtom = atom(false);
export const logSessionIdAtom = atom<string | null>(null);
export const logCountAtom = atom(0);

// Modal/Dialog State
export const addConnectionModalAtom = atom(false);
export const editConnectionModalAtom = atom<string | null>(null);
export const deleteConnectionModalAtom = atom<string | null>(null);

// WebSocket State
export const socketConnectedAtom = atom(false);
export const socketReconnectingAtom = atom(false);

// Guest Mode State
export const isGuestModeAtom = atom(false);

// Auth Modal State
export const authModalAtom = atom<{ open: boolean; mode: 'signIn' | 'signUp' }>({ open: false, mode: 'signIn' });

// Encryption State (for authenticated users)
export const masterKeyAtom = atom<string | null>(null);
export const encryptionEnabledAtom = atom(false);

// Derived atoms
export const canSaveConnectionsAtom = atom(
    (get) => !get(isGuestModeAtom) && get(encryptionEnabledAtom)
);

export const filteredLogLevelAtom = atom(
    (get) => get(userPreferencesAtom).logLevelFilter
);

export const isLoadingAnyAtom = atom(
    (get) => get(loadingAtom) || get(socketReconnectingAtom)
);

// Actions atoms (write-only)
export const toggleSidebarAtom = atom(
    null,
    (get, set) => {
        set(sidebarCollapsedAtom, !get(sidebarCollapsedAtom));
    }
);

export const updateUserPreferencesAtom = atom(
    null,
    (get, set, update: Partial<{
        theme: 'light' | 'dark' | 'auto',
        autoScroll: boolean,
        logLevelFilter: 'all' | 'error' | 'warn' | 'info' | 'debug',
        maxLogLines: number,
        refreshInterval: number,
        notifications: boolean,
    }>) => {
        set(userPreferencesAtom, { ...get(userPreferencesAtom), ...update });
    }
);

export const setActiveConnectionAtom = atom(
    null,
    (_get, set, connectionId: string | null) => {
        set(activeConnectionIdAtom, connectionId);
        if (!connectionId) {
            set(logStreamingAtom, false);
            set(logSessionIdAtom, null);
        }
    }
);

export const startLogStreamAtom = atom(
    null,
    (_get, set, sessionId: string) => {
        set(logStreamingAtom, true);
        set(logSessionIdAtom, sessionId);
        set(logCountAtom, 0);
    }
);

export const stopLogStreamAtom = atom(
    null,
    (_get, set) => {
        set(logStreamingAtom, false);
        set(logSessionIdAtom, null);
    }
);

export const incrementLogCountAtom = atom(
    null,
    (get, set) => {
        set(logCountAtom, get(logCountAtom) + 1);
    }
);

export const resetLogCountAtom = atom(
    null,
    (_get, set) => {
        set(logCountAtom, 0);
    }
); 