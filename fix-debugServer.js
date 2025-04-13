// Simple HTTP server for debugging that doesn't use ES modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3030;

// Store console logs
const logs = [];

// Configure middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint to check if server is running
app.head('/log', (req, res) => {
  res.status(200).end();
});

// Get all logs
app.get('/logs', (req, res) => {
  res.json(logs);
});

// Clear logs
app.post('/clear-logs', (req, res) => {
  logs.length = 0;
  res.json({ message: 'Logs cleared' });
});

// Receive log from client
app.post('/log', (req, res) => {
  const { level, message, stack, timestamp } = req.body;
  
  logs.push({
    level,
    message,
    stack,
    timestamp: timestamp || new Date().toISOString()
  });
  
  console.log(`[${level}] ${message}`);
  if (stack) {
    console.log(stack);
  }
  
  res.json({ success: true });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Debug server running on http://localhost:${PORT}`);
  console.log(`View logs at http://localhost:${PORT}/logs`);
});

// Handle server shutdown properly
process.on('SIGINT', () => {
  console.log('Shutting down debug server...');
  server.close(() => {
    console.log('Debug server closed');
    process.exit(0);
  });
});

// If parent process exits
process.on('SIGTERM', () => {
  console.log('Shutting down debug server...');
  server.close(() => {
    console.log('Debug server closed');
    process.exit(0);
  });
});