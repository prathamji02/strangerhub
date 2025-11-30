import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineCount, setOnlineCount] = useState(0);
    const [me, setMe] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            const newSocket = io(SOCKET_URL, { auth: { token } });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                setMe(newSocket.id);
            });

            newSocket.on('update_online_count', (count) => {
                setOnlineCount(count);
            });

            return () => newSocket.disconnect();
        }
    }, []);

    return (
        <SocketContext.Provider value={{
            socket,
            onlineCount,
            me
        }}>
            {children}
        </SocketContext.Provider>
    );
};
