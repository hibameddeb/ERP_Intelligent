import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
    if (socket?.connected) return socket;

    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('[SOCKET] Pas de token, connexion impossible.');
        return null;
    }

    // Adapte l'URL si ton backend tourne ailleurs
    const URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

    socket = io(URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
    });

    socket.on('connect',       () => console.log('[SOCKET] Connecté.'));
    socket.on('disconnect',    (r) => console.log('[SOCKET] Déconnecté:', r));
    socket.on('connect_error', (e) => console.error('[SOCKET] Erreur:', e.message));

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};