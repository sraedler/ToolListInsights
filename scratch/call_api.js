const http = require('http');

function getMode() {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/api/db-mode', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });
}

function setMode(mode) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/db-mode',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.write(JSON.stringify({ mode }));
    req.end();
  });
}

async function run() {
  try {
    let modeObj = await getMode();
    console.log('Initial DB Mode:', modeObj.mode);
    
    console.log('Switching to LIVE mode...');
    const switchRes = await setMode('live');
    console.log('Switch response:', switchRes);
    
    modeObj = await getMode();
    console.log('Current DB Mode:', modeObj.mode);
    
    console.log('Switching back to DEV mode...');
    const switchBack = await setMode('dev');
    console.log('Switch response:', switchBack);
  } catch (err) {
    console.error(err);
  }
}

run();
