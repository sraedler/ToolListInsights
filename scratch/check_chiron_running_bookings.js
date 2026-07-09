const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const poolD4 = await getPoolD4();
    // Query tZE_BUCH_BEWE for open bookings (stop date is 0 or null)
    const sql = `
      SELECT 
        p.ID as StepId,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_PP_STATUS_PRODUKTION as ProdStatus,
        b.BP_ARTIKEL_BEZEICHNUNG as ArticleDesc,
        b.ID as OrderId,
        zb.ZBUBW_DATUM_ZEIT_START,
        zb.ZBUBW_DATUM_ZEIT_STOP
      FROM [D4].[dbo].[tZE_BUCH_BEWE] zb
      INNER JOIN [D4].[dbo].[tZE_BUCH] z ON z.ID = zb.ZBUBW_IDZBU
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = z.ZBU_IDPSKP
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.ID = p.PSP_IDPSKKK
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = k.PSK_IDBEBP
      WHERE p.PSP_IDMS = 21
        AND zb.ZBUBW_DATUM_ZEIT_START IS NOT NULL 
        AND zb.ZBUBW_DATUM_ZEIT_START <> 0
        AND (zb.ZBUBW_DATUM_ZEIT_STOP IS NULL OR zb.ZBUBW_DATUM_ZEIT_STOP = 0)
    `;
    const result = await poolD4.request().query(sql);
    console.log(`Found ${result.recordset.length} open bookings on Chiron:`);
    result.recordset.forEach(s => {
      console.log(`StepId: ${s.StepId} | OrderId: ${s.OrderId} | Article: ${s.ArticleDesc} | ProdStatus: ${s.ProdStatus} | StartTime: ${s.ZBUBW_DATUM_ZEIT_START} | StopTime: ${s.ZBUBW_DATUM_ZEIT_STOP}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
