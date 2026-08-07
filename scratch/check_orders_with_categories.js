const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    const res = await pool.request().query(`
      SELECT TOP 20
        bk.BK_BKBE_NUMMER as ContractNumber,
        bp.BP_POSITION_NUMMER as OrderPos,
        kago_bk.KG_FARBE as OrderCategoryColor,
        kago_bk.KG_BEZEICHNUNG as OrderCategoryName,
        kago_pos.KG_FARBE as PositionCategoryColor,
        kago_pos.KG_BEZEICHNUNG as PositionCategoryName
      FROM [D4].[dbo].[tBE_BELK_BKBE] bk WITH (NOLOCK)
      INNER JOIN [D4].[dbo].[tbe_Belp] bp WITH (NOLOCK) ON bp.BP_IDBEBK = bk.BK_BKBE_IDBEBK
      LEFT JOIN (SELECT AGBW_IDEKBK, MIN(ID) AS AGBW_MIN_ID FROM [D4].[dbo].[tAG_BEWE] WHERE AGBW_IDEKBK IS NOT NULL GROUP BY AGBW_IDEKBK) AS tAG_BEWE_BK_MIN ON tAG_BEWE_BK_MIN.AGBW_IDEKBK = bk.BK_BKBE_IDBEBK
      LEFT JOIN [D4].[dbo].[tAG_BEWE] agbw_bk WITH (NOLOCK) ON agbw_bk.ID = tAG_BEWE_BK_MIN.AGBW_MIN_ID
      LEFT JOIN [D4].[dbo].[tKAGO] kago_bk WITH (NOLOCK) ON kago_bk.ID = agbw_bk.AGBW_IDKAGO
      LEFT JOIN (SELECT AGBW_IDEKBP, MIN(ID) AS AGBW_MIN_ID FROM [D4].[dbo].[tAG_BEWE] WHERE AGBW_IDEKBP IS NOT NULL GROUP BY AGBW_IDEKBP) AS tAG_BEWE_POS_MIN ON tAG_BEWE_POS_MIN.AGBW_IDEKBP = bp.ID
      LEFT JOIN [D4].[dbo].[tAG_BEWE] agbw_pos WITH (NOLOCK) ON agbw_pos.ID = tAG_BEWE_POS_MIN.AGBW_MIN_ID
      LEFT JOIN [D4].[dbo].[tKAGO] kago_pos WITH (NOLOCK) ON kago_pos.ID = agbw_pos.AGBW_IDKAGO
      WHERE (kago_bk.KG_FARBE IS NOT NULL AND kago_bk.KG_FARBE <> -1)
         OR (kago_pos.KG_FARBE IS NOT NULL AND kago_pos.KG_FARBE <> -1)
    `);
    
    console.log('=== ORDERS/POSITIONS WITH CATEGORY COLORS IN D4 ===');
    console.log(res.recordset);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
