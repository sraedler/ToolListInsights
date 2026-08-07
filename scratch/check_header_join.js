const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    const res = await pool.request().query(`
      SELECT TOP 5 
        bk.ID, bk.BK_BKBE_IDEKBK, bk.BK_BKBE_IDBEBK, bk.BK_BKBE_NUMMER,
        ag.ID as AgBeweId, ag.AGBW_IDEKBK, ag.AGBW_IDKAGO, kago.KG_FARBE, kago.KG_BEZEICHNUNG
      FROM [D4].[dbo].[tBE_BELK_BKBE] bk WITH (NOLOCK)
      INNER JOIN [D4].[dbo].[tAG_BEWE] ag WITH (NOLOCK) ON ag.AGBW_IDEKBK = bk.BK_BKBE_IDEKBK
      INNER JOIN [D4].[dbo].[tKAGO] kago WITH (NOLOCK) ON kago.ID = ag.AGBW_IDKAGO
    `);
    
    console.log('=== MATCHED HEADER CATEGORIES IN D4 ===');
    console.log(res.recordset);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
