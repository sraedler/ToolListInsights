const http = require('http');

http.get('http://localhost:5001/api/debug-search', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Response:", data);
  });
});
