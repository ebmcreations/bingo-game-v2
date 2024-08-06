import React, { useState, useEffect, useContext, useRef } from 'react';
import './PlayerInterface.css';
import { SocketContext } from '../SocketContext';
import { useLocation, useNavigate } from 'react-router-dom';

const generateBingoCard = () => {
    const columns = [
        { name: 'B', numbers: Array.from({ length: 15 }, (_, i) => i + 1) },
        { name: 'I', numbers: Array.from({ length: 15 }, (_, i) => i + 16) },
        { name: 'N', numbers: Array.from({ length: 15 }, (_, i) => i + 31) },
        { name: 'G', numbers: Array.from({ length: 15 }, (_, i) => i + 46) },
        { name: 'O', numbers: Array.from({ length: 15 }, (_, i) => i + 61) },
    ];

    const card = columns.map((col) => {
        const colNumbers = [...col.numbers];
        const selectedNumbers = [];
        while (selectedNumbers.length < 5) {
            const randomIndex = Math.floor(Math.random() * colNumbers.length);
            selectedNumbers.push(colNumbers.splice(randomIndex, 1)[0]);
        }
        return selectedNumbers;
    });

    card[2][2] = 'FREE'; // Set the FREE space
    return card;
};

const getBingoLetter = (number) => {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return '';
};

const PlayerInterface = () => {
    const socket = useContext(SocketContext);
    const navigate = useNavigate();
    const [card] = useState(generateBingoCard());
    const [markedNumbers, setMarkedNumbers] = useState([]);
    const [drawnNumbers, setDrawnNumbers] = useState([]);
    const [currentDraw, setCurrentDraw] = useState(null);
    const [lastFive, setLastFive] = useState([]);
    const [name, setName] = useState('');
    const [gameName, setGameName] = useState('Default Game');
    const [gameNumber, setGameNumber] = useState(1);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState([]);
    const [joinedPlayers, setJoinedPlayers] = useState([]);

    const chatMessagesRef = useRef(null);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const playerName = queryParams.get('name');

    useEffect(() => {
        if (playerName) {
            setName(playerName);
            if (socket) {
                socket.emit('newPlayer', playerName);
                socket.emit('requestState');
            }
        }

        if (!socket) return;

        const handleCurrentState = (state) => {
            setDrawnNumbers(state.drawnNumbers);
            setCurrentDraw(state.drawnNumbers[state.drawnNumbers.length - 1] || null);
            setLastFive(state.drawnNumbers.slice(-5));
            setGameName(state.gameName);
            setGameNumber(state.gameNumber);
            setMarkedNumbers([]);
            setJoinedPlayers(state.players || []);
        };

        socket.on('currentState', handleCurrentState);

        socket.on('numberDrawn', (number) => {
            setDrawnNumbers((prevDrawnNumbers) => [...prevDrawnNumbers, number]);
            setCurrentDraw(number);
            setLastFive((prevLastFive) => [...prevLastFive, number].slice(-5));
        });

        socket.on('newGame', (newGameNumber) => {
            setDrawnNumbers([]);
            setCurrentDraw(null);
            setLastFive([]);
            setGameNumber(newGameNumber);
            setMarkedNumbers([]);
        });

        socket.on('updateGameName', (newGameName) => {
            setGameName(newGameName);
        });

        socket.on('updateGameNumber', (newGameNumber) => {
            setGameNumber(newGameNumber);
        });

        socket.on('clearMarkedNumbers', () => {
            setMarkedNumbers([]);
        });

        socket.on('chatMessage', (msg) => {
            // Allow duplicate messages from the same user
            setChatMessages((prevMessages) => [...prevMessages, msg]);
        });

        socket.on('playerJoined', (newPlayer) => {
            const joinMessage = {
                name: 'System',
                text: `${newPlayer} has joined the game`,
            };
            if (!joinedPlayers.includes(newPlayer)) {
                setJoinedPlayers((prev) => [...prev, newPlayer]);
                setChatMessages((prevMessages) => {
                    if (
                        prevMessages.length === 0 ||
                        prevMessages[prevMessages.length - 1].text !== joinMessage.text
                    ) {
                        return [...prevMessages, joinMessage];
                    }
                    return prevMessages;
                });
            }
        });

        const handleBeforeUnload = (event) => {
            const confirmationMessage =
                'You will lose your Bingo card and all marked numbers if you leave this page. Are you sure you want to leave?';
            event.returnValue = confirmationMessage;
            return confirmationMessage;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            socket.off('currentState', handleCurrentState);
            socket.off('numberDrawn');
            socket.off('newGame');
            socket.off('updateGameName');
            socket.off('updateGameNumber');
            socket.off('clearMarkedNumbers');
            socket.off('chatMessage');
            socket.off('playerJoined');
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [playerName, socket, joinedPlayers]);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleMarkNumber = (number) => {
        if (
            number === 'FREE' ||
            (!markedNumbers.includes(number) && drawnNumbers.includes(number))
        ) {
            setMarkedNumbers((prev) => [...prev, number]);
        } else if (markedNumbers.includes(number)) {
            setMarkedNumbers((prev) => prev.filter((num) => num !== number));
        }
    };

    const handleBackToMainScreen = () => {
        navigate('/');
    };

    const handleChatInputChange = (e) => {
        setChatInput(e.target.value);
    };

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if (chatInput.trim()) {
            const msg = { name, text: chatInput };
            socket.emit('chatMessage', msg);
            setChatInput('');
        }
    };

    return (
        <div className="player-interface">
            <button onClick={handleBackToMainScreen} className="main-screen-button">
                Main Screen
            </button>
            {name ? (
                <div>
                    <h1>Welcome to EBM Bingo, {name}!</h1>
                    <div className="game-container">
                        <div className="info-boxes-container">
                            <div className="info-box">
                                <h2>Current Draw:</h2>
                                <div className="data current-number">
                                    {currentDraw
                                        ? `${getBingoLetter(currentDraw)} ${currentDraw}`
                                        : ''}
                                </div>
                            </div>
                            <div className="info-box last-five">
                                <h2>Last 5 Numbers Called:</h2>
                                <div className="data last-five-numbers">
                                    {lastFive
                                        .map((num) => `${getBingoLetter(num)} ${num}`)
                                        .join(', ')}
                                </div>
                            </div>
                            <div className="info-box game-info">
                                <div className="game-number-container">
                                    <h2>Game #</h2>
                                    <div className="game-number">{gameNumber}</div>
                                </div>
                                <div className="bingo-type-container">
                                    <h2>Bingo Type:</h2>
                                    <div className="data bingo-type">{gameName}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bingo-card">
                            <div className="header">
                                <div>B</div>
                                <div>I</div>
                                <div>N</div>
                                <div>G</div>
                                <div>O</div>
                            </div>
                            {card.map((col, colIndex) => (
                                <div key={colIndex} className="column">
                                    {col.map((number, rowIndex) => (
                                        <div
                                            key={rowIndex}
                                            className={`number ${markedNumbers.includes(number) ? 'marked' : ''
                                                }`}
                                            onClick={() => handleMarkNumber(number)}
                                        >
                                            {number}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="chat-box" ref={chatMessagesRef}>
                            {chatMessages.map((msg, index) => (
                                <div key={index} className="chat-message">
                                    <strong>{msg.name}: </strong>{msg.text}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleChatSubmit} className="chat-form">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={handleChatInputChange}
                                placeholder="Type your message..."
                            />
                            <button type="submit" className="send-message-button">Send</button>
                        </form>
                    </div>
                </div>
            ) : (
                <div>
                    <h2>Please provide your name in the main screen.</h2>
                    <button onClick={handleBackToMainScreen} className="main-screen-button">
                        Main Screen
                    </button>
                </div>
            )}
        </div>
    );
};

export default PlayerInterface;
