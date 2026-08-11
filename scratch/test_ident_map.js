const { getPoolWT } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const poolWT = await getPoolWT();
    const res = await poolWT.request().query('SELECT TOP 20 Nr, Ident, NCP, Descript FROM [WTDATA].[dbo].[ToolLists]');
    console.log('=== WINTOL TOOLLISTS SAMPLE ===');
    console.log(res.recordset);

    const match3202 = res.recordset.find(r => String(r.Nr) === '3202');
    if (match3202) {
      console.log('\nMatch for 3202:', match3202);
    } else {
      const res3202 = await poolWT.request().query('SELECT Nr, Ident, NCP, Descript FROM [WTDATA].[dbo].[ToolLists] WHERE Nr = 3202');
      console.log('\nMatch for 3202 in DB:', res3202.recordset);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
