import http from 'http';

// Function to check if debug server is running
function checkServerStatus() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3030/logs', () => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    // Set a timeout in case the request hangs
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Function to fetch logs from debug server
function fetchLogs() {
  return new Promise(async (resolve, reject) => {
    // First check if server is running
    const serverRunning = await checkServerStatus();
    
    if (!serverRunning) {
      reject(new Error('Debug server not running'));
      return;
    }
    
    // Server is running, fetch logs
    const req = http.get('http://localhost:3030/logs', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const logs = JSON.parse(data);
          resolve(logs);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.end();
  });
}

// Fetch log files info
async function fetchLogFiles() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3030/log-files', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const files = JSON.parse(data);
          resolve(files);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.end();
  });
}

// Display logs with formatting by log level
async function displayLogs() {
  try {
    // First check if server is running
    const serverRunning = await checkServerStatus();
    
    if (!serverRunning) {
      console.log('\n❌ DEBUG SERVER NOT RUNNING');
      console.log('Start the debug server with: npm run start-debug');
      return;
    }
    
    const logs = await fetchLogs();
    
    // Also fetch log files info
    let logFiles = [];
    try {
      logFiles = await fetchLogFiles();
    } catch (e) {
      console.log('Could not fetch log files info');
    }
    
    // Group logs by level
    const errorLogs = logs.filter(log => log.level === 'error');
    const warnLogs = logs.filter(log => log.level === 'warn');
    const infoLogs = logs.filter(log => log.level === 'info');
    const debugLogs = logs.filter(log => log.level === 'log');
    
    // Clear console for better readability
    console.clear();
    
    console.log('📝 LIVE LOG VIEWER 📝');
    console.log('===================\n');
    
    // Display errors first
    if (errorLogs.length > 0) {
      console.log('🛑 ERRORS:');
      for (const log of errorLogs) {
        console.log(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
        if (log.stack) console.log(`  ${log.stack.split('\n')[0]}`);
      }
      console.log('');
    }
    
    // Display warnings
    if (warnLogs.length > 0) {
      console.log('⚠️ WARNINGS:');
      for (const log of warnLogs) {
        console.log(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
      }
      console.log('');
    }
    
    // Display info logs
    if (infoLogs.length > 0) {
      console.log('ℹ️ INFO:');
      for (const log of infoLogs) {
        console.log(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
      }
      console.log('');
    }
    
    // Display debug logs
    if (debugLogs.length > 0) {
      console.log('🔍 DEBUG:');
      for (const log of debugLogs) {
        console.log(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
      }
      console.log('');
    }
    
    // Show log files
    if (logFiles.length > 0) {
      console.log('📁 LOG FILES:');
      for (const file of logFiles.slice(0, 5)) {
        const createdDate = new Date(file.created).toLocaleString();
        console.log(`- ${file.name} (created: ${createdDate})`);
      }
      if (logFiles.length > 5) {
        console.log(`  ...and ${logFiles.length - 5} more files`);
      }
      console.log('');
    }
    
    console.log('📊 SUMMARY:');
    console.log(`- Memory logs: ${logs.length} entries (Errors: ${errorLogs.length} | Warnings: ${warnLogs.length} | Info: ${infoLogs.length} | Debug: ${debugLogs.length})`);
    console.log(`- Log files: ${logFiles.length} files`);
    
    if (logs.length === 0) {
      console.log('\nNo logs found. Is the application running correctly?');
    }
    
    console.log('\n👁️  Press Ctrl+C to exit or leave this terminal open to monitor logs');
    
  } catch (error) {
    console.error('Failed to fetch logs:', error.message);
    if (error.message === 'Debug server not running') {
      console.log('\nTo start the debug server, run:');
      console.log('  npm run start-debug');
    } else {
      console.log('Make sure the debug server is running correctly at http://localhost:3030');
    }
  }
}

// Start monitoring logs periodically
async function startMonitoring(intervalMs = 2000) {
  console.log('Starting log monitor...');
  console.log('Press Ctrl+C to stop');
  
  // Display logs immediately
  await displayLogs();
  
  // Then set up interval to refresh
  setInterval(async () => {
    await displayLogs();
  }, intervalMs);
}

// Start monitoring
startMonitoring();