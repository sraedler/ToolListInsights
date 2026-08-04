const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    const res = await pool.request().query(`
      SELECT 
        p.ID as PlanId,
        sk.ID as StepId,
        p.PSPP_DATUM_START,
        CONVERT(varchar(10), p.PSPP_DATUM_START, 120) as DateStr,
        p.PSPP_ZEIT as ScheduledMin,
        bk.BK_BKBE_NUMMER as ContractNumber,
        bp.BP_POSITION_NUMMER as OrderPos,
        bp.BP_ARTIKEL_BEZEICHNUNG as ArticleDesc,
        sk.PSP_POSITION_NUMMER as StepPos,
        sk.PSP_BEZEICHNUNG as StepDesc,
        sk.PSP_PP_STATUS_PRODUKTION as StatusProd,
        bk.BK_BKBE_STATUS_BEARBEITUNG as StatusBearbeitung,
        m.MS_BEZEICHNUNG as MachineName,
        sk.PSP_IDMS as MachineId,
        sk.PSP_IDMP as MachinePoolId
      FROM [D4].[dbo].[tPPS_SKKALP_PLAN] p WITH (NOLOCK)
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] sk WITH (NOLOCK) ON sk.ID = p.PSPP_IDPSKP
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m WITH (NOLOCK) ON m.ID = sk.PSP_IDMS
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k WITH (NOLOCK) ON k.ID = sk.PSP_IDPSKKK
      INNER JOIN [D4].[dbo].[tbe_Belp] bp WITH (NOLOCK) ON bp.ID = k.PSK_IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk WITH (NOLOCK) ON bk.BK_BKBE_IDBEBK = bp.BP_IDBEBK
      WHERE bk.BK_BKBE_NUMMER = 'P202675641'
    `);

    console.log('=== D4 PLAN RECORDS FOR P202675641 ===');
    console.log(`Count: ${res.recordset.length}`);
    res.recordset.forEach(r => {
      console.log(JSON.stringify(r, null, 2));
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
