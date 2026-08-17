const { getPoolD4 } = require('../backend/db');

async function test() {
  try {
    const pool = await getPoolD4();

    // Query positions for 38597 and 38598
    const posRes = await pool.request().query(`
      SELECT b.ID as PosId, b.BP_IDBEBK, bk.BK_BKBE_NUMMER, b.BP_POSITION_NUMMER, b.BP_ARTIKEL_BEZEICHNUNG, b.BP_IDAR
      FROM [D4].[dbo].[tbe_Belp] b
      JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      WHERE bk.ID IN (38597, 38598)
    `);
    console.log("Positions count:", posRes.recordset.length);

    const posIds = posRes.recordset.map(p => p.PosId);

    // Query tPPS_SKKALK (work plan headers)
    const kalkRes = await pool.request().query(`
      SELECT k.ID as KalkId, k.PSK_IDBEBP, b.BP_POSITION_NUMMER, bk.BK_BKBE_NUMMER, b.BP_ARTIKEL_BEZEICHNUNG
      FROM [D4].[dbo].[tPPS_SKKALK] k
      JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = k.PSK_IDBEBP
      JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      WHERE k.PSK_IDBEBP IN (${posIds.join(',')})
    `);
    console.log("Work plan headers count (tPPS_SKKALK):", kalkRes.recordset.length);
    console.log("Kalk headers:", JSON.stringify(kalkRes.recordset, null, 2));

    if (kalkRes.recordset.length > 0) {
      const kalkIds = kalkRes.recordset.map(k => k.KalkId);
      // Query operations in tPPS_SKKALP
      const alpRes = await pool.request().query(`
        SELECT 
          p.ID as StepId,
          p.PSP_IDPSKKK,
          p.PSP_POSITION_NUMMER as StepPos,
          p.PSP_BEZEICHNUNG as StepDesc,
          p.PSP_IDMS as MachineId,
          m.MS_BEZEICHNUNG as MachineName,
          p.PSP_IDMP as MachinePoolId,
          mp.MP_BEZEICHNUNG as MachinePoolName,
          p.PSP_PP_STATUS_PRODUKTION as StatusProd,
          p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupTime,
          p.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL as ProdTime
        FROM [D4].[dbo].[tPPS_SKKALP] p
        LEFT JOIN [D4].[dbo].[tPPS_MASTA] m ON m.ID = p.PSP_IDMS
        LEFT JOIN [D4].[dbo].[tPPS_MASCHPOOL] mp ON mp.ID = p.PSP_IDMP
        WHERE p.PSP_IDPSKKK IN (${kalkIds.join(',')})
      `);
      console.log("Operations count (tPPS_SKKALP):", alpRes.recordset.length);
      console.log("Operations:", JSON.stringify(alpRes.recordset, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
