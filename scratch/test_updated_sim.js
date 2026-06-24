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

async function test() {
  try {
    console.log('Fetching C40 active programs in DB...');
    const programs = await fetchJson('http://localhost:5000/api/inventory/machine/C40/programs');
    console.log('Programs:', programs.map(p => ({ id: p.Id, name: p.ProgramName })));
    
    console.log('\n--- Case 1: Default Simulation (no unload) ---');
    const simDefault = await fetchJson('http://localhost:5000/api/inventory/machine/C40/simulation?targetDate=2028-12-31');
    console.log(`Initial magazine tools count: ${simDefault.initialMagazine.length}`);
    console.log(`Final magazine tools count: ${simDefault.finalMagazine.length}`);
    console.log(`Setup tools count (Rüstbedarf): ${simDefault.setupTools.length}`);
    
    if (programs.length > 0) {
      const progToUnload = programs.find(p => p.ProgramName.includes('L267-0120-SP3')) || programs[0];
      console.log(`\n--- Case 2: Simulation with program unloaded: "${progToUnload.ProgramName}" (Id: ${progToUnload.Id}) ---`);
      
      const simUnload = await fetchJson(`http://localhost:5000/api/inventory/machine/C40/simulation?targetDate=2028-12-31&unloadPrograms=${progToUnload.Id}`);
      console.log(`Initial magazine tools count: ${simUnload.initialMagazine.length}`);
      console.log(`Final magazine tools count: ${simUnload.finalMagazine.length}`);
      console.log(`Setup tools count (Rüstbedarf): ${simUnload.setupTools.length}`);
      
      console.log(`\nDifference in starting tools: ${simDefault.initialMagazine.length - simUnload.initialMagazine.length}`);
      console.log(`Difference in setup demand tools: ${simUnload.setupTools.length - simDefault.setupTools.length}`);
    }
    
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

// Give the server 3 seconds to finish caching before running test
setTimeout(test, 3000);
