// src/App.js
import React from 'react';
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
    useNavigate,
    useSearchParams,
} from 'react-router-dom';
import PlayerInterface from './components/PlayerInterface';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { SocketProvider } from './SocketContext';
import './App.css';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainScreen />} />
                <Route path="/player" element={<PlayerSocketWrapper />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
};

const PlayerSocketWrapper = () => {
    const [searchParams] = useSearchParams();
    const playerName = searchParams.get('name');

    return (
        <SocketProvider playerName={playerName}>
            <PlayerInterface />
        </SocketProvider>
    );
};

const MainScreen = () => {
    const [name, setName] = React.useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name) {
            navigate(`/player?name=${name}`);
        }
    };

    return (
        <div className="main-screen">
            <h1>Welcome to EBM Bingo</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                />
                <button type="submit" className="join-button">
                    Join Bingo Game
                </button>
            </form>
            <button onClick={() => navigate('/admin')} className="admin-login-button">
                Admin Login
            </button>
        </div>
    );
};

export default App;
