const { getPoolD4 } = require('../backend/db');

async function main() {
  try {
    const pool = await getPoolD4();
    console.log('Querying steps for 620187 Pos 11...');

    const res = await pool.request().query(`
      SELECT 
        bk.BK_BKBE_NUMMER as ContractNumber,
        bp.BP_POSITION_NUMMER as OrderPos,
        bp.BP_ARTIKEL_BEZEICHNUNG as ArticleDesc,
        sk.ID as StepId,
        sk.PSP_POSITION_NUMMER as StepPos,
        sk.PSP_BEZEICHNUNG as StepDesc,
        sk.PSP_IDMS as MachineId,
        sk.PSP_IDMP as MachinePoolId,
        m.MS_BEZEICHNUNG as MachineName,
        m.MS_NUMMER as MachineNummer,
        sk.PSP_PP_STATUS_PRODUKTION as StatusProd,
        sk.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupTime,
        sk.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL as ProdTime
      FROM [D4].[dbo].[tPPS_SKKALP] sk WITH (NOLOCK)
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k WITH (NOLOCK) ON k.ID = sk.PSP_IDPSKKK
      INNER JOIN [D4].[dbo].[tbe_Belp] bp WITH (NOLOCK) ON bp.ID = k.PSK_IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk WITH (NOLOCK) ON bk.BK_BKBE_IDBEBK = bp.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m WITH (NOLOCK) ON m.ID = sk.PSP_IDMS
      WHERE bk.BK_BKBE_NUMMER LIKE '%620187%' AND bp.BP_POSITION_NUMMER = 11
      ORDER BY sk.PSP_POSITION_NUMMER
    `);

    console.log('Steps in tPPS_SKKALP for Pos 11:');
    console.log(JSON.stringify(res.recordset, null, 2));

    // Also check planning table tPPS_SKKALP_PLAN for Pos 11
    const planRes = await pool.request().query(`
      SELECT 
        p.ID as PlanId,
        p.PSPP_IDPSKP as StepId,
        CONVERT(varchar(10), p.PSPP_DATUM_START, 120) as StartDate,
        p.PSPP_ZEIT as PlanZeit,
        sk.PSP_POSITION_NUMMER as StepPos,
        sk.PSP_BEZEICHNUNG as StepDesc,
        sk.PSP_IDMS as StepMachineId,
        sk.PSP_IDMP as StepMachinePoolId,
        m.MS_BEZEICHNUNG as MachineName,
        m.MS_NUMMER as MachineNummer
      FROM [D4].[dbo].[tPPS_SKKALP_PLAN] p WITH (NOLOCK)
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] sk WITH (NOLOCK) ON sk.ID = p.PSPP_IDPSKP
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k WITH (NOLOCK) ON k.ID = sk.PSP_IDPSKKK
      INNER JOIN [D4].[dbo].[tbe_Belp] bp WITH (NOLOCK) ON bp.ID = k.PSK_IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk WITH (NOLOCK) ON bk.BK_BKBE_IDBEBK = bp.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m WITH (NOLOCK) ON m.ID = sk.PSP_IDMS
      WHERE bk.BK_BKBE_NUMMER LIKE '%620187%' AND bp.BP_POSITION_NUMMER = 11
      ORDER BY p.PSPP_DATUM_START
    `);

    console.log('Plan entries in tPPS_SKKALP_PLAN for Pos 11:');
    console.log(JSON.stringify(planRes.recordset, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error querying D4:', err);
    process.exit(1);
  }
}

main();
