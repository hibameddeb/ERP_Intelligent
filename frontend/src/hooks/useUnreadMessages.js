import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { connectSocket } from '../services/socket';

/**
 * Hook qui retourne le nombre de messages non-lus pour le user courant,
 * mis à jour en temps réel via Socket.io.
 */
export function useUnreadMessages() {
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(async () => {
        try {
            const res = await API.get('/messages/unread/count');
            setCount(res.data?.count || 0);
        } catch {
            /* silent */
        }
    }, []);

    const getMyId = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        } catch { return null; }
    };

    useEffect(() => {
        fetchCount();

        const sock = connectSocket();
        if (!sock) return;

        const myId = getMyId();

        const onNew = (msg) => {
            if (msg.id_destinataire === myId) {
                setCount(c => c + 1);
            }
        };

        const onFocus = () => fetchCount();

        sock.on('message:new', onNew);
        window.addEventListener('focus', onFocus);

        return () => {
            sock.off('message:new', onNew);
            window.removeEventListener('focus', onFocus);
        };
    }, [fetchCount]);

    return count;
}