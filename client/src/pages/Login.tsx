import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { authModalAtom } from '../store/atoms';

export const LoginPage = () => {
    const [, setModal] = useAtom(authModalAtom);

    useEffect(() => {
        setModal({ open: true, mode: 'signIn' });
    }, [setModal]);

    return null;
}; 