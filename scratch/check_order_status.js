const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query(`
      SELECT 
        bk.ID,
        bk.BK_BKBE_NUMMER as ContractNumber,
        bk.BK_BKBE_STATUS_BEARBEITUNG as StatusBearbeitung,
        bk.BK_BKBE_TYP_BELEG as TypBeleg
      FROM [D4].[dbo].[tBE_BELK_BKBE] bk
      WHERE bk.BK_BKBE_NUMMER = 'P14875'
    `);
    
    console.log('Order Details for P14875:');
    console.log(result.recordset);
    
    // Also check if there are steps associated with it
    const stepsResult = await pool.request().query(`
      SELECT 
        p.ID as StepId,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_PP_STATUS_PRODUKTION as StepStatus
      FROM [D4].[dbo].[tbe_Belp] b
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.PSK_IDBEBP = b.ID
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      WHERE bk.BK_BKBE_NUMMER = 'P14875'
    `);
    console.log('\nAssociated Steps count:', stepsResult.recordset.length);
    if (stepsResult.recordset.length > 0) {
      console.log('Sample Step Status:', stepsResult.recordset[0]);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
