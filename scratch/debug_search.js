const { getPoolD4, getPoolWT } = require('../backend/db');
const fs = require('fs');
const path = require('path');

function stepMatchesSearch(step, q) {
  if (!q) return true;
  const oId = String(step.OrderId || step.orderId || '').toLowerCase();
  const cNum = String(step.ContractNumber || step.contractNumber || step.cNum || '').toLowerCase();
  const desc = String(step.StepDesc || step.stepDesc || step.Description || step.ArticleName || step.articleName || '').toLowerCase();
  const cust = String(step.CustomerName || step.customerName || '').toLowerCase();
  const nc = String(step.NCProgram || step.ncProgram || '').toLowerCase();
  const tl = String(step.MatchedListNr || step.matchedListNr || step.toolListNr || '').toLowerCase();
  const pos = String(step.OrderPos || step.orderPos || '').toLowerCase();

  return oId.includes(q) || cNum.includes(q) || desc.includes(q) || cust.includes(q) || nc.includes(q) || tl.includes(q) || (cNum + '_' + pos).includes(q) || (oId + '_' + pos).includes(q);
}

async function test() {
  try {
    const poolD4 = await getPoolD4();

    // Query step 433948
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
        bk.BK_BKBE_NUMMER as ContractNumber
      FROM (
        ${selectPart}
      ) AS OuterTemp
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
      WHERE OuterTemp.ID = 433948
    `;

    const res = await poolD4.request().query(finalSql);
    const step = res.recordset[0];
    console.log("Step 433948:", step);

    const queries = ['202675771', 'p202675771', '75771', '6152'];
    queries.forEach(q => {
      console.log(`stepMatchesSearch(step, '${q}'):`, stepMatchesSearch(step, q));
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
