const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const poolD4 = await getPoolD4();
    const sql = `
      SELECT 
        zb.ID as BookingId,
        zb.ZBUBW_DATUM_ZEIT_START,
        zb.ZBUBW_DATUM_ZEIT_STOP,
        p.ID as StepId,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_PP_STATUS_PRODUKTION as ProdStatus,
        p.PSP_IDMS as MachineId,
        m.MS_BEZEICHNUNG as MachineDesc,
        b.BP_ARTIKEL_BEZEICHNUNG as ArticleDesc,
        b.ID as OrderId
      FROM [D4].[dbo].[tZE_BUCH_BEWE] zb
      INNER JOIN [D4].[dbo].[tZE_BUCH] z ON z.ID = zb.ZBUBW_IDZBU
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = z.ZBU_IDPSKP
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.ID = p.PSP_IDPSKKK
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = k.PSK_IDBEBP
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m ON m.ID = p.PSP_IDMS
      WHERE zb.ZBUBW_DATUM_ZEIT_START IS NOT NULL 
        AND zb.ZBUBW_DATUM_ZEIT_START <> 0
        AND (zb.ZBUBW_DATUM_ZEIT_STOP IS NULL OR zb.ZBUBW_DATUM_ZEIT_STOP = 0)
    `;
    const result = await poolD4.request().query(sql);
    console.log(`Found ${result.recordset.length} open bookings in the database:`);
    result.recordset.forEach(s => {
      console.log(`StepId: ${s.StepId} | Order: ${s.OrderId} | Article: ${s.ArticleDesc} | Machine: ${s.MachineId} (${s.MachineDesc}) | Start: ${s.ZBUBW_DATUM_ZEIT_START}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
