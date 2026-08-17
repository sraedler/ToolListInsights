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
    const res1 = await fetchApi('/api/planning?searchQuery=202675771');
    console.log("Items in res1.board:");
    Object.keys(res1.board || {}).forEach(m => {
      Object.keys(res1.board[m]).forEach(d => {
        if (res1.board[m][d].length > 0) {
          console.log(`Machine ${m}, Day ${d}: ${res1.board[m][d].length} items`);
          res1.board[m][d].forEach(s => {
            console.log(`  -> StepId=${s.stepId || s.StepId}, ContractNumber=${s.contractNumber || s.ContractNumber}, Pos=${s.stepPos || s.StepPos}, Desc=${s.stepDesc || s.StepDesc}`);
          });
        }
      });
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
