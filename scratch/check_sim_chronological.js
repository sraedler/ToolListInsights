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
    const sim = await fetchJson('http://localhost:5000/api/inventory/machine/C40/simulation?targetDate=2028-12-31&optimize=false');
    console.log('Total timeline steps:', sim.simulatedTimeline.length);
    console.log('Sample steps simulation details:');
    sim.simulatedTimeline.slice(0, 10).forEach((step, idx) => {
      console.log(`Step #${idx+1}: desc="${step.desc.substring(0, 30)}" date=${step.date} toolsCount=${step.toolsCount} missesCount=${step.missesCount} occupiedSlots=${step.occupiedSlots}`);
    });
  } catch (err) {
    console.error(err);
  }
}

run();
