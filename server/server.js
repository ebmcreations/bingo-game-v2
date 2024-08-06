const http = require('http');
const { Server } = require('socket.io');
const app = require('./app'); // Import the app from app.js

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://your-client-url.com", // Update with your client URL
        methods: ["GET", "POST"],
    },
});

let drawnNumbers = [];
let gameNumber = 1;
let gameName = 'Default Game';
const playerSockets = new Map(); // Track connected players by socket ID
let drawCount = 0; // Track the number of draws
const chatMessages = []; // Store chat messages

// Set up Socket.io connection
io.on('connection', (socket) => {
    console.log('A player connected');

    // Emit current state when a player connects
    socket.emit('currentState', {
        drawnNumbers,
        gameNumber,
        gameName,
        playerCount: playerSockets.size, // Current player count
    });

    // Emit player count when a new player joins
    io.emit('playerCountUpdate', playerSockets.size); // Update player count

    // Emit chat messages to the newly connected player
    socket.emit('chatMessages', chatMessages);

    socket.on('newPlayer', (playerName) => {
        if (!playerSockets.has(socket.id)) { // Check if the player is already connected
            console.log(`${playerName} has joined the game`);
            playerSockets.set(socket.id, playerName); // Store player name with socket ID

            // Emit a welcome message to all players
            io.emit('chatMessage', { name: 'System', text: `${playerName} has joined the game` });
        }
    });

    socket.on('numberDrawn', (number) => {
        drawnNumbers.push(number);
        drawCount++; // Increment draw count
        io.emit('currentState', {
            drawnNumbers,
            gameNumber,
            gameName,
            playerCount: playerSockets.size,
            drawCount, // Include draw count in the state update
        });
    });

    socket.on('gameNameChange', (newGameName) => {
        gameName = newGameName; // Update game name
        io.emit('currentState', {
            drawnNumbers,
            gameNumber,
            gameName,
            playerCount: playerSockets.size,
            drawCount,
        });
    });

    socket.on('newGame', (newGameNumber) => {
        gameNumber = newGameNumber; // Update game number
        drawnNumbers = []; // Reset drawn numbers
        drawCount = 0; // Reset draw count
        io.emit('currentState', {
            drawnNumbers,
            gameNumber,
            gameName,
            playerCount: playerSockets.size,
            drawCount,
        });
    });

    socket.on('resetGame', () => {
        drawnNumbers = []; // Reset drawn numbers
        drawCount = 0; // Reset draw count
        io.emit('currentState', {
            drawnNumbers,
            gameNumber,
            gameName,
            playerCount: playerSockets.size,
            drawCount,
        });
    });

    socket.on('chatMessage', (msg) => {
        chatMessages.push(msg); // Store the chat message
        io.emit('chatMessage', msg); // Emit the new chat message to all players
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected');
        playerSockets.delete(socket.id); // Remove player socket from the map
        io.emit('playerCountUpdate', playerSockets.size); // Update player count
    });
});

// Start the server
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
