const { getPoolD4 } = require('../backend/db');

async function main() {
  try {
    const pool = await getPoolD4();
    console.log('Connected to D4 successfully.');
    
    // Test: Find a master step in tSK_KALP for a specific Article ID (e.g. 14192) and Pos '010'
    const res = await pool.request().query(`
      SELECT p.ID, p.KP_POSITION_NUMMER, CAST(p.KP_BEZEICHNUNG AS VARCHAR(8000)) as StepDesc
      FROM [D4].[dbo].[tSK_KALP] p
      INNER JOIN [D4].[dbo].[tSK_KALK] k ON p.KP_IDSKKK = k.ID
      WHERE (k.KK_IDBEBP IS NULL OR k.KK_IDBEBP = 0)
        AND p.KP_TYP_POSITION = 0
        AND p.KP_IDAR = 14192
        AND p.KP_POSITION_NUMMER = '010'
    `);
    
    console.log('Master step found:');
    console.log(res.recordset);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
