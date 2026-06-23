const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Status: ${res.statusCode}. Body: ${data}`));
        } else {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log('=== VERIFYING EXCLUSION OF CLOSED ORDER P14875 ===\n');

    const machines = ['C40', 'C400', 'C42', 'Chiron', 'RS1', 'RS2'];
    let found = false;

    for (const mName of machines) {
      const sim = await fetchJson(`http://localhost:5000/api/inventory/machine/${encodeURIComponent(mName)}/simulation?targetDate=2028-12-31`);
      const matches = sim.simulatedTimeline.filter(s => s.contractNumber === 'P14875');
      if (matches.length > 0) {
        console.log(`Error: Closed order P14875 was found in the timeline of machine ${mName}!`);
        console.log(matches);
        found = true;
      }
    }

    if (!found) {
      console.log('Success: Closed order P14875 was NOT found in any machine timelines.');
    }
  } catch (err) {
    console.error('Verification failed:', err.message);
  }
}

run();
