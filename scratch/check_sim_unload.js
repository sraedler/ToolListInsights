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
    const simDefault = await fetchJson('http://localhost:5000/api/inventory/machine/C40/simulation?targetDate=2028-12-31&optimize=false');
    const simUnload = await fetchJson('http://localhost:5000/api/inventory/machine/C40/simulation?targetDate=2028-12-31&optimize=false&unloadPrograms=5294');
    
    console.log('Comparing step simulation details (Default vs Unloaded L267-0120-SP3):');
    for (let i = 0; i < 10; i++) {
      const stepDef = simDefault.simulatedTimeline[i];
      const stepUnl = simUnload.simulatedTimeline[i];
      console.log(`Step #${i+1}: desc="${stepDef.desc.substring(0, 25)}"`);
      console.log(`  - Default:  missesCount=${stepDef.missesCount} occupiedSlots=${stepDef.occupiedSlots}`);
      console.log(`  - Unloaded: missesCount=${stepUnl.missesCount} occupiedSlots=${stepUnl.occupiedSlots}`);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
