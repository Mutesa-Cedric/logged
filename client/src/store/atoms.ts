import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { ServerConnection } from '../services/connections';

export const userPreferencesAtom = atomWithStorage('user-preferences', {
    theme: 'light' as 'light' | 'dark' | 'auto',
    autoScroll: true,
    logLevelFilter: 'all' as 'all' | 'error' | 'warn' | 'info' | 'debug',
    maxLogLines: 1000,
    refreshInterval: 5000,
    notifications: true,
});

export const sidebarCollapsedAtom = atom(false);
export const activePageAtom = atom('dashboard');
export const loadingAtom = atom(false);
export const commandPaletteOpenAtom = atom(false);

export const activeConnectionIdAtom = atom<string | null>(null);
export const connectionStatusAtom = atom<'connected' | 'disconnected' | 'connecting'>('disconnected');

export const logSearchTermAtom = atom('');
export const logStreamingAtom = atom(false);
export const logSessionIdAtom = atom<string | null>(null);
export const logCountAtom = atom(0);

export const addConnectionModalAtom = atom<{ open: boolean; editingConnection: ServerConnection | null }>({ 
    open: false, 
    editingConnection: null 
});
export const editConnectionModalAtom = atom<string | null>(null);
export const deleteConnectionModalAtom = atom<string | null>(null);

export const socketConnectedAtom = atom(false);
export const socketReconnectingAtom = atom(false);

export const isGuestModeAtom = atom(false);

export const authModalAtom = atom<{ open: boolean; mode: 'signIn' | 'signUp' }>({ open: false, mode: 'signIn' });

export const masterKeyAtom = atom<string | null>(null);
export const encryptionEnabledAtom = atom(false);

export const canSaveConnectionsAtom = atom(
    (get) => !get(isGuestModeAtom) && get(encryptionEnabledAtom)
);

export const filteredLogLevelAtom = atom(
    (get) => get(userPreferencesAtom).logLevelFilter
);

export const isLoadingAnyAtom = atom(
    (get) => get(loadingAtom) || get(socketReconnectingAtom)
);

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