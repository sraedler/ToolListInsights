const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const poolD4 = await getPoolD4();
    // Query tZE_BUCH bookings join with tPPS_SKKALP for Chiron
    const sql = `
      SELECT 
        p.ID as StepId,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_PP_STATUS_PRODUKTION as ProdStatus,
        b.BP_ARTIKEL_BEZEICHNUNG as ArticleDesc,
        b.ID as OrderId,
        zb.ZE_BUCH_SUMME_ZEIT_IST
      FROM [D4].[dbo].[tPPS_SKKALP] p
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.ID = p.PSP_IDPSKKK
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = k.PSK_IDBEBP
      INNER JOIN (
        SELECT ZBU_IDPSKP, SUM(ISNULL(ZBUBW_ZEIT, 0)) AS ZE_BUCH_SUMME_ZEIT_IST
        FROM [D4].[dbo].[tZE_BUCH]
        LEFT JOIN (
          SELECT CASE
                   WHEN ISNULL(ZBUBW_DATUM_ZEIT_START, 0) <> 0 AND ISNULL(ZBUBW_DATUM_ZEIT_STOP, 0) <> 0 THEN
                     ROUND(CAST(DATEDIFF(ss, ZBUBW_DATUM_ZEIT_START, ZBUBW_DATUM_ZEIT_STOP) AS FLOAT) / 60, 4)
                   ELSE 0
                 END AS ZBUBW_ZEIT,
                 ZBUBW_IDZBU
          FROM [D4].[dbo].[tZE_BUCH_BEWE]
        ) AS tZE ON tZE.ZBUBW_IDZBU = tZE_BUCH.ID
        GROUP BY ZBU_IDPSKP
      ) zb ON zb.ZBU_IDPSKP = p.ID
      WHERE p.PSP_IDMS = 21 AND zb.ZE_BUCH_SUMME_ZEIT_IST > 0
    `;
    const result = await poolD4.request().query(sql);
    console.log(`Found ${result.recordset.length} Chiron steps with active bookings (Time > 0):`);
    result.recordset.forEach(s => {
      console.log(`StepId: ${s.StepId} | OrderId: ${s.OrderId} | Article: ${s.ArticleDesc} | ProdStatus: ${s.ProdStatus} | BookedTime: ${s.ZE_BUCH_SUMME_ZEIT_IST.toFixed(2)} min | Desc: ${s.StepDesc.substring(0, 30).replace(/\r?\n/g, ' ')}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
