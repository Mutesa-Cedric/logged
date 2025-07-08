import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useSocket } from '../hooks/useSocket';
import {
    socketConnectedAtom,
    logStreamingAtom
} from '../store/atoms';

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
    const { connectionStatus, activeSession } = useSocket();

    const setSocketConnected = useSetAtom(socketConnectedAtom);
    const setLogStreaming = useSetAtom(logStreamingAtom);

    // Sync socket connection status with atom
    useEffect(() => {
        setSocketConnected(connectionStatus === 'connected');
    }, [connectionStatus, setSocketConnected]);

    // Sync log streaming status with atom
    useEffect(() => {
        setLogStreaming(!!activeSession);
    }, [activeSession, setLogStreaming]);

    return <>{children}</>;
}; 