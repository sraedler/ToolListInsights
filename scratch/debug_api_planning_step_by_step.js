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
    console.log("Testing /api/planning endpoint variants...");

    const p1 = await fetchApi('/api/planning?includeNonGreen=true');
    console.log("includeNonGreen=true board keys with non-empty lists:");
    Object.keys(p1.board || {}).forEach(m => {
      Object.keys(p1.board[m]).forEach(d => {
        if (p1.board[m][d].length > 0) {
          console.log(`  ${m} -> ${d}: ${p1.board[m][d].length} items`);
        }
      });
    });

    const p2 = await fetchApi('/api/planning?searchQuery=202675771');
    console.log("\nsearchQuery=202675771 board keys with non-empty lists:");
    let count2 = 0;
    Object.keys(p2.board || {}).forEach(m => {
      Object.keys(p2.board[m]).forEach(d => {
        if (p2.board[m][d].length > 0) {
          count2 += p2.board[m][d].length;
          console.log(`  ${m} -> ${d}: ${p2.board[m][d].length} items`);
        }
      });
    });
    console.log("Total items found for searchQuery=202675771:", count2);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
