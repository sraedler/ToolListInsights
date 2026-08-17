const http = require('http');

function fetchApi(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5001${urlPath}`, (res) => {
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
    console.log("Fetching /api/planning?searchQuery=P202675771 ...");
    const dataP = await fetchApi('/api/planning?searchQuery=P202675771');
    
    let itemsP = [];
    if (dataP.board) {
      Object.keys(dataP.board).forEach(m => {
        Object.keys(dataP.board[m]).forEach(d => {
          dataP.board[m][d].forEach(s => {
            itemsP.push({ m, d, StepId: s.StepId || s.stepId, ContractNumber: s.ContractNumber || s.contractNumber, Pos: s.StepPos || s.stepPos });
          });
        });
      });
    }
    console.log("Items returned for P202675771:", itemsP);

    console.log("\nFetching /api/planning?searchQuery=202675771 ...");
    const dataNum = await fetchApi('/api/planning?searchQuery=202675771');
    let itemsNum = [];
    if (dataNum.board) {
      Object.keys(dataNum.board).forEach(m => {
        Object.keys(dataNum.board[m]).forEach(d => {
          dataNum.board[m][d].forEach(s => {
            itemsNum.push({ m, d, StepId: s.StepId || s.stepId, ContractNumber: s.ContractNumber || s.contractNumber, Pos: s.StepPos || s.stepPos });
          });
        });
      });
    }
    console.log("Items returned for 202675771:", itemsNum);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
