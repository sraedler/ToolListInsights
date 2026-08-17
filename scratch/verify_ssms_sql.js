const { getPoolD4 } = require('../backend/db');

async function test() {
  try {
    const pool = await getPoolD4();
    console.log("Testing standalone query 1...");

    const sql1 = `
      SELECT 
          bk.BK_BKBE_NUMMER              AS AuftragsNummer,
          bk.BK_BKBE_TYP_BELEG_ART       AS BelegArt,         -- 0 = Vorgemerkt, 1 = Freigegeben (P...)
          bk.BK_BKBE_STATUS_BEARBEITUNG  AS HeaderStatus,     -- 0 = Aktiv
          b.BP_POSITION_NUMMER           AS AuftragsPos,
          b.BP_ARTIKEL_BEZEICHNUNG       AS ArtikelBeschreibung,
          p.ID                           AS StepId,
          p.PSP_POSITION_NUMMER          AS SchrittPos,       -- z.B. 010, 020, 030
          p.PSP_BEZEICHNUNG              AS SchrittBezeichnung,
          p.PSP_PP_STATUS_PRODUKTION     AS StatusProduktion, -- 0 = Offen, 4 = Erledigt
          p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL   AS RuestzeitMin,
          p.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL AS StueckzeitMin,
          p.PSP_IDMS                     AS MaschinenId,     -- Fest zugeordnete Maschinen-ID
          m.MS_BEZEICHNUNG               AS MaschinenName,
          p.PSP_IDMP                     AS MaschinenPoolId, -- Pool-ID (9 = Fräsen RS2)
          mp.MP_BEZEICHNUNG              AS MaschinenPoolName
      FROM [D4].[dbo].[tBE_BELK_BKBE] bk
      INNER JOIN [D4].[dbo].[tbe_Belp] b 
          ON b.BP_IDBEBK = bk.BK_BKBE_IDBEBK
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k 
          ON k.PSK_IDBEBP = b.ID
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p 
          ON p.PSP_IDPSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m 
          ON m.ID = p.PSP_IDMS
      LEFT JOIN [D4].[dbo].[tPPS_MASCHPOOL] mp 
          ON mp.ID = p.PSP_IDMP
      WHERE bk.BK_BKBE_NUMMER LIKE '%75771%'
         OR bk.BK_BKBE_NUMMER LIKE '%202675771%'
      ORDER BY bk.BK_BKBE_NUMMER, CAST(ISNULL(NULLIF(b.BP_POSITION_NUMMER, ''), '0') AS INT), CAST(ISNULL(NULLIF(p.PSP_POSITION_NUMMER, ''), '0') AS INT);
    `;

    const res1 = await pool.request().query(sql1);
    console.log("SUCCESS Query 1! Rows:", res1.recordset.length);

    console.log("\nTesting standalone query 2 (Full KV_test query)...");
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '..', 'KV_test.sql');
    let kvSql = fs.readFileSync(sqlPath, 'utf8').replace(/\bgo\b/gi, '');
    const selectStartMatch = kvSql.match(/\)\s+SELECT\s+ID\s*,\s*IDBEBP\s*,/i);
    const selectStartIndex = selectStartMatch.index;
    const ctePart = kvSql.substring(0, selectStartIndex + 1);
    const selectPartAndSuffix = kvSql.substring(selectStartIndex + 1);
    const whereIdx = selectPartAndSuffix.lastIndexOf('WHERE ISNULL(IDBEBP, 0) <> 0');
    const selectPart = selectPartAndSuffix.substring(0, whereIdx);

    const fullSql = `
      ${ctePart}
      SELECT
        OuterTemp.ID as StepId,
        OuterTemp.IDBEBP as OrderId,
        OuterTemp.PSP_POSITION_NUMMER as StepPos,
        OuterTemp.PSP_TYP_HERKUNFT as TypHerkunft,
        OuterTemp.PSP_TYP_POSITION as StepTyp,
        OuterTemp.SPKO as SPKO,
        OuterTemp.VORGAENGER as VORGAENGER,
        b.BP_ARTIKEL_BEZEICHNUNG as OrderDesc,
        b.BP_POSITION_NUMMER as OrderPos,
        b.BP_IDAR as ArticleId,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupTime,
        p.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL as ProdTime,
        p.PSP_IDMS as MachineId,
        p.PSP_IDMP as MachinePoolId,
        p.PSP_PP_STATUS_PRODUKTION as StatusProduction,
        bk.BK_BKBE_NUMMER as ContractNumber
      FROM (
        ${selectPart}
      ) AS OuterTemp
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
      WHERE (bk.BK_BKBE_NUMMER LIKE '%75771%' OR bk.BK_BKBE_NUMMER LIKE '%202675771%')
    `;

    const res2 = await pool.request().query(fullSql);
    console.log("SUCCESS Query 2! Rows:", res2.recordset.length);

    process.exit(0);
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
}

test();
