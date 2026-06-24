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
    const currentTools = await fetchJson('http://localhost:5000/api/inventory/machine/C40/current-tools');
    console.log(`Successfully fetched current tools from DB!`);
    console.log(`Total tools returned: ${currentTools.length}`);
    if (currentTools.length > 0) {
      console.log(`Sample tool: pocket ${currentTools[0].pocket} - ${currentTools[0].desc} (${currentTools[0].toolName})`);
    }
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

test();
