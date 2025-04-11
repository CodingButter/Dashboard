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

// Display logs
async function displayLogs() {
  try {
    const logs = await fetchLogs();
    console.log(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Failed to fetch logs:', error.message);
  }
}

// Run the function
displayLogs();