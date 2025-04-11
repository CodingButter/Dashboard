import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3030;

// Store console logs
const logs = [];

// Configure middleware
app.use(cors());
app.use(bodyParser.json());

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
app.listen(PORT, () => {
  console.log(`Debug server running on http://localhost:${PORT}`);
  console.log(`View logs at http://localhost:${PORT}/logs`);
});