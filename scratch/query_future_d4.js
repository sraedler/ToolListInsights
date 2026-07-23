const { getPoolD4 } = require('../backend/db');

async function queryFutureStepFromBackend() {
  try {
    const poolD4 = await getPoolD4();
    
    const res = await poolD4.request().query(`
      SELECT TOP 5
        bk.BK_BKBE_NUMMER AS ContractNr,
        b.BP_POSITION_NUMMER AS OrderPos,
        CAST(b.BP_ARTIKEL_BEZEICHNUNG AS VARCHAR(500)) AS OrderDesc,
        p.PSP_POSITION_NUMMER AS StepPos,
        CAST(p.PSP_BEZEICHNUNG AS VARCHAR(500)) AS StepDesc,
        p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL AS SetupTime,
        p.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL AS ProdTime,
        p.PSP_ZEIT_TAGE_DURCHLAUFZEIT AS ThroughputDays,
        p.PSP_PP_STATUS_ANZAHL_TAGE_PRODUKTION AS ProdDays,
        m.MS_BEZEICHNUNG AS MachineName,
        planT.PSPP_DATUM_START AS StartDate
      FROM [D4].[dbo].[tPPS_SKKALP] p
      JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
      JOIN [D4].[dbo].[tbe_Belp] b ON k.PSK_IDBEBP = b.ID
      JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON b.BP_IDBEBK = bk.BK_BKBE_IDBEBK
      JOIN [D4].[dbo].[tPPS_SKKALP_PLAN] planT ON planT.PSPP_IDPSKP = p.ID
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m ON p.PSP_IDMS = m.ID
      WHERE planT.PSPP_DATUM_START >= GETDATE()
        AND planT.PSPP_STATUS_PLANUNG <> 1
        AND bk.BK_BKBE_STATUS_BEARBEITUNG = 0
      ORDER BY planT.PSPP_DATUM_START ASC
    `);

    console.log(JSON.stringify(res.recordset, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

queryFutureStepFromBackend();
