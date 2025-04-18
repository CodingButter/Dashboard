// Fix imports for Node.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Make sure the server can be killed properly
const cleanupAndExit = () => {
  console.log('Shutting down debug server...');
  process.exit(0);
};

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
  
  // Add an initial log for testing
  logs.push({
    level: 'info',
    message: 'Debug server started and ready to collect logs',
    timestamp: new Date().toISOString()
  });
});

// Handle various exit signals
process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);
process.on('SIGHUP', cleanupAndExit);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  cleanupAndExit();
});