// Simple logger that sends console logs to our debug server in development mode only

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV === true;

const DEBUG_SERVER_URL = 'http://localhost:3030/log';
const DEBUG_SERVER_CLEAR_URL = 'http://localhost:3030/clear-logs';

// Connection state
let serverConnected = false;
let pendingLogs: Array<{level: string, message: string, stack: string, timestamp: string}> = [];
let connectionRetryTimeout: number | null = null;

// Override console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};

// Check if debug server is available
const checkServerConnection = async () => {
  if (!isDevelopment) return;
  
  try {
    const response = await fetch(DEBUG_SERVER_URL, {
      method: 'HEAD',
      cache: 'no-store'
    });
    
    const wasConnected = serverConnected;
    serverConnected = response.ok;
    
    // Log connection established if this is the first successful connection
    if (serverConnected && !wasConnected) {
      // Use originalConsole to avoid potential circular reference
      originalConsole.info('Debug server connection established');
      
      // Now that we're connected, send a proper log message
      setTimeout(() => {
        console.info('Debug server connected and logger is working');
      }, 100);
    }
    
    // If connection is established and we have pending logs, send them
    if (serverConnected && pendingLogs.length > 0) {
      const logsToSend = [...pendingLogs];
      pendingLogs = [];
      
      originalConsole.log(`Sending ${logsToSend.length} pending logs to debug server`);
      
      for (const log of logsToSend) {
        try {
          await fetch(DEBUG_SERVER_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(log)
          });
        } catch {
          // If sending fails, put back in pending logs
          pendingLogs.push(log);
        }
      }
    }
    
    return true;
  } catch {
    serverConnected = false;
    
    // Schedule retry if not already scheduled
    if (!connectionRetryTimeout && isDevelopment) {
      connectionRetryTimeout = window.setTimeout(() => {
        connectionRetryTimeout = null;
        checkServerConnection();
      }, 5000) as unknown as number;
    }
    
    return false;
  }
};

// Function to send logs to server (only in development)
const sendToServer = async (level: string, args: any[]) => {
  if (!isDevelopment) return;
  
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
      } catch {
        message += '[Object] ';
      }
    } else {
      message += String(arg) + ' ';
    }
  }
  
  const logData = {
    level,
    message: message.trim(),
    stack,
    timestamp: new Date().toISOString()
  };

  // If server is not connected, add to pending logs and check connection
  if (!serverConnected) {
    pendingLogs.push(logData);
    checkServerConnection();
    return;
  }
  
  try {
    // Send to debug server
    await fetch(DEBUG_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logData)
    });
  } catch {
    // If sending fails, add to pending logs and mark server as disconnected
    pendingLogs.push(logData);
    serverConnected = false;
    checkServerConnection();
  }
};

// Initialize logger
export const initLogger = () => {
  // Only override console and add event listeners in development
  if (isDevelopment) {
    // Check server connection when app starts
    checkServerConnection();
    
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
    
    originalConsole.log('Browser console logger initialized (development mode)');
  }
};

// Helper to clear logs on the server (only works in development)
export const clearLogs = async () => {
  if (!isDevelopment) return;
  
  if (!serverConnected) {
    // Try to connect first
    const connected = await checkServerConnection();
    if (!connected) {
      console.warn('Debug server not connected. Will clear logs when connection is established.');
      return;
    }
  }
  
  try {
    await fetch(DEBUG_SERVER_CLEAR_URL, {
      method: 'POST'
    });
    console.log('Logs cleared');
  } catch (err) {
    serverConnected = false;
    if (isDevelopment) {
      console.error('Failed to clear logs', err);
    }
    checkServerConnection();
  }
};