import http from 'http';

// Test if the debug server is running
const req = http.get('http://localhost:3030/logs', (res) => {
  console.log(`Server is running. Status: ${res.statusCode}`);
  res.on('data', () => {});
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (e) => {
  console.error(`Server not running: ${e.message}`);
});

req.end();