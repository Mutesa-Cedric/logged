import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { authModalAtom } from '../store/atoms';

export const SignUpPage = () => {
    const [, setModal] = useAtom(authModalAtom);

    useEffect(() => {
        setModal({ open: true, mode: 'signUp' });
    }, [setModal]);

    return null;
}; 