// Simple script to check the logs
import http from 'http';

// Function to fetch logs
function fetchLogs() {
  console.clear();
  
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3030/logs', (res) => {
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
    }).on('error', (e) => {
      reject(e);
    });
  });
}

// Format and display logs
async function displayLogs() {
  try {
    const logs = await fetchLogs();
    
    if (logs.length === 0) {
      console.log('No logs found');
      return;
    }
    
    // Group logs by level
    const errorLogs = logs.filter(log => log.level === 'error');
    const warnLogs = logs.filter(log => log.level === 'warn');
    const infoLogs = logs.filter(log => log.level === 'info');
    const debugLogs = logs.filter(log => log.level === 'log');
    
    // Display error logs first
    if (errorLogs.length > 0) {
      console.log('\n\x1b[31m%s\x1b[0m', '===== ERROR LOGS =====');
      errorLogs.forEach(log => {
        console.log(`\x1b[31m[${new Date(log.timestamp).toLocaleTimeString()}]\x1b[0m ${log.message}`);
        if (log.stack) {
          console.log(`\x1b[31m${log.stack}\x1b[0m`);
        }
      });
    }
    
    // Display warning logs
    if (warnLogs.length > 0) {
      console.log('\n\x1b[33m%s\x1b[0m', '===== WARNING LOGS =====');
      warnLogs.forEach(log => {
        console.log(`\x1b[33m[${new Date(log.timestamp).toLocaleTimeString()}]\x1b[0m ${log.message}`);
      });
    }
    
    // Display info logs
    if (infoLogs.length > 0) {
      console.log('\n\x1b[36m%s\x1b[0m', '===== INFO LOGS =====');
      infoLogs.forEach(log => {
        console.log(`\x1b[36m[${new Date(log.timestamp).toLocaleTimeString()}]\x1b[0m ${log.message}`);
      });
    }
    
    // Display debug logs
    if (debugLogs.length > 0) {
      console.log('\n\x1b[37m%s\x1b[0m', '===== DEBUG LOGS =====');
      debugLogs.forEach(log => {
        console.log(`\x1b[37m[${new Date(log.timestamp).toLocaleTimeString()}]\x1b[0m ${log.message}`);
      });
    }
    
    console.log('\n');
  } catch (error) {
    console.error('Failed to fetch logs:', error.message);
  }
}

// Start monitoring
async function startMonitoring(intervalMs = 2000) {
  console.log('Starting log monitor...');
  console.log('Press Ctrl+C to stop');
  
  while (true) {
    await displayLogs();
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}

// Start the monitoring immediately
startMonitoring();