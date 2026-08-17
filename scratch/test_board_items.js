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
    const data = await fetchApi('/api/planning?daysCount=14');
    let allContracts = new Set();
    Object.keys(data.board).forEach(m => {
      Object.keys(data.board[m]).forEach(d => {
        data.board[m][d].forEach(s => {
          allContracts.add(String(s.ContractNumber || s.contractNumber));
        });
      });
    });
    console.log("All contracts on board:", Array.from(allContracts));
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
