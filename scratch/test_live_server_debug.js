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
    console.log("Calling live backend API without searchQuery...");
    const data = await fetchApi('/api/planning?daysCount=14');
    
    // Find all steps on board that match 75771 or 6152
    let found = [];
    Object.keys(data.board).forEach(m => {
      Object.keys(data.board[m]).forEach(d => {
        data.board[m][d].forEach(s => {
          const cNum = String(s.ContractNumber || s.contractNumber || '');
          const oId = String(s.OrderId || s.orderId || '');
          const desc = String(s.StepDesc || s.stepDesc || '');
          if (cNum.includes('75771') || oId.includes('75771') || desc.includes('75771') || desc.includes('6152')) {
            found.push({ m, d, StepId: s.StepId || s.stepId, ContractNumber: cNum, OrderPos: s.OrderPos || s.orderPos, color: s.color });
          }
        });
      });
    });

    console.log("Found on live server board without search query:", found);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
