const http = require('http');

function postJSON(path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log('Switching to live mode...');
    await postJSON('/api/db-mode', { mode: 'live' });
    
    console.log('Querying live planning data...');
    const startTime = Date.now();
    const planning = await getJSON('/api/planning?optimize=true&optimizeNightRun=true&algo=greedy');
    console.log(`Live planning data loaded successfully in ${Date.now() - startTime}ms.`);
    console.log('Number of days scheduled:', planning.days.length);
    console.log('First day:', planning.days[0]);
    
    // Check if there are scheduled Chiron steps in live mode
    let chironStepsToday = (planning.board['Chiron'] && planning.board['Chiron'][planning.days[0]]) || [];
    console.log(`Number of steps scheduled on Chiron today (live): ${chironStepsToday.length}`);
    chironStepsToday.forEach((s, idx) => {
      console.log(`  ${idx + 1}. Contract: ${s.contractNumber} | Active: ${s.isExecuting} | Desc: ${s.stepDesc}`);
    });
    
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    console.log('Switching back to dev mode...');
    await postJSON('/api/db-mode', { mode: 'dev' });
    process.exit(0);
  }
}

run();
