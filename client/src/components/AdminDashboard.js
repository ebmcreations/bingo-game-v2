import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from 'react';
import './AdminDashboard.css';
import { SocketContext } from '../SocketContext';

const getBingoLetter = (number) => {
  if (number < 1 || number > 75) return '';
  return ['B', 'I', 'N', 'G', 'O'][Math.floor((number - 1) / 15)];
};

const AdminDashboard = () => {
  const socket = useContext(SocketContext);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastDrawnNumber, setLastDrawnNumber] = useState(null);
  const [gameNumber, setGameNumber] = useState(1);
  const [gameType, setGameType] = useState('Default Game');
  const [drawCount, setDrawCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAdminJoined, setIsAdminJoined] = useState(false);
  const [isAutoDrawEnabled, setIsAutoDrawEnabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const chatMessagesEndRef = useRef(null);
  const joinedPlayers = useRef(new Set());

  useEffect(() => {
    if (!socket) return;

    if (!isAdminJoined) {
      socket.emit('newPlayer', 'Admin');
      setIsAdminJoined(true);
    }

    socket.emit('requestState');

    const handleCurrentState = (state) => {
      setDrawnNumbers(state.drawnNumbers);
      setLastDrawnNumber(state.drawnNumbers.at(-1) || null);
      setGameNumber(state.gameNumber);
      setGameType(state.gameName);
      setDrawCount(state.drawnNumbers.length);
      setPlayerCount(state.playerCount);
    };

    const handlePlayerCountUpdate = (count) => setPlayerCount(count);

    const handleChatMessage = (msg) => {
      setChatMessages((prevMessages) => [...prevMessages, msg]);
    };

    const handlePlayerJoined = (newPlayer) => {
      if (!joinedPlayers.current.has(newPlayer)) {
        joinedPlayers.current.add(newPlayer);
        setChatMessages((prevMessages) => [
          ...prevMessages,
          { name: 'System', text: `${newPlayer} has joined the game` },
        ]);
      }
    };

    socket.on('currentState', handleCurrentState);
    socket.on('playerCountUpdate', handlePlayerCountUpdate);
    socket.on('chatMessage', handleChatMessage);
    socket.on('playerJoined', handlePlayerJoined);

    return () => {
      socket.off('currentState', handleCurrentState);
      socket.off('playerCountUpdate', handlePlayerCountUpdate);
      socket.off('chatMessage', handleChatMessage);
      socket.off('playerJoined', handlePlayerJoined);
    };
  }, [socket, isAdminJoined]);

  const drawNumber = useCallback(() => {
    const remainingNumbers = Array.from({ length: 75 }, (_, i) => i + 1).filter(
      (num) => !drawnNumbers.includes(num)
    );
    if (remainingNumbers.length === 0) return;

    const number =
      remainingNumbers[Math.floor(Math.random() * remainingNumbers.length)];
    setDrawnNumbers((prev) => [...prev, number]);
    setLastDrawnNumber(number);
    setDrawCount((prev) => prev + 1);
    socket.emit('numberDrawn', number);
  }, [drawnNumbers, socket]);

  useEffect(() => {
    let timer;
    if (isAutoDrawEnabled) {
      timer = setInterval(() => {
        drawNumber();
        setCountdown(30);
      }, 30000);
    }
    return () => clearInterval(timer);
  }, [isAutoDrawEnabled, drawNumber]);

  useEffect(() => {
    let countdownTimer;
    if (isAutoDrawEnabled) {
      countdownTimer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
      }, 1000);
    } else {
      setCountdown(30); // Reset countdown if auto draw is disabled
    }
    return () => clearInterval(countdownTimer);
  }, [isAutoDrawEnabled]);

  const handleGameTypeChange = (e) => {
    const newGameType = e.target.value;
    setGameType(newGameType);
    socket.emit('gameNameChange', newGameType);
  };

  const handleNextGame = () => {
    const newGameNumber = gameNumber + 1;
    setGameNumber(newGameNumber);
    setDrawnNumbers([]);
    setLastDrawnNumber(null);
    setDrawCount(0);
    socket.emit('newGame', newGameNumber);
    socket.emit('clearMarkedNumbers');
  };

  const handleResetGame = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the game? This will clear all drawn numbers and marked numbers on players' cards."
      )
    ) {
      setDrawnNumbers([]);
      setLastDrawnNumber(null);
      setDrawCount(0);
      socket.emit('resetGame');
    }
  };

  const handleChatSend = () => {
    if (chatInput.trim()) {
      const message = { name: 'Admin', text: chatInput };
      socket.emit('chatMessage', message);
      setChatInput('');
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="control-panel">
        <div className="draw-number-container">
          <button onClick={drawNumber} className="draw-button">
            Draw Number
          </button>
          <label>
            <input
              type="checkbox"
              checked={isAutoDrawEnabled}
              onChange={(e) => setIsAutoDrawEnabled(e.target.checked)}
            />
            Enable Auto Draw
          </label>
          {isAutoDrawEnabled && (
            <div className="countdown">Next Draw In: {countdown}s</div>
          )}
          <div className="draw-count">Draw Count: {drawCount}</div>
          <div className="player-count">Players in Game: {playerCount}</div>
        </div>
        <div className="game-type">
          <label>Bingo Type: </label>
          <input
            type="text"
            value={gameType}
            onChange={handleGameTypeChange}
            onKeyPress={(e) => e.key === 'Enter' && handleGameTypeChange(e)}
          />
        </div>
        <div className="next-game-container">
          <div className="game-number">Game # {gameNumber}</div>
          <button onClick={handleNextGame} className="next-game-button">
            Next Game
          </button>
          <button onClick={handleResetGame} className="reset-game-button">
            Reset Game
          </button>
        </div>
      </div>
      <div className="info-container">
        <div className="info-row">
          <div className="info-box small">
            <h2>Current Draw:</h2>
            <div className="data current-number">
              {lastDrawnNumber
                ? `${getBingoLetter(lastDrawnNumber)} ${lastDrawnNumber}`
                : ''}
            </div>
          </div>
          <div className="info-box small">
            <h2>Last 5 Numbers Called:</h2>
            <div className="data last-five-numbers">
              {drawnNumbers
                .slice(-5)
                .reverse()
                .map((num) => `${getBingoLetter(num)} ${num}`)
                .join(', ')}
            </div>
          </div>
        </div>
        <div className="info-box full-width">
          <h2>Drawn Numbers:</h2>
          <div className="numbers-list">
            {drawnNumbers
              .map((num) => `${getBingoLetter(num)} ${num}`)
              .join(', ')}
          </div>
        </div>
      </div>
      <div className="chat-container">
        <h2>Chat</h2>
        <div className="chat-messages">
          {chatMessages.map((msg, index) => (
            <div key={index} className="chat-message">
              <strong>{msg.name}: </strong>
              {msg.text}
            </div>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
            placeholder="Type your message..."
          />
          <button onClick={handleChatSend}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
