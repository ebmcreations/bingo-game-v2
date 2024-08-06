// src/SocketContext.js
import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const ENDPOINT = 'https://your-digital-ocean-endpoint.com'; // Replace with your DigitalOcean socket server URL
const SocketContext = createContext();

const SocketProvider = ({ children, playerName }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(ENDPOINT, {
            transports: ['websocket'], // Use WebSocket for better performance
            cors: {
                origin: "*", // Allow all origins for CORS
                methods: ["GET", "POST"], // Specify allowed methods
                allowedHeaders: ["Content-Type"], // Specify allowed headers
            },
        });

        // Log connection and emit events
        newSocket.on('connect', () => {
            console.log('Connected to server');
            newSocket.emit('requestState'); // Request current game state

            if (playerName) {
                newSocket.emit('newPlayer', playerName); // Emit newPlayer event with playerName
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        // Handle reconnections
        newSocket.on('reconnect', (attemptNumber) => {
            console.log(`Reconnected on attempt: ${attemptNumber}`);
        });

        // Handle connection errors
        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        setSocket(newSocket);

        // Clean up socket events on component unmount
        return () => {
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('reconnect');
            newSocket.off('connect_error');
            newSocket.close();
        };
    }, [playerName]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export { SocketContext, SocketProvider };
