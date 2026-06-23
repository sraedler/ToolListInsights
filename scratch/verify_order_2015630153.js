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
    console.log('=== VERIFYING EXCLUSION OF DOCUMENT TYPE 3 ORDER 2015630153 ===\n');

    const machines = ['C40', 'C400', 'C42', 'Chiron', 'RS1', 'RS2'];
    let found = false;

    for (const mName of machines) {
      const sim = await fetchJson(`http://localhost:5000/api/inventory/machine/${encodeURIComponent(mName)}/simulation?targetDate=2028-12-31`);
      const matches = sim.simulatedTimeline.filter(s => s.contractNumber === '2015630153');
      if (matches.length > 0) {
        console.log(`Error: Sales order 2015630153 was found in the timeline of machine ${mName}!`);
        console.log(matches);
        found = true;
      }
    }

    if (!found) {
      console.log('Success: Sales order 2015630153 was NOT found in any machine timelines.');
    }
  } catch (err) {
    console.error('Verification failed:', err.message);
  }
}

run();
