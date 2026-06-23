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
    const mName = 'C400';
    const sim = await fetchJson(`http://localhost:5000/api/inventory/machine/${encodeURIComponent(mName)}/simulation?targetDate=2028-12-31`);
    
    let total = sim.simulatedTimeline.length;
    let withTools = sim.simulatedTimeline.filter(s => s.toolsCount > 0).length;
    let totalOriginalMisses = sim.simulatedTimeline.reduce((acc, s) => acc + s.missesCount, 0);
    
    console.log(`Machine ${mName} Timeline Statistics (Chronological):`);
    console.log(`- Total timeline steps: ${total}`);
    console.log(`- Steps with matched tools: ${withTools} (${Math.round(withTools/total * 100)}%)`);
    console.log(`- Total chronological tool swaps (misses): ${totalOriginalMisses}`);
    
    const simOpt = await fetchJson(`http://localhost:5000/api/inventory/machine/${encodeURIComponent(mName)}/simulation?targetDate=2028-12-31&optimize=true`);
    let totalOptMisses = simOpt.simulatedTimeline.reduce((acc, s) => acc + s.missesCount, 0);
    console.log(`\nMachine ${mName} Timeline Statistics (Rüstoptimiert):`);
    console.log(`- Total optimized tool swaps (misses): ${totalOptMisses}`);
    console.log(`- Swaps reduction: ${totalOriginalMisses - totalOptMisses} (${Math.round((1 - totalOptMisses / totalOriginalMisses) * 100)}% reduction)`);
    
    console.log('\nSample steps with tools in optimized order (first 10):');
    simOpt.simulatedTimeline.filter(s => s.toolsCount > 0).slice(0, 10).forEach((s, idx) => {
      console.log(`- Step #${idx + 1} (${s.date}): ${s.desc.substring(0, 30)}... | Tools: ${s.toolsCount} | Misses: ${s.missesCount}`);
    });
    
  } catch (err) {
    console.error(err);
  }
}

run();
