const { getPoolD4 } = require('../backend/db');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const poolD4 = await getPoolD4();

    // Replicate fetchActiveStepsAndMaterials from server.js L179-366
    const sqlPath = path.join(__dirname, '..', 'KV_test.sql');
    let kvSql = fs.readFileSync(sqlPath, 'utf8').replace(/\bgo\b/gi, '');
    const selectStartMatch = kvSql.match(/\)\s+SELECT\s+ID\s*,\s*IDBEBP\s*,/i);
    const selectStartIndex = selectStartMatch.index;
    const ctePart = kvSql.substring(0, selectStartIndex + 1);
    const selectPartAndSuffix = kvSql.substring(selectStartIndex + 1);
    const whereIdx = selectPartAndSuffix.lastIndexOf('WHERE ISNULL(IDBEBP, 0) <> 0');
    const selectPart = selectPartAndSuffix.substring(0, whereIdx);

    const finalSql = `
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
        bk.BK_BKBE_NUMMER as ContractNumber,
        bk.BK_BKBE_TYP_BELEG_ART as BelegArt,
        CASE WHEN ISNULL(au.BK_BKBE_AU_PP_ZUSTAND_PLANUNG, 0) > 0 
             THEN au.BK_BKBE_AU_PP_ZUSTAND_PLANUNG - 1 
             ELSE ISNULL(b.BP_PP_ZUSTAND_PLANUNG, 0) 
        END as ZustandPlanung
      FROM (
        ${selectPart}
      ) AS OuterTemp
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
      LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
      WHERE bk.BK_BKBE_STATUS_BEARBEITUNG = 0 
        AND bk.BK_BKBE_TYP_BELEG = 2
        AND LTRIM(RTRIM(ISNULL(bk.BK_BKBE_NUMMER, ''))) <> '990001'
        AND ISNULL(OuterTemp.IDBEBP, 0) <> 990001
    `;

    console.log("Executing query...");
    const res = await poolD4.request().query(finalSql);
    console.log("Total rows returned:", res.recordset.length);

    const matches75771 = res.recordset.filter(r => String(r.ContractNumber).includes('75771'));
    console.log("Matches 75771:", matches75771.length);
    console.log(matches75771.map(m => ({
      StepId: m.StepId,
      OrderId: m.OrderId,
      StepPos: m.StepPos,
      ContractNumber: m.ContractNumber,
      BelegArt: m.BelegArt,
      ZustandPlanung: m.ZustandPlanung,
      SPKO: m.SPKO
    })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
