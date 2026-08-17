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
    console.log("Calling live backend API...");
    const data = await fetchApi('/api/planning?searchQuery=202675771');
    console.log("Response board keys:", Object.keys(data.board || {}));

    let matches = [];
    if (data.board) {
      Object.keys(data.board).forEach(m => {
        Object.keys(data.board[m]).forEach(d => {
          data.board[m][d].forEach(s => {
            matches.push({ m, d, s });
          });
        });
      });
    }

    console.log("Matches count:", matches.length);
    console.log("Matches:", matches);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
