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
    const data = await fetchApi('/api/planning');
    console.log("Inspecting all items on board:");
    let totalItems = 0;
    Object.keys(data.board).forEach(m => {
      Object.keys(data.board[m]).forEach(d => {
        const list = data.board[m][d];
        if (list.length > 0) {
          totalItems += list.length;
          list.forEach(s => {
            if (String(s.ContractNumber || s.contractNumber || '').includes('75771') || String(s.StepDesc || '').includes('6152')) {
              console.log(`FOUND MATCH: Machine=${m}, Day=${d}, StepId=${s.StepId || s.stepId}, Contract=${s.ContractNumber || s.contractNumber}, Pos=${s.StepPos || s.stepPos}`);
            }
          });
        }
      });
    });
    console.log("Total items on board:", totalItems);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
