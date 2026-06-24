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
    console.log('Fetching C400 active programs in DB...');
    const programs = await fetchJson('http://localhost:5000/api/inventory/machine/C400/programs');
    console.log('Programs:', programs.map(p => ({ id: p.Id, name: p.ProgramName })));
    
    if (programs.length > 0) {
      const unloadId = programs[0].Id;
      console.log(`Unloading program ID ${unloadId} ("${programs[0].ProgramName}")`);
      
      const simDefault = await fetchJson('http://localhost:5000/api/inventory/machine/C400/simulation?targetDate=2028-12-31&optimize=false');
      const simUnload = await fetchJson(`http://localhost:5000/api/inventory/machine/C400/simulation?targetDate=2028-12-31&optimize=false&unloadPrograms=${unloadId}`);
      
      console.log('\nComparing step simulation details for C400:');
      for (let i = 0; i < 15; i++) {
        const stepDef = simDefault.simulatedTimeline[i];
        const stepUnl = simUnload.simulatedTimeline[i];
        if (!stepDef || !stepUnl) break;
        console.log(`Step #${i+1}: desc="${stepDef.desc.substring(0, 25)}"`);
        console.log(`  - Default:  missesCount=${stepDef.missesCount} occupiedSlots=${stepDef.occupiedSlots}`);
        console.log(`  - Unloaded: missesCount=${stepUnl.missesCount} occupiedSlots=${stepUnl.occupiedSlots}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
