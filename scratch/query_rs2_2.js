const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    const res = await pool.request().query(`
      SELECT 
        p.ID as PlanId,
        sk.ID as StepId,
        CONVERT(varchar(10), p.PSPP_DATUM_START, 120) as DateStr,
        p.PSPP_ZEIT as ScheduledMin,
        bk.BK_BKBE_NUMMER as ContractNumber,
        bp.BP_POSITION_NUMMER as OrderPos,
        bp.BP_ARTIKEL_BEZEICHNUNG as ArticleDesc,
        sk.PSP_POSITION_NUMMER as StepPos,
        sk.PSP_BEZEICHNUNG as StepDesc,
        m.MS_BEZEICHNUNG as MachineName,
        sk.PSP_IDMS as MachineId,
        sk.PSP_IDMP as MachinePoolId
      FROM [D4].[dbo].[tPPS_SKKALP_PLAN] p WITH (NOLOCK)
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] sk WITH (NOLOCK) ON sk.ID = p.PSPP_IDPSKP
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m WITH (NOLOCK) ON m.ID = sk.PSP_IDMS
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k WITH (NOLOCK) ON k.ID = sk.PSP_IDPSKKK
      INNER JOIN [D4].[dbo].[tbe_Belp] bp WITH (NOLOCK) ON bp.ID = k.PSK_IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk WITH (NOLOCK) ON bk.BK_BKBE_IDBEBK = bp.BP_IDBEBK
      WHERE CONVERT(varchar(10), p.PSPP_DATUM_START, 120) = '2026-09-09'
        AND (sk.PSP_IDMS = 6 OR m.MS_BEZEICHNUNG LIKE '%RS2_2%' OR sk.PSP_IDMP IN (9, 12) OR sk.PSP_BEZEICHNUNG LIKE '%RS2%')
      ORDER BY m.MS_BEZEICHNUNG, bk.BK_BKBE_NUMMER
    `);

    console.log('=== D4 DB RECORDS FOR RS2 / RS2_2 ON 2026-09-09 ===');
    console.log(`Total count: ${res.recordset.length}`);
    res.recordset.forEach(r => {
      console.log(`Contract: ${r.ContractNumber} | Pos: ${r.OrderPos} | AS: ${r.StepPos} | Min: ${r.ScheduledMin} (${(r.ScheduledMin/60).toFixed(1)}h) | Machine: ${r.MachineName || ('Pool #' + r.MachinePoolId)} | Article: ${r.ArticleDesc.replace(/[\r\n]+/g, ' ').substring(0, 30)} | StepDesc: ${r.StepDesc.replace(/[\r\n]+/g, ' ').substring(0, 35)}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
