const http = require('http');

function testHttp() {
  console.log('Testing /api/planning endpoint via http...');
  http.get('http://localhost:5000/api/planning?optimize=true&optimizeNightRun=true&algo=hybrid', (res) => {
    console.log('Status:', res.statusCode);
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('SUCCESS! Loaded board.');
        console.log('Days:', data.days);
        console.log('Machines:', data.machines);
        const mName = 'Brother';
        const day = data.days[0];
        console.log(`Steps on ${mName} - ${day}:`, data.board[mName][day].length);
        if (data.board[mName][day].length > 0) {
          console.log('Sample step details:', data.board[mName][day][0]);
        }
      } catch (err) {
        console.log('JSON Parse error or error response:', body.substring(0, 300));
      }
      process.exit(0);
    });
  }).on('error', (e) => {
    console.error('HTTP Error:', e.message);
    process.exit(1);
  });
}

testHttp();
