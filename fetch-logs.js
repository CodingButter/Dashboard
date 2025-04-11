import http from 'http';

// Function to fetch logs from debug server
function fetchLogs() {
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

// Display logs with formatting by log level
async function displayLogs() {
  try {
    const logs = await fetchLogs();
    
    // Group logs by level
    const errorLogs = logs.filter(log => log.level === 'error');
    const warnLogs = logs.filter(log => log.level === 'warn');
    const infoLogs = logs.filter(log => log.level === 'info');
    const debugLogs = logs.filter(log => log.level === 'log');
    
    // Display errors first
    if (errorLogs.length > 0) {
      console.log('\n🛑 ERRORS:');
      for (const log of errorLogs) {
        console.log(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
        if (log.stack) console.log(`  ${log.stack.split('\n')[0]}`);
      }
    }
    
    // Display warnings
    if (warnLogs.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      for (const log of warnLogs) {
        console.log(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
      }
    }
    
    // Display info logs
    if (infoLogs.length > 0) {
      console.log('\nℹ️ INFO:');
      for (const log of infoLogs) {
        console.log(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
      }
    }
    
    // Display debug logs
    if (debugLogs.length > 0) {
      console.log('\n🔍 DEBUG:');
      for (const log of debugLogs) {
        console.log(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
      }
    }
    
    console.log(`\n📊 SUMMARY: Total logs: ${logs.length} | Errors: ${errorLogs.length} | Warnings: ${warnLogs.length} | Info: ${infoLogs.length} | Debug: ${debugLogs.length}`);
    
    if (logs.length === 0) {
      console.log('No logs found. Is the application running?');
    }
    
  } catch (error) {
    console.error('Failed to fetch logs:', error.message);
    console.log('Make sure the debug server is running at http://localhost:3030');
  }
}

// Run the function
displayLogs();