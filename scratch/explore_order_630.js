const { getPoolD4, sql } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  try {
    const pool = await getPoolD4();
    
    // Find order P202584630
    const orderRes = await pool.request()
      .input('num', sql.VarChar, 'P202584630')
      .query(`
        SELECT b.ID, b.BP_POSITION_NUMMER, b.BP_ARTIKEL_BEZEICHNUNG, b.BP_IDAR, bk.BK_BKBE_NUMMER
        FROM [D4].[dbo].[tbe_Belp] b
        INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
        WHERE bk.BK_BKBE_NUMMER = @num
      `);
      
    console.log('--- Order Positions ---');
    console.log(orderRes.recordset);
    
    if (orderRes.recordset.length === 0) {
      console.log('No order positions found for P202584630');
      process.exit(0);
    }
    
    const belpIds = orderRes.recordset.map(r => r.ID);
    
    // Fetch step 080 specifically or all steps
    const stepsRes = await pool.request().query(`
      SELECT p.ID as StepId, p.PSP_POSITION_NUMMER as StepPos, p.PSP_BEZEICHNUNG as StepDesc, p.PSP_IDMS, m.MS_BEZEICHNUNG as MachineName
      FROM [D4].[dbo].[tPPS_SKKALP] p
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.ID = p.PSP_IDPSKKK
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m ON m.ID = p.PSP_IDMS
      WHERE k.PSK_IDBEBP IN (${belpIds.join(',')})
      ORDER BY p.PSP_POSITION_NUMMER
    `);
    
    console.log('\n--- Steps ---');
    stepsRes.recordset.forEach(s => {
      console.log(`StepPos: ${s.StepPos}, Machine: ${s.MachineName}`);
      console.log(`StepDesc:\n${s.StepDesc}\n----------------------------------`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
