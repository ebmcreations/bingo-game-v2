const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to handle CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Socket.IO connection
io.on("connection", (socket) => {
    logger.info("A user connected");

    // Handle chat message event
    socket.on("chatMessage", (message) => {
        logger.info("Chat message received:", message);

        // Optionally, you can save the message to Firestore
        admin.firestore().collection("chatMessages").add(message)
            .then(() => {
                // Emit message to all connected clients
                io.emit("chatMessage", message);
            })
            .catch((error) => {
                logger.error("Error saving message to Firestore:", error);
            });
    });

    socket.on("disconnect", () => {
        logger.info("User disconnected");
    });
});

// Hello World function
exports.helloWorld = onRequest((request, response) => {
    logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});

// Socket Handler function
exports.socketHandler = onRequest((req, res) => {
    const port = process.env.PORT || 8080; // Use the PORT environment variable
    server.listen(port, () => {
        logger.info(`Socket.IO server started on port ${port}`);
    });
});
