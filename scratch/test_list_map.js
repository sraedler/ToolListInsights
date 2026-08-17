const { getPoolWT } = require('../backend/db');
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
    const poolWT = await getPoolWT();
    const resList = await poolWT.request().query("SELECT Nr, MachineNr FROM [WTDATA].[dbo].[ToolLists] WHERE Nr = '118'");
    console.log("WinTool list 118 MachineNr:", resList.recordset);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
