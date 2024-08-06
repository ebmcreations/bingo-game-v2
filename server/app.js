const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Set up a basic HTTP endpoint
app.get('/', (req, res) => {
    res.send('Bingo Server is running');
});

module.exports = app; // Export the app for use in server.js
