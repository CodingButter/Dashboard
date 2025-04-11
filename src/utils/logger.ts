// Simple logger that sends console logs to our debug server

const DEBUG_SERVER_URL = 'http://localhost:3030/log';

// Override console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};

// Function to send logs to server
const sendToServer = async (level: string, args: any[]) => {
  try {
    // Convert args to a string representation
    let message = '';
    let stack = '';
    
    for (const arg of args) {
      if (arg instanceof Error) {
        message += arg.message + ' ';
        stack = arg.stack || '';
      } else if (typeof arg === 'object') {
        try {
          message += JSON.stringify(arg) + ' ';
        } catch (e) {
          message += '[Object] ';
        }
      } else {
        message += String(arg) + ' ';
      }
    }
    
    // Send to debug server
    await fetch(DEBUG_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        level,
        message: message.trim(),
        stack,
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
    // Don't use console here to avoid infinite loop
    // Just silently fail if server is not available
  }
};

// Initialize logger
export const initLogger = () => {
  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    sendToServer('log', args);
  };
  
  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    sendToServer('info', args);
  };
  
  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    sendToServer('warn', args);
  };
  
  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    sendToServer('error', args);
  };
  
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    sendToServer('error', [
      event.error || event.message,
      `at ${event.filename}:${event.lineno}:${event.colno}`
    ]);
  });
  
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    sendToServer('error', [
      event.reason || 'Unhandled Promise Rejection'
    ]);
  });
  
  console.log('Browser console logger initialized');
};

// Helper to clear logs on the server
export const clearLogs = async () => {
  try {
    await fetch('http://localhost:3030/clear-logs', {
      method: 'POST'
    });
    console.log('Logs cleared');
  } catch (err) {
    console.error('Failed to clear logs', err);
  }
};