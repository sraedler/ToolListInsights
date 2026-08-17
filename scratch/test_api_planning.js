const http = require('http');

function fetchApi(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  try {
    const urls = [
      '/api/planning',
      '/api/planning?searchQuery=202675771',
      '/api/planning?searchQuery=P202675771',
      '/api/planning?includeNonGreen=true',
      '/api/planning?includeNonGreen=true&searchQuery=202675771',
      '/api/planning?isConflictMode=true&searchQuery=202675771'
    ];

    for (const url of urls) {
      console.log(`\n=== GET ${url} ===`);
      const data = await fetchApi(url);
      let matches = [];
      if (data.board) {
        Object.keys(data.board).forEach(m => {
          Object.keys(data.board[m]).forEach(d => {
            data.board[m][d].forEach(s => {
              const cNum = String(s.ContractNumber || s.contractNumber || '');
              const oId = String(s.OrderId || s.orderId || '');
              const desc = String(s.StepDesc || s.stepDesc || '');
              if (cNum.includes('75771') || oId.includes('75771') || desc.includes('75771')) {
                matches.push({ machine: m, date: d, stepId: s.StepId || s.stepId, pos: s.StepPos || s.stepPos, desc: desc.substring(0, 35), color: s.color, contract: cNum });
              }
            });
          });
        });
      }
      console.log(`Found ${matches.length} matches:`);
      console.log(JSON.stringify(matches, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
