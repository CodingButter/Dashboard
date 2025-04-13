// Enhanced debug server with ES module syntax and file logging
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Directory for log files
const LOGS_DIR = path.join(__dirname, 'logs');

// Maximum lines per log file
const MAX_LOG_LINES = 500;

// Store logs in memory
const logs = [];

// Current log file
let currentLogFile = null;
let currentLogLines = 0;

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Create a new log file with timestamp
function createNewLogFile() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `log-${timestamp}.txt`;
  const filePath = path.join(LOGS_DIR, filename);
  
  console.log(`Creating new log file: ${filename}`);
  fs.writeFileSync(filePath, `Log started at ${new Date().toISOString()}\n`);
  
  currentLogFile = filePath;
  currentLogLines = 1;
  
  return filePath;
}

// Write a log entry to file
function writeLogToFile(logEntry) {
  // Create new log file if needed
  if (!currentLogFile || currentLogLines >= MAX_LOG_LINES) {
    createNewLogFile();
  }
  
  // Format log entry as text
  const timestampStr = new Date(logEntry.timestamp).toISOString();
  let logText = `[${timestampStr}] [${logEntry.level.toUpperCase()}] ${logEntry.message}\n`;
  
  if (logEntry.stack) {
    logText += `${logEntry.stack}\n`;
  }
  
  // Append to current log file
  fs.appendFileSync(currentLogFile, logText);
  currentLogLines++;
}

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle GET requests to /logs
  if (req.method === 'GET' && req.url === '/logs') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(logs));
    return;
  }
  
  // Handle POST requests to /log
  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { level, message, stack, timestamp } = data;
        
        // Create log entry
        const logEntry = {
          level: level || 'info',
          message: message || '',
          stack: stack || '',
          timestamp: timestamp || new Date().toISOString()
        };
        
        // Add to in-memory logs (limit to last 1000 entries)
        logs.push(logEntry);
        if (logs.length > 1000) {
          logs.shift(); // Remove oldest log if we exceed 1000 entries
        }
        
        // Write to log file
        writeLogToFile(logEntry);
        
        // Also show in console for server logging
        console.log(`[${logEntry.level}] ${logEntry.message}`);
        if (logEntry.stack) {
          console.log(logEntry.stack);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('Error processing log:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    
    return;
  }
  
  // Handle POST requests to /clear-logs
  if (req.method === 'POST' && req.url === '/clear-logs') {
    logs.length = 0;
    
    // Create a new log file when logs are cleared
    createNewLogFile();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Logs cleared' }));
    return;
  }
  
  // Handle GET requests to /log-files
  if (req.method === 'GET' && req.url === '/log-files') {
    try {
      const files = fs.readdirSync(LOGS_DIR)
        .filter(filename => filename.endsWith('.txt'))
        .map(filename => ({
          name: filename,
          path: path.join(LOGS_DIR, filename),
          created: fs.statSync(path.join(LOGS_DIR, filename)).birthtime
        }))
        .sort((a, b) => b.created - a.created);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } catch (err) {
      console.error('Error listing log files:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to list log files' }));
    }
    return;
  }
  
  // Handle GET requests to /log-file/:filename
  if (req.method === 'GET' && req.url.startsWith('/log-file/')) {
    const filename = req.url.substring('/log-file/'.length);
    const filePath = path.join(LOGS_DIR, filename);
    
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Log file not found' }));
      }
    } catch (err) {
      console.error('Error reading log file:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read log file' }));
    }
    return;
  }
  
  // Handle all other requests
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Create initial log file on startup
createNewLogFile();

// Add initial test log
const startupLog = {
  level: 'info',
  message: 'Enhanced debug server started and ready to collect logs',
  timestamp: new Date().toISOString()
};

logs.push(startupLog);
writeLogToFile(startupLog);

// Start server
const PORT = 3030;
server.listen(PORT, () => {
  console.log(`Enhanced debug server running on http://localhost:${PORT}`);
  console.log(`View logs at http://localhost:${PORT}/logs`);
  console.log(`Log files are being written to: ${LOGS_DIR}`);
  console.log(`Log files API: http://localhost:${PORT}/log-files`);
});

// Handle exit signals
process.on('SIGINT', () => {
  console.log('Shutting down simple debug server...');
  server.close(() => {
    console.log('Simple debug server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down simple debug server...');
  server.close(() => {
    console.log('Simple debug server closed');
    process.exit(0);
  });
});