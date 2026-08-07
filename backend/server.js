
function mapD4ColorToHex(kgFarbe) {
  if (kgFarbe === null || kgFarbe === undefined || kgFarbe === -1) return null;
  const num = Number(kgFarbe);
  switch (num) {
    case 1: case 11: case 16: case 43: return '#ef4444'; // Rot
    case 2: case 17: case 36: case 58: return '#f97316'; // Orange
    case 3: case 4: case 13: case 18: case 23: case 30: case 33: case 37: case 46: case 50: case 60: case 63: return '#eab308'; // Gelb
    case 5: case 34: case 48: return '#38bdf8'; // Hellblau
    case 6: case 41: case 42: case 47: return '#22c55e'; // Hellgrün
    case 7: case 14: case 19: case 24: case 38: case 49: case 52: case 65: case 66: return '#10b981'; // Grün
    case 8: case 15: case 20: case 25: case 32: case 39: case 40: case 45: case 56: case 62: return '#3b82f6'; // Blau
    case 10: case 55: return '#a855f7'; // Lila
    case 12: case 31: case 59: return '#991b1b'; // Dunkelrot
    case 22: case 57: case 64: return '#6b7280'; // Grau
    default:
      if (num > 255) {
        const r = num & 0xFF;
        const g = (num >> 8) & 0xFF;
        const b = (num >> 16) & 0xFF;
        return `rgb(${r}, ${g}, ${b})`;
      }
      return null;
  }
}

async function fetchFastD4NativePlan(startDateStr, endDateStr) {
  try {
    const poolD4 = await getPoolD4();
    const res = await poolD4.request().query(`
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
        sk.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupTime,
        sk.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL as ProdTime,
        ISNULL(sk.PSP_IDMS, 0) as MachineId,
        ISNULL(sk.PSP_IDMP, 0) as MachinePoolId,
        m.MS_BEZEICHNUNG as MachineName,
        bk.BK_BKBE_TYP_BELEG_ART as BelegArt,
        ISNULL(sk.PSP_TYP_SPERRE, 0) as TypSperre,
        ISNULL(sk.PSP_TYP_SPERRE_WEITERVERARBEITUNG, 0) as SperreWeiter,
        sk.PSP_PP_STATUS_PRODUKTION as StatusProd,
        ISNULL(sk.PSP_ZEIT_UEBERLAPPUNG_PROZENT, 0) as UeberlappungProzent,
        ISNULL(sk.PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG, 0) as MaxProdTag,
        k.PSK_IDBEBP as IdBeBp,
        CASE WHEN ISNULL(au.BK_BKBE_AU_PP_ZUSTAND_PLANUNG, 0) > 0 
             THEN au.BK_BKBE_AU_PP_ZUSTAND_PLANUNG - 1 
             ELSE ISNULL(bp.BP_PP_ZUSTAND_PLANUNG, 0) 
        END as ZustandPlanung,
        ISNULL(kago_bk.KG_FARBE, -1) as OrderCategoryColor,
        kago_bk.KG_BEZEICHNUNG as OrderCategoryName,
        ISNULL(kago_pos.KG_FARBE, -1) as PositionCategoryColor,
        kago_pos.KG_BEZEICHNUNG as PositionCategoryName
      FROM [D4].[dbo].[tPPS_SKKALP_PLAN] p WITH (NOLOCK)
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] sk WITH (NOLOCK) ON sk.ID = p.PSPP_IDPSKP
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m WITH (NOLOCK) ON m.ID = sk.PSP_IDMS
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k WITH (NOLOCK) ON k.ID = sk.PSP_IDPSKKK
      INNER JOIN [D4].[dbo].[tbe_Belp] bp WITH (NOLOCK) ON bp.ID = k.PSK_IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk WITH (NOLOCK) ON bk.BK_BKBE_IDBEBK = bp.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au WITH (NOLOCK) ON au.BK_BKBE_AU_IDBKBE = bk.ID
      LEFT JOIN (SELECT AGBW_IDEKBK, MIN(ID) AS AGBW_MIN_ID FROM [D4].[dbo].[tAG_BEWE] WHERE AGBW_IDEKBK IS NOT NULL GROUP BY AGBW_IDEKBK) AS tAG_BEWE_BK_MIN ON tAG_BEWE_BK_MIN.AGBW_IDEKBK = bk.BK_BKBE_IDBEBK
      LEFT JOIN [D4].[dbo].[tAG_BEWE] agbw_bk WITH (NOLOCK) ON agbw_bk.ID = tAG_BEWE_BK_MIN.AGBW_MIN_ID
      LEFT JOIN [D4].[dbo].[tKAGO] kago_bk WITH (NOLOCK) ON kago_bk.ID = agbw_bk.AGBW_IDKAGO
      LEFT JOIN (SELECT AGBW_IDEKBP, MIN(ID) AS AGBW_MIN_ID FROM [D4].[dbo].[tAG_BEWE] WHERE AGBW_IDEKBP IS NOT NULL GROUP BY AGBW_IDEKBP) AS tAG_BEWE_POS_MIN ON tAG_BEWE_POS_MIN.AGBW_IDEKBP = bp.ID
      LEFT JOIN [D4].[dbo].[tAG_BEWE] agbw_pos WITH (NOLOCK) ON agbw_pos.ID = tAG_BEWE_POS_MIN.AGBW_MIN_ID
      LEFT JOIN [D4].[dbo].[tKAGO] kago_pos WITH (NOLOCK) ON kago_pos.ID = agbw_pos.AGBW_IDKAGO
      WHERE sk.PSP_PP_STATUS_PRODUKTION <> 4
        AND bk.BK_BKBE_STATUS_BEARBEITUNG = 0
        AND bk.BK_BKBE_TYP_BELEG = 2
        AND LTRIM(RTRIM(ISNULL(bk.BK_BKBE_NUMMER, ''))) <> '990001'
        AND p.PSPP_DATUM_START >= CAST('${startDateStr}' AS DATE)
        AND p.PSPP_DATUM_START <= CAST('${endDateStr}' AS DATE)
      ORDER BY p.PSPP_DATUM_START, bk.BK_BKBE_NUMMER, bp.BP_POSITION_NUMMER
    `);
    return res.recordset || [];
  } catch (err) {
    console.error('Error in fetchFastD4NativePlan:', err);
    return [];
  }
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config();
const { getPoolD4, getPoolWT, getPoolTL, getDbMode, setDbMode, sql } = require('./db');
const { extractNCPrograms, findMatches } = require('./matching');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// System state tracking cache warm-up
const systemState = {
  status: 'loading', // 'loading', 'ready', 'error'
  progress: 'Server gestartet. Warte auf Verbindung...',
  cachedItems: {
    toolLists: false,
    dashboard: false,
    standardization: false,
    demand: false,
    setup: false
  }
};

// Caches for the endpoints
let cachedToolLists = [];
let cachedDashboard = null;
let cachedStandardization = null;
let cachedDemand = null;
let cachedDemandSteps = null;
let cachedToolDetails = {};
let cachedSetupData = null;
let machineTimeEvaluationCache = {};
let activeEvaluationDateRanges = new Set();
let cacheWarmingPromise = null;
let cachedMachines = [];
const activeScenarios = {}; // machineName -> { unloadPrograms, loadPrograms }

async function fetchActiveStepsAndMaterials(poolD4) {
  const sqlPath = path.join(__dirname, '..', 'KV_test.sql');
  console.log(`Loading KV_test.sql from ${sqlPath}...`);
  let kvSql = fs.readFileSync(sqlPath, 'utf8');
  
  // Clean it up
  kvSql = kvSql.replace(/\bgo\b/gi, '');

  // Split at the CTE definition closing parenthesis before SELECT ID,
  const selectStartMatch = kvSql.match(/\)\s+SELECT\s+ID\s*,\s*IDBEBP\s*,/i);
  if (!selectStartMatch) {
    throw new Error('Could not find the end of CTE in KV_test.sql');
  }

  const selectStartIndex = selectStartMatch.index;
  const ctePart = kvSql.substring(0, selectStartIndex + 1); // include the closing parenthesis ')'
  const selectPartAndSuffix = kvSql.substring(selectStartIndex + 1);

  const whereIdx = selectPartAndSuffix.lastIndexOf('WHERE ISNULL(IDBEBP, 0) <> 0');
  if (whereIdx === -1) {
    throw new Error('Could not find WHERE clause in select part');
  }

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
      (
        SELECT ISNULL(SUM(
          CASE
            WHEN zbw.ZBUBW_DATUM_ZEIT_START IS NOT NULL AND zbw.ZBUBW_DATUM_ZEIT_START <> '1900-01-01' THEN
              CASE 
                WHEN zbw.ZBUBW_DATUM_ZEIT_STOP IS NOT NULL AND zbw.ZBUBW_DATUM_ZEIT_STOP <> '1900-01-01' THEN
                  CASE
                    WHEN zbw.ZBUBW_TYP_PRODUKTION = 1 THEN
                      ROUND(CAST(DATEDIFF(second, zbw.ZBUBW_DATUM_ZEIT_START, zbw.ZBUBW_DATUM_ZEIT_STOP) AS FLOAT) / 60, 4)
                    ELSE
                      ROUND(CAST(DATEDIFF(minute, zbw.ZBUBW_DATUM_ZEIT_START, zbw.ZBUBW_DATUM_ZEIT_STOP) AS FLOAT), 4)
                  END
                ELSE
                  CASE
                    WHEN zbw.ZBUBW_TYP_PRODUKTION = 1 THEN
                      ROUND(CAST(DATEDIFF(second, zbw.ZBUBW_DATUM_ZEIT_START, GETDATE()) AS FLOAT) / 60, 4)
                    ELSE
                      ROUND(CAST(DATEDIFF(minute, zbw.ZBUBW_DATUM_ZEIT_START, GETDATE()) AS FLOAT), 4)
                  END
              END
            ELSE 0
          END
        ), 0)
        FROM [D4].[dbo].[tZE_BUCH] zb
        LEFT JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
        WHERE zb.ZBU_IDPSKP = OuterTemp.ID
      ) as BookedTime,
      p.PSP_IDMS as MachineId,
      (
        SELECT TOP 1 zb.ZBU_IDMS
        FROM [D4].[dbo].[tZE_BUCH] zb
        WHERE zb.ZBU_IDPSKP = OuterTemp.ID
          AND zb.ZBU_IDMS IS NOT NULL
        ORDER BY zb.ID DESC
      ) as BookedMachineId,
      p.PSP_IDMP as MachinePoolId,
      p.PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG as MaxProdTag,
      ISNULL(p.PSP_ZEIT_UEBERLAPPUNG_PROZENT, 0) as UeberlappungProzent,
      p.PSP_MENGE_SOLL as Quantity,
      p.PSP_PP_STATUS_PRODUKTION as StatusProduction,
      ISNULL(p.PSP_TYP_SPERRE, 0) as TypSperre,
      ISNULL(p.PSP_TYP_SPERRE_WEITERVERARBEITUNG, 0) as SperreWeiter,
      CASE
        WHEN b.BP_PP_DATUM_TERMIN IS NOT NULL THEN b.BP_PP_DATUM_TERMIN
        ELSE
          CASE
            WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM
            ELSE au.BK_BKBE_AU_LI_DATUM
          END
      END as DeliveryDate,
      (
        SELECT TOP 1 
          CASE 
            WHEN ekp.BP_LI_DATUM IS NOT NULL THEN ekp.BP_LI_DATUM 
            ELSE ekb.BK_BKBE_BE_LI_DATUM 
          END
        FROM [D4].[dbo].[tSK_KALP_BEST] kb
        INNER JOIN [D4].[dbo].[tEK_BELP] ekp ON ekp.ID = kb.KP_BEST_IDEKBP_BEST
        INNER JOIN [D4].[dbo].[tEK_BELK] ek ON ek.ID = ekp.BP_IDEKBK AND ek.BK_TYP_BELEG = 2
        INNER JOIN [D4].[dbo].[tEK_BELK_BKBE] ekbk ON ekbk.BK_BKBE_IDEKBK = ekp.BP_IDEKBK
        INNER JOIN [D4].[dbo].[tEK_BELK_BKBE_BE] ekb ON ekb.BK_BKBE_BE_IDBKEK = ekbk.ID
        WHERE kb.KP_BEST_IDSKKP = OuterTemp.ID
          AND kb.KP_BEST_TYP <> 2
          AND ekp.BP_POSITION_TYP = 0
          AND (ekp.BP_LI_DATUM IS NOT NULL OR ekb.BK_BKBE_BE_LI_DATUM IS NOT NULL)
        ORDER BY kb.ID DESC
      ) as PoDeliveryDate,
      CASE
        WHEN OuterTemp.PSP_TYP_HERKUNFT = 0 THEN
          (
            SELECT MIN(PSPP_DATUM_START)
            FROM tPPS_SKKALP_PLAN
            WHERE tPPS_SKKALP_PLAN.PSPP_IDPSKP = OuterTemp.ID
              AND tPPS_SKKALP_PLAN.PSPP_STATUS_PLANUNG <> 1
          )
        ELSE
          (
            SELECT MIN(PSPP_DATUM_START)
            FROM tPPS_SKKALP_PLAN
            WHERE tPPS_SKKALP_PLAN.PSPP_IDSKKP = OuterTemp.ID
              AND tPPS_SKKALP_PLAN.PSPP_STATUS_PLANUNG <> 1
          )
      END as StartDate,
      CASE
        WHEN OuterTemp.PSP_TYP_HERKUNFT = 0 THEN
          (
            SELECT COUNT(DISTINCT CAST(PSPP_DATUM_START AS DATE))
            FROM tPPS_SKKALP_PLAN
            WHERE tPPS_SKKALP_PLAN.PSPP_IDPSKP = OuterTemp.ID
              AND tPPS_SKKALP_PLAN.PSPP_STATUS_PLANUNG <> 1
          )
        ELSE
          (
            SELECT COUNT(DISTINCT CAST(PSPP_DATUM_START AS DATE))
            FROM tPPS_SKKALP_PLAN
            WHERE tPPS_SKKALP_PLAN.PSPP_IDSKKP = OuterTemp.ID
              AND tPPS_SKKALP_PLAN.PSPP_STATUS_PLANUNG <> 1
          )
      END as PlannedDays,
      (
        SELECT COUNT(DISTINCT CAST(zbw.ZBUBW_DATUM_ZEIT_START AS DATE))
        FROM [D4].[dbo].[tZE_BUCH] zb
        LEFT JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
        WHERE zb.ZBU_IDPSKP = OuterTemp.ID
          AND zbw.ZBUBW_DATUM_ZEIT_START IS NOT NULL
          AND zbw.ZBUBW_DATUM_ZEIT_START <> '1900-01-01'
      ) as UsedDays,
      (
        SELECT ISNULL(MAX(zb.ZBU_MENGE_IST), 0)
        FROM [D4].[dbo].[tZE_BUCH] zb
        WHERE zb.ZBU_IDPSKP = OuterTemp.ID
      ) as BookedQty,
      bk.BK_BKBE_NUMMER as ContractNumber,
      bk.BK_BKBE_TYP_BELEG_ART as BelegArt,
      CASE WHEN ISNULL(au.BK_BKBE_AU_PP_ZUSTAND_PLANUNG, 0) > 0 
           THEN au.BK_BKBE_AU_PP_ZUSTAND_PLANUNG - 1 
           ELSE ISNULL(b.BP_PP_ZUSTAND_PLANUNG, 0) 
      END as ZustandPlanung,
      ISNULL(kago_bk.KG_FARBE, -1) as OrderCategoryColor,
      kago_bk.KG_BEZEICHNUNG as OrderCategoryName,
      ISNULL(kago_pos.KG_FARBE, -1) as PositionCategoryColor,
      kago_pos.KG_BEZEICHNUNG as PositionCategoryName
    FROM (
      ${selectPart}
    ) AS OuterTemp
    INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
    INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
    LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
    LEFT JOIN (SELECT AGBW_IDEKBK, MIN(ID) AS AGBW_MIN_ID FROM [D4].[dbo].[tAG_BEWE] WHERE AGBW_IDEKBK IS NOT NULL GROUP BY AGBW_IDEKBK) AS tAG_BEWE_BK_MIN ON tAG_BEWE_BK_MIN.AGBW_IDEKBK = bk.BK_BKBE_IDBEBK
    LEFT JOIN [D4].[dbo].[tAG_BEWE] agbw_bk ON agbw_bk.ID = tAG_BEWE_BK_MIN.AGBW_MIN_ID
    LEFT JOIN [D4].[dbo].[tKAGO] kago_bk ON kago_bk.ID = agbw_bk.AGBW_IDKAGO
    LEFT JOIN (SELECT AGBW_IDEKBP, MIN(ID) AS AGBW_MIN_ID FROM [D4].[dbo].[tAG_BEWE] WHERE AGBW_IDEKBP IS NOT NULL GROUP BY AGBW_IDEKBP) AS tAG_BEWE_POS_MIN ON tAG_BEWE_POS_MIN.AGBW_IDEKBP = b.ID
    LEFT JOIN [D4].[dbo].[tAG_BEWE] agbw_pos ON agbw_pos.ID = tAG_BEWE_POS_MIN.AGBW_MIN_ID
    LEFT JOIN [D4].[dbo].[tKAGO] kago_pos ON kago_pos.ID = agbw_pos.AGBW_IDKAGO
    LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
    WHERE bk.BK_BKBE_STATUS_BEARBEITUNG = 0 
      AND bk.BK_BKBE_TYP_BELEG = 2
      AND LTRIM(RTRIM(ISNULL(bk.BK_BKBE_NUMMER, ''))) <> '990001'
      AND ISNULL(OuterTemp.IDBEBP, 0) <> 990001
  `;

  console.log('Executing database query for active steps/materials...');
  const req = poolD4.request();
  req.timeout = 180000;
  const result = await req.query(finalSql);
  return result.recordset;
}

// Warm-up functions
async function loadToolListsCache() {
  const poolWT = await getPoolWT();
  systemState.progress = '1. WinTool: Lade Werkzeuglisten...';
  console.log('Loading ToolLists from WinTool database into cache...');
  const result = await poolWT.request().query(
    'SELECT Nr, Ident, NCP, Descript, MachineNr FROM [WTDATA].[dbo].[ToolLists]'
  );
  cachedToolLists = result.recordset;
  systemState.progress = `1. WinTool: ${cachedToolLists.length} Werkzeuglisten geladen.`;
  console.log(`Successfully cached ${cachedToolLists.length} ToolLists.`);
}

async function cacheDashboardSummary() {
  const poolD4 = await getPoolD4();
  const poolWT = await getPoolWT();

  console.log('Caching dashboard summary...');
  const artResult = await poolD4.request().query('SELECT COUNT(*) as count FROM [D4].[dbo].[tARST] WHERE AR_ART = 0 AND AR_TYP = 1');
  const orderResult = await poolD4.request().query('SELECT COUNT(*) as count FROM [D4].[dbo].[tbe_Belp]');
  
  const setupResult = await poolD4.request().query(`
    SELECT SUM(p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL) as totalSetup
    FROM [D4].[dbo].[tbe_Belp] b
    INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.PSK_IDBEBP = b.ID
    INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
    WHERE p.PSP_TYP_POSITION = 0
  `);

  const toolResult = await poolWT.request().query('SELECT COUNT(*) as count FROM [WTDATA].[dbo].[Tools]');
  const partsResult = await poolWT.request().query('SELECT COUNT(*) as count FROM [WTDATA].[dbo].[Parts]');

  cachedDashboard = {
    totalArticles: artResult.recordset[0].count,
    totalOrders: orderResult.recordset[0].count,
    totalToolLists: cachedToolLists.length || 0,
    totalTools: toolResult.recordset[0].count,
    totalParts: partsResult.recordset[0].count,
    totalSetupHours: Math.round((setupResult.recordset[0].totalSetup || 0) / 60)
  };
  console.log('Dashboard summary cached.');
}

async function cacheStandardization() {
  const poolWT = await getPoolWT();
  console.log('Caching tool standardization clusters...');
  const result = await poolWT.request().query(`
    SELECT
      t.Nr as ToolNr, 
      t.Descript as ToolDesc, 
      t.KeyWord as ToolKeyWord,
      ISNULL(t.Ds, 0) as ToolDia, 
      ISNULL(t.CLength, 0) as ToolCutLength,
      COUNT(DISTINCT tl.ToolListNr) as ListCount
    FROM [WTDATA].[dbo].[Tools] t
    INNER JOIN [WTDATA].[dbo].[ToolList] tl ON tl.ToolNr = t.Nr
    GROUP BY t.Nr, t.Descript, t.KeyWord, t.Ds, t.CLength
    ORDER BY ListCount DESC
  `);

  const tools = result.recordset;
  const grouped = {};
  tools.forEach(tool => {
    const kw = (tool.ToolKeyWord || 'Unbekannt').trim();
    const dia = tool.ToolDia;
    const key = `${kw} Ø ${dia}`;
    if (!grouped[key]) {
      grouped[key] = {
        keyword: kw,
        diameter: dia,
        totalUsage: 0,
        uniqueToolsCount: 0,
        items: []
      };
    }
    grouped[key].items.push(tool);
    grouped[key].totalUsage += tool.ListCount;
    grouped[key].uniqueToolsCount++;
  });

  cachedStandardization = {
    totalUniqueToolsUsed: tools.length,
    groupsCount: Object.values(grouped).filter(g => g.uniqueToolsCount > 1).length,
    groups: Object.values(grouped)
      .filter(g => g.uniqueToolsCount > 1)
      .sort((a, b) => b.totalUsage - a.totalUsage)
  };
  console.log('Tool standardization clusters cached.');
}

async function cacheDemand() {
  const poolD4 = await getPoolD4();
  const poolWT = await getPoolWT();

  console.log('Caching phased tool demand timeline...');
  const rows = await fetchActiveStepsAndMaterials(poolD4);

  const steps = rows.filter(step => 
    step.TypHerkunft === 0 &&
    step.StepTyp === 0 &&
    step.SPKO !== 4 &&
    ((step.MachineId !== null && step.MachineId !== 0) || (step.MachinePoolId !== null && step.MachinePoolId !== 0))
  );

  const mappingResult = await poolWT.request().query(`
    SELECT ToolListNr, ToolNr, ToolQuantity
    FROM [WTDATA].[dbo].[ToolList]
    WHERE ToolNr IS NOT NULL
  `);
  
  const listToToolsMap = {};
  mappingResult.recordset.forEach(row => {
    if (!listToToolsMap[row.ToolListNr]) {
      listToToolsMap[row.ToolListNr] = [];
    }
    listToToolsMap[row.ToolListNr].push({
      toolNr: row.ToolNr,
      qty: row.ToolQuantity || 1
    });
  });

  const toolsDetailResult = await poolWT.request().query(`
    SELECT Nr, Descript, KeyWord, Ds, CLength
    FROM [WTDATA].[dbo].[Tools]
  `);
  
  const toolDetails = {};
  toolsDetailResult.recordset.forEach(t => {
    toolDetails[t.Nr] = {
      nr: t.Nr,
      desc: t.Descript,
      keyword: t.KeyWord,
      dia: t.Ds,
      len: t.CLength
    };
  });

  const matchCache = {};
  const tempSteps = [];
  steps.forEach(step => {
    const targetDate = step.StartDate || step.DeliveryDate;
    if (!targetDate) return;
    const dateStr = new Date(targetDate).toISOString().substring(0, 10);
    const progs = extractNCPrograms(step.StepDesc);
    const stepTools = [];

    progs.forEach(prog => {
      if (matchCache[prog] === undefined) {
        const matches = findMatches(prog, cachedToolLists, 0.7);
        if (matches.length > 0) {
          matchCache[prog] = {
            Nr: matches[0].Nr
          };
        } else {
          matchCache[prog] = null;
        }
      }

      const match = matchCache[prog];
      if (match) {
        const listTools = listToToolsMap[match.Nr] || [];
        listTools.forEach(lt => {
          stepTools.push({
            toolNr: lt.toolNr,
            qty: lt.qty * (step.Quantity || 1)
          });
        });
      }
    });

    if (stepTools.length > 0) {
      tempSteps.push({
        date: dateStr,
        machineId: step.MachineId,
        machinePoolId: step.MachinePoolId,
        tools: stepTools
      });
    }
  });

  cachedDemandSteps = tempSteps;
  cachedToolDetails = toolDetails;
  cachedDemand = true; // Flag compatibility for UI startup dashboard checks
  console.log('Tool demand timeline cached.');
}

function getToollistMachineId(d4MachineId, d4PoolId) {
  // D4 Machine IDs: 5 -> RS2_1, 6 -> RS2_2, 4 -> C40, 25 -> C42, 21 -> Chiron, 2 -> C400
  // Toollist DB Machine IDs: 3 -> RS1 (RS2_1), 4 -> RS2 (RS2_2), 1 -> C40, 6 -> C42, 5 -> Chiron, 2 -> C400
  if (d4MachineId === 5) return 3;
  if (d4MachineId === 6) return 4;
  if (d4MachineId === 4) return 1;
  if (d4MachineId === 25) return 6;
  if (d4MachineId === 21) return 5;
  if (d4MachineId === 2) return 2;
  
  // D4 Pool IDs: 9 -> RS2, 12 -> Kapazität RS2, 13 -> Kapazität C40-C42
  if (d4PoolId === 9 || d4PoolId === 12) return [3, 4];
  if (d4PoolId === 13) return [1, 6];
  
  return null;
}

async function cacheSetupData() {
  if (cacheWarmingPromise) {
    return cacheWarmingPromise;
  }

  cacheWarmingPromise = (async () => {
    const poolD4 = await getPoolD4();
    const poolWT = await getPoolWT();
    const poolTL = await getPoolTL();

    console.log('Caching steps, tools, and night-run bookings in parallel...');
    const [rows, mappingResult, toolsDetailResult, nightBookingsResult, activeProgsResult, toolLocationsResult, histAvgDaysResult] = await Promise.all([
      fetchActiveStepsAndMaterials(poolD4),
      poolWT.request().query('SELECT ToolListNr, ToolNr FROM [WTDATA].[dbo].[ToolList] WHERE ToolNr IS NOT NULL'),
      poolWT.request().query('SELECT Nr, Design, Descript, KeyWord, Ds, CLength FROM [WTDATA].[dbo].[Tools]'),
      poolD4.request().query(`
        WITH MovementNightBookings AS (
          SELECT 
            b.BP_IDAR as ArticleId, 
            p.PSP_POSITION_NUMMER as StepPos, 
            CASE WHEN DATEPART(hour, zbb.ZBUBW_DATUM_ZEIT_START) >= 17 
                   OR DATEPART(hour, zbb.ZBUBW_DATUM_ZEIT_START) < 6 
                 THEN 'NIGHT' ELSE 'DAY' END as ShiftType, 
            CAST(CASE WHEN DATEPART(hour, zbb.ZBUBW_DATUM_ZEIT_START) < 6 
                      THEN DATEADD(day, -1, zbb.ZBUBW_DATUM_ZEIT_START) 
                      ELSE zbb.ZBUBW_DATUM_ZEIT_START END AS DATE) as ShiftDate
          FROM [D4].[dbo].[tZE_BUCH] zb 
          INNER JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbb ON zbb.ZBUBW_IDZBU = zb.ID 
          INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = zb.ZBU_IDBEBP 
          INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = zb.ZBU_IDPSKP 
          WHERE zbb.ZBUBW_DATUM_ZEIT_START >= '2020-01-01' 
        ),
        ShiftDateSummary AS (
          SELECT 
            ArticleId,
            StepPos,
            ShiftType,
            ShiftDate,
            COUNT(*) as ShiftStampsCount
          FROM MovementNightBookings
          GROUP BY ArticleId, StepPos, ShiftType, ShiftDate
        )
        SELECT 
          ArticleId, 
          StepPos, 
          SUM(CASE WHEN ShiftType = 'NIGHT' THEN ShiftStampsCount ELSE 0 END) as NightBookings, 
          MAX(CASE WHEN ShiftType = 'NIGHT' THEN ShiftStampsCount ELSE 0 END) as MaxNightQty, 
          MAX(CASE WHEN ShiftType = 'DAY' THEN ShiftStampsCount ELSE 0 END) as MaxDayQty 
        FROM ShiftDateSummary 
        GROUP BY ArticleId, StepPos
      `),
      poolTL.request().query('SELECT Machine, ProgramName FROM MachineToProgram WHERE ProgramName IS NOT NULL'),
      poolTL.request().query('SELECT mtp.Machine, ptt.ToolName FROM ProgramToTool ptt INNER JOIN MachineToProgram mtp ON ptt.MachineToProgramId = mtp.Id WHERE ptt.ToolName IS NOT NULL'),
      poolD4.request().query(`
        SELECT 
          b.BP_IDAR as ArticleId,
          p.PSP_POSITION_NUMMER as StepPos,
          AVG(CAST(StepDays.UsedDays AS FLOAT)) as AvgHistoricalDays
        FROM [D4].[dbo].[tPPS_SKKALP] p
        JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
        JOIN [D4].[dbo].[tbe_Belp] b ON k.PSK_IDBEBP = b.ID
        CROSS APPLY (
          SELECT COUNT(DISTINCT CAST(zbw.ZBUBW_DATUM_ZEIT_START AS DATE)) as UsedDays
          FROM [D4].[dbo].[tZE_BUCH] zb
          JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
          WHERE zb.ZBU_IDPSKP = p.ID AND zbw.ZBUBW_DATUM_ZEIT_START >= DATEADD(year, -2, GETDATE())
        ) StepDays
        WHERE StepDays.UsedDays > 0
        GROUP BY b.BP_IDAR, p.PSP_POSITION_NUMMER
      `)
    ]);

    let fixtureLocationsResult = { recordset: [] };
    try {
      fixtureLocationsResult = await poolD4.request().query(`
        SELECT DISTINCT CAST(p.PSP_BEZEICHNUNG AS VARCHAR(8000)) as StepDesc, k.KK_LAGERORT as Lagerort
        FROM [D4].[dbo].[tPPS_SKKALP] p
        INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
        WHERE p.PSP_BEZEICHNUNG LIKE '%vorrichtung%' OR p.PSP_BEZEICHNUNG LIKE '%spannmittel%'
      `);
    } catch (e) {
      console.warn('[DB Warning] Could not load fixture locations from D4 (likely missing KK_LAGERORT in dev environment):', e.message);
    }

    const machineActivePrograms = {};
    activeProgsResult.recordset.forEach(r => {
      if (!machineActivePrograms[r.Machine]) {
        machineActivePrograms[r.Machine] = [];
      }
      machineActivePrograms[r.Machine].push(r.ProgramName.trim().toLowerCase());
    });

    const fixtureLocationMap = {};
    fixtureLocationsResult.recordset.forEach(row => {
      const desc = row.StepDesc;
      const loc = row.Lagerort;
      if (desc && loc) {
        const fixture = extractFixture(desc);
        if (fixture) {
          fixtureLocationMap[fixture.trim().toLowerCase()] = loc.trim();
        }
      }
    });

    const listToToolsMap = {};
    const toolUsageCounts = {};
    mappingResult.recordset.forEach(row => {
      if (!listToToolsMap[row.ToolListNr]) {
        listToToolsMap[row.ToolListNr] = [];
      }
      listToToolsMap[row.ToolListNr].push(row.ToolNr);
      toolUsageCounts[row.ToolNr] = (toolUsageCounts[row.ToolNr] || 0) + 1;
    });

    const toolsDetails = {};
    const identToNrMap = {};
    toolsDetailResult.recordset.forEach(t => {
      const nr = t.Nr;
      const ident = (t.Design || '').trim().toLowerCase();
      if (ident) {
        identToNrMap[ident] = nr;
      }
      toolsDetails[t.Nr] = {
        nr: t.Nr,
        ident: t.Design,
        desc: t.Descript,
        keyword: t.KeyWord,
        dia: t.Ds,
        len: t.CLength
      };
    });

    const nightStepsMap = new Map();
    nightBookingsResult.recordset.forEach(row => {
      const cleanPos = String(row.StepPos || '').trim();
      nightStepsMap.set(row.ArticleId + '-' + cleanPos, {
        isNightCapable: (row.NightBookings || 0) >= 3,
        MaxNightQty: row.MaxNightQty || 0,
        MaxDayQty: row.MaxDayQty || 0
      });
    });

    const histAvgDaysMap = {};
    if (histAvgDaysResult && histAvgDaysResult.recordset) {
      histAvgDaysResult.recordset.forEach(row => {
        if (row.ArticleId && row.StepPos && row.AvgHistoricalDays > 0) {
          const cleanPos = String(row.StepPos).trim();
          histAvgDaysMap[row.ArticleId + '_' + cleanPos] = Math.round(row.AvgHistoricalDays);
        }
      });
    }

    // Group steps by OrderId to resolve predecessors correctly within each order
    const ordersMap = {};
    rows.forEach(row => {
      const cNrStr = String(row.ContractNumber || '').trim();
      const oIdStr = String(row.OrderId || '').trim();
      if (cNrStr === '990001' || oIdStr === '990001' || cNrStr.includes('990001')) return;
      
      const upperContract = cNrStr.toUpperCase();
      const rawBelegArt = row.BelegArt !== undefined ? parseInt(row.BelegArt, 10) : 0;

      // EXACT D4 ZUSTAND_PLANUNG IDENTIFICATION:
      // ZustandPlanung = 0 -> Freigegeben
      // ZustandPlanung = 1 -> Vorgemerkt
      const rawZustand = row.ZustandPlanung !== undefined ? parseInt(row.ZustandPlanung, 10) : 0;
      const isReleased = (rawZustand === 0);

      row.zustandPlanung = rawZustand;
      row.belegArt = isReleased ? 1 : 0;
      row.isFreigegeben = isReleased;
      if (row.BookedMachineId) {
        row.MachineId = row.BookedMachineId;
      }
      const cleanStepPos = String(row.StepPos || '').trim();
      const nightInfo = nightStepsMap.get(row.ArticleId + '-' + cleanStepPos);
      row.isNightRunCapable = !!(nightInfo && nightInfo.isNightCapable);
      row.MaxNightQty = nightInfo ? Math.min(nightInfo.MaxNightQty, row.OrderQuantity || 999999) : 0;
      row.MaxDayQty = nightInfo ? Math.min(nightInfo.MaxDayQty, row.OrderQuantity || 999999) : (row.OrderQuantity || 0);
      
      row.OrderPlanDays = row.PlannedDays || 1;
      const histAvgDays = histAvgDaysMap[row.ArticleId + '_' + cleanStepPos];
      if (histAvgDays && histAvgDays > 0) {
        row.PlannedDays = histAvgDays;
        row.HistAvgDays = histAvgDays;
      } else {
        row.HistAvgDays = row.OrderPlanDays;
      }

      row.originalSetupTime = row.SetupTime || 0;
      row.originalProdTime = row.ProdTime || 0;
      
      // Calculate remaining production and setup time if work step already started
      if (row.BookedTime && row.BookedTime > 0) {
        const totalSoll = (row.SetupTime || 0) + (row.ProdTime || 0);
        const remaining = Math.max(0, totalSoll - row.BookedTime);
        row.SetupTime = 0; // Setup is already completed if we have booked time on this operation
        row.prodTime = remaining;
      } else {
        row.prodTime = row.ProdTime || 0;
      }
      row.setupTime = row.SetupTime || 0;
      row.scheduledMin = (row.setupTime || 0) + (row.prodTime || 0);

      if (!ordersMap[row.OrderId]) {
        ordersMap[row.OrderId] = [];
      }
      ordersMap[row.OrderId].push(row);
    });

    // Sort and resolve feasibility status for each step in each order
    Object.keys(ordersMap).forEach(orderId => {
      const stepsGroup = ordersMap[orderId];
      stepsGroup.sort((a, b) => {
        const posA = parseInt(a.StepPos || 0, 10);
        const posB = parseInt(b.StepPos || 0, 10);
        return posA - posB;
      });

      // Determine real status SPKO for each step in order
      stepsGroup.forEach((s, idx) => {
        // User rule: Step is completed via successor progress ONLY IF reported quantity (MengeIst / BookedQty) is equal to or greater than target quantity (MengeSoll / OrderQuantity)!
        const targetQty = s.OrderQuantity || 0;
        const bookedQty = s.BookedQty || 0;
        const isQtyMet = targetQty > 0 ? (bookedQty >= targetQty) : false;

        const hasStartedSuccessor = stepsGroup.slice(idx + 1).some(succ => 
          (succ.StatusProduction && succ.StatusProduction >= 1) || (succ.BookedTime && succ.BookedTime > 0) || succ.SPKO === 4
        );

        if (s.StatusProduction === 4 || s.SPKO === 4 || (hasStartedSuccessor && isQtyMet) || (targetQty > 0 && bookedQty >= targetQty)) {
          s.realSPKO = 4; // Completed
          s.SPKO = 4;
        } else if (s.BookedTime && s.BookedTime > 0) {
          s.realSPKO = 2; // In Progress
        } else {
          s.realSPKO = 1; // Open / Planned
        }
      });

      stepsGroup.forEach((step, idx) => {
        // If self is in progress (2), status is Green (can continue running)
        if (step.realSPKO === 2) {
          step.color = 'Green';
          return;
        }

        const normPos = (p) => {
          if (p === null || p === undefined) return null;
          const cleaned = String(p).replace(/[^0-9]/g, '');
          return cleaned ? parseInt(cleaned, 10) : null;
        };

        const formatShortDesc = (desc) => {
          if (!desc) return '';
          let rawDesc = desc.replace(/\r/g, '').split('\n')[0].trim();
          if (/fräsen|fräs/i.test(rawDesc)) {
            const mMatch = rawDesc.match(/fräsen\s+([A-Za-z0-9_\-\/]+)/i);
            if (mMatch && mMatch[1] && mMatch[1].trim()) {
              return mMatch[1].trim();
            }
          }
          if (rawDesc.toLowerCase().includes('material')) return 'Material';
          if (rawDesc.toLowerCase().includes('fremdleistung')) return 'Fremdleistung';
          return rawDesc;
        };

        const isInspectionStep = (s) => {
          if (!s) return false;
          if (s.StepTyp === 3) return true;
          const d = (s.StepDesc || '').toLowerCase();
          return d.includes('eingangsprüfung') || d.includes('prüf') || d.includes('abnahme') || d.includes('kontrolle');
        };

        // Direct predecessor check (strict status evaluation against direct predecessor step)
        let predPos = null;
        let vgRaw = (step.VORGAENGER || '').trim();
        if (vgRaw.startsWith('|')) {
          vgRaw = vgRaw.replace('|', '').trim();
        }

        if (vgRaw === '') {
          if (idx > 0) {
            predPos = stepsGroup[idx - 1].StepPos;
          }
        } else {
          predPos = vgRaw;
        }

        let predStep = null;
        if (predPos !== null) {
          const targetNorm = normPos(predPos);
          predStep = stepsGroup.find(s => normPos(s.StepPos) === targetNorm && s.StepId !== step.StepId);
        }

        if (predStep) {
          step.predStepPos = predStep.StepPos;
          step.predSPKO = predStep.realSPKO;

          // If direct predecessor is an Eingangsprüfung or inspection step, check what comes before it (Material, Fremdleistung, etc.)
          if (isInspectionStep(predStep)) {
            let prevStep = null;
            let pVgRaw = (predStep.VORGAENGER || '').trim();
            if (pVgRaw.startsWith('|')) pVgRaw = pVgRaw.replace('|', '').trim();
            
            let pNormPos = null;
            if (pVgRaw === '') {
              const pIdx = stepsGroup.findIndex(s => s.StepId === predStep.StepId);
              if (pIdx > 0) pNormPos = normPos(stepsGroup[pIdx - 1].StepPos);
            } else {
              pNormPos = normPos(pVgRaw);
            }

            if (pNormPos !== null) {
              prevStep = stepsGroup.find(s => normPos(s.StepPos) === pNormPos && s.StepId !== predStep.StepId);
            }

            const formatDeDate = (dVal) => {
              if (!dVal) return '';
              const d = new Date(dVal);
              if (isNaN(d.getTime())) return '';
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const year = d.getFullYear();
              return `${day}.${month}.${year}`;
            };

            let poDate = (prevStep && prevStep.PoDeliveryDate) || (predStep && predStep.PoDeliveryDate) || step.PoDeliveryDate;
            let dateVal = poDate || (prevStep && prevStep.StartDate) || (predStep && predStep.StartDate) || (prevStep && prevStep.DeliveryDate) || (predStep && predStep.DeliveryDate) || step.StartDate || step.DeliveryDate;
            let dateStr = formatDeDate(dateVal);
            let dateSuffix = dateStr ? ` (${dateStr})` : '';

            if (prevStep) {
              const pDesc = (prevStep.StepDesc || '').toLowerCase();
              if (prevStep.StepTyp === 2 || prevStep.TypHerkunft === 2 || pDesc.includes('material') || parseInt(prevStep.StepPos, 10) <= 20) {
                step.predStepDesc = 'Material' + dateSuffix;
                step.predStepPos = prevStep.StepPos;
              } else if (prevStep.StepTyp === 1 || prevStep.TypHerkunft === 1 || pDesc.includes('fremdleistung') || pDesc.includes('härten') || pDesc.includes('anodisier') || pDesc.includes('galvanik')) {
                step.predStepDesc = 'Fremdleistung' + dateSuffix;
                step.predStepPos = prevStep.StepPos;
              } else {
                step.predStepDesc = formatShortDesc(prevStep.StepDesc);
                step.predStepPos = prevStep.StepPos;
              }
            } else {
              // Direct predecessor is Eingangsprüfung at start of order (e.g. Pos 020) -> Material arrival
              step.predStepDesc = 'Material' + dateSuffix;
            }
          } else {
            const formatDeDate = (dVal) => {
              if (!dVal) return '';
              const d = new Date(dVal);
              if (isNaN(d.getTime())) return '';
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const year = d.getFullYear();
              return `${day}.${month}.${year}`;
            };
            let poDate = predStep ? predStep.PoDeliveryDate : step.PoDeliveryDate;
            let dateVal = poDate || (predStep ? (predStep.StartDate || predStep.DeliveryDate) : (step.StartDate || step.DeliveryDate));
            let dateStr = formatDeDate(dateVal);
            let dateSuffix = dateStr ? ` (${dateStr})` : '';

            // Direct predecessor is not an inspection step (e.g. Sägen, Brother, Material, Fremdleistung)
            const dDesc = (predStep.StepDesc || '').toLowerCase();
            if (predStep.StepTyp === 2 || predStep.TypHerkunft === 2 || dDesc.includes('material')) {
              step.predStepDesc = 'Material' + dateSuffix;
            } else if (predStep.StepTyp === 1 || predStep.TypHerkunft === 1 || dDesc.includes('fremdleistung') || dDesc.includes('härten') || dDesc.includes('anodisier')) {
              const shortDesc = formatShortDesc(predStep.StepDesc) || 'Fremdleistung';
              step.predStepDesc = shortDesc + dateSuffix;
            } else {
              step.predStepDesc = formatShortDesc(predStep.StepDesc);
            }
          }
        }

        if (!predStep) {
          // First step or no predecessor -> Can start, so Green
          step.color = 'Green';
        } else {
          if (predStep.realSPKO === 2) {
            step.color = 'Yellow'; // Predecessor is running
          } else if (predStep.realSPKO === 1 || predStep.realSPKO === 0) {
            step.color = 'Red'; // Predecessor is open / not started
          } else if (predStep.realSPKO === 4) {
            step.color = 'Green'; // Predecessor is completed
          } else {
            step.color = 'Green';
          }
        }
      });
    });

    // Keep only normal work steps (StepTyp = 0) with valid setup time (> 0) and assigned to a machine or pool
    // Also filter out completed steps (SPKO === 4)
    const steps = rows.filter(step => {
      const cNrStr = String(step.ContractNumber || '').trim();
      const oIdStr = String(step.OrderId || '').trim();
      if (cNrStr === '990001' || oIdStr === '990001' || cNrStr.includes('990001')) return false;
      if (step.SPKO === 4) return false;
      if (step.TypHerkunft !== 0 || step.StepTyp !== 0) return false;

      const desc = (step.StepDesc || '').toLowerCase();
      const isDeburringAssembly = 
        step.MachineId === 15 || desc.includes('ur5') ||
        step.MachineId === 16 || desc.includes('laser') ||
        step.MachineId === 17 || desc.includes('messmaschine') || desc.includes('zeiss') || desc.includes('kmg') ||
        desc.includes('versand') || desc.includes('verpacken') || desc.includes('etikett') ||
        desc.includes('montage') || desc.includes('gewindeeinsatz') || desc.includes('zapfen brechen') ||
        desc.includes('prüf') || desc.includes('abnahme') || desc.includes('serienprüfung') || desc.includes('stempeln') ||
        desc.includes('entgrat');

      const isMachining = (step.SetupTime > 0 || step.SPKO === 2) &&
        ((step.MachineId !== null && step.MachineId !== 0) || (step.MachinePoolId !== null && step.MachinePoolId !== 0));

      return isDeburringAssembly || isMachining;
    });

    console.log('Loading article master routing template steps...');
    const masterStepsResult = await poolD4.request().query(`
      SELECT p.KP_IDAR as ArticleId, p.KP_POSITION_NUMMER as StepPos, CAST(p.KP_BEZEICHNUNG AS VARCHAR(8000)) as StepDesc
      FROM [D4].[dbo].[tSK_KALP] p
      INNER JOIN [D4].[dbo].[tSK_KALK] k ON p.KP_IDSKKK = k.ID
      WHERE (k.KK_IDBEBP IS NULL OR k.KK_IDBEBP = 0)
        AND p.KP_TYP_POSITION = 0
    `);
    
    const masterStepsMap = {};
    masterStepsResult.recordset.forEach(row => {
      if (row.ArticleId) {
        const key = row.ArticleId + '_' + (row.StepPos || '').trim();
        masterStepsMap[key] = row.StepDesc || '';
      }
    });
    console.log('Loaded ' + masterStepsResult.recordset.length + ' master template steps.');

    console.log('Matching NC programs for ' + steps.length + ' setup steps...');
    const matchCache = {};
    steps.forEach((step, idx) => {
      if (idx % 25 === 0) {
        systemState.progress = '5. Rüstzeitmodelle: Ordne NC-Programme zu (' + idx + ' / ' + steps.length + ' verarbeitet)...';
      }
      const progs = extractNCPrograms(step.StepDesc);
      if (progs.length > 0) {
        const prog = progs[0];
        step.NCProgram = prog;
        const cacheKey = prog + '_' + (step.MachineId || 'null') + '_' + (step.MachinePoolId || 'null');
        if (matchCache[cacheKey] === undefined) {
          const matches = findMatches(prog, cachedToolLists, 0.70);
          if (matches.length > 0) {
            const tlMachineIds = getToollistMachineId(step.MachineId, step.MachinePoolId);
            if (tlMachineIds && matches.length > 1) {
              const activeIds = Array.isArray(tlMachineIds) ? tlMachineIds : [tlMachineIds];
              matches.sort((a, b) => {
                const aActive = activeIds.some(mId => 
                  machineActivePrograms[mId] && 
                  (machineActivePrograms[mId].includes((a.Ident || '').trim().toLowerCase()) ||
                   machineActivePrograms[mId].includes((a.NCP || '').trim().toLowerCase()))
                );
                const bActive = activeIds.some(mId => 
                  machineActivePrograms[mId] && 
                  (machineActivePrograms[mId].includes((b.Ident || '').trim().toLowerCase()) ||
                   machineActivePrograms[mId].includes((b.NCP || '').trim().toLowerCase()))
                );
                if (aActive && !bActive) return -1;
                if (!aActive && bActive) return 1;
                
                // Taper fallback: RS machines prefer SK40, C40/C42 prefer HSK
                const isRS = activeIds.includes(3) || activeIds.includes(4);
                const isC4x = activeIds.includes(1) || activeIds.includes(6);
                
                const strA = ((a.Ident || '') + ' ' + (a.NCP || '')).toLowerCase();
                const strB = ((b.Ident || '') + ' ' + (b.NCP || '')).toLowerCase();

                if (isRS) {
                  const aHasSk40 = strA.includes('sk40');
                  const bHasSk40 = strB.includes('sk40');
                  if (aHasSk40 && !bHasSk40) return -1;
                  if (!aHasSk40 && bHasSk40) return 1;
                }

                if (isC4x) {
                  const aHasHsk = strA.includes('hsk');
                  const bHasHsk = strB.includes('hsk');
                  if (aHasHsk && !bHasHsk) return -1;
                  if (!aHasHsk && bHasHsk) return 1;
                }

                return b.score - a.score;
              });
            }
            matchCache[cacheKey] = {
              Nr: matches[0].Nr,
              Ident: matches[0].Ident,
              NCP: matches[0].NCP,
              matchType: matches[0].matchType,
              score: matches[0].score
            };
          } else {
            matchCache[cacheKey] = null;
          }
        }

        const match = matchCache[cacheKey];
        if (match) {
          step.MatchedListNr = match.Nr;
          step.MatchedListIdent = match.Ident;
          step.MatchedListNcp = match.NCP;
          step.MatchedType = match.matchType;
          step.MatchedScore = match.score;
        }
        step.fixture = extractFixture(step.StepDesc);
        const dbLoc = step.fixture ? fixtureLocationMap[step.fixture.trim().toLowerCase()] : null;
        step.fixtureLocation = dbLoc || (step.fixture ? extractLagerortFromDesc(step.StepDesc) : null);
        step.fixtureLocationFromDb = !!dbLoc;
      }

      const cleanPos = (step.StepPos || '').trim();
      const masterDesc = masterStepsMap[step.ArticleId + '_' + cleanPos];
      if (masterDesc) {
        const masterProgs = extractNCPrograms(masterDesc);
        if (masterProgs.length > 0) {
          const masterProg = masterProgs[0];
          step.masterNcProgram = masterProg;
          const masterMatches = findMatches(masterProg, cachedToolLists, 0.6);
          if (masterMatches.length > 0) {
            const tlMachineIds = getToollistMachineId(step.MachineId, step.MachinePoolId);
            if (tlMachineIds && masterMatches.length > 1) {
              const activeIds = Array.isArray(tlMachineIds) ? tlMachineIds : [tlMachineIds];
              masterMatches.sort((a, b) => {
                const aActive = activeIds.some(mId => 
                  machineActivePrograms[mId] && 
                  (machineActivePrograms[mId].includes((a.Ident || '').trim().toLowerCase()) ||
                   machineActivePrograms[mId].includes((a.NCP || '').trim().toLowerCase()))
                );
                const bActive = activeIds.some(mId => 
                  machineActivePrograms[mId] && 
                  (machineActivePrograms[mId].includes((b.Ident || '').trim().toLowerCase()) ||
                   machineActivePrograms[mId].includes((b.NCP || '').trim().toLowerCase()))
                );
                if (aActive && !bActive) return -1;
                if (!aActive && bActive) return 1;
                
                // Taper fallback: RS machines prefer SK40, C40/C42 prefer HSK
                const isRS = activeIds.includes(3) || activeIds.includes(4);
                const isC4x = activeIds.includes(1) || activeIds.includes(6);
                
                const strA = ((a.Ident || '') + ' ' + (a.NCP || '')).toLowerCase();
                const strB = ((b.Ident || '') + ' ' + (b.NCP || '')).toLowerCase();

                if (isRS) {
                  const aHasSk40 = strA.includes('sk40');
                  const bHasSk40 = strB.includes('sk40');
                  if (aHasSk40 && !bHasSk40) return -1;
                  if (!aHasSk40 && bHasSk40) return 1;
                }

                if (isC4x) {
                  const aHasHsk = strA.includes('hsk');
                  const bHasHsk = strB.includes('hsk');
                  if (aHasHsk && !bHasHsk) return -1;
                  if (!aHasHsk && bHasHsk) return 1;
                }

                return b.score - a.score;
              });
            }
            step.masterMatchedListNr = masterMatches[0].Nr;
            step.masterMatchedListIdent = masterMatches[0].Ident;
            step.masterMatchedListNcp = masterMatches[0].NCP;
            step.masterMatchedType = masterMatches[0].matchType;
            step.masterMatchedScore = masterMatches[0].score;
          } else {
            step.masterMatchedListNr = null;
            step.masterMatchedListIdent = null;
            step.masterMatchedListNcp = null;
            step.masterMatchedType = null;
            step.masterMatchedScore = null;
          }
        } else {
          step.masterNcProgram = null;
          step.masterMatchedListNr = null;
          step.masterMatchedListIdent = null;
          step.masterMatchedListNcp = null;
          step.masterMatchedType = null;
          step.masterMatchedScore = null;
        }
      } else {
        step.masterNcProgram = null;
        step.masterMatchedListNr = null;
        step.masterMatchedListIdent = null;
        step.masterMatchedListNcp = null;
        step.masterMatchedType = null;
        step.masterMatchedScore = null;
      }
    });
    console.log('NC program matching completed.');

    const listHeadersResult = await poolWT.request().query(`
      SELECT Nr, MachineNr
      FROM [WTDATA].[dbo].[ToolLists]
      WHERE MachineNr IS NOT NULL
    `);

    const listToMachineMap = {};
    listHeadersResult.recordset.forEach(row => {
      listToMachineMap[row.Nr] = row.MachineNr;
    });

    const toolMachineMap = {};
    const tlMachineNames = {
      1: 'C40',
      2: 'C400',
      3: 'RS2_1',
      4: 'RS2_2',
      5: 'Chiron',
      6: 'C42'
    };
    if (toolLocationsResult && toolLocationsResult.recordset) {
      toolLocationsResult.recordset.forEach(r => {
        const toolIdent = (r.ToolName || '').trim().toLowerCase();
        const toolNr = identToNrMap[toolIdent];
        const machId = r.Machine;
        const machName = tlMachineNames[machId];
        if (machName && toolNr) {
          if (!toolMachineMap[toolNr]) {
            toolMachineMap[toolNr] = [];
          }
          if (!toolMachineMap[toolNr].includes(machName)) {
            toolMachineMap[toolNr].push(machName);
          }
        }
      });
    }

    cachedSetupData = {
      steps,
      listToToolsMap,
      toolUsageCounts,
      toolsDetails,
      listToMachineMap,
      fixtureLocationMap,
      toolMachineMap
    };
    console.log('Setup reduction base data cached.');
  })();

  try {
    await cacheWarmingPromise;
  } finally {
    cacheWarmingPromise = null;
  }
}
function getMagazineSize(number, name) {
  const code = ((number || '') + ' ' + (name || '')).toUpperCase();
  if (code.includes('C400')) return 37;
  if (code.includes('C42')) return 258;
  if (code.includes('C40')) return 121;
  if (code.includes('RS1')) return 121;
  if (code.includes('RS2')) return 121;
  if (code.includes('CHIRON')) return 48;
  return null;
}

async function cacheMachines() {
  const poolD4 = await getPoolD4();
  console.log('Loading Machine Pools from D4 database into cache...');
  const poolResult = await poolD4.request().query(
    'SELECT ID, MP_NUMMER, MP_BEZEICHNUNG FROM [D4].[dbo].[tPPS_MASCHPOOL] ORDER BY MP_BEZEICHNUNG'
  );
  console.log('Loading Machines from D4 database into cache...');
  const mastaResult = await poolD4.request().query(
    'SELECT ID, MS_NUMMER, MS_BEZEICHNUNG FROM [D4].[dbo].[tPPS_MASTA] ORDER BY MS_BEZEICHNUNG'
  );

  const combined = [];
  poolResult.recordset.forEach(p => {
    const num = p.MP_NUMMER ? p.MP_NUMMER.trim() : `Pool #${p.ID}`;
    const name = p.MP_BEZEICHNUNG ? p.MP_BEZEICHNUNG.trim() : '';
    combined.push({
      id: `pool_${p.ID}`,
      type: 'pool',
      dbId: parseInt(p.ID),
      number: num,
      name: name,
      magazineSize: getMagazineSize(num, name)
    });
  });

  mastaResult.recordset.forEach(m => {
    const num = m.MS_NUMMER ? m.MS_NUMMER.trim() : `Machine #${m.ID}`;
    const name = m.MS_BEZEICHNUNG ? m.MS_BEZEICHNUNG.trim() : '';
    combined.push({
      id: `machine_${m.ID}`,
      type: 'machine',
      dbId: parseInt(m.ID),
      number: num,
      name: name,
      magazineSize: getMagazineSize(num, name)
    });
  });

  cachedMachines = combined;
  console.log(`Successfully cached ${cachedMachines.length} D4 machines & pools.`);
}

// Background startup cache warm-up worker
async function warmupAllCaches() {
  try {
    systemState.progress = '1. Verbinde mit WinTool & Lade Werkzeuglisten...';
    await loadToolListsCache();
    await cacheMachines();
    systemState.cachedItems.toolLists = true;

    systemState.progress = '2. Verbinde mit ERP & Lade Dashboard-Kennzahlen...';
    await cacheDashboardSummary();
    systemState.cachedItems.dashboard = true;

    systemState.progress = '3. Analysiere Werkzeug-Standardisierungspotentiale...';
    await cacheStandardization();
    systemState.cachedItems.standardization = true;

    systemState.progress = '4. Berechne phasenbezogene Bedarfstermine...';
    await cacheDemand();
    systemState.cachedItems.demand = true;

    systemState.progress = '5. Berechne Rüstzeitmodelle & Werkzeug-Häufigkeiten...';
    await cacheSetupData();
    systemState.cachedItems.setup = true;

    systemState.progress = '6. Berechne Zeitauswertung-Cache (Maschinenzeiten)...';
    await refreshMachineTimeEvaluationCache();
    systemState.cachedItems.timeEvaluation = true;

    systemState.status = 'ready';
    systemState.progress = 'System bereit!';
    console.log('--- ALL BACKEND DATABASES SUCCESSFULY INDEXED & CACHED ---');
  } catch (err) {
    systemState.status = 'error';
    systemState.progress = `Datenbank-Verbindungsfehler oder Abfrage-Fehler: ${err.message}`;
    console.error('Cache warm-up crash:', err);
  }
}

/* ====================================================
   API ENDPOINTS
   ==================================================== */

// Cache Status Endpoint
app.get('/api/status', (req, res) => {
  res.json(systemState);
});

// Clear Cache Endpoint
app.post('/api/clear-cache', async (req, res) => {
  try {
    cachedSetupData = null;
    cacheWarmingPromise = null;
    await cacheSetupData();
    await refreshMachineTimeEvaluationCache();
    res.json({ success: true, message: 'Cache wurde erfolgreich gelöscht und neu berechnet.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get DB Mode Endpoint
app.get('/api/db-mode', (req, res) => {
  res.json({ mode: getDbMode() });
});

app.get('/api/debug-p202675788', (req, res) => {
  if (!cachedSetupData) return res.json({ error: 'no cached setup data' });
  const steps = cachedSetupData.steps.filter(s => String(s.ContractNumber).includes('P202675788'));
  res.json({ count: steps.length, steps });
});

// Most Used Tools Endpoint
app.get('/api/most-used-tools', async (req, res) => {
  try {
    if (!cachedSetupData) {
      await cacheSetupData();
    }

    const { listToToolsMap, toolsDetails, toolMachineMap } = cachedSetupData;

    const machineName = req.query.machine || 'Brother';
    const pastDays = parseInt(req.query.pastDays || '30', 10);
    const futureDays = parseInt(req.query.futureDays || '30', 10);

    const now = new Date();
    const pastDate = new Date(now.getTime() - pastDays * 24 * 3600 * 1000);
    const futureDate = new Date(now.getTime() + futureDays * 24 * 3600 * 1000);

    const poolD4 = await getPoolD4();

    const sqlPath = path.join(__dirname, '../KV_test.sql');
    let kvSql = fs.readFileSync(sqlPath, 'utf8').replace(/\bgo\b/gi, '');
    const selectStartMatch = kvSql.match(/\)\s+SELECT\s+ID\s*,\s*IDBEBP\s*,/i);
    const selectStartIndex = selectStartMatch.index;
    const ctePart = kvSql.substring(0, selectStartIndex + 1);
    const selectPartAndSuffix = kvSql.substring(selectStartIndex + 1);
    const whereIdx = selectPartAndSuffix.lastIndexOf('WHERE ISNULL(IDBEBP, 0) <> 0');
    const selectPart = selectPartAndSuffix.substring(0, whereIdx);

    const sql = `
      ${ctePart}
      SELECT
        OuterTemp.ID as StepId,
        OuterTemp.IDBEBP as OrderId,
        OuterTemp.PSP_POSITION_NUMMER as StepPos,
        OuterTemp.PSP_TYP_HERKUNFT as TypHerkunft,
        OuterTemp.PSP_TYP_POSITION as StepTyp,
        OuterTemp.SPKO as SPKO,
        b.BP_ARTIKEL_BEZEICHNUNG as OrderDesc,
        b.BP_POSITION_NUMMER as OrderPos,
        b.BP_IDAR as ArticleId,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupTime,
        p.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL as ProdTime,
        p.PSP_IDMS as MachineId,
        p.PSP_IDMP as MachinePoolId,
        bk.BK_BKBE_NUMMER as ContractNumber,
        COALESCE(
          (
            SELECT MIN(zbw.ZBUBW_DATUM_ZEIT_START)
            FROM [D4].[dbo].[tZE_BUCH] zb
            JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
            WHERE zb.ZBU_IDPSKP = OuterTemp.ID
          ),
          (
            SELECT MIN(PSPP_DATUM_START)
            FROM [D4].[dbo].[tPPS_SKKALP_PLAN] planP
            WHERE planP.PSPP_IDPSKP = OuterTemp.ID
          )
        ) as ActionDate
      FROM (
        ${selectPart}
      ) AS OuterTemp
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
      WHERE bk.BK_BKBE_STATUS_BEARBEITUNG = 0 
        AND bk.BK_BKBE_TYP_BELEG = 2
    `;

    const queryRes = await poolD4.request().query(sql);
    const rows = queryRes.recordset;

    const machineIdMap = {
      'Brother': [8],
      'Chiron': [21],
      'C400': [2],
      'C40': [4],
      'C42': [25],
      'RS2_1': [5],
      'RS2_2': [6]
    };
    const poolIdMap = {
      'C40': [13],
      'C42': [13],
      'RS2_1': [9, 12],
      'RS2_2': [9, 12]
    };

    const targetMachineIds = machineIdMap[machineName] || [];
    const targetPoolIds = poolIdMap[machineName] || [];

    const filteredSteps = rows.filter(step => {
      if (machineName !== 'All') {
        const matchM = targetMachineIds.includes(step.MachineId);
        const matchP = targetPoolIds.includes(step.MachinePoolId);
        if (!matchM && !matchP) return false;
      }

      if (!step.ActionDate) return false;
      const d = new Date(step.ActionDate);
      return d >= pastDate && d <= futureDate;
    });

    const toolStats = {};
    let stepsWithTools = 0;

    filteredSteps.forEach(step => {
      const progs = extractNCPrograms(step.StepDesc);
      if (progs.length === 0) return;
      const prog = progs[0];

      const matches = findMatches(prog, cachedToolLists, 0.70);
      if (matches.length === 0) return;
      const matchedList = matches[0];

      const tools = listToToolsMap[matchedList.Nr] || [];
      if (tools.length > 0) stepsWithTools++;

      tools.forEach(toolNr => {
        if (!toolStats[toolNr]) {
          const details = toolsDetails[toolNr] || { nr: toolNr, ident: 'Unbekannt', desc: '' };
          const loadedMachines = toolMachineMap ? (toolMachineMap[toolNr] || []) : [];
          toolStats[toolNr] = {
            nr: toolNr,
            ident: details.ident || '',
            desc: details.desc || '',
            keyword: details.keyword || '',
            dia: details.dia || 0,
            len: details.len || 0,
            count: 0,
            stepIds: new Set(),
            contracts: new Set(),
            isCurrentlyLoaded: machineName !== 'All' ? loadedMachines.includes(machineName) : loadedMachines.length > 0,
            currentMachines: loadedMachines,
            steps: []
          };
        }

        toolStats[toolNr].count += 1;
        toolStats[toolNr].stepIds.add(step.StepId);
        if (step.ContractNumber) toolStats[toolNr].contracts.add(String(step.ContractNumber).trim());

        toolStats[toolNr].steps.push({
          stepId: step.StepId,
          contractNumber: step.ContractNumber,
          orderPos: step.OrderPos,
          stepPos: step.StepPos,
          stepDesc: (step.StepDesc || '').split('\n')[0],
          ncProgram: prog,
          matchedListIdent: matchedList.Ident,
          actionDate: step.ActionDate ? new Date(step.ActionDate).toISOString().substring(0, 10) : null,
          spko: step.SPKO
        });
      });
    });

    const sortedTools = Object.values(toolStats).map(t => ({
      ...t,
      stepCount: t.stepIds.size,
      contractCount: t.contracts.size,
      stepIds: Array.from(t.stepIds),
      contracts: Array.from(t.contracts)
    })).sort((a, b) => b.count - a.count);

    const totalToolUsages = sortedTools.reduce((sum, t) => sum + t.count, 0);

    res.json({
      success: true,
      machine: machineName,
      pastDays,
      futureDays,
      totalStepsEvaluated: filteredSteps.length,
      stepsWithToolsCount: stepsWithTools,
      uniqueToolsCount: sortedTools.length,
      totalToolUsages,
      tools: sortedTools
    });
  } catch (err) {
    console.error('Error in /api/most-used-tools:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debug-kv-steps', (req, res) => {
  if (!cachedSetupData || !cachedSetupData.steps) {
    return res.json({ error: 'Cache not ready' });
  }
  const steps = cachedSetupData.steps;
  const colorCounts = {};
  const sampleSteps = steps.slice(0, 30).map(s => ({
    stepId: s.StepId,
    orderId: s.OrderId,
    stepPos: s.StepPos,
    stepDesc: s.StepDesc,
    spko: s.SPKO,
    bookedTime: s.BookedTime,
    realSPKO: s.realSPKO,
    vorgaenger: s.VORGAENGER,
    predStepPos: s.predStepPos,
    predSPKO: s.predSPKO,
    color: s.color
  }));
  steps.forEach(s => {
    const c = s.color || 'undefined';
    colorCounts[c] = (colorCounts[c] || 0) + 1;
  });
  res.json({ totalSteps: steps.length, colorCounts, sampleSteps });
});

// Switch DB Mode Endpoint
app.post('/api/db-mode', (req, res) => {
  const { mode } = req.body;
  if (mode !== 'live' && mode !== 'dev') {
    return res.status(400).json({ error: 'Ungültiger Modus. Erlaubt sind: dev, live' });
  }
  try {
    setDbMode(mode);
    cachedSetupData = null; // Clear cache so next request fetches fresh data from selected DB!
    res.json({ success: true, mode: getDbMode(), message: `Erfolgreich auf ${mode === 'live' ? 'Live-Datenbank' : 'Entwicklungs-Datenbank'} umgeschaltet.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 0. Machines Catalog
app.get('/api/machines', (req, res) => {
  if (!cachedMachines || cachedMachines.length === 0) {
    return res.status(503).json({ error: 'Maschinen werden noch geladen' });
  }
  res.json(cachedMachines);
});

// 1. Dashboard Summary
app.get('/api/dashboard-summary', (req, res) => {
  if (!cachedDashboard) {
    return res.status(503).json({ error: 'Dashboard wird noch geladen' });
  }
  
  const { startDate, endDate } = req.query;
  if ((startDate || endDate) && cachedSetupData) {
    const { steps } = cachedSetupData;
    const filteredSteps = steps.filter(step => {
      const targetDate = step.StartDate || step.DeliveryDate;
      if (!targetDate) return false;
      const dStr = new Date(targetDate).toISOString().substring(0, 10);
      if (startDate && dStr < startDate) return false;
      if (endDate && dStr > endDate) return false;
      return true;
    });

    const uniqueArticles = new Set();
    const uniqueOrders = new Set();
    let totalSetup = 0;
    
    filteredSteps.forEach(s => {
      if (s.ArticleId) uniqueArticles.add(s.ArticleId);
      uniqueOrders.add(s.OrderId);
      totalSetup += s.SetupTime || 0;
    });

    return res.json({
      totalArticles: uniqueArticles.size,
      totalOrders: uniqueOrders.size,
      totalToolLists: cachedDashboard.totalToolLists,
      totalTools: cachedDashboard.totalTools,
      totalParts: cachedDashboard.totalParts,
      totalSetupHours: Math.round(totalSetup / 60)
    });
  }
  
  res.json(cachedDashboard);
});

// 2. Paginated ERP Articles (Stays dynamic since users search/page it)
app.get('/api/articles', async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const poolD4 = await getPoolD4();

    // Count
    const countReq = poolD4.request();
    countReq.input('search', sql.VarChar, `%${search}%`);
    const countResult = await countReq.query(`
      SELECT COUNT(*) as count 
      FROM [D4].[dbo].[tARST] 
      WHERE AR_ART = 0 AND AR_TYP = 1
        AND (AR_NUMMER LIKE @search OR AR_BEZEICHNUNG LIKE @search)
    `);
    const total = countResult.recordset[0].count;

    // Data
    const dataReq = poolD4.request();
    dataReq.input('search', sql.VarChar, `%${search}%`);
    dataReq.input('offset', sql.Int, offset);
    dataReq.input('limit', sql.Int, limit);
    const dataResult = await dataReq.query(`
      SELECT ID, AR_NUMMER as ArticleNumber, AR_BEZEICHNUNG as Description
      FROM [D4].[dbo].[tARST]
      WHERE AR_ART = 0 AND AR_TYP = 1
        AND (AR_NUMMER LIKE @search OR AR_BEZEICHNUNG LIKE @search)
      ORDER BY AR_NUMMER
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: dataResult.recordset
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Orders for a specific Article (Dynamic lookup)
app.get('/api/articles/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    const poolD4 = await getPoolD4();

    const request = poolD4.request();
    request.input('id', sql.Int, id);
    const result = await request.query(`
      SELECT 
        b.ID as OrderId, 
        b.BP_POSITION_NUMMER as PositionNumber, 
        b.BP_ARTIKEL_BEZEICHNUNG as Description,
        b.BP_PP_DATUM_START as StartDate, 
        b.BP_PP_DATUM_TERMIN as EndDate,
        CASE
          WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM
          ELSE au.BK_BKBE_AU_LI_DATUM
        END as DeliveryDate,
        bk.BK_BKBE_NUMMER as ContractNumber,
        bk.BK_BKBE_STATUS_BEARBEITUNG as Status,
        CASE
          WHEN bk.BK_BKBE_IDKU_RE_ALTERNATIV IS NOT NULL THEN tADRS_RE_ALTERNATIV.AD_NAME1
          ELSE tADRS_RE.AD_NAME1
        END as CustomerName
      FROM [D4].[dbo].[tbe_Belp] b
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
      LEFT JOIN [D4].[dbo].[tKUND] tKUND_RE ON tKUND_RE.ID = bk.BK_BKBE_IDKU_RE
      LEFT JOIN [D4].[dbo].[tADRS] tADRS_RE ON tADRS_RE.ID = tKUND_RE.KU_IDAD
      LEFT JOIN [D4].[dbo].[tKUND] tKUND_RE_ALTERNATIV ON tKUND_RE_ALTERNATIV.ID = bk.BK_BKBE_IDKU_RE_ALTERNATIV
      LEFT JOIN [D4].[dbo].[tADRS] tADRS_RE_ALTERNATIV ON tADRS_RE_ALTERNATIV.ID = tKUND_RE_ALTERNATIV.KU_IDAD
      WHERE b.BP_IDAR = @id
      ORDER BY b.BP_PP_DATUM_START DESC
    `);

    const ordersList = result.recordset;
    if (!cachedSetupData) {
      return res.json(ordersList);
    }
    
    // Group active steps by OrderId
    const { steps } = cachedSetupData;
    const ordersMap = {};
    steps.forEach(step => {
      if (!ordersMap[step.OrderId]) {
        ordersMap[step.OrderId] = [];
      }
      ordersMap[step.OrderId].push(step);
    });

    // Track which machines are involved across these orders to pre-simulate them
    const machinesInvolved = new Set();
    ordersList.forEach(ord => {
      const oSteps = ordersMap[ord.OrderId] || [];
      oSteps.forEach(step => {
        const mName = findMachineNameFromD4(step.MachineId, step.MachinePoolId);
        if (mName) {
          step.MatchedMachineName = mName;
          machinesInvolved.add(mName);
        }
      });
    });

    // Run active simulation for each involved machine
    const simulatedStepsMap = {};
    for (let mName of Array.from(machinesInvolved)) {
      try {
        const scenario = activeScenarios[mName] || { unloadPrograms: '', loadPrograms: '' };
        const simResult = await runSimulationForMachine(
          mName,
          scenario.unloadPrograms,
          scenario.loadPrograms,
          '2028-12-31',
          'false'
        );
        simResult.simulatedTimeline.forEach(sStep => {
          simulatedStepsMap[sStep.stepId] = {
            missesCount: sStep.missesCount,
            occupiedSlots: sStep.occupiedSlots,
            magazineSize: simResult.magazineSize,
            isFeasible: sStep.isFeasible
          };
        });
      } catch (err) {
        console.error(`Error simulating machine ${mName} for articles orders:`, err);
      }
    }

    // Attach aggregated simulation data to orders
    const resolvedOrders = ordersList.map(ord => {
      const oSteps = ordersMap[ord.OrderId] || [];
      let totalMisses = 0;
      let maxOccupied = 0;
      let magSize = 0;
      let hasSim = false;

      oSteps.forEach(step => {
        const simData = simulatedStepsMap[step.StepId];
        if (simData) {
          hasSim = true;
          totalMisses += simData.missesCount;
          if (simData.occupiedSlots > maxOccupied) {
            maxOccupied = simData.occupiedSlots;
            magSize = simData.magazineSize;
          }
        }
      });

      return {
        ...ord,
        SimMissesCount: hasSim ? totalMisses : undefined,
        SimOccupiedSlots: hasSim ? maxOccupied : undefined,
        SimMagazineSize: hasSim ? magSize : undefined
      };
    });

    res.json(resolvedOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id/steps', async (req, res) => {
  try {
    const { id } = req.params;
    const poolD4 = await getPoolD4();

    let targetOrderId = parseInt(id, 10);
    let resolvedOrderId = null;

    if (!isNaN(targetOrderId) && targetOrderId > 0) {
      // 1. Check if id is an OrderId in tbe_Belp
      try {
        const checkBelp = await poolD4.request()
          .input('oid', sql.Int, targetOrderId)
          .query(`SELECT TOP 1 ID FROM tbe_Belp WHERE ID = @oid`);
        if (checkBelp.recordset.length > 0) {
          resolvedOrderId = checkBelp.recordset[0].ID;
        } else {
          // 2. Check if id is a StepId in tPPS_SKKALP or tSK_KALP
          const checkStep = await poolD4.request()
            .input('sid', sql.Int, targetOrderId)
            .query(`
              SELECT TOP 1 k.PSK_IDBEBP as OrderId
              FROM tPPS_SKKALP p
              INNER JOIN tPPS_SKKALK k ON k.ID = p.PSP_IDPSKKK
              WHERE p.ID = @sid
              UNION ALL
              SELECT TOP 1 k.KK_IDBEBP as OrderId
              FROM tSK_KALP p
              INNER JOIN tSK_KALK k ON k.ID = p.KP_IDSKKK
              WHERE p.ID = @sid
            `);
          if (checkStep.recordset.length > 0) {
            resolvedOrderId = checkStep.recordset[0].OrderId;
          }
        }
      } catch (errCheck) {
        console.warn('Error checking OrderId/StepId in DB:', errCheck.message);
      }
    }

    if (!resolvedOrderId) {
      // 3. Look up by ContractNumber / Belegnummer / Projekt-Nummer
      try {
        const findReq = poolD4.request();
        findReq.input('cn', sql.VarChar, id);
        const findRes = await findReq.query(`
          SELECT TOP 1 b.ID
          FROM tbe_Belp b
          INNER JOIN tBE_BELK_BKBE bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
          LEFT JOIN tBE_BELK_BKBE_AU au ON au.BK_BKBE_AU_IDBKBE = bk.ID
          WHERE bk.BK_BKBE_NUMMER = @cn
             OR b.BP_POSITION_NUMMER = @cn
             OR b.BP_ARTIKEL_BEZEICHNUNG = @cn
        `);
        if (findRes.recordset.length > 0) {
          resolvedOrderId = findRes.recordset[0].ID;
        }
      } catch (errCn) {
        console.warn('Error checking ContractNumber in DB:', errCn.message);
      }
    }

    const finalSearchId = resolvedOrderId || (isNaN(targetOrderId) ? 0 : targetOrderId);

    // Fetch active planning steps from tPPS_SKKALP
    const requestActive = poolD4.request();
    requestActive.input('orderId', sql.Int, finalSearchId);
    requestActive.input('cnStr', sql.VarChar, id);
    const resultActive = await requestActive.query(`
      SELECT
        p.ID as StepId,
        p.PSP_POSITION_NUMMER as StepPos,
        b.BP_POSITION_NUMMER as OrderPos,
        p.PSP_TYP_POSITION as StepTyp,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupTime,
        p.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL as ProdTime,
        p.PSP_MENGE_SOLL as TargetQty,
        p.PSP_PP_STATUS_PRODUKTION as StatusProduction,
        CASE
          WHEN p.PSP_PP_STATUS_PRODUKTION = 0 THEN
            CASE
              WHEN EXISTS (
                SELECT 1 FROM tZE_BUCH zb
                INNER JOIN tZE_BUCH_BEWE zbb ON zbb.ZBUBW_IDZBU = zb.ID
                WHERE zb.ZBU_IDPSKP = p.ID
              ) THEN 2
              WHEN EXISTS (
                SELECT 1 FROM tSK_KALP_LGBEWE
                WHERE KPLG_IDSKKP = p.ID
              ) THEN 4
              ELSE 1
            END
          ELSE 4
        END AS SPKO,
        CASE
          WHEN b.BP_PP_DATUM_TERMIN IS NOT NULL THEN b.BP_PP_DATUM_TERMIN
          ELSE
            CASE
              WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM
              ELSE au.BK_BKBE_AU_LI_DATUM
            END
        END as DeliveryDate,
        (
          SELECT MIN(PSPP_DATUM_START)
          FROM tPPS_SKKALP_PLAN
          WHERE tPPS_SKKALP_PLAN.PSPP_IDPSKP = p.ID
            AND tPPS_SKKALP_PLAN.PSPP_STATUS_PLANUNG <> 1
        ) as StartDate,
        p.PSP_IDMS as MachineId,
        (
          SELECT TOP 1 zb.ZBU_IDMS
          FROM tZE_BUCH zb
          WHERE zb.ZBU_IDPSKP = p.ID
            AND zb.ZBU_IDMS IS NOT NULL
          ORDER BY zb.ID DESC
        ) as BookedMachineId,
        p.PSP_IDMP as MachinePoolId,
        COALESCE(masta.MS_BEZEICHNUNG, pool.MP_BEZEICHNUNG, masta.MS_NUMMER, '') as MachineName
      FROM [D4].[dbo].[tPPS_SKKALK] k
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = k.PSK_IDBEBP
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] masta ON masta.ID = p.PSP_IDMS
      LEFT JOIN [D4].[dbo].[tPPS_MASCHPOOL] pool ON pool.ID = p.PSP_IDMP
      WHERE k.PSK_IDBEBP = @orderId OR bk.BK_BKBE_NUMMER = @cnStr
      ORDER BY p.PSP_POSITION_NUMMER
    `);

    // Fetch all calculation template steps from tSK_KALP
    const requestTsk = poolD4.request();
    requestTsk.input('orderId', sql.Int, finalSearchId);
    requestTsk.input('cnStr', sql.VarChar, id);
    const resultTsk = await requestTsk.query(`
      SELECT
        p.ID as StepId,
        p.KP_POSITION_NUMMER as StepPos,
        p.KP_TYP_POSITION as StepTyp,
        p.KP_BEZEICHNUNG as StepDesc,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM tSK_KALP_LGBEWE
            WHERE KPLG_IDSKKP = p.ID
          ) THEN 4
          ELSE 1
        END as SPKO
      FROM [D4].[dbo].[tSK_KALK] k
      INNER JOIN [D4].[dbo].[tSK_KALP] p ON p.KP_IDSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = k.KK_IDBEBP
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
      WHERE k.KK_IDBEBP = @orderId OR bk.BK_BKBE_NUMMER = @cnStr
      ORDER BY p.KP_POSITION_NUMMER
    `);

    // Merge active planning steps and calculation steps
    const activeMap = {};
    resultActive.recordset.forEach(row => {
      activeMap[row.StepPos] = row;
    });

    const combinedSteps = [...resultActive.recordset];
    resultTsk.recordset.forEach(tskRow => {
      if (!activeMap[tskRow.StepPos]) {
        combinedSteps.push({
          StepId: tskRow.StepId,
          StepPos: tskRow.StepPos,
          StepTyp: tskRow.StepTyp,
          StepDesc: tskRow.StepDesc,
          SetupTime: 0,
          ProdTime: 0,
          TargetQty: 0,
          StatusProduction: 0,
          SPKO: tskRow.SPKO,
          DeliveryDate: null,
          StartDate: null,
          MachineId: null,
          MachinePoolId: null,
          MachineName: (tskRow.StepTyp === 1 || (tskRow.StepDesc && /fremd|extern|härten|beschichten|eloxieren|verzinken|schleifen/i.test(tskRow.StepDesc))) ? 'Extern' : 'Sonstige'
        });
      }
    });

    // Fallback: If DB queries yield 0 steps, search server memory cachedSetupData
    if (combinedSteps.length === 0 && cachedSetupData && cachedSetupData.length > 0) {
      const matchId = String(id).toLowerCase();
      const foundSteps = cachedSetupData.filter(s => 
        String(s.OrderId) === String(id) ||
        String(s.StepId) === String(id) ||
        String(s.ContractNumber || s.contractNumber || '').toLowerCase() === matchId
      );

      if (foundSteps.length > 0) {
        const sample = foundSteps[0];
        const targetCn = String(sample.ContractNumber || sample.contractNumber || '').toLowerCase();
        const targetOid = String(sample.OrderId || sample.orderId || '');

        const allOrderSteps = cachedSetupData.filter(s => 
          (targetOid && String(s.OrderId || s.orderId || '') === targetOid) ||
          (targetCn && String(s.ContractNumber || s.contractNumber || '').toLowerCase() === targetCn)
        );

        allOrderSteps.sort((a, b) => (parseInt(a.StepPos || a.stepPos || 0) - parseInt(b.StepPos || b.stepPos || 0)));

        const memoryFormatted = allOrderSteps.map(s => {
          const isActualMachine = !!((s.MachineId || s.machineId) && (s.MachineId || s.machineId) > 0);
          const isPool = !isActualMachine && !!((s.MachinePoolId || s.machinePoolId) && (s.MachinePoolId || s.machinePoolId) > 0);
          const isFremd = s.StepTyp === 1 || (s.StepDesc || s.stepDesc || '').toLowerCase().includes('fremd') || (s.StepDesc || s.stepDesc || '').toLowerCase().includes('extern');
          let cleanName = (s.MachineName || s.machineName || '').replace(/\s*\(\s*Pool\s*\)/gi, '').trim();
          if (cleanName === 'Sonstige/Extern') cleanName = '';

          let mName = cleanName;
          if (isPool) {
            mName = cleanName ? `${cleanName} (Pool)` : 'Pool';
          } else if (!cleanName) {
            mName = isActualMachine ? `Maschine #${s.MachineId || s.machineId}` : (isFremd ? 'Extern' : 'Sonstige');
          }

          return {
            StepId: s.StepId || s.stepId,
            StepPos: s.StepPos || s.stepPos,
            OrderPos: s.OrderPos || s.orderPos || 10,
            StepTyp: s.StepTyp || 0,
            StepDesc: s.StepDesc || s.stepDesc || 'Arbeitsgang',
            SetupTime: s.SetupTime || s.setupTime || 0,
            ProdTime: s.ProdTime || s.prodTime || 0,
            TargetQty: s.Quantity || 0,
            StatusProduction: s.StatusProduction || 0,
            SPKO: s.SPKO || (s.isCompleted ? 4 : (s.isExecuting ? 2 : 1)),
            DeliveryDate: s.DeliveryDate || s.deliveryDate,
            MachineId: s.MachineId || s.machineId,
            MachinePoolId: s.MachinePoolId || s.machinePoolId,
            MachineName: mName,
            isPool
          };
        });

        return res.json(memoryFormatted);
      }
    }

    // Re-sort combined list by step position
    combinedSteps.sort((a, b) => {
      const posA = parseInt(a.StepPos || 0, 10);
      const posB = parseInt(b.StepPos || 0, 10);
      return posA - posB;
    });

    // Find the highest step position that is completed (SPKO === 4) or in progress (SPKO === 2)
    let maxCompletedPos = -1;
    combinedSteps.forEach(s => {
      if (s.SPKO === 4 || s.SPKO === 2) {
        const posVal = parseInt(s.StepPos || 0, 10);
        if (posVal > maxCompletedPos) {
          maxCompletedPos = posVal;
        }
      }
    });

    // Auto-complete preceding steps if they are Fracht (shipping) or Fremdleistung (external processing)
    if (maxCompletedPos !== -1) {
      combinedSteps.forEach(s => {
        const posVal = parseInt(s.StepPos || 0, 10);
        if (posVal < maxCompletedPos) {
          const isFremd = s.StepTyp === 1;
          const desc = (s.StepDesc || '').toLowerCase();
          const isFracht = desc.includes('fracht') || 
                           desc.includes('versand') || 
                           desc.includes('transport') ||
                           desc.includes('spedition') ||
                           desc.includes('extern') ||
                           desc.includes('fremdleistung');
          if ((isFremd || isFracht) && s.SPKO !== 4) {
            s.SPKO = 4;
          }
        }
      });
    }

    const processedSteps = combinedSteps.map(step => {
      if (step.BookedMachineId) {
        step.MachineId = step.BookedMachineId;
      }

      const isActualMachine = !!(step.MachineId && step.MachineId > 0);
      const isPool = !isActualMachine && !!(step.MachinePoolId && step.MachinePoolId > 0);
      const isFremd = step.StepTyp === 1 || (step.StepDesc && /fremd|extern|härten|beschichten|eloxieren|verzinken|schleifen/i.test(step.StepDesc));

      let cleanName = (step.MachineName || '').replace(/\s*\(\s*Pool\s*\)/gi, '').trim();
      if (cleanName === 'Sonstige/Extern') cleanName = '';

      if (isPool) {
        step.MachineName = cleanName ? `${cleanName} (Pool)` : 'Pool';
        step.isPool = true;
      } else {
        step.MachineName = cleanName || (isActualMachine ? `Maschine #${step.MachineId}` : (isFremd ? 'Extern' : 'Sonstige'));
        step.isPool = false;
      }
      const stepTypName = 
        step.StepTyp === 0 ? 'Arbeitsschritt' :
        step.StepTyp === 1 ? 'Fremddienstleistung' :
        step.StepTyp === 2 ? 'Material' :
        step.StepTyp === 3 ? 'Info' :
        step.StepTyp === 6 ? 'Kosten' : 'Unbekannt';

      let parsedPrograms = [];
      let toolListMatches = [];

      if (step.StepTyp === 0) {
        parsedPrograms = extractNCPrograms(step.StepDesc);
        for (let prog of parsedPrograms) {
          const matches = findMatches(prog, cachedToolLists, 0.6);
          toolListMatches.push({
            programName: prog,
            matches
          });
        }
      }

      return {
        ...step,
        orderPos: step.OrderPos || null,
        StepTypName: stepTypName,
        parsedPrograms,
        toolListMatches,
        IsFinished: step.SPKO === 4
      };
    });

    if (!cachedSetupData) {
      return res.json(processedSteps);
    }

    // Determine unique machines involved in active steps
    const machinesInvolved = new Set();
    processedSteps.forEach(step => {
      if (step.StepTyp === 0) {
        const mName = findMachineNameFromD4(step.MachineId, step.MachinePoolId);
        if (mName) {
          step.MatchedMachineName = mName;
          machinesInvolved.add(mName);
        }
      }
    });

    // Run active simulation for each involved machine and build steps map
    const simulatedStepsMap = {};
    for (let mName of Array.from(machinesInvolved)) {
      try {
        const scenario = activeScenarios[mName] || { unloadPrograms: '', loadPrograms: '' };
        const simResult = await runSimulationForMachine(
          mName,
          scenario.unloadPrograms,
          scenario.loadPrograms,
          '2028-12-31',
          'false'
        );
        simResult.simulatedTimeline.forEach(sStep => {
          simulatedStepsMap[sStep.stepId] = {
            missesCount: sStep.missesCount,
            occupiedSlots: sStep.occupiedSlots,
            magazineSize: simResult.magazineSize,
            isFeasible: sStep.isFeasible,
            statusColor: sStep.statusColor,
            misses: sStep.misses,
            magazineTools: sStep.magazineTools
          };
        });
      } catch (err) {
        console.error(`Error simulating machine ${mName} for order steps:`, err);
      }
    }

    // Attach simulation attributes to each step
    const finalSteps = processedSteps.map(step => {
      const simData = simulatedStepsMap[step.StepId];
      if (simData) {
        return {
          ...step,
          SimMissesCount: simData.missesCount,
          SimOccupiedSlots: simData.occupiedSlots,
          SimMagazineSize: simData.magazineSize,
          SimIsFeasible: simData.isFeasible,
          SimStatusColor: simData.statusColor,
          SimMisses: simData.misses,
          SimMagazineTools: simData.magazineTools
        };
      }
      return step;
    });

    res.json(finalSteps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Tool List details (Dynamic lookup)
app.get('/api/tool-lists/:nr', async (req, res) => {
  try {
    const { nr } = req.params;
    const poolWT = await getPoolWT();

    const headerReq = poolWT.request();
    headerReq.input('nr', sql.VarChar, nr);
    const headerResult = await headerReq.query(`
      SELECT Nr, Ident, NCP, Descript, MachineNr, MDate, MSign
      FROM [WTDATA].[dbo].[ToolLists]
      WHERE Nr = @nr
    `);

    if (headerResult.recordset.length === 0) {
      return res.status(404).json({ error: `Tool list ${nr} not found` });
    }

    const header = headerResult.recordset[0];

    const itemsReq = poolWT.request();
    itemsReq.input('nr', sql.VarChar, nr);
    const itemsResult = await itemsReq.query(`
      SELECT
        tl.Pos, tl.T, tl.D, tl.H, tl.Rem as ItemRem, tl.ToolQuantity,
        t.Nr as ToolNr, t.Descript as ToolDesc, t.KeyWord as ToolKeyWord,
        t.Ds as ToolDia, t.CLength as ToolCutLength
      FROM [WTDATA].[dbo].[ToolList] tl
      LEFT JOIN [WTDATA].[dbo].[Tools] t ON t.Nr = tl.ToolNr
      WHERE tl.ToolListNr = @nr
      ORDER BY tl.Pos
    `);

    const items = itemsResult.recordset;
    const processedItems = [];

    for (let item of items) {
      if (item.ToolNr) {
        const partsReq = poolWT.request();
        partsReq.input('toolNr', sql.Int, item.ToolNr);
        const partsResult = await partsReq.query(`
          SELECT
            tp.Pos as PartPos, tp.Nbr as PartQty,
            p.Nr as PartNr, p.Descript as PartDesc, p.KeyWord as PartKeyWord
          FROM [WTDATA].[dbo].[ToolParts] tp
          INNER JOIN [WTDATA].[dbo].[Parts] p ON p.ID = tp.PartID
          WHERE tp.ToolNr = @toolNr
          ORDER BY tp.Pos
        `);
        processedItems.push({
          ...item,
          parts: partsResult.recordset
        });
      } else {
        processedItems.push({
          ...item,
          parts: []
        });
      }
    }

    res.json({
      header,
      items: processedItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tools/:nr/parts', async (req, res) => {
  try {
    const { nr } = req.params;
    const poolWT = await getPoolWT();
    const partsReq = poolWT.request();
    partsReq.input('toolNr', sql.Int, parseInt(nr, 10));
    const partsResult = await partsReq.query(`
      SELECT
        tp.Pos as PartPos, tp.Nbr as PartQty,
        p.Nr as PartNr, p.Descript as PartDesc, p.KeyWord as PartKeyWord
      FROM [WTDATA].[dbo].[ToolParts] tp
      INNER JOIN [WTDATA].[dbo].[Parts] p ON p.ID = tp.PartID
      WHERE tp.ToolNr = @toolNr
      ORDER BY tp.Pos
    `);
    res.json(partsResult.recordset.map(row => ({
      partPos: row.PartPos,
      partQty: row.PartQty,
      partNr: row.PartNr ? row.PartNr.toString().trim() : '',
      partDesc: row.PartDesc ? row.PartDesc.toString().trim() : '',
      partKeyWord: row.PartKeyWord ? row.PartKeyWord.toString().trim() : ''
    })));
  } catch (err) {
    console.error('Error fetching tool parts:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Tool Standardization Analysis (Served from Cache)
app.get('/api/standardization', (req, res) => {
  if (!cachedStandardization) {
    return res.status(503).json({ error: 'Standardisierung wird noch geladen' });
  }
  res.json(cachedStandardization);
});

// 7. Phased Tool Demand Timeline (Served from Cache)
app.get('/api/demand', (req, res) => {
  if (!cachedDemandSteps) {
    return res.status(503).json({ error: 'Bedarfstimeline wird noch geladen' });
  }
  
  const { startDate, endDate, machineId } = req.query;
  let filteredSteps = cachedDemandSteps;

  if (startDate) {
    filteredSteps = filteredSteps.filter(s => s.date >= startDate);
  }
  if (endDate) {
    filteredSteps = filteredSteps.filter(s => s.date <= endDate);
  }

  if (machineId) {
    const parts = machineId.split('_');
    const type = parts[0]; // 'pool' or 'machine'
    const dbId = parseInt(parts[1]); // ID as integer
    if (!isNaN(dbId)) {
      filteredSteps = filteredSteps.filter(s => {
        if (type === 'pool') {
          return s.machinePoolId === dbId;
        } else {
          return s.machineId === dbId;
        }
      });
    }
  }

  // Aggregate tools by date
  const demandByDate = {};
  filteredSteps.forEach(s => {
    const dateStr = s.date;
    if (!demandByDate[dateStr]) {
      demandByDate[dateStr] = {};
    }
    s.tools.forEach(t => {
      if (!demandByDate[dateStr][t.toolNr]) {
        demandByDate[dateStr][t.toolNr] = 0;
      }
      demandByDate[dateStr][t.toolNr] += t.qty;
    });
  });

  const result = Object.keys(demandByDate).sort().map(date => {
    const toolsReq = demandByDate[date];
    const items = Object.keys(toolsReq).map(tNr => ({
      toolNr: parseInt(tNr),
      quantity: toolsReq[tNr],
      details: cachedToolDetails[tNr] || { nr: tNr, desc: 'Unbekannt' }
    }));
    
    const totalTools = items.reduce((acc, curr) => acc + curr.quantity, 0);

    return {
      date,
      totalTools,
      tools: items
    };
  });

  res.json(result);
});

// Helper to get currently loaded tools for a machine from Toollist DB
async function getCurrentToolsForMachine(machineName) {
  try {
    const poolTL = await getPoolTL();
    
    // Map D4 planning board machine names to Toollist DB machine names
    let searchName = machineName;
    if (machineName === 'RS2_1') {
      searchName = 'RS1';
    } else if (machineName === 'RS2_2') {
      searchName = 'RS2';
    }
    
    const machineResult = await poolTL.request()
      .input('name', sql.VarChar, `%${searchName}%`)
      .query('SELECT Id, Name, MagazineSize FROM Machines WHERE Name LIKE @name');
    
    if (machineResult.recordset.length === 0) {
      return { toolNrs: [], magazineSize: 40 };
    }
    const machine = machineResult.recordset[0];
    const magazineSize = machine.MagazineSize || 40;
    
    const programResult = await poolTL.request()
      .input('machineId', sql.Int, machine.Id)
      .query('SELECT Id, ProgramName FROM MachineToProgram WHERE Machine = @machineId');
      
    let activePrograms = programResult.recordset;
    let initialToolNrs = [];
    if (activePrograms.length > 0) {
      const activeProgramIds = activePrograms.map(p => p.Id);
      const toolsResult = await poolTL.request()
        .query(`SELECT ToolName FROM ProgramToTool WHERE MachineToProgramId IN (${activeProgramIds.join(',')})`);
        
      toolsResult.recordset.forEach(t => {
        const nameStr = t.ToolName || '';
        const idx = nameStr.lastIndexOf('-');
        const suffix = nameStr.substring(idx + 1);
        const nr = parseInt(suffix, 10);
        if (!isNaN(nr) && !initialToolNrs.includes(nr)) {
          initialToolNrs.push(nr);
        }
      });
    }
    return { toolNrs: initialToolNrs, magazineSize };
  } catch (err) {
    console.error(`Error loading current tools for ${machineName}:`, err);
    return { toolNrs: [], magazineSize: 40 };
  }
}

// Genetic Algorithm sequencing
function sequenceStepsGA(stepsList, initialMagazine, magazineSize, listToToolsMap, optimizeFixture = false, fixtureWeight = 1.5) {
  if (stepsList.length <= 1) return stepsList;

  function evaluatePermutation(permutation) {
    return evaluateSequence(permutation, initialMagazine, magazineSize, listToToolsMap, optimizeFixture, fixtureWeight);
  }

  const popSize = 40;
  const generations = 50;
  const mutationRate = 0.25;
  const tournamentSize = 3;

  let population = [];

  // Seed 1: Greedy NN sequence
  const greedySeq = [];
  let remaining = [...stepsList];
  let currentMag = [...initialMagazine];
  while (remaining.length > 0) {
    let bestIdx = 0;
    let minLoad = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const tools = listToToolsMap[remaining[i].MatchedListNr] || [];
      const loadCount = tools.filter(t => !currentMag.includes(t)).length;
      if (loadCount < minLoad) {
        minLoad = loadCount;
        bestIdx = i;
      }
    }
    const chosen = remaining.splice(bestIdx, 1)[0];
    greedySeq.push(chosen);
    const tools = listToToolsMap[chosen.MatchedListNr] || [];
    currentMag = Array.from(new Set([...currentMag, ...tools])).slice(-magazineSize);
  }
  population.push(greedySeq);

  // Rest: random
  for (let p = 1; p < popSize; p++) {
    const perm = [...stepsList];
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    population.push(perm);
  }

  function selectParent(pop, fitnesses) {
    let bestIdx = Math.floor(Math.random() * pop.length);
    for (let i = 1; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * pop.length);
      if (fitnesses[idx] < fitnesses[bestIdx]) {
        bestIdx = idx;
      }
    }
    return pop[bestIdx];
  }

  function crossover(parentA, parentB) {
    const size = parentA.length;
    const child = Array(size).fill(null);
    const start = Math.floor(Math.random() * size);
    const end = Math.floor(Math.random() * (size - start)) + start;

    for (let i = start; i <= end; i++) {
      child[i] = parentA[i];
    }

    let childIdx = (end + 1) % size;
    for (let i = 0; i < size; i++) {
      const item = parentB[(end + 1 + i) % size];
      if (!child.includes(item)) {
        child[childIdx] = item;
        childIdx = (childIdx + 1) % size;
      }
    }
    return child;
  }

  function mutate(individual) {
    if (Math.random() < mutationRate) {
      const idxA = Math.floor(Math.random() * individual.length);
      let idxB = Math.floor(Math.random() * individual.length);
      while (idxA === idxB && individual.length > 1) {
        idxB = Math.floor(Math.random() * individual.length);
      }
      [individual[idxA], individual[idxB]] = [individual[idxB], individual[idxA]];
    }
  }

  for (let gen = 0; gen < generations; gen++) {
    const fitnesses = population.map(ind => evaluatePermutation(ind));
    let minChanges = Infinity;
    let bestIdx = 0;
    fitnesses.forEach((fit, idx) => {
      if (fit < minChanges) {
        minChanges = fit;
        bestIdx = idx;
      }
    });

    const bestInd = population[bestIdx];
    const nextPop = [bestInd]; // Elitism
    while (nextPop.length < popSize) {
      const parentA = selectParent(population, fitnesses);
      const parentB = selectParent(population, fitnesses);
      let child = crossover(parentA, parentB);
      mutate(child);
      nextPop.push(child);
    }
    population = nextPop;
  }

  const finalFitnesses = population.map(ind => evaluatePermutation(ind));
  let minChanges = Infinity;
  let bestIdx = 0;
  finalFitnesses.forEach((fit, idx) => {
    if (fit < minChanges) {
      minChanges = fit;
      bestIdx = idx;
    }
  });

  return population[bestIdx];
}

function sequenceStepsHybrid(stepsList, initialMagazine, magazineSize, listToToolsMap, optimizeFixture = false, fixtureWeight = 1.5) {
  if (stepsList.length <= 1) return stepsList;

  function evaluatePermutation(permutation) {
    return evaluateSequence(permutation, initialMagazine, magazineSize, listToToolsMap, optimizeFixture, fixtureWeight);
  }

  const popSize = 40;
  const generations = 40;
  const mutationRate = 0.3;
  const tournamentSize = 3;

  let population = [];

  // Seed 1: Pure Greedy NN sequence
  const greedySeq = [];
  {
    let remaining = [...stepsList];
    let currentMag = [...initialMagazine];
    while (remaining.length > 0) {
      let bestIdx = 0;
      let minLoad = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const tools = listToToolsMap[remaining[i].MatchedListNr] || [];
        const loadCount = tools.filter(t => !currentMag.includes(t)).length;
        if (loadCount < minLoad) {
          minLoad = loadCount;
          bestIdx = i;
        }
      }
      const chosen = remaining.splice(bestIdx, 1)[0];
      greedySeq.push(chosen);
      const tools = listToToolsMap[chosen.MatchedListNr] || [];
      currentMag = Array.from(new Set([...currentMag, ...tools])).slice(-magazineSize);
    }
  }
  population.push(greedySeq);

  // Seed 2..20: GRASP randomized greedy construction
  for (let p = 1; p < 20; p++) {
    let remaining = [...stepsList];
    let currentMag = [...initialMagazine];
    const seq = [];
    while (remaining.length > 0) {
      const candidates = remaining.map((step, idx) => {
        const tools = listToToolsMap[step.MatchedListNr] || [];
        const loadCount = tools.filter(t => !currentMag.includes(t)).length;
        return { step, idx, loadCount };
      });
      candidates.sort((a, b) => a.loadCount - b.loadCount);
      const poolSize = Math.min(3, candidates.length);
      const chosenCandidate = candidates[Math.floor(Math.random() * poolSize)];
      
      remaining.splice(chosenCandidate.idx, 1);
      seq.push(chosenCandidate.step);
      const tools = listToToolsMap[chosenCandidate.step.MatchedListNr] || [];
      currentMag = Array.from(new Set([...currentMag, ...tools])).slice(-magazineSize);
    }
    population.push(seq);
  }

  // Seed 21..40: Mutations of the pure greedy sequence
  for (let p = 20; p < popSize; p++) {
    const mutatedGreedy = [...greedySeq];
    // Apply 1 or 2 swaps
    const swaps = Math.random() < 0.5 ? 1 : 2;
    for (let s = 0; s < swaps; s++) {
      const idxA = Math.floor(Math.random() * mutatedGreedy.length);
      const idxB = Math.floor(Math.random() * mutatedGreedy.length);
      [mutatedGreedy[idxA], mutatedGreedy[idxB]] = [mutatedGreedy[idxB], mutatedGreedy[idxA]];
    }
    population.push(mutatedGreedy);
  }

  function selectParent(pop, fitnesses) {
    let bestIdx = Math.floor(Math.random() * pop.length);
    for (let i = 1; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * pop.length);
      if (fitnesses[idx] < fitnesses[bestIdx]) {
        bestIdx = idx;
      }
    }
    return pop[bestIdx];
  }

  function crossover(parentA, parentB) {
    const size = parentA.length;
    const child = Array(size).fill(null);
    const start = Math.floor(Math.random() * size);
    const end = Math.floor(Math.random() * (size - start)) + start;

    for (let i = start; i <= end; i++) {
      child[i] = parentA[i];
    }

    let childIdx = (end + 1) % size;
    for (let i = 0; i < size; i++) {
      const item = parentB[(end + 1 + i) % size];
      if (!child.includes(item)) {
        child[childIdx] = item;
        childIdx = (childIdx + 1) % size;
      }
    }
    return child;
  }

  function mutate(individual) {
    if (Math.random() < mutationRate) {
      const idxA = Math.floor(Math.random() * individual.length);
      let idxB = Math.floor(Math.random() * individual.length);
      while (idxA === idxB && individual.length > 1) {
        idxB = Math.floor(Math.random() * individual.length);
      }
      [individual[idxA], individual[idxB]] = [individual[idxB], individual[idxA]];
    }
  }

  // Generation Loop
  for (let gen = 0; gen < generations; gen++) {
    const fitnesses = population.map(ind => evaluatePermutation(ind));
    let minChanges = Infinity;
    let bestIdx = 0;
    fitnesses.forEach((fit, idx) => {
      if (fit < minChanges) {
        minChanges = fit;
        bestIdx = idx;
      }
    });

    const bestInd = population[bestIdx];
    const nextPop = [bestInd]; // Elitism
    while (nextPop.length < popSize) {
      const parentA = selectParent(population, fitnesses);
      const parentB = selectParent(population, fitnesses);
      let child = crossover(parentA, parentB);
      mutate(child);
      nextPop.push(child);
    }
    population = nextPop;
  }

  const finalFitnesses = population.map(ind => evaluatePermutation(ind));
  let minChanges = Infinity;
  let bestIdx = 0;
  finalFitnesses.forEach((fit, idx) => {
    if (fit < minChanges) {
      minChanges = fit;
      bestIdx = idx;
    }
  });

  return population[bestIdx];
}

function sequenceStepsRL(stepsList, initialMagazine, magazineSize, listToToolsMap, optimizeFixture = false, fixtureWeight = 1.5) {
  if (stepsList.length <= 1) return stepsList;

  function evaluateSeq(sequence) {
    return evaluateSequence(sequence, initialMagazine, magazineSize, listToToolsMap, optimizeFixture, fixtureWeight);
  }

  const times = stepsList.map(s => new Date(s.StartDate || s.DeliveryDate || '9999-12-31').getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;

  // Optimize policy weights: [w_setup, w_time]
  let bestWeights = [1.0, 0.5];
  let bestScore = Infinity;
  let bestSequence = null;

  const episodes = 100;
  for (let episode = 0; episode < episodes; episode++) {
    let w_setup, w_time;
    if (episode === 0) {
      w_setup = bestWeights[0];
      w_time = bestWeights[1];
    } else {
      // Explore parameter space (direct policy search)
      w_setup = Math.max(0.1, bestWeights[0] + (Math.random() - 0.5) * 0.5);
      w_time = Math.max(0.01, bestWeights[1] + (Math.random() - 0.5) * 0.5);
    }

    let remaining = [...stepsList];
    let currentMag = [...initialMagazine];
    const sequence = [];
    let lastFixture = null;
    
    // Linear epsilon decay from 0.25 down to 0.01 (exploration vs exploitation)
    const eps = Math.max(0.01, 0.25 * (1 - episode / episodes));

    while (remaining.length > 0) {
      // Evaluate all remaining candidate steps (actions)
      const candidates = remaining.map((step, idx) => {
        const tools = listToToolsMap[step.MatchedListNr] || [];
        const misses = tools.filter(t => !currentMag.includes(t)).length;
        const t = new Date(step.StartDate || step.DeliveryDate || '9999-12-31').getTime();
        const normTime = (t - minTime) / timeRange;
        
        let fixturePenalty = 0;
        if (optimizeFixture && lastFixture !== null && step.fixture !== null && step.fixture !== lastFixture) {
          fixturePenalty = fixtureWeight;
        }

        // Q-value score: higher score is better.
        // We want to minimize misses and minimize normTime, so we use negative weights.
        const qValue = - (w_setup * (misses + fixturePenalty) + w_time * normTime);
        return { step, idx, qValue };
      });

      let chosenCandidate;
      if (Math.random() < eps) {
        // Exploit random action (exploration)
        chosenCandidate = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        // Exploit best action based on Q-values (exploitation)
        let bestIdx = 0;
        let maxQ = -Infinity;
        for (let i = 0; i < candidates.length; i++) {
          if (candidates[i].qValue > maxQ) {
            maxQ = candidates[i].qValue;
            bestIdx = i;
          }
        }
        chosenCandidate = candidates[bestIdx];
      }

      remaining.splice(chosenCandidate.idx, 1);
      sequence.push(chosenCandidate.step);
      if (chosenCandidate.step.fixture !== null) {
        lastFixture = chosenCandidate.step.fixture;
      }
      const tools = listToToolsMap[chosenCandidate.step.MatchedListNr] || [];
      currentMag = Array.from(new Set([...currentMag, ...tools])).slice(-magazineSize);
    }

    const score = evaluateSeq(sequence);
    if (score < bestScore) {
      bestScore = score;
      bestSequence = sequence;
      bestWeights = [w_setup, w_time];
    }
  }

  return bestSequence || stepsList;
}

// MIP / Exact Branch and Bound sequencing (for small step sizes)
function sequenceStepsMIP(stepsList, initialMagazine, magazineSize, listToToolsMap) {
  if (stepsList.length <= 1) return stepsList;
  if (stepsList.length > 13) {
    // Fallback to GA for larger inputs to prevent freezing
    return sequenceStepsGA(stepsList, initialMagazine, magazineSize, listToToolsMap);
  }

  // Pre-calculate timestamps and normalize them for tie-breaking
  const times = stepsList.map(s => new Date(s.StartDate || s.DeliveryDate || '9999-12-31').getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;
  const N = stepsList.length;

  let bestSequence = null;
  let minTotalChanges = Infinity; // Stores changes + fractional penalty

  function search(index, currentMag, currentChanges, currentPenalty, currentPath, remaining) {
    // Prune if changes are strictly greater than best so far
    if (currentChanges > Math.floor(minTotalChanges)) return;

    if (remaining.length === 0) {
      const totalScore = currentChanges + currentPenalty;
      if (totalScore < minTotalChanges) {
        minTotalChanges = totalScore;
        bestSequence = [...currentPath];
      }
      return;
    }

    const sortedRemaining = remaining.map(s => {
      const tools = listToToolsMap[s.MatchedListNr] || [];
      const loadCount = tools.filter(t => !currentMag.includes(t)).length;
      return { step: s, loadCount };
    }).sort((a, b) => a.loadCount - b.loadCount);

    for (let i = 0; i < sortedRemaining.length; i++) {
      const { step, loadCount } = sortedRemaining[i];
      const tools = listToToolsMap[step.MatchedListNr] || [];
      const combined = Array.from(new Set([...currentMag, ...tools]));
      const nextMag = combined.slice(-magazineSize);

      // Compute step penalty
      const t = new Date(step.StartDate || step.DeliveryDate || '9999-12-31').getTime();
      const norm = (t - minTime) / timeRange;
      const stepPenalty = (((N - 1 - index) * norm) / (N * N)) * 0.45;

      currentPath.push(step);
      const nextRemaining = remaining.filter(r => r.StepId !== step.StepId);
      search(index + 1, nextMag, currentChanges + loadCount, currentPenalty + stepPenalty, currentPath, nextRemaining);
      currentPath.pop();
    }
  }

  search(0, initialMagazine, 0, 0, [], [...stepsList]);
  return bestSequence || stepsList;
}

function findOptimalVictim(candidates, remainingSteps, listToToolsMap, lastUsedIndex = {}) {
  let bestVictim = candidates[0];
  let furthestIndex = -1;

  for (let cand of candidates) {
    let nextUseIndex = Infinity;
    // Find the first step in the future where the candidate is needed
    for (let i = 0; i < remainingSteps.length; i++) {
      const stepTools = listToToolsMap[remainingSteps[i].MatchedListNr] || [];
      if (stepTools.includes(cand)) {
        nextUseIndex = i;
        break;
      }
    }

    if (nextUseIndex > furthestIndex) {
      furthestIndex = nextUseIndex;
      bestVictim = cand;
    } else if (nextUseIndex === furthestIndex && nextUseIndex === Infinity) {
      // If both are never used again, use LRU/FIFO fallback (older lastUsedIndex is evicted first)
      const candLRU = lastUsedIndex[cand] !== undefined ? lastUsedIndex[cand] : -2;
      const bestLRU = lastUsedIndex[bestVictim] !== undefined ? lastUsedIndex[bestVictim] : -2;
      if (candLRU < bestLRU) {
        bestVictim = cand;
      }
    }
  }

  return bestVictim;
}

function evaluateSequence(sequence, initialMagazine, magazineSize, listToToolsMap, optimizeFixture = false, fixtureWeight = 1.5) {
  if (sequence.length <= 1) return 0;
  let currentMag = [...initialMagazine];
  let changes = 0;
  let lastFixture = null;
  let fixtureChanges = 0;
  let lastArticleId = null;
  let articleChanges = 0;
  
  const times = sequence.map(s => new Date(s.StartDate || s.DeliveryDate || '9999-12-31').getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;

  sequence.forEach((s, idx) => {
    if (optimizeFixture && lastFixture !== null && s.fixture !== null && s.fixture !== lastFixture) {
      fixtureChanges++;
    }
    if (s.fixture !== null) {
      lastFixture = s.fixture;
    }

    if (lastArticleId !== null && s.ArticleId !== lastArticleId) {
      articleChanges++;
    }
    lastArticleId = s.ArticleId || null;

    const tools = listToToolsMap[s.MatchedListNr] || [];
    const loadTools = tools.filter(t => !currentMag.includes(t));
    changes += loadTools.length;

    const newMagazine = [...currentMag];
    loadTools.forEach(tNr => {
      while (newMagazine.length >= magazineSize) {
        const candidates = newMagazine.filter(mNr => !tools.includes(mNr));
        if (candidates.length === 0) break;
        const remaining = sequence.slice(idx + 1);
        const victim = findOptimalVictim(candidates, remaining, listToToolsMap);
        const vIdx = newMagazine.indexOf(victim);
        newMagazine.splice(vIdx, 1);
      }
      newMagazine.push(tNr);
    });
    currentMag = newMagazine;
  });

  let penalty = 0;
  const N = sequence.length;
  sequence.forEach((s, idx) => {
    const t = new Date(s.StartDate || s.DeliveryDate || '9999-12-31').getTime();
    const norm = (t - minTime) / timeRange;
    penalty += (N - 1 - idx) * norm;
  });

  const scaledPenalty = N > 1 ? (penalty / (N * N)) * 0.45 : 0;
  return changes + scaledPenalty + (optimizeFixture ? fixtureChanges * fixtureWeight : 0) + articleChanges * 2.0;
}

function getFremdleistungType(desc) {
  if (!desc) return 'None';
  const lower = desc.toLowerCase();
  
  if (lower.includes('härte') || lower.includes('vakuumhärten') || lower.includes('nitrier')) {
    return 'Härten';
  }
  if (lower.includes('elox') || lower.includes('anod')) {
    return 'Eloxieren';
  }
  if (lower.includes('verzink') || lower.includes('zink')) {
    return 'Verzinken';
  }
  if (lower.includes('brünier') || lower.includes('schwarz')) {
    return 'Brünieren';
  }
  if (lower.includes('schleif') || lower.includes('rundschleif')) {
    return 'Schleifen';
  }
  if (lower.includes('beschicht') || lower.includes('pulver')) {
    return 'Beschichten';
  }
  if (lower.includes('fremd') || lower.includes('extern')) {
    const match = lower.match(/(?:fremdleistung|extern)\s+([a-zA-ZäöüÄÖÜß]+)/);
    if (match) return match[1];
    return 'Fremd';
  }
  return 'None';
}

function sequenceNonMachining(stepsList, orderStepsMap) {
  if (stepsList.length === 0) {
    return { sequenced: [], finalMagazine: [] };
  }
  if (stepsList.length === 1) {
    return { sequenced: stepsList.map(s => ({ ...s, loadTools: [], unloadTools: [] })), finalMagazine: [] };
  }

  const isMachiningCenter = (mId) => {
    return [2, 4, 5, 6, 8, 21, 25].includes(mId);
  };

  const hasSubsequentMilling = (step) => {
    const oId = step.OrderId;
    const allOrderSteps = orderStepsMap[oId] || [];
    return allOrderSteps.some(os => os.StepPos > step.StepPos && isMachiningCenter(os.MachineId));
  };

  stepsList.forEach(s => {
    s.hasSubsequentMilling = hasSubsequentMilling(s);
    s.fremdType = getFremdleistungType(s.StepDesc);
  });

  const times = stepsList.map(s => new Date(s.StartDate || s.DeliveryDate || '9999-12-31').getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;

  let remaining = [...stepsList];
  let ordered = [];
  let lastFremdType = 'None';

  while (remaining.length > 0) {
    let bestIdx = -1;
    let minScore = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const step = remaining[i];
      const t = new Date(step.StartDate || step.DeliveryDate || '9999-12-31').getTime();
      const normTime = (t - minTime) / timeRange;

      let score = normTime;
      if (step.hasSubsequentMilling) {
        score -= 0.5;
      }
      if (lastFremdType !== 'None' && step.fremdType === lastFremdType) {
        score -= 0.8;
      }

      if (score < minScore) {
        minScore = score;
        bestIdx = i;
      }
    }

    const chosen = remaining.splice(bestIdx, 1)[0];
    ordered.push(chosen);
    if (chosen.fremdType !== 'None') {
      lastFremdType = chosen.fremdType;
    } else {
      lastFremdType = 'None';
    }
  }

  const sequenced = ordered.map(chosen => {
    return {
      ...chosen,
      loadTools: [],
      unloadTools: []
    };
  });

  return { sequenced, finalMagazine: [] };
}

// Helper to sequence steps using selected algorithm and simulate magazine transition
function sequenceSteps(stepsList, currentMagazine, magazineSize, listToToolsMap, algo = 'greedy', optimizeFixture = false, fixtureWeight = 1.5) {
  if (stepsList.length === 0) {
    return { sequenced: [], finalMagazine: currentMagazine };
  }

  let magazine = [...currentMagazine];
  let initialUnloads = [];

  // Prune initial magazine if it exceeds magazineSize
  if (magazine.length > magazineSize) {
    const neededTools = new Set();
    stepsList.forEach(s => {
      const tools = listToToolsMap[s.MatchedListNr] || [];
      tools.forEach(t => neededTools.add(t));
    });

    while (magazine.length > magazineSize) {
      const candidates = magazine.filter(mNr => !neededTools.has(mNr));
      let victim;
      if (candidates.length > 0) {
        victim = candidates[0];
      } else {
        victim = findOptimalVictim(magazine, stepsList, listToToolsMap);
      }
      magazine = magazine.filter(mNr => mNr !== victim);
      initialUnloads.push(victim);
    }
  }

  // Extract active steps (in progress) and force them to the front of today's schedule
  const activeSteps = stepsList.filter(s => s.SPKO === 2);
  const normalSteps = stepsList.filter(s => s.SPKO !== 2);

  if (activeSteps.length > 0) {
    let runningMag = [...magazine];
    activeSteps.forEach((chosen, idx) => {
      const tools = listToToolsMap[chosen.MatchedListNr] || [];
      const load = tools.filter(t => !runningMag.includes(t));
      let unloadTools = idx === 0 ? [...initialUnloads] : [];
      load.forEach(tNr => {
        while (runningMag.length >= magazineSize) {
          const candidates = runningMag.filter(mNr => !tools.includes(mNr));
          if (candidates.length === 0) break;
          const remaining = activeSteps.slice(idx + 1).concat(normalSteps);
          const victim = findOptimalVictim(candidates, remaining, listToToolsMap);
          runningMag = runningMag.filter(mNr => mNr !== victim);
          unloadTools.push(victim);
        }
        runningMag.push(tNr);
      });
      chosen.loadTools = load;
      chosen.unloadTools = unloadTools;
      chosen.missesCount = load.length;
    });

    // Reset initialUnloads as we've consumed it in the activeSteps
    const result = sequenceSteps(normalSteps, runningMag, magazineSize, listToToolsMap, algo, optimizeFixture, fixtureWeight);
    return {
      sequenced: activeSteps.concat(result.sequenced),
      finalMagazine: result.finalMagazine
    };
  }

  let ordered = [];
  if (algo === 'ga') {
    ordered = sequenceStepsGA(stepsList, magazine, magazineSize, listToToolsMap, optimizeFixture, fixtureWeight);
  } else if (algo === 'rl') {
    ordered = sequenceStepsRL(stepsList, magazine, magazineSize, listToToolsMap, optimizeFixture, fixtureWeight);
  } else if (algo === 'hybrid') {
    // 1. Run Greedy
    let remaining = [...stepsList];
    let testMag = [...magazine];
    let greedyOrdered = [];
    let lastFixture = null;
    let lastArticleId = null;
    while (remaining.length > 0) {
      let bestIdx = -1;
      let minScore = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const step = remaining[i];
        const tools = listToToolsMap[step.MatchedListNr] || [];
        const misses = tools.filter(tNr => !testMag.includes(tNr));
        
        let score = misses.length;
        if (optimizeFixture && lastFixture !== null && step.fixture !== null && step.fixture !== lastFixture) {
          score += fixtureWeight;
        }
        if (lastArticleId !== null && step.ArticleId !== lastArticleId) {
          score += 2.0;
        }

        if (score < minScore) {
          minScore = score;
          bestIdx = i;
        } else if (score === minScore && bestIdx !== -1) {
          const dateCurrent = new Date(step.StartDate || step.DeliveryDate || '9999-12-31').getTime();
          const dateBest = new Date(remaining[bestIdx].StartDate || remaining[bestIdx].DeliveryDate || '9999-12-31').getTime();
          if (dateCurrent < dateBest) {
            bestIdx = i;
          }
        }
      }
      const chosen = remaining.splice(bestIdx, 1)[0];
      greedyOrdered.push(chosen);
      lastArticleId = chosen.ArticleId || null;
      if (chosen.fixture !== null) {
        lastFixture = chosen.fixture;
      }
      const tools = listToToolsMap[chosen.MatchedListNr] || [];
      testMag = Array.from(new Set([...testMag, ...tools])).slice(-magazineSize);
    }

    // 2. Run Hybrid GA
    const hybridOrdered = sequenceStepsHybrid(stepsList, magazine, magazineSize, listToToolsMap, optimizeFixture, fixtureWeight);

    // 3. Run Reinforcement Learning
    const rlOrdered = sequenceStepsRL(stepsList, magazine, magazineSize, listToToolsMap, optimizeFixture, fixtureWeight);

    // 4. Evaluate and choose the best sequence
    const greedyScore = evaluateSequence(greedyOrdered, magazine, magazineSize, listToToolsMap, optimizeFixture, fixtureWeight);
    const hybridScore = evaluateSequence(hybridOrdered, magazine, magazineSize, listToToolsMap, optimizeFixture, fixtureWeight);
    const rlScore = evaluateSequence(rlOrdered, magazine, magazineSize, listToToolsMap, optimizeFixture, fixtureWeight);

    console.log(`[Hybrid Selection] Greedy Score: ${greedyScore.toFixed(4)}, GA/Hybrid Score: ${hybridScore.toFixed(4)}, RL Score: ${rlScore.toFixed(4)}`);
    
    let best = greedyOrdered;
    let minScore = greedyScore;
    if (hybridScore < minScore) {
      minScore = hybridScore;
      best = hybridOrdered;
    }
    if (rlScore < minScore) {
      minScore = rlScore;
      best = rlOrdered;
    }
    ordered = best;
  } else if (algo === 'mip') {
    ordered = sequenceStepsMIP(stepsList, magazine, magazineSize, listToToolsMap);
  } else if (algo === 'none') {
    ordered = [...stepsList];
  } else {
    // Default: greedy Nearest Neighbor
    let remaining = [...stepsList];
    let testMag = [...magazine];
    let greedyOrdered = [];
    let lastFixture = null;
    let lastArticleId = null;
    while (remaining.length > 0) {
      let bestIdx = -1;
      let minScore = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const step = remaining[i];
        const tools = listToToolsMap[step.MatchedListNr] || [];
        const misses = tools.filter(tNr => !testMag.includes(tNr));
        
        let score = misses.length;
        if (optimizeFixture && lastFixture !== null && step.fixture !== null && step.fixture !== lastFixture) {
          score += fixtureWeight;
        }
        if (lastArticleId !== null && step.ArticleId !== lastArticleId) {
          score += 2.0;
        }

        if (score < minScore) {
          minScore = score;
          bestIdx = i;
        } else if (score === minScore && bestIdx !== -1) {
          const dateCurrent = new Date(step.StartDate || step.DeliveryDate || '9999-12-31').getTime();
          const dateBest = new Date(remaining[bestIdx].StartDate || remaining[bestIdx].DeliveryDate || '9999-12-31').getTime();
          if (dateCurrent < dateBest) {
            bestIdx = i;
          }
        }
      }
      const chosen = remaining.splice(bestIdx, 1)[0];
      greedyOrdered.push(chosen);
      lastArticleId = chosen.ArticleId || null;
      if (chosen.fixture !== null) {
        lastFixture = chosen.fixture;
      }
      const tools = listToToolsMap[chosen.MatchedListNr] || [];
      testMag = Array.from(new Set([...testMag, ...tools])).slice(-magazineSize);
    }
    ordered = greedyOrdered;
  }

  // Now simulate magazine transitions over the determined sequence
  let transitionMag = [...magazine];
  const sequenced = [];

  ordered.forEach((chosen, idx) => {
    const tools = listToToolsMap[chosen.MatchedListNr] || [];
    const loadTools = tools.filter(tNr => !transitionMag.includes(tNr));
    let unloadTools = idx === 0 ? [...initialUnloads] : [];
    const newMagazine = [...transitionMag];
    loadTools.forEach(tNr => {
      while (newMagazine.length >= magazineSize) {
        const candidates = newMagazine.filter(mNr => !tools.includes(mNr));
        if (candidates.length === 0) break;
        const remaining = ordered.slice(idx + 1);
        const victim = findOptimalVictim(candidates, remaining, listToToolsMap);
        const vIdx = newMagazine.indexOf(victim);
        newMagazine.splice(vIdx, 1);
        unloadTools.push(victim);
      }
      newMagazine.push(tNr);
    });
    transitionMag = newMagazine;
    sequenced.push({
      ...chosen,
      loadTools,
      unloadTools,
      missesCount: loadTools.length
    });
  });

  return { sequenced, finalMagazine: transitionMag };
}

// Helper to get next working days (Monday-Friday) starting from a date
function getNextWorkingDays(startDateStr, daysCount = 5) {
  const days = [];
  let curr = new Date(startDateStr);
  let limit = 0;
  while (days.length < daysCount && limit < 100) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(curr.toISOString().substring(0, 10));
    }
    curr.setDate(curr.getDate() + 1);
    limit++;
  }
  return days;
}

// Helper to simulate unoptimized tool changes for comparison
function calculateToolChanges(stepsList, initialMagazine, magazineSize, listToToolsMap) {
  let currentMag = [...initialMagazine];
  let totalChanges = 0;
  stepsList.forEach((s, idx) => {
    const tools = listToToolsMap[s.MatchedListNr] || [];
    const load = tools.filter(t => !currentMag.includes(t));
    totalChanges += load.length;

    // Simulate magazine update using Belady's MIN (optimal) eviction
    load.forEach(tNr => {
      while (currentMag.length >= magazineSize) {
        const candidates = currentMag.filter(mNr => !tools.includes(mNr));
        if (candidates.length === 0) break;
        
        const remaining = stepsList.slice(idx + 1);
        const victim = findOptimalVictim(candidates, remaining, listToToolsMap);
        currentMag = currentMag.filter(mNr => mNr !== victim);
      }
      currentMag.push(tNr);
    });
  });
  return totalChanges;
}

function extractFixture(desc) {
  if (!desc) return null;
  
  // 1. Search for a specific versioned fixture code first (e.g. 12359V1, M2080045V1, L254-0201V2, LTM0038-V1)
  const specificFixtureMatch = desc.match(/\b([a-zA-Z0-9_-]*\d+-?[vV]\d+)\b/);
  if (specificFixtureMatch) {
    return specificFixtureMatch[1].trim();
  }
  
  // 2. Search for explicit "Vorrichtung:" prefix anywhere in the text
  const vorrichtungMatch = desc.match(/vorrichtung\s*:\s*([^\r\n\t]+)/i);
  if (vorrichtungMatch) {
    let val = vorrichtungMatch[1].trim();
    // Truncate at double spaces
    const doubleSpaceIdx = val.indexOf('  ');
    if (doubleSpaceIdx !== -1) {
      val = val.substring(0, doubleSpaceIdx).trim();
    }
    // Truncate if VBZ or Lagerort starts in the value
    const vbzIdx = val.toLowerCase().indexOf('vbz');
    if (vbzIdx !== -1) {
      val = val.substring(0, vbzIdx).trim();
    }
    const lagerortIdx = val.toLowerCase().indexOf('lagerort');
    if (lagerortIdx !== -1) {
      val = val.substring(0, lagerortIdx).trim();
    }
    // Remove trailing semicolons/commas/dashes
    val = val.replace(/[;,-]$/, '').trim();
    if (val !== '') {
      return val;
    }
  }
  
  // 3. Search for any VBZ identifier (e.g. VBZ4, VBZ-1, VBZ_3) third
  const vbzMatch = desc.match(/VBZ\s*[0-9a-zA-Z_-]+/i);
  if (vbzMatch) {
    return vbzMatch[0].trim();
  }
  
  // 4. Fallback line-by-line search
  const lines = desc.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^[vV]orrichtung\s*:(.*)$/);
    if (match) {
      const val = match[1].trim();
      if (val !== '') {
        return val;
      }
    }
  }
  return null;
}

function extractLagerortFromDesc(desc) {
  if (!desc) return null;
  
  // 1. Try to find the PN... FA... LP... pattern
  const pnFaLpMatch = desc.match(/(PN\s*\w+)\s*[\/\-\s]*\s*(FA\s*\w+)\s*[\/\-\s]*\s*(LP\s*\w+)/i);
  if (pnFaLpMatch) {
    return pnFaLpMatch[0].trim();
  }

  // 2. Otherwise try the standard lagerort: pattern
  const match = desc.match(/lagerort\s*:\s*([^\r\n\t]+)/i);
  if (match) {
    let val = match[1].trim();
    const doubleSpaceIdx = val.indexOf('  ');
    if (doubleSpaceIdx !== -1) {
      val = val.substring(0, doubleSpaceIdx).trim();
    }
    const vbzIdx = val.toLowerCase().indexOf('vbz');
    if (vbzIdx !== -1) {
      val = val.substring(0, vbzIdx).trim();
    }
    val = val.replace(/[;,-]$/, '').trim();
    if (val !== '') {
      return val;
    }
  }
  return null;
}

// 7a. Get step bookings detailed logs
app.get('/api/planning/step-bookings', async (req, res) => {
  try {
    const { stepId } = req.query;
    if (!stepId) {
      return res.status(400).json({ error: 'Missing stepId' });
    }
    const poolD4 = await getPoolD4();
    const result = await poolD4.request()
      .input('stepId', sql.Int, parseInt(stepId, 10))
      .query(`
        SELECT CONVERT(datetime, CONVERT(varchar, ZBUBW_DATUM_ZEIT_START, 104), 104) AS ZB_DATUM_START,
               tADRS.AD_NAME1 + CASE
                                    WHEN ISNULL(MS_BEZEICHNUNG, '') <> '' THEN
                                        ' / ' + ISNULL(MS_BEZEICHNUNG, '')
                                    ELSE
                                        ''
                                END AS ZBU_MARB_MASTA,
               CONVERT(VARCHAR(8), ZBUBW_DATUM_ZEIT_START, 108) AS ZBUBW_ZEIT_START,
               CONVERT(VARCHAR(8), ZBUBW_DATUM_ZEIT_STOP, 108) AS ZBUBW_ZEIT_STOP,
               ZBUBW_TYP_ZEIT,
               ZBUBW_TYP_PRODUKTION,
               ZBU_ZEIT_RUESTUNG_GESAMT,
               ZBU_ZEIT_PRODUKTION_AK,
               ZBU_ZEIT_PRODUKTION_MS,
               ISNULL(ZBU_ZEIT_RUESTUNG_GESAMT, 0) + ISNULL(ZBU_ZEIT_PRODUKTION_GESAMT, 0) AS ZBU_ZEIT_GESAMT,
               ZBUBW_TYP_PRODUKTION AS D4IV_ZBUBW_TYP_PRODUKTION,
               tZE_BUCH.ID
        FROM(((((((((((((((((((
        (
            SELECT *
            FROM(((tZE_BUCH
                LEFT JOIN
                (
                    SELECT ZBUBW_IDZBU AS ZBUBW_IDZBU_RUESTUNG,
                           SUM(ZBUBW_ZEIT_RUESTUNG) AS ZBU_ZEIT_RUESTUNG_GESAMT
                    FROM
                    (
                        SELECT *,
                               'ZBUBW_ZEIT_RUESTUNG' = CASE
                                                           WHEN ISNULL(ZBUBW_DATUM_ZEIT_START, 0) <> 0
                                                                AND ISNULL(ZBUBW_DATUM_ZEIT_STOP, 0) <> 0 THEN
                                                               CASE
                                                                   WHEN ZBUBW_TYP_PRODUKTION = 1 THEN
                                                                       ROUND(
                                                                                CAST(DATEDIFF(
                                                                                                 ss,
                                                                                                 ZBUBW_DATUM_ZEIT_START,
                                                                                                 ZBUBW_DATUM_ZEIT_STOP
                                                                                             ) AS FLOAT) / 60,
                                                                                4
                                                                            )
                                                                   ELSE
                                                                       ROUND(
                                                                                CAST(DATEDIFF(
                                                                                                 mi,
                                                                                                 ZBUBW_DATUM_ZEIT_START,
                                                                                                 ZBUBW_DATUM_ZEIT_STOP
                                                                                             ) AS FLOAT),
                                                                                4
                                                                            )
                                                               END
                                                           ELSE
                                                               CASE
                                                                   WHEN ISNULL(ZBUBW_DATUM_ZEIT_START, 0) <> 0
                                                                        AND ISNULL(ZBUBW_DATUM_ZEIT_STOP, 0) = 0 THEN
                                                                       CASE
                                                                           WHEN ZBUBW_TYP_PRODUKTION = 1 THEN
                                                                               ROUND(
                                                                                        CAST(DATEDIFF(
                                                                                                         ss,
                                                                                                         ZBUBW_DATUM_ZEIT_START,
                                                                                                         GETDATE()
                                                                                                     ) AS FLOAT) / 60,
                                                                                        4
                                                                                    )
                                                                           ELSE
                                                                               ROUND(
                                                                                        CAST(DATEDIFF(
                                                                                                         mi,
                                                                                                         ZBUBW_DATUM_ZEIT_START,
                                                                                                         GETDATE()
                                                                                                     ) AS FLOAT),
                                                                                        4
                                                                                    )
                                                                       END
                                                                   ELSE
                                                                       0
                                                               END
                                                       END
                        FROM tZE_BUCH_BEWE
                        WHERE ZBUBW_TYP_ZEIT = 0
                    ) AS MATRIX1
                    GROUP BY ZBUBW_IDZBU
                ) AS tZE_BUCH_BEWE_RUESTUNG
                    ON tZE_BUCH_BEWE_RUESTUNG.ZBUBW_IDZBU_RUESTUNG = tZE_BUCH.ID)
                LEFT JOIN
                (
                    SELECT ZBUBW_IDZBU AS ZBUBW_IDZBU_PRODUKTION,
                           SUM(ZBUBW_ZEIT_PRODUKTION) AS ZBU_ZEIT_PRODUKTION_GESAMT,
                           SUM(   CASE
                                      WHEN ZBUBW_TYP_PRODUKTION = 0 THEN
                                          ZBUBW_ZEIT_PRODUKTION
                                      ELSE
                                          0
                                  END
                              ) AS ZBU_ZEIT_PRODUKTION_AK,
                           SUM(   CASE
                                      WHEN ZBUBW_TYP_PRODUKTION = 1 THEN
                                          ZBUBW_ZEIT_PRODUKTION
                                      ELSE
                                          0
                                  END
                              ) AS ZBU_ZEIT_PRODUKTION_MS
                    FROM
                    (
                        SELECT *,
                               'ZBUBW_ZEIT_PRODUKTION' = CASE
                                                             WHEN ISNULL(ZBUBW_DATUM_ZEIT_START, 0) <> 0
                                                                  AND ISNULL(ZBUBW_DATUM_ZEIT_STOP, 0) <> 0 THEN
                                                                 CASE
                                                                     WHEN ZBUBW_TYP_PRODUKTION = 1 THEN
                                                                         ROUND(
                                                                                  CAST(DATEDIFF(
                                                                                                   ss,
                                                                                                   ZBUBW_DATUM_ZEIT_START,
                                                                                                   ZBUBW_DATUM_ZEIT_STOP
                                                                                               ) AS FLOAT) / 60,
                                                                                  4
                                                                              )
                                                                     ELSE
                                                                         ROUND(
                                                                                  CAST(DATEDIFF(
                                                                                                   mi,
                                                                                                   ZBUBW_DATUM_ZEIT_START,
                                                                                                   ZBUBW_DATUM_ZEIT_STOP
                                                                                               ) AS FLOAT),
                                                                                  4
                                                                              )
                                                                 END
                                                             ELSE
                                                                 CASE
                                                                     WHEN ISNULL(ZBUBW_DATUM_ZEIT_START, 0) <> 0
                                                                          AND ISNULL(ZBUBW_DATUM_ZEIT_STOP, 0) = 0 THEN
                                                                         CASE
                                                                             WHEN ZBUBW_TYP_PRODUKTION = 1 THEN
                                                                                 ROUND(
                                                                                          CAST(DATEDIFF(
                                                                                                           ss,
                                                                                                           ZBUBW_DATUM_ZEIT_START,
                                                                                                           GETDATE()
                                                                                                       ) AS FLOAT) / 60,
                                                                                          4
                                                                                      )
                                                                             ELSE
                                                                                 ROUND(
                                                                                          CAST(DATEDIFF(
                                                                                                           mi,
                                                                                                           ZBUBW_DATUM_ZEIT_START,
                                                                                                           GETDATE()
                                                                                                       ) AS FLOAT),
                                                                                          4
                                                                                      )
                                                                         END
                                                                     ELSE
                                                                         0
                                                                 END
                                                         END
                        FROM tZE_BUCH_BEWE
                        WHERE ZBUBW_TYP_ZEIT = 1
                    ) AS MATRIX2
                    GROUP BY ZBUBW_IDZBU
                ) AS tZE_BUCH_BEWE_PRODUKTION
                    ON tZE_BUCH_BEWE_PRODUKTION.ZBUBW_IDZBU_PRODUKTION = tZE_BUCH.ID)
                LEFT JOIN
                (
                    SELECT ID AS IDZBU_MENGE_IST,
                           ISNULL(ZBU_MENGE_IST, 0) AS MENGE_IST
                    FROM tZE_BUCH
                ) AS tZE_BUCH_MENGE_IST
                    ON tZE_BUCH_MENGE_IST.IDZBU_MENGE_IST = tZE_BUCH.ID)
        ) AS tZE_BUCH
            LEFT JOIN tZE_BEWE
                ON tZE_BUCH.ZBU_IDZB = tZE_BEWE.ID)
            LEFT JOIN tMARB
                ON tZE_BEWE.ZB_IDMR = tMARB.ID)
            LEFT JOIN tZE_STAR
                ON tZE_BUCH.ZBU_IDZS = tZE_STAR.ID)
            LEFT JOIN tKAGO
                ON tKAGO.ID = tZE_BUCH.ZBU_IDKAGO_AUSSCHUSS)
            LEFT JOIN tZE_BUCH_BEWE
                ON tZE_BUCH_BEWE.ZBUBW_IDZBU = tZE_BUCH.ID)
            LEFT JOIN tBE_BELK_BKBE
                ON tZE_BUCH.ZBU_IDBEBK = tBE_BELK_BKBE.BK_BKBE_IDBEBK)
            LEFT JOIN tBE_BELP
                ON tZE_BUCH.ZBU_IDBEBP = tBE_BELP.ID)
            LEFT JOIN tARST
                ON tARST.ID = tBE_BELP.BP_IDAR)
            LEFT JOIN tPPS_SKKALP
                ON tPPS_SKKALP.ID = tZE_BUCH.ZBU_IDPSKP)
            LEFT JOIN tBE_BELK_ALLG
                ON tZE_BUCH.ZBU_IDBEBK = tBE_BELK_ALLG.BK_ALLG_IDBEBK)
            LEFT JOIN tPPS_ARBSCHR
                ON tPPS_ARBSCHR.ID = tPPS_SKKALP.PSP_IDAS)
            LEFT JOIN tARDI
                ON tARDI.ID = tBE_BELP.BP_FE_IDAD)
            LEFT JOIN tKUND
                ON tKUND.ID = tBE_BELK_BKBE.BK_BKBE_IDKU_RE)
            LEFT JOIN tADRS AS tADRS_KUND
                ON tADRS_KUND.ID = tKUND.KU_IDAD)
            LEFT JOIN tZE_BUCH_PR
                ON tZE_BUCH_PR.ID = tZE_BUCH.ZBU_IDZBUPR)
            LEFT JOIN tPPS_MASTA
                ON tPPS_MASTA.ID = tZE_BUCH.ZBU_IDMS)
            LEFT JOIN tPPS_MASTA_PALETTEN
                ON tPPS_MASTA_PALETTEN.ID = tZE_BUCH.ZBU_IDMSP)
            LEFT JOIN tADRS
                ON tMARB.MA_IDAD = tADRS.ID)
            LEFT JOIN
            (
                SELECT AKB_IDPSKP,
                       AKB_IDMS,
                       MAX(ID) AS AKB_ID
                FROM tANSP_KOMM_BEN
                GROUP BY AKB_IDPSKP,
                         AKB_IDMS
            ) AS AKB_MAX
                ON AKB_MAX.AKB_IDPSKP = tPPS_SKKALP.ID
                   AND AKB_MAX.AKB_IDMS = tPPS_MASTA.ID)
        WHERE ZBU_IDPSKP = @stepId
        ORDER BY ZB_DATUM_START ASC,
                 ZBU_MARB_MASTA ASC
      `);

    res.json(result.recordset);
  } catch (e) {
    console.error('Error fetching step bookings:', e);
    res.status(500).json({ error: e.message });
  }
});

// 7a-2. Save manual machine override for a step
app.post('/api/planning/override', (req, res) => {
  try {
    const { stepId, machine } = req.body;
    if (!stepId) {
      return res.status(400).json({ error: 'stepId is required' });
    }

    const fs = require('fs');
    const path = require('path');
    const overridesPath = path.join(__dirname, 'planning_overrides.json');
    let overrides = {};
    if (fs.existsSync(overridesPath)) {
      try {
        overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      } catch (err) {
        console.error('Error reading planning overrides:', err);
      }
    }

    if (machine) {
      overrides[String(stepId)] = machine;
    } else {
      delete overrides[String(stepId)];
    }

    fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), 'utf8');
    res.json({ success: true, overrides });
  } catch (err) {
    console.error('Error saving planning override:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7b. Planning Tab Kanban Data Endpoint
app.get('/api/planning', async (req, res) => {
  try {
    if (!cachedSetupData) {
      await cacheSetupData();
    }

    const { startDate, optimize, algo, optimizeFixture, fixtureWeight, daysCount, includeNonGreen, isConflictMode, useD4Plan: useD4PlanParam } = req.query;
const useD4Plan = useD4PlanParam === 'true';
    const isConflict = isConflictMode === 'true';
    const parsedDaysCount = daysCount !== undefined ? parseInt(daysCount, 10) : (isConflict ? 4 : 5);
    const shouldOptimizeFixture = optimizeFixture === 'true';
    const parsedFixtureWeight = fixtureWeight !== undefined ? parseFloat(fixtureWeight) : 1.5;
    let { steps, listToToolsMap, toolsDetails, listToMachineMap, fixtureLocationMap, toolMachineMap } = cachedSetupData;

    // Load manual overrides
    const fs = require('fs');
    const path = require('path');
    const overridesPath = path.join(__dirname, 'planning_overrides.json');
    let overrides = {};
    if (fs.existsSync(overridesPath)) {
      try {
        overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      } catch (err) {
        console.error('Error loading planning overrides:', err);
      }
    }

    // Clone steps to apply overrides and prevent mutating memory cache
    const clonedSteps = steps.map(s => {
      const copy = { ...s };
      if (overrides[String(copy.StepId)]) {
        const overrideMachine = overrides[String(copy.StepId)];
        copy.manualMachineOverride = overrideMachine; // expose override to UI

        // Map machine name to D4 database IDs
        if (overrideMachine === 'Brother') { copy.MachineId = 8; copy.MachinePoolId = 0; }
        else if (overrideMachine === 'Chiron') { copy.MachineId = 21; copy.MachinePoolId = 0; }
        else if (overrideMachine === 'C400') { copy.MachineId = 2; copy.MachinePoolId = 0; }
        else if (overrideMachine === 'C40') { copy.MachineId = 4; copy.MachinePoolId = 0; }
        else if (overrideMachine === 'C42') { copy.MachineId = 25; copy.MachinePoolId = 0; }
        else if (overrideMachine === 'RS2_1') { copy.MachineId = 5; copy.MachinePoolId = 0; }
        else if (overrideMachine === 'RS2_2') { copy.MachineId = 6; copy.MachinePoolId = 0; }
      }
      return copy;
    });
    steps = clonedSteps;

    const orderStepsMap = {};
    steps.forEach(s => {
      if (!orderStepsMap[s.OrderId]) {
        orderStepsMap[s.OrderId] = [];
      }
      orderStepsMap[s.OrderId].push(s);
    });

    // Build machine id -> name lookup map and pool id -> name lookup map
    const machineMap = {};
    const poolMap = {};
    if (cachedMachines) {
      cachedMachines.forEach(m => {
        if (m.type === 'machine' && m.dbId) {
          machineMap[m.dbId] = m.name || m.number;
        } else if (m.type === 'pool' && m.dbId) {
          poolMap[m.dbId] = m.name || m.number;
        }
      });
    }

    // Group all steps by OrderId to easily resolve the entire routing plan
    const ordersMap = {};
    steps.forEach(s => {
      if (!ordersMap[s.OrderId]) {
        ordersMap[s.OrderId] = [];
      }
      ordersMap[s.OrderId].push(s);
    });

    Object.keys(ordersMap).forEach(oId => {
      ordersMap[oId].sort((a, b) => {
        const posA = parseInt(a.StepPos || 0, 10);
        const posB = parseInt(b.StepPos || 0, 10);
        return posA - posB;
      });
    });

    // Filter steps to schedule (include non-green steps if requested via includeNonGreen / isConflictMode)
    const shouldIncludeNonGreen = includeNonGreen === 'true' || isConflictMode === 'true';
    let greenSteps = shouldIncludeNonGreen ? steps : steps.filter(step => step.color === 'Green');

    function getVirtualMachineForStep(step) {
      // If the step has an explicit D4 machine or machine pool assignment, it is a machining step
      if ((step.MachineId && step.MachineId > 0) || (step.MachinePoolId && step.MachinePoolId > 0)) {
        return null;
      }
      const desc = (step.StepDesc || '').toLowerCase();
      if (step.MachineId === 15 || desc.includes('ur5')) return 'Montage UR5';
      if (step.MachineId === 16 || desc.includes('laser')) return 'Laser';
      if (step.MachineId === 17 || desc.includes('messmaschine') || desc.includes('zeiss') || desc.includes('kmg')) return 'Messmaschine';
      if (desc.includes('versand') || desc.includes('verpacken') || desc.includes('etikett')) return 'Versand';
      if (desc.includes('montage') || desc.includes('gewindeeinsatz') || desc.includes('zapfen brechen')) return 'Montage';
      if (desc.includes('eingangsprüfung') || desc.includes('ersteilabnahme') || desc.includes('serienprüfung') || desc.includes('stempeln')) return 'Prüfplanung';
      if (desc.includes('entgrat')) return 'Entgraten';
      return null;
    }

    // Rule: In "Planung blockiert" (isConflictMode):
    // 1. ONLY released orders (belegArt === 1) are allowed! Exclude vorgemerkte (belegArt === 0)!
    // 2. Each combination of P-Order + Position (ContractNumber/OrderId + OrderPos) must appear AT MOST ONCE PER MACHINE!
    // 3. If an order position has multiple blocked steps on the same machine, display ONLY the FIRST blocked step for that machine!
    if (isConflict) {
      const machinePosMap = {};

      const getTargetMachine = (step) => {
        const vM = getVirtualMachineForStep(step);
        if (vM) return vM;
        if (step.MachineId === 8) return 'Brother';
        if (step.MachineId === 21) return 'Chiron';
        if (step.MachineId === 2) return 'C400';
        if (step.MachineId === 4) return 'C40';
        if (step.MachineId === 25) return 'C42';
        if (step.MachineId === 5) return 'RS2_1';
        if (step.MachineId === 6) return 'RS2_2';
        if (step.MachinePoolId === 13) return 'C40';
        if (step.MachinePoolId === 9 || step.MachinePoolId === 12) return 'RS2_1';
        return 'Unassigned';
      };

      steps.forEach(s => {
        if (s.belegArt === 1 || s.BelegArt === 1) {
          const cNum = String(s.ContractNumber || s.contractNumber || s.OrderId || s.orderId || '').trim();
          const cleanContract = cNum.replace(/^P/i, '');
          const oPos = String(s.OrderPos || s.orderPos || '').trim();
          const targetM = getTargetMachine(s);
          const machinePosKey = targetM + '_' + cleanContract + '_' + oPos;

          if (!machinePosMap[machinePosKey]) {
            machinePosMap[machinePosKey] = [];
          }
          machinePosMap[machinePosKey].push(s);
        }
      });

      const conflictCandidates = [];
      const seenMachinePosKeys = new Set();

      Object.keys(machinePosMap).forEach(mPosKey => {
        const group = machinePosMap[mPosKey];
        group.sort((a, b) => parseInt(a.StepPos || 0, 10) - parseInt(b.StepPos || 0, 10));

        // Find the FIRST non-green (blocked / conflict) step for this machine + order position
        const firstBlocked = group.find(s => s.color !== 'Green' && s.realSPKO !== 4 && s.SPKO !== 4);
        if (firstBlocked && !seenMachinePosKeys.has(mPosKey)) {
          seenMachinePosKeys.add(mPosKey);
          conflictCandidates.push(firstBlocked);
        }
      });

      greenSteps = conflictCandidates;
    }

    // Find default start date (always today to avoid planning in the past by default!)
    const defaultStartStr = new Date().toISOString().substring(0, 10);

    const startStr = startDate || defaultStartStr;
    const planningDays = getNextWorkingDays(startStr, parsedDaysCount);

    const machinesList = [
      'Brother', 'Chiron', 'C400', 'C40', 'C42', 'RS2_1', 'RS2_2',
      'Laser', 'Messmaschine', 'Montage', 'Montage UR5', 'Prüfplanung', 'Versand', 'Entgraten'
    ];

    // Load initial magazines for the machines in parallel to optimize performance!
    const machineMagazines = {};
    await Promise.all(machinesList.map(async (mName) => {
      const { toolNrs, magazineSize } = await getCurrentToolsForMachine(mName);
      machineMagazines[mName] = {
        magazine: toolNrs,
        size: magazineSize
      };
    }));

    // Fetch capacities from tPPS_MASTA in D4
    const machineIdMap = {
      'Brother': 8,
      'Chiron': 21,
      'C400': 2,
      'C40': 4,
      'C42': 25,
      'RS2_1': 5,
      'RS2_2': 6,
      'Laser': 16,
      'Messmaschine': 17,
      'Montage UR5': 15
    };

    let capacities = {};
    let nameCapacities = {};
    try {
      const poolD4 = await getPoolD4();
      const capResult = await poolD4.request().query(`
        SELECT ID, MS_NUMMER, MS_BEZEICHNUNG,
               MS_KAPAZITAET_ZEIT_MINUTEN_MO,
               MS_KAPAZITAET_ZEIT_MINUTEN_DI,
               MS_KAPAZITAET_ZEIT_MINUTEN_MI,
               MS_KAPAZITAET_ZEIT_MINUTEN_DO,
               MS_KAPAZITAET_ZEIT_MINUTEN_FR,
               MS_KAPAZITAET_ZEIT_MINUTEN_SA,
               MS_KAPAZITAET_ZEIT_MINUTEN_SO
        FROM [D4].[dbo].[tPPS_MASTA]
      `);
      capResult.recordset.forEach(row => {
        const id = parseInt(row.ID);
        const caps = {
          1: row.MS_KAPAZITAET_ZEIT_MINUTEN_MO || 0, // Monday
          2: row.MS_KAPAZITAET_ZEIT_MINUTEN_DI || 0, // Tuesday
          3: row.MS_KAPAZITAET_ZEIT_MINUTEN_MI || 0, // Wednesday
          4: row.MS_KAPAZITAET_ZEIT_MINUTEN_DO || 0, // Thursday
          5: row.MS_KAPAZITAET_ZEIT_MINUTEN_FR || 0, // Friday
          6: row.MS_KAPAZITAET_ZEIT_MINUTEN_SA || 0, // Saturday
          0: row.MS_KAPAZITAET_ZEIT_MINUTEN_SO || 0  // Sunday
        };
        capacities[id] = caps;

        const numStr = (row.MS_NUMMER || '').trim().toUpperCase();
        const bezStr = (row.MS_BEZEICHNUNG || '').trim().toUpperCase();

        if (numStr.includes('C400') || bezStr.includes('C400')) {
          nameCapacities['C400'] = caps;
        } else if (numStr.includes('C42') || bezStr.includes('C42')) {
          nameCapacities['C42'] = caps;
        } else if (numStr.includes('C40') || bezStr.includes('C40')) {
          nameCapacities['C40'] = caps;
        } else if (numStr.includes('CHIRON') || bezStr.includes('CHIRON')) {
          nameCapacities['CHIRON'] = caps;
        } else if (numStr.includes('BROTHER') || bezStr.includes('BROTHER')) {
          nameCapacities['BROTHER'] = caps;
        } else if (numStr.includes('RS1') || bezStr.includes('RS1') || numStr.includes('RS2_1') || bezStr.includes('RS2_1')) {
          nameCapacities['RS2_1'] = caps;
        } else if (numStr.includes('RS2') || bezStr.includes('RS2') || numStr.includes('RS2_2') || bezStr.includes('RS2_2')) {
          nameCapacities['RS2_2'] = caps;
        }
      });
    } catch (err) {
      console.error('Error fetching capacities:', err);
    }

    const getCapacityForDay = (mName, dateStr) => {
      if (dateStr === 'Überlauf') return 99999;
      const key = mName.toUpperCase();
      const capMap = nameCapacities[key] || nameCapacities[mName] || (machineIdMap[mName] && capacities[machineIdMap[mName]]);
      if (!capMap) return 0;
      const dayOfWeek = new Date(dateStr).getDay(); // 0 = Sunday, 1 = Monday, etc.
      const cap = capMap[dayOfWeek];
      return cap !== undefined ? cap : 0;
    };

    const allowLookahead = req.query.allowLookahead === 'true';
    const lastDay = new Date(planningDays[planningDays.length - 1]);
    const lookaheadLimitDate = new Date(lastDay);
    lookaheadLimitDate.setDate(lookaheadLimitDate.getDate() + 14);

    // Filter and group steps by Machine and Date
    const board = {};
    const lookaheadCandidates = {};
    machinesList.forEach(mName => {
      board[mName] = {};
      lookaheadCandidates[mName] = [];
      planningDays.forEach(day => {
        board[mName][day] = [];
      });
      board[mName]['Überlauf'] = [];
    });

    // Fetch fast native D4 schedule entries from tPPS_SKKALP_PLAN for exact D4 date matching
    const d4PlanEntries = await fetchFastD4NativePlan(planningDays[0], planningDays[planningDays.length - 1]);
    const d4PlanMap = {};
    d4PlanEntries.forEach(p => {
      const k = String(p.StepId);
      if (!d4PlanMap[k]) {
        d4PlanMap[k] = { dateStr: p.DateStr, scheduledMin: p.ScheduledMin };
      }
    });

    // List to hold pool steps that need dynamic distribution
    const poolSteps = [];

    // Populate steps
    greenSteps.forEach(step => {
      const sKey = String(step.StepId || step.originalStepId || '');
      const d4Entry = d4PlanMap[sKey];
      let stepDateStr = d4Entry ? d4Entry.dateStr : null;
      if (!stepDateStr) {
        // If strict useD4Plan mode is active, steps without tPPS_SKKALP_PLAN entry go to Überlauf!
        if (useD4Plan) {
          stepDateStr = 'Überlauf';
        } else {
          const stepDate = step.StartDate || step.DeliveryDate || planningDays[0];
          stepDateStr = new Date(stepDate).toISOString().substring(0, 10);
        }
      }

      // If step has no D4 plan date or date is in the past, route to Überlauf backlog!
      if (!stepDateStr || stepDateStr < planningDays[0]) {
        stepDateStr = 'Überlauf';
      }

      // Active steps (in execution): in interactive board mode, schedule on day 1; in useD4Plan mode, keep exact D4 date/Überlauf
      if (step.SPKO === 2 && !useD4Plan) {
        stepDateStr = planningDays[0];
      }

      // Check if it belongs to a deburring/assembly/laser virtual column
      const virtualM = getVirtualMachineForStep(step);
      if (virtualM) {
        const targetDay = planningDays.includes(stepDateStr) ? stepDateStr : 'Überlauf';
        if (targetDay) {
          board[virtualM][targetDay].push(step);
        } else if (allowLookahead && stepDateStr > planningDays[planningDays.length - 1] && new Date(stepDateStr) <= lookaheadLimitDate) {
          if (!lookaheadCandidates[virtualM].some(x => x.StepId === step.StepId)) {
            lookaheadCandidates[virtualM].push(step);
          }
        }
        return;
      }

      // Check if the step has a specific machine assignment
      let targetM = null;
      if (step.MachineId === 8) targetM = 'Brother';
      else if (step.MachineId === 21) targetM = 'Chiron';
      else if (step.MachineId === 2) targetM = 'C400';
      else if (step.MachineId === 4) targetM = 'C40';
      else if (step.MachineId === 25) targetM = 'C42';
      else if (step.MachineId === 5) targetM = 'RS2_1';
      else if (step.MachineId === 6) targetM = 'RS2_2';
      else if (!step.MachineId || step.MachineId === 0) {
        let assignedMachine = null;
        if (step.MatchedListNr && listToMachineMap[step.MatchedListNr] !== undefined) {
          const wtMachine = String(listToMachineMap[step.MatchedListNr]);
          
          if (step.MachinePoolId === 13) {
            // Pool C40-C42
            if (wtMachine === '17') {
              assignedMachine = 'C40';
            } else if (wtMachine === '18') {
              assignedMachine = 'C42';
            }
          } else if (step.MachinePoolId === 9 || step.MachinePoolId === 12) {
            // Pool RS2_1-RS2_2
            if (wtMachine === '17') {
              assignedMachine = 'RS2_1';
            } else if (wtMachine === '18') {
              assignedMachine = 'RS2_2';
            }
          }
        }
        targetM = assignedMachine;
      }

      if (targetM) {
        const targetDay = planningDays.includes(stepDateStr) ? stepDateStr : 'Überlauf';
        if (targetDay) {
          const stepToAdd = (useD4Plan && d4Entry && d4Entry.scheduledMin)
            ? { ...step, prodTime: Math.max(0, d4Entry.scheduledMin - (step.setupTime || 0)) }
            : step;
          board[targetM][targetDay].push(stepToAdd);
        } else if (allowLookahead && stepDateStr > planningDays[planningDays.length - 1] && new Date(stepDateStr) <= lookaheadLimitDate) {
          if (!lookaheadCandidates[targetM].some(x => x.StepId === step.StepId)) {
            lookaheadCandidates[targetM].push(step);
          }
        }
      } else {
        // Pool assignment step - save to list to distribute dynamically after baseline load
        if (step.MachinePoolId === 13 || step.MachinePoolId === 9 || step.MachinePoolId === 12) {
          const targetDay = planningDays.includes(stepDateStr) ? stepDateStr : 'Überlauf';
          if (targetDay) {
            poolSteps.push({ step, dateStr: targetDay });
          } else if (allowLookahead && stepDateStr > planningDays[planningDays.length - 1] && new Date(stepDateStr) <= lookaheadLimitDate) {
            if (step.MachinePoolId === 13) {
              if (!lookaheadCandidates['C40'].some(x => x.StepId === step.StepId)) lookaheadCandidates['C40'].push(step);
              if (!lookaheadCandidates['C42'].some(x => x.StepId === step.StepId)) lookaheadCandidates['C42'].push(step);
            } else if (step.MachinePoolId === 9 || step.MachinePoolId === 12) {
              if (!lookaheadCandidates['RS2_1'].some(x => x.StepId === step.StepId)) lookaheadCandidates['RS2_1'].push(step);
              if (!lookaheadCandidates['RS2_2'].some(x => x.StepId === step.StepId)) lookaheadCandidates['RS2_2'].push(step);
            }
          }
        }
      }
    });

    // Dynamically distribute pool steps (only when not in strict useD4Plan mode)
    if (!useD4Plan) {
    poolSteps.forEach(({ step, dateStr }) => {
      const stepDuration = (step.SetupTime || 0) + (step.prodTime || 0);

      if (step.MachinePoolId === 13) {
        // Pool C40-C42
        const capC40 = getCapacityForDay('C40', dateStr);
        const capC42 = getCapacityForDay('C42', dateStr);

        const loadC40 = board['C40'][dateStr].reduce((sum, s) => sum + (s.SetupTime || 0) + (s.prodTime || 0), 0);
        const loadC42 = board['C42'][dateStr].reduce((sum, s) => sum + (s.SetupTime || 0) + (s.prodTime || 0), 0);

        if (loadC40 + stepDuration <= capC40 && loadC40 <= loadC42) {
          board['C40'][dateStr].push(step);
        } else if (loadC42 + stepDuration <= capC42) {
          board['C42'][dateStr].push(step);
        } else if (loadC40 + stepDuration <= capC40) {
          board['C40'][dateStr].push(step);
        } else {
          board['C40']['Überlauf'].push(step);
        }
      } else if (step.MachinePoolId === 9 || step.MachinePoolId === 12) {
        // Pool RS2
        const capRS1 = getCapacityForDay('RS2_1', dateStr);
        const capRS2 = getCapacityForDay('RS2_2', dateStr);

        const loadRS2_1 = board['RS2_1'][dateStr].reduce((sum, s) => sum + (s.SetupTime || 0) + (s.prodTime || 0), 0);
        const loadRS2_2 = board['RS2_2'][dateStr].reduce((sum, s) => sum + (s.SetupTime || 0) + (s.prodTime || 0), 0);

        if (loadRS2_1 + stepDuration <= capRS1 && loadRS2_1 <= loadRS2_2) {
          board['RS2_1'][dateStr].push(step);
        } else if (loadRS2_2 + stepDuration <= capRS2) {
          board['RS2_2'][dateStr].push(step);
        } else if (loadRS2_1 + stepDuration <= capRS1) {
          board['RS2_1'][dateStr].push(step);
        } else {
          board['RS2_1']['Überlauf'].push(step);
        }
      }
    });
    }

    const shouldOptimize = isConflict ? false : (optimize !== 'false');
    const optimizeNightRun = isConflict ? false : (req.query.optimizeNightRun !== 'false');
    const activeAlgo = shouldOptimize ? (algo || 'greedy') : 'none';

    const finalBoard = {};
    const dailyCapacities = {};

    // If client requested native D4 Plan (for Auswertung Planung), return exact tPPS_SKKALP_PLAN board directly from D4
    if (useD4Plan) {
      machinesList.forEach(mName => {
        finalBoard[mName] = {};
        dailyCapacities[mName] = {};
        const mCaps = nameCapacities[mName.toUpperCase()] || nameCapacities[mName] || capacities[machineIdMap[mName]] || {};
        planningDays.forEach(day => {
          finalBoard[mName][day] = [];
          const dObj = new Date(day);
          const dayOfWeek = isNaN(dObj.getTime()) ? 1 : dObj.getDay();
          dailyCapacities[mName][day] = mCaps[dayOfWeek] !== undefined ? mCaps[dayOfWeek] : 0;
        });
        finalBoard[mName]['Überlauf'] = [];
      });

      // Helper to calculate total loaded minutes for a machine across all days in finalBoard
      const getBoardTotalLoadMin = (m) => {
        if (!finalBoard[m]) return 0;
        let tot = 0;
        Object.keys(finalBoard[m]).forEach(d => {
          const list = finalBoard[m][d] || [];
          list.forEach(s => { tot += (s.scheduledMin || (s.setupTime || 0) + (s.prodTime || 0)); });
        });
        return tot;
      };

      const greenStepMap = {};
      greenSteps.forEach(s => {
        const k = String(s.StepId || s.stepId || '');
        if (k) greenStepMap[k] = s;
      });

      // Two-Pass Non-Overbooking Pool Allocation Algorithm for Auswertung Planung
      // Pass 1: Fixed machine-booked jobs (p.MachineId) reserve primary daily capacity first
      const poolEntries = [];

      d4PlanEntries.forEach(p => {
        let mName = null;
        if (p.MachineId === 8) mName = 'Brother';
        else if (p.MachineId === 21) mName = 'Chiron';
        else if (p.MachineId === 2) mName = 'C400';
        else if (p.MachineId === 4) mName = 'C40';
        else if (p.MachineId === 25) mName = 'C42';
        else if (p.MachineId === 5) mName = 'RS2_1';
        else if (p.MachineId === 6) mName = 'RS2_2';

        if (!mName) {
          // Defer Pool jobs to Pass 2
          poolEntries.push(p);
          return;
        }

        const day = planningDays.includes(p.DateStr) ? p.DateStr : 'Überlauf';
        if (!finalBoard[mName] || !finalBoard[mName][day]) return;

        const isFreigegeben = (p.ZustandPlanung === 0);
        const isGesperrt = p.TypSperre > 0 || p.SperreWeiter > 0;
        const origStep = greenStepMap[String(p.StepId)] || {};

        const schMin = p.ScheduledMin !== undefined ? p.ScheduledMin : ((origStep.SetupTime || 0) + (origStep.ProdTime || 0));
        const totalSetup = (origStep.SetupTime !== undefined ? origStep.SetupTime : (origStep.setupTime || origStep.originalSetupTime)) || 0;
        const sTime = Math.min(schMin, totalSetup);
        const prTime = Math.max(0, schMin - sTime);

        finalBoard[mName][day].push({
          ...origStep,
          stepId: p.StepId,
          StepId: p.StepId,
          orderId: origStep.OrderId || origStep.orderId || p.OrderId,
          OrderId: origStep.OrderId || origStep.orderId || p.OrderId,
          contractNumber: p.ContractNumber || origStep.ContractNumber || origStep.contractNumber,
          ContractNumber: p.ContractNumber || origStep.ContractNumber || origStep.contractNumber,
          orderPos: p.OrderPos || origStep.OrderPos || origStep.orderPos,
          OrderPos: p.OrderPos || origStep.OrderPos || origStep.orderPos,
          articleDesc: p.ArticleDesc || origStep.ArticleDesc || origStep.articleDesc || origStep.OrderDesc || origStep.orderDesc,
          ArticleDesc: p.ArticleDesc || origStep.ArticleDesc || origStep.articleDesc || origStep.OrderDesc || origStep.orderDesc,
          orderDesc: origStep.OrderDesc || origStep.orderDesc || p.ArticleDesc,
          OrderDesc: origStep.OrderDesc || origStep.orderDesc || p.ArticleDesc,
          articleId: origStep.ArticleId || origStep.articleId,
          ArticleId: origStep.ArticleId || origStep.articleId,
          deliveryDate: origStep.DeliveryDate || origStep.deliveryDate,
          DeliveryDate: origStep.DeliveryDate || origStep.deliveryDate,
          ncProgram: origStep.NCProgram || origStep.ncProgram,
          NCProgram: origStep.NCProgram || origStep.ncProgram,
          matchedListNr: origStep.MatchedListNr || origStep.matchedListNr,
          MatchedListNr: origStep.MatchedListNr || origStep.matchedListNr,
          matchedListIdent: origStep.MatchedListIdent || origStep.matchedListIdent,
          MatchedListIdent: origStep.MatchedListIdent || origStep.matchedListIdent,
          matchedListNcp: origStep.MatchedListNcp || origStep.matchedListNcp,
          MatchedListNcp: origStep.MatchedListNcp || origStep.matchedListNcp,
          fixture: origStep.Fixture || origStep.fixture,
          Fixture: origStep.Fixture || origStep.fixture,
          fixtureLocation: origStep.FixtureLocation || origStep.fixtureLocation,
          FixtureLocation: origStep.FixtureLocation || origStep.fixtureLocation,
          fixtureLocationFromDb: origStep.FixtureLocationFromDb || origStep.fixtureLocationFromDb,
          scheduledMin: schMin,
          setupTime: sTime,
          prodTime: prTime,
          SetupTime: sTime,
          ProdTime: prTime,
          DateStr: p.DateStr,
          isFreigegeben,
          isGesperrt,
          isOverplanned: (p.UeberlappungProzent || origStep.UeberlappungProzent || 0) > 0,
          ueberlappungProzent: p.UeberlappungProzent || origStep.UeberlappungProzent || 0,
          maxProdTag: p.MaxProdTag || origStep.MaxProdTag || 0,
          orderCategoryColor: p.OrderCategoryColor !== undefined ? p.OrderCategoryColor : origStep.OrderCategoryColor,
          orderCategoryHex: mapD4ColorToHex(p.OrderCategoryColor !== undefined ? p.OrderCategoryColor : origStep.OrderCategoryColor),
          orderCategoryName: p.OrderCategoryName || origStep.OrderCategoryName,
          positionCategoryColor: p.PositionCategoryColor !== undefined ? p.PositionCategoryColor : origStep.PositionCategoryColor,
          positionCategoryHex: mapD4ColorToHex(p.PositionCategoryColor !== undefined ? p.PositionCategoryColor : origStep.PositionCategoryColor),
          positionCategoryName: p.PositionCategoryName || origStep.PositionCategoryName,
          color: isFreigegeben ? 'Green' : isGesperrt ? 'Red' : 'Orange',
          isFixedAssignment: true
        });
      });

      // Pass 2: Pool jobs fill remaining free capacity up to 100% max daily limit without overbooking
      // Sort pool entries descending by duration (largest job first) to optimize capacity-proportional best-fit placement
      poolEntries.sort((a, b) => {
        const origA = greenStepMap[String(a.StepId)] || {};
        const origB = greenStepMap[String(b.StepId)] || {};
        const minA = a.ScheduledMin !== undefined ? a.ScheduledMin : ((origA.SetupTime || 0) + (origA.ProdTime || 0));
        const minB = b.ScheduledMin !== undefined ? b.ScheduledMin : ((origB.SetupTime || 0) + (origB.ProdTime || 0));
        return minB - minA;
      });

      poolEntries.forEach(p => {
        const day = planningDays.includes(p.DateStr) ? p.DateStr : 'Überlauf';
        const origStep = greenStepMap[String(p.StepId)] || {};
        const stepMin = p.ScheduledMin !== undefined ? p.ScheduledMin : ((origStep.SetupTime || 0) + (origStep.ProdTime || 0));
        const totalSetup = (origStep.SetupTime !== undefined ? origStep.SetupTime : (origStep.setupTime || origStep.originalSetupTime)) || 0;
        const sTime = Math.min(stepMin, totalSetup);
        const prTime = Math.max(0, stepMin - sTime);

        let targetM = null;

        if (p.MachinePoolId === 13) {
          // Pool C40 vs C42
          const maxC40 = getCapacityForDay('C40', day);
          const maxC42 = getCapacityForDay('C42', day);
          const loadC40 = (finalBoard['C40'][day] || []).reduce((sum, s) => sum + (s.scheduledMin || 0), 0);
          const loadC42 = (finalBoard['C42'][day] || []).reduce((sum, s) => sum + (s.scheduledMin || 0), 0);

          const remC40 = Math.max(0, maxC40 - loadC40);
          const remC42 = Math.max(0, maxC42 - loadC42);

          if (stepMin <= remC40 && stepMin <= remC42) {
            targetM = remC42 >= remC40 ? 'C42' : 'C40';
          } else if (stepMin <= remC42) {
            targetM = 'C42';
          } else if (stepMin <= remC40) {
            targetM = 'C40';
          } else {
            // Cannot fit without overbooking -> route to machine with more remaining capacity
            targetM = remC42 >= remC40 ? 'C42' : 'C40';
          }
        } else if (p.MachinePoolId === 9 || p.MachinePoolId === 12) {
          // Pool RS2_1 vs RS2_2
          const maxRS1 = getCapacityForDay('RS2_1', day);
          const maxRS2 = getCapacityForDay('RS2_2', day);
          const loadRS1 = (finalBoard['RS2_1'][day] || []).reduce((sum, s) => sum + (s.scheduledMin || 0), 0);
          const loadRS2 = (finalBoard['RS2_2'][day] || []).reduce((sum, s) => sum + (s.scheduledMin || 0), 0);

          const remRS1 = Math.max(0, maxRS1 - loadRS1);
          const remRS2 = Math.max(0, maxRS2 - loadRS2);

          if (stepMin <= remRS1 && stepMin <= remRS2) {
            targetM = remRS2 >= remRS1 ? 'RS2_2' : 'RS2_1';
          } else if (stepMin <= remRS2) {
            targetM = 'RS2_2';
          } else if (stepMin <= remRS1) {
            targetM = 'RS2_1';
          } else {
            targetM = remRS2 >= remRS1 ? 'RS2_2' : 'RS2_1';
          }
        }

        if (!targetM || !finalBoard[targetM]) return;

        // If step exceeds remaining capacity on chosen day, route to Überlauf to avoid overbooking
        const targetMax = getCapacityForDay(targetM, day);
        const targetCurrentLoad = (finalBoard[targetM][day] || []).reduce((sum, s) => sum + (s.scheduledMin || 0), 0);
        const targetDay = (day !== 'Überlauf' && (targetCurrentLoad + stepMin > targetMax)) ? 'Überlauf' : day;

        const isFreigegeben = (p.ZustandPlanung === 0);
        const isGesperrt = p.TypSperre > 0 || p.SperreWeiter > 0;

        finalBoard[targetM][targetDay].push({
          ...origStep,
          stepId: p.StepId,
          StepId: p.StepId,
          orderId: origStep.OrderId || origStep.orderId || p.OrderId,
          OrderId: origStep.OrderId || origStep.orderId || p.OrderId,
          contractNumber: p.ContractNumber || origStep.ContractNumber || origStep.contractNumber,
          ContractNumber: p.ContractNumber || origStep.ContractNumber || origStep.contractNumber,
          orderPos: p.OrderPos || origStep.OrderPos || origStep.orderPos,
          OrderPos: p.OrderPos || origStep.OrderPos || origStep.orderPos,
          articleDesc: p.ArticleDesc || origStep.ArticleDesc || origStep.articleDesc || origStep.OrderDesc || origStep.orderDesc,
          ArticleDesc: p.ArticleDesc || origStep.ArticleDesc || origStep.articleDesc || origStep.OrderDesc || origStep.orderDesc,
          orderDesc: origStep.OrderDesc || origStep.orderDesc || p.ArticleDesc,
          OrderDesc: origStep.OrderDesc || origStep.orderDesc || p.ArticleDesc,
          articleId: origStep.ArticleId || origStep.articleId,
          ArticleId: origStep.ArticleId || origStep.articleId,
          deliveryDate: origStep.DeliveryDate || origStep.deliveryDate,
          DeliveryDate: origStep.DeliveryDate || origStep.deliveryDate,
          ncProgram: origStep.NCProgram || origStep.ncProgram,
          NCProgram: origStep.NCProgram || origStep.ncProgram,
          matchedListNr: origStep.MatchedListNr || origStep.matchedListNr,
          MatchedListNr: origStep.MatchedListNr || origStep.matchedListNr,
          matchedListIdent: origStep.MatchedListIdent || origStep.matchedListIdent,
          MatchedListIdent: origStep.MatchedListIdent || origStep.matchedListIdent,
          matchedListNcp: origStep.MatchedListNcp || origStep.matchedListNcp,
          MatchedListNcp: origStep.MatchedListNcp || origStep.matchedListNcp,
          fixture: origStep.Fixture || origStep.fixture,
          Fixture: origStep.Fixture || origStep.fixture,
          fixtureLocation: origStep.FixtureLocation || origStep.fixtureLocation,
          FixtureLocation: origStep.FixtureLocation || origStep.fixtureLocation,
          fixtureLocationFromDb: origStep.FixtureLocationFromDb || origStep.fixtureLocationFromDb,
          scheduledMin: stepMin,
          setupTime: sTime,
          prodTime: prTime,
          SetupTime: sTime,
          ProdTime: prTime,
          DateStr: p.DateStr,
          isFreigegeben,
          isGesperrt,
          isOverplanned: (p.UeberlappungProzent || origStep.UeberlappungProzent || 0) > 0,
          ueberlappungProzent: p.UeberlappungProzent || origStep.UeberlappungProzent || 0,
          maxProdTag: p.MaxProdTag || origStep.MaxProdTag || 0,
          orderCategoryColor: p.OrderCategoryColor !== undefined ? p.OrderCategoryColor : origStep.OrderCategoryColor,
          orderCategoryHex: mapD4ColorToHex(p.OrderCategoryColor !== undefined ? p.OrderCategoryColor : origStep.OrderCategoryColor),
          orderCategoryName: p.OrderCategoryName || origStep.OrderCategoryName,
          positionCategoryColor: p.PositionCategoryColor !== undefined ? p.PositionCategoryColor : origStep.PositionCategoryColor,
          positionCategoryHex: mapD4ColorToHex(p.PositionCategoryColor !== undefined ? p.PositionCategoryColor : origStep.PositionCategoryColor),
          positionCategoryName: p.PositionCategoryName || origStep.PositionCategoryName,
          color: isFreigegeben ? 'Green' : isGesperrt ? 'Red' : 'Orange',
          isPoolFilledStep: true
        });
      });


      // Put non-planned overflow steps into Überlauf with optimal capacity-ratio Pool load balancing
      greenSteps.forEach(s => {
        const sKey = String(s.StepId || s.originalStepId || '');
        if (!d4PlanMap[sKey]) {
          let targetM = null;
          if (s.MachineId === 8) targetM = 'Brother';
          else if (s.MachineId === 21) targetM = 'Chiron';
          else if (s.MachineId === 2) targetM = 'C400';
          else if (s.MachineId === 4) targetM = 'C40';
          else if (s.MachineId === 25) targetM = 'C42';
          else if (s.MachineId === 5) targetM = 'RS2_1';
          else if (s.MachineId === 6) targetM = 'RS2_2';
          else if (s.MachinePoolId === 13) {
            const loadC40 = (finalBoard['C40']['Überlauf'] || []).reduce((sum, x) => sum + (x.setupTime || 0) + (x.prodTime || 0), 0);
            const loadC42 = (finalBoard['C42']['Überlauf'] || []).reduce((sum, x) => sum + (x.setupTime || 0) + (x.prodTime || 0), 0);
            targetM = (loadC40 <= loadC42) ? 'C40' : 'C42';
          } else if (s.MachinePoolId === 9 || s.MachinePoolId === 12) {
            const loadRS1 = (finalBoard['RS2_1']['Überlauf'] || []).reduce((sum, x) => sum + (x.setupTime || 0) + (x.prodTime || 0), 0);
            const loadRS2 = (finalBoard['RS2_2']['Überlauf'] || []).reduce((sum, x) => sum + (x.setupTime || 0) + (x.prodTime || 0), 0);
            targetM = (loadRS1 <= loadRS2) ? 'RS2_1' : 'RS2_2';
          }

          if (targetM && finalBoard[targetM]) {
            finalBoard[targetM]['Überlauf'].push({
              ...s,
              day: 'Überlauf'
            });
          }
        }
      });

      return res.json({
        board: finalBoard,
        days: planningDays,
        planningDays,
        dailyCapacities,
        capacities,
        lookaheadCandidates,
        summary: {
          totalSteps: greenSteps.length,
          useD4Plan: true
        }
      });
    }

    const isEvaluationMode = req.query.isEvaluationMode === 'true';

    // DEDICATED BOTTLENECK SCHEDULING ALGORITHM (DRUM-BUFFER-ROPE) FOR EXCLUSIVE USE IN "AUSWERTUNG PLANUNG" (Optimierter Plan)
    if (isEvaluationMode && !useD4Plan) {
      const evalBoard = {};
      const evalDailyCapacities = {};
      const evalMillingMachines = ['Brother', 'Chiron', 'C400', 'C40', 'C42', 'RS2_1', 'RS2_2'];

      evalMillingMachines.forEach(mName => {
        evalBoard[mName] = {};
        evalDailyCapacities[mName] = {};
        const mId = machineIdMap[mName];
        const mCaps = nameCapacities[mName.toUpperCase()] || nameCapacities[mName] || capacities[mId] || {};
        planningDays.forEach(day => {
          evalBoard[mName][day] = [];
          const dObj = new Date(day);
          const dayOfWeek = isNaN(dObj.getTime()) ? 1 : dObj.getDay();
          evalDailyCapacities[mName][day] = mCaps[dayOfWeek] !== undefined ? mCaps[dayOfWeek] : 0;
        });
        evalBoard[mName]['Überlauf'] = [];
      });

      // 1. Calculate Machine Demands to Identify Primary Bottleneck (Drum)
      const machineDemandMap = {};
      evalMillingMachines.forEach(m => machineDemandMap[m] = 0);

      const resolveTargetMachine = (s) => {
        if (s.MachineId === 8) return 'Brother';
        if (s.MachineId === 21) return 'Chiron';
        if (s.MachineId === 2) return 'C400';
        if (s.MachineId === 4) return 'C40';
        if (s.MachineId === 25) return 'C42';
        if (s.MachineId === 5) return 'RS2_1';
        if (s.MachineId === 6) return 'RS2_2';
        if (s.MachinePoolId === 13) return 'C40_POOL';
        if (s.MachinePoolId === 9 || s.MachinePoolId === 12) return 'RS2_POOL';
        return null;
      };

      greenSteps.forEach(s => {
        const duration = (s.SetupTime || s.setupTime || 0) + (s.ProdTime || s.prodTime || (s.ScheduledMin || s.scheduledMin || 0));
        let m = resolveTargetMachine(s);
        if (m === 'C40_POOL') m = 'C40';
        if (m === 'RS2_POOL') m = 'RS2_1';
        if (m && machineDemandMap[m] !== undefined) {
          machineDemandMap[m] += duration;
        }
      });

      // Rank machines by capacity load ratio (Demand / Total Window Capacity)
      const machineRanks = evalMillingMachines.map(mName => {
        const totCap = planningDays.reduce((sum, d) => sum + (evalDailyCapacities[mName][d] || 0), 0);
        const demand = machineDemandMap[mName] || 0;
        const ratio = totCap > 0 ? (demand / totCap) : 0;
        return { machineName: mName, demand, totCap, ratio };
      }).sort((a, b) => b.ratio - a.ratio);

      const primaryBottleneck = machineRanks[0] ? machineRanks[0].machineName : 'C42';
      const primaryBottleneckRatio = machineRanks[0] ? Math.round(machineRanks[0].ratio * 100) : 0;

      // 2. Bottleneck-First Scheduling (Drum-Buffer-Rope)
      const scheduledStepIds = new Set();
      const stepScheduledDayMap = {};

      const isFremdleistungStep = (s) => {
        const desc = String(s.StepDesc || s.stepDesc || '').toLowerCase();
        return desc.includes('härt') || desc.includes('haert') || desc.includes('beschicht') || 
               desc.includes('verzink') || desc.includes('elox') || desc.includes('fremd') || 
               desc.includes('verlager') || desc.includes('fl') || desc.includes('wärme') || desc.includes('waerme');
      };

      const canScheduleStepOnDay = (s, currentDayIdx) => {
        const oId = s.OrderId;
        if (!oId || !ordersMap[oId]) return true;

        const orderSteps = ordersMap[oId];
        const sPos = parseInt(s.StepPos || s.stepPos || 0, 10);

        for (const pStep of orderSteps) {
          const pPos = parseInt(pStep.StepPos || pStep.stepPos || 0, 10);
          if (pPos < sPos) {
            if (pStep.SPKO === 4 || pStep.realSPKO === 4 || pStep.isCompleted) {
              continue;
            }
            const pId = String(pStep.StepId || pStep.originalStepId || '');
            const pScheduledDay = stepScheduledDayMap[pId];

            if (pScheduledDay === undefined) {
              if (!greenSteps.some(x => String(x.StepId || x.originalStepId || '') === pId)) {
                continue;
              }
              return false;
            }

            if (isFremdleistungStep(pStep)) {
              const FL_BUFFER_DAYS = 4;
              if (currentDayIdx < pScheduledDay + FL_BUFFER_DAYS) {
                return false;
              }
            } else {
              if (currentDayIdx < pScheduledDay) {
                return false;
              }
            }
          }
        }
        return true;
      };

      const orderedMachines = machineRanks.map(x => x.machineName);

      const remainingDurationMap = {};
      greenSteps.forEach(s => {
        const sId = String(s.StepId || s.originalStepId || '');
        const fullSetup = s.SetupTime || s.setupTime || 0;
        const fullProd = s.ProdTime || s.prodTime || Math.max(0, (s.ScheduledMin || s.scheduledMin || 0) - fullSetup);
        remainingDurationMap[sId] = fullSetup + fullProd;
      });

      orderedMachines.forEach(mName => {
        planningDays.forEach((day, dayIdx) => {
          const dayCap = getCapacityForDay(mName, day);
          let usedCap = evalBoard[mName][day].reduce((sum, x) => sum + (x.scheduledMin || 0), 0);

          const candidates = greenSteps.filter(s => {
            const sId = String(s.StepId || s.originalStepId || '');
            if (scheduledStepIds.has(sId)) return false;

            let targetM = resolveTargetMachine(s);
            if (targetM === 'C40_POOL') {
              const capC40 = getCapacityForDay('C40', day);
              const capC42 = getCapacityForDay('C42', day);
              const loadC40 = evalBoard['C40'][day].reduce((sum, x) => sum + (x.scheduledMin || 0), 0);
              const loadC42 = evalBoard['C42'][day].reduce((sum, x) => sum + (x.scheduledMin || 0), 0);
              targetM = (loadC40 / (capC40 || 1) <= loadC42 / (capC42 || 1)) ? 'C40' : 'C42';
            } else if (targetM === 'RS2_POOL') {
              const capRS1 = getCapacityForDay('RS2_1', day);
              const capRS2 = getCapacityForDay('RS2_2', day);
              const loadRS1 = evalBoard['RS2_1'][day].reduce((sum, x) => sum + (x.scheduledMin || 0), 0);
              const loadRS2 = evalBoard['RS2_2'][day].reduce((sum, x) => sum + (x.scheduledMin || 0), 0);
              targetM = (loadRS1 / (capRS1 || 1) <= loadRS2 / (capRS2 || 1)) ? 'RS2_1' : 'RS2_2';
            }

            if (targetM !== mName) return false;
            return canScheduleStepOnDay(s, dayIdx);
          });

          const { sequenced } = sequenceSteps(candidates, machineMagazines[mName]?.magazine || [], machineMagazines[mName]?.size || 40, listToToolsMap, 'greedy', shouldOptimizeFixture, parsedFixtureWeight);

          for (const s of sequenced) {
            const sId = String(s.StepId || s.originalStepId || '');
            if (scheduledStepIds.has(sId)) continue;
            if (usedCap >= dayCap) break;

            const remDur = remainingDurationMap[sId];
            if (remDur <= 0) continue;

            const availInDay = dayCap - usedCap;
            const allocMin = Math.min(remDur, availInDay);

            const fullSetup = s.SetupTime || s.setupTime || 0;
            const fullProd = s.ProdTime || s.prodTime || Math.max(0, (s.ScheduledMin || s.scheduledMin || 0) - fullSetup);
            let allocSetup = 0;
            let allocProd = 0;

            if (fullSetup > 0 && remainingDurationMap[sId] === (fullSetup + fullProd)) {
              allocSetup = Math.min(fullSetup, allocMin);
              allocProd = Math.max(0, allocMin - allocSetup);
            } else {
              allocSetup = 0;
              allocProd = allocMin;
            }

            evalBoard[mName][day].push({
              ...s,
              day,
              setupTime: allocSetup,
              SetupTime: allocSetup,
              prodTime: allocProd,
              ProdTime: allocProd,
              scheduledMin: allocMin,
              ScheduledMin: allocMin,
              fullSetupTime: fullSetup,
              fullProdTime: fullProd,
              contractNumber: s.ContractNumber || s.contractNumber || 'P-Auftrag',
              ContractNumber: s.ContractNumber || s.contractNumber || 'P-Auftrag',
              orderPos: s.OrderPos || s.orderPos || s.BP_POSITION_NUMMER || '10',
              OrderPos: s.OrderPos || s.orderPos || s.BP_POSITION_NUMMER || '10',
              stepPos: s.StepPos || s.stepPos || s.PSP_POSITION_NUMMER || '10',
              StepPos: s.StepPos || s.stepPos || s.PSP_POSITION_NUMMER || '10',
              stepDesc: s.StepDesc || s.stepDesc || '',
              StepDesc: s.StepDesc || s.stepDesc || '',
              isFreigegeben: s.isFreigegeben !== undefined ? s.isFreigegeben : (s.zustandPlanung !== undefined ? s.zustandPlanung === 0 : true)
            });

            usedCap += allocMin;
            remainingDurationMap[sId] -= allocMin;

            if (remainingDurationMap[sId] <= 0) {
              scheduledStepIds.add(sId);
              stepScheduledDayMap[sId] = dayIdx;
            }
          }
        });
      });

      greenSteps.forEach(s => {
        const sId = String(s.StepId || s.originalStepId || '');
        if (!scheduledStepIds.has(sId)) {
          let targetM = resolveTargetMachine(s);
          if (targetM === 'C40_POOL') targetM = 'C40';
          if (targetM === 'RS2_POOL') targetM = 'RS2_1';

          if (targetM && evalBoard[targetM]) {
            evalBoard[targetM]['Überlauf'].push({
              ...s,
              day: 'Überlauf',
              setupTime: s.SetupTime || s.setupTime || 0,
              prodTime: s.ProdTime || s.prodTime || 0,
              scheduledMin: (s.ScheduledMin || s.scheduledMin) || ((s.SetupTime || s.setupTime || 0) + (s.ProdTime || s.prodTime || 0)),
              contractNumber: s.ContractNumber || s.contractNumber || 'P-Auftrag',
              ContractNumber: s.ContractNumber || s.contractNumber || 'P-Auftrag',
              orderPos: s.OrderPos || s.orderPos || s.BP_POSITION_NUMMER || '10',
              OrderPos: s.OrderPos || s.orderPos || s.BP_POSITION_NUMMER || '10',
              stepPos: s.StepPos || s.stepPos || s.PSP_POSITION_NUMMER || '10',
              StepPos: s.StepPos || s.stepPos || s.PSP_POSITION_NUMMER || '10',
              stepDesc: s.StepDesc || s.stepDesc || '',
              StepDesc: s.StepDesc || s.stepDesc || '',
              isFreigegeben: s.isFreigegeben !== undefined ? s.isFreigegeben : (s.zustandPlanung !== undefined ? s.zustandPlanung === 0 : true)
            });
          }
        }
      });

      return res.json({
        board: evalBoard,
        days: planningDays,
        planningDays,
        dailyCapacities: evalDailyCapacities,
        capacities,
        lookaheadCandidates: {},
        summary: {
          algorithm: 'bottleneck',
          primaryBottleneck,
          primaryBottleneckRatio: primaryBottleneckRatio + '%',
          scheduledSteps: scheduledStepIds.size,
          totalSteps: greenSteps.length,
          useD4Plan: false
        }
      });
    }

    machinesList.forEach(mName => {
      // Define a local helper to run the entire 5-day scheduling loop for a single algorithm
      function runMachineScheduling(algorithm) {
        const dayScheduledMap = {};
        const dailyCap = {};
        let runningMagazine = [...machineMagazines[mName].magazine];
        const mSize = machineMagazines[mName].size;
        let overflowQueue = [];
        let totalChanges = 0;
        const scheduledStepIds = new Set();

        // Shallow clone candidate steps to prevent state contamination between runs
        const tempBoard = {};
        planningDays.forEach(d => {
          tempBoard[d] = JSON.parse(JSON.stringify(board[mName][d]));
        });

        planningDays.forEach((day, dayIdx) => {
          const dayCapacity = getCapacityForDay(mName, day);
          dailyCap[day] = dayCapacity;
          const isAutomated = mName !== 'Chiron' && mName !== 'C400' && mName !== 'Brother';

          // Unscheduled candidates: Overflow from previous days + current day candidates (no duplicate future pulling into overflow!)
          const currentDayCandidates = (tempBoard[day] || []).filter(s => !scheduledStepIds.has(s.StepId) && !scheduledStepIds.has(s.originalStepId));
          const unassignedOverflow = overflowQueue.map(s => ({ ...s }));

          let dayCandidates = [...unassignedOverflow, ...currentDayCandidates];
          
          if (allowLookahead && lookaheadCandidates[mName] && lookaheadCandidates[mName].length > 0) {
            const currentDayTools = new Set();
            dayCandidates.forEach(s => {
              const tools = listToToolsMap[s.MatchedListNr] || [];
              tools.forEach(t => currentDayTools.add(t));
            });

            lookaheadCandidates[mName].forEach(s => {
              if (scheduledStepIds.has(s.StepId) || scheduledStepIds.has(s.originalStepId)) return;
              if (!dayCandidates.some(x => x.StepId === s.StepId)) {
                dayCandidates.push({ ...s, isLookahead: true });
              }
            });
          }

          let sequencedSteps = [];

          const isNonMachining = ['Entgraten', 'Montage', 'Montage UR5', 'Laser', 'Messmaschine', 'Prüfplanung', 'Versand'].includes(mName);

          if (dayCandidates.length > 0) {
            // Force executing steps (SPKO === 2 / isExecuting) to run first, bypassing the normal/night splitting
            const executingSteps = dayCandidates.filter(s => s.SPKO === 2 || s.isExecuting);
            const nonExecutingCandidates = dayCandidates.filter(s => s.SPKO !== 2 && !s.isExecuting);

            let currentMag = [...runningMagazine];
            if (executingSteps.length > 0) {
              const { sequenced, finalMagazine } = sequenceSteps(executingSteps, currentMag, mSize, listToToolsMap, algorithm, shouldOptimizeFixture, parsedFixtureWeight);
              sequencedSteps = sequencedSteps.concat(sequenced);
              currentMag = finalMagazine;
            }



            if (nonExecutingCandidates.length > 0) {
              if (isNonMachining) {
                const { sequenced } = sequenceNonMachining(nonExecutingCandidates, orderStepsMap);
                sequencedSteps = sequencedSteps.concat(sequenced);
              } else if (shouldOptimize && optimizeNightRun && isAutomated) {
                const nightSteps = nonExecutingCandidates.filter(s => s.isNightRunCapable);
                const normalSteps = nonExecutingCandidates.filter(s => !s.isNightRunCapable);

                if (nightSteps.length > 0) {
                  const { sequenced, finalMagazine } = sequenceSteps(nightSteps, currentMag, mSize, listToToolsMap, algorithm, shouldOptimizeFixture, parsedFixtureWeight);
                  sequencedSteps = sequencedSteps.concat(sequenced);
                  currentMag = finalMagazine;
                }
                if (normalSteps.length > 0) {
                  const { sequenced, finalMagazine } = sequenceSteps(normalSteps, currentMag, mSize, listToToolsMap, algorithm, shouldOptimizeFixture, parsedFixtureWeight);
                  sequencedSteps = sequencedSteps.concat(sequenced);
                  currentMag = finalMagazine;
                }
              } else {
                const { sequenced, finalMagazine } = sequenceSteps(nonExecutingCandidates, currentMag, mSize, listToToolsMap, algorithm, shouldOptimizeFixture, parsedFixtureWeight);
                sequencedSteps = sequencedSteps.concat(sequenced);
                currentMag = finalMagazine;
              }
            }
            runningMagazine = currentMag;
          }

          // Apply capacity constraint scheduling with Staggered Shift Model (Tag & Nacht Fenster)
          const isAutomatedCell = ['RS2_1', 'RS2_2', 'C40', 'C42'].includes(mName);
          // PLANUNG MASCHINEN: Robot cells & automated machines ALLOW 24h (1440 min) unmanned night run!
          const allowNightRun = isAutomatedCell || dayCapacity > 540;
          const DAY_WINDOW_LIMIT = 540; // 07:00 - 16:00 (9 hours / 540 min)
          const nightWindowLimit = allowNightRun ? 900 : Math.max(0, dayCapacity - DAY_WINDOW_LIMIT);
          const maxDayCap = allowNightRun ? 1440 : dayCapacity;

          let usedDayMinutes = 0;
          let usedDaySetupMinutes = 0; // Tracks external setup station usage (07:00-16:00) on automated robot cells
          let usedNightMinutes = 0;
          let dayScheduled = [];
          let nextDayOverflow = [];

          sequencedSteps.forEach(s => {
            const setupTime = s.SetupTime || 0;
            const prodTime = s.prodTime || 0;
            const totalDuration = setupTime + prodTime;

            // Determine if step qualifies for night shift on this machine
            const isNightCapableOnThisMachine = allowNightRun && s.isNightRunCapable;

            if (isConflict) {
              const stepKeyId = s.originalStepId || s.StepId;
              if (scheduledStepIds.has(stepKeyId)) {
                return;
              }

              const currentTotal = usedDaySetupMinutes + usedDayMinutes + usedNightMinutes;
              const totalRemainingDay = Math.max(0, maxDayCap - currentTotal);
              
              if (totalRemainingDay > 0 && totalDuration <= totalRemainingDay) {
                dayScheduled.push({ ...s, scheduledShift: isNightCapableOnThisMachine ? 'NIGHT' : 'DAY' });
                scheduledStepIds.add(stepKeyId);
                if (isNightCapableOnThisMachine) {
                  usedDaySetupMinutes += setupTime;
                  usedNightMinutes += prodTime;
                } else {
                  usedDayMinutes += totalDuration;
                }
              } else {
                // User directive: "Nicht aufteilen in teile" in conflict mode!
                const stepKey = (s.ContractNumber || s.contractNumber || s.OrderId || s.orderId) + '_' + s.StepPos;
                if (!nextDayOverflow.some(x => x.StepId === s.StepId || ((x.ContractNumber || x.contractNumber || x.OrderId || x.orderId) + '_' + x.StepPos) === stepKey)) {
                  if (!nextDayOverflow.some(x => (x.originalStepId || x.StepId) === (s.originalStepId || s.StepId))) { nextDayOverflow.push(s); }
                }
              }
            } else if (isNightCapableOnThisMachine) {
              // NIGHT STEP ON ROBOT CELL: Setup happens on external station during Day Window (07:00-16:00, max 540 min)
              // Setup of next order is ALLOWED to overlap in parallel with production time of other orders!
              // ABSOLUTE HARD CAP: Total scheduled workload per calendar day MUST NEVER EXCEED D4 dayCapacity limit!
              const currentTotalWorkload = usedDaySetupMinutes + usedDayMinutes + usedNightMinutes;
              const totalRemainingDay = Math.max(0, maxDayCap - currentTotalWorkload);
              const daySetupRemaining = Math.min(totalRemainingDay, Math.max(0, DAY_WINDOW_LIMIT - (isAutomated ? usedDaySetupMinutes : usedDayMinutes)));
              const nightRemaining = Math.min(totalRemainingDay, Math.max(0, nightWindowLimit - usedNightMinutes));

              if ((setupTime === 0 || setupTime <= daySetupRemaining) && prodTime <= nightRemaining && (setupTime + prodTime <= totalRemainingDay)) {
                dayScheduled.push({ ...s, scheduledShift: 'NIGHT' });
                if (isAutomated) {
                  usedDaySetupMinutes += setupTime;
                } else {
                  usedDayMinutes += setupTime;
                }
                usedNightMinutes += prodTime;
              } else if ((setupTime === 0 || setupTime <= daySetupRemaining) && nightRemaining > 0 && totalRemainingDay > setupTime) {
                const fittedProdTime = Math.min(nightRemaining, totalRemainingDay - setupTime);
                const remainingProdTime = prodTime - fittedProdTime;

                dayScheduled.push({
                  ...s,
                  prodTime: fittedProdTime,
                  isSplit: true,
                  splitPart: s.splitPart || 1,
                  originalStepId: s.originalStepId || s.StepId,
                  scheduledShift: 'NIGHT'
                });
                if (isAutomated) {
                  usedDaySetupMinutes += setupTime;
                } else {
                  usedDayMinutes += setupTime;
                }
                usedNightMinutes += fittedProdTime;

                if (remainingProdTime > 0) {
                  nextDayOverflow.push({
                    ...s,
                    SetupTime: 0,
                    prodTime: remainingProdTime,
                    isSplit: true,
                    splitPart: (s.splitPart || 1) + 1,
                    originalStepId: s.originalStepId || s.StepId
                  });
                }
              } else {
                if (!nextDayOverflow.some(x => (x.originalStepId || x.StepId) === (s.originalStepId || s.StepId))) { nextDayOverflow.push(s); }
              }
            } else {
              // DAY STEP: Both Setup AND Prod Time fill Day Window (07:00-16:00, max 540 min or dayCapacity)
              const currentTotalWorkload = usedDaySetupMinutes + usedDayMinutes + usedNightMinutes;
              const totalRemainingDay = Math.max(0, maxDayCap - currentTotalWorkload);
              const maxDayLimitForMachine = Math.min(DAY_WINDOW_LIMIT, dayCapacity, totalRemainingDay);
              const dayRemaining = Math.max(0, maxDayLimitForMachine - usedDayMinutes);

              if (dayRemaining > 0) {
                if (totalDuration <= dayRemaining) {
                  dayScheduled.push({ ...s, scheduledShift: 'DAY' });
                  usedDayMinutes += totalDuration;
                } else if (setupTime <= dayRemaining) {
                  const fittedProdTime = Math.min(dayRemaining - setupTime, totalRemainingDay - setupTime);
                  const remainingProdTime = prodTime - fittedProdTime;

                  dayScheduled.push({
                    ...s,
                    prodTime: fittedProdTime,
                    isSplit: true,
                    splitPart: s.splitPart || 1,
                    originalStepId: s.originalStepId || s.StepId,
                    scheduledShift: 'DAY'
                  });
                  usedDayMinutes += (setupTime + fittedProdTime);

                  if (remainingProdTime > 0) {
                    nextDayOverflow.push({
                      ...s,
                      SetupTime: 0,
                      prodTime: remainingProdTime,
                      isSplit: true,
                      splitPart: (s.splitPart || 1) + 1,
                      originalStepId: s.originalStepId || s.StepId
                    });
                  }
                } else {
                  // Partial setup fits today, remaining setup + prod overflows to next day
                  const fittedSetupTime = Math.min(dayRemaining, totalRemainingDay);
                  const remainingSetupTime = setupTime - fittedSetupTime;

                  dayScheduled.push({
                    ...s,
                    SetupTime: fittedSetupTime,
                    prodTime: 0,
                    isSplit: true,
                    splitPart: s.splitPart || 1,
                    originalStepId: s.originalStepId || s.StepId,
                    scheduledShift: 'DAY'
                  });
                  usedDayMinutes += fittedSetupTime;

                  nextDayOverflow.push({
                    ...s,
                    SetupTime: remainingSetupTime,
                    prodTime: prodTime,
                    isSplit: true,
                    splitPart: (s.splitPart || 1) + 1,
                    originalStepId: s.originalStepId || s.StepId
                  });
                }
              } else {
                if (!nextDayOverflow.some(x => (x.originalStepId || x.StepId) === (s.originalStepId || s.StepId))) { nextDayOverflow.push(s); }
              }
            }
          });

          // LOOKAHEAD CAPACITY FILLER PASS: Pull future orders to saturate capacity to 100% if utilized minutes are below 100%
          if (allowLookahead && lookaheadCandidates[mName] && lookaheadCandidates[mName].length > 0) {
            const currentDayTools = new Set();
            dayScheduled.forEach(s => {
              const tools = listToToolsMap[s.MatchedListNr] || [];
              tools.forEach(t => currentDayTools.add(t));
            });

            // Sort future lookahead candidates so orders sharing tools with the current day/night schedule are pulled first!
            const sortedLookahead = [...lookaheadCandidates[mName]].sort((a, b) => {
              const toolsA = listToToolsMap[a.MatchedListNr] || [];
              const toolsB = listToToolsMap[b.MatchedListNr] || [];
              const overlapA = toolsA.filter(t => currentDayTools.has(t)).length;
              const overlapB = toolsB.filter(t => currentDayTools.has(t)).length;
              return overlapB - overlapA; // Highest tool overlap first!
            });

            // Fill Night Window to 100% (900 min / 15h) with strict 1440 min (24.0h) hard cap
            if (allowNightRun && usedNightMinutes < nightWindowLimit) {
              for (const cand of sortedLookahead) {
                if (usedNightMinutes >= nightWindowLimit) break;
                if (scheduledStepIds.has(cand.StepId) || scheduledStepIds.has(cand.originalStepId)) continue;
                if (!cand.isNightRunCapable) continue;

                const currentTotalWorkload = usedDaySetupMinutes + usedDayMinutes + usedNightMinutes;
                const totalRemainingDay = Math.max(0, maxDayCap - currentTotalWorkload);
                if (totalRemainingDay <= 0) break;

                const candSetup = cand.SetupTime || 0;
                const candProd = cand.prodTime || 0;
                const daySetupRem = Math.min(totalRemainingDay, Math.max(0, DAY_WINDOW_LIMIT - (isAutomated ? usedDaySetupMinutes : usedDayMinutes)));
                const nightRem = Math.min(totalRemainingDay, Math.max(0, nightWindowLimit - usedNightMinutes));

                if ((candSetup === 0 || candSetup <= daySetupRem) && nightRem > 0 && totalRemainingDay > candSetup) {
                  const fittedProd = Math.min(candProd, nightRem, totalRemainingDay - candSetup);
                  const remainingProd = candProd - fittedProd;

                  const scheduledCand = {
                    ...cand,
                    prodTime: fittedProd,
                    isSplit: remainingProd > 0 || cand.isSplit,
                    splitPart: cand.splitPart || 1,
                    originalStepId: cand.originalStepId || cand.StepId,
                    scheduledShift: 'NIGHT',
                    isLookahead: true
                  };

                  dayScheduled.push(scheduledCand);
                  if (isAutomated) {
                    usedDaySetupMinutes += candSetup;
                  } else {
                    usedDayMinutes += candSetup;
                  }
                  usedNightMinutes += fittedProd;
                  scheduledStepIds.add(cand.StepId);
                  if (cand.originalStepId) scheduledStepIds.add(cand.originalStepId);

                  if (remainingProd > 0) {
                    nextDayOverflow.push({
                      ...cand,
                      SetupTime: 0,
                      prodTime: remainingProd,
                      isSplit: true,
                      splitPart: (cand.splitPart || 1) + 1,
                      originalStepId: cand.originalStepId || cand.StepId,
                      isLookahead: true
                    });
                  }
                }
              }
            }

            // Fill Day Window to 100% (540 min / 9h)
            if (usedDayMinutes < DAY_WINDOW_LIMIT) {
              for (const cand of sortedLookahead) {
                if (usedDayMinutes >= DAY_WINDOW_LIMIT) break;
                if (scheduledStepIds.has(cand.StepId) || scheduledStepIds.has(cand.originalStepId)) continue;

                const candTotal = (cand.SetupTime || 0) + (cand.prodTime || 0);
                const dayRem = Math.max(0, DAY_WINDOW_LIMIT - usedDayMinutes);

                if (dayRem > (cand.SetupTime || 0)) {
                  const fittedProd = Math.min(cand.prodTime || 0, dayRem - (cand.SetupTime || 0));
                  const remainingProd = (cand.prodTime || 0) - fittedProd;

                  const scheduledCand = {
                    ...cand,
                    prodTime: fittedProd,
                    isSplit: remainingProd > 0 || cand.isSplit,
                    splitPart: cand.splitPart || 1,
                    originalStepId: cand.originalStepId || cand.StepId,
                    scheduledShift: 'DAY',
                    isLookahead: true
                  };

                  dayScheduled.push(scheduledCand);
                  usedDayMinutes += (cand.SetupTime || 0) + fittedProd;
                  scheduledStepIds.add(cand.StepId);
                  if (cand.originalStepId) scheduledStepIds.add(cand.originalStepId);

                  if (remainingProd > 0) {
                    nextDayOverflow.push({
                      ...cand,
                      SetupTime: 0,
                      prodTime: remainingProd,
                      isSplit: true,
                      splitPart: (cand.splitPart || 1) + 1,
                      originalStepId: cand.originalStepId || cand.StepId,
                      isLookahead: true
                    });
                  }
                }
              }
            }
          }

          overflowQueue = nextDayOverflow;
          dayScheduledMap[day] = dayScheduled;

          // Compute tool changes changes count for this day
          dayScheduled.forEach(s => {
            totalChanges += (s.missesCount || 0);
            scheduledStepIds.add(s.originalStepId || s.StepId);
          });
        });

        const seenOverflowIds = new Set();
        const deduplicatedOverflow = [];
        overflowQueue.forEach(s => {
          const keyId = s.originalStepId || s.StepId || s.stepId || s.id;
          if (!seenOverflowIds.has(keyId)) {
            seenOverflowIds.add(keyId);
            deduplicatedOverflow.push(s);
          }
        });

        dayScheduledMap['Überlauf'] = deduplicatedOverflow;
        dayScheduledMap['Überlauf'].forEach(s => {
          totalChanges += (s.missesCount || 0);
        });

        return {
          dayScheduledMap,
          dailyCap,
          totalChanges
        };
      }

      let selectedResult;
      if (activeAlgo === 'hybrid') {
        const greedyRes = runMachineScheduling('greedy');
        const gaRes = runMachineScheduling('ga');
        const rlRes = runMachineScheduling('rl');

        console.log(`[Global Machine Selection - ${mName}] Greedy: ${greedyRes.totalChanges} changes, GA: ${gaRes.totalChanges} changes, RL: ${rlRes.totalChanges} changes`);

        let bestRes = greedyRes;
        if (gaRes.totalChanges < bestRes.totalChanges) {
          bestRes = gaRes;
        }
        if (rlRes.totalChanges < bestRes.totalChanges) {
          bestRes = rlRes;
        }
        selectedResult = bestRes;
      } else {
        selectedResult = runMachineScheduling(activeAlgo);
      }

      dailyCapacities[mName] = selectedResult.dailyCap;
      finalBoard[mName] = {};

      const daysToMap = [...planningDays, 'Überlauf'];
      daysToMap.forEach(day => {
        const daySteps = selectedResult.dayScheduledMap[day] || [];
        finalBoard[mName][day] = daySteps.map(s => {
          const tools = listToToolsMap[s.MatchedListNr] || [];
          const originalDate = s.StartDate || s.DeliveryDate;
          const originalDateStr = originalDate ? new Date(originalDate).toISOString().substring(0, 10) : '';
          const isConflict = originalDateStr && (originalDateStr < planningDays[0]);

          const entireArbeitsplan = (ordersMap[s.OrderId] || [])
            .map(planStep => {
              const isFremd = planStep.StepTyp === 1 || (planStep.StepDesc && /fremd|extern|härten|beschichten|eloxieren|verzinken|schleifen/i.test(planStep.StepDesc));
              let machineName = isFremd ? 'Extern' : 'Sonstige';
              if (planStep.MachineId && machineMap[planStep.MachineId]) {
                machineName = machineMap[planStep.MachineId];
              } else if (planStep.MachinePoolId && poolMap[planStep.MachinePoolId]) {
                machineName = poolMap[planStep.MachinePoolId];
              } else if (planStep.MachineId) {
                machineName = `Maschine #${planStep.MachineId}`;
              } else if (planStep.MachinePoolId) {
                machineName = `Pool #${planStep.MachinePoolId}`;
              }
              return {
                stepId: planStep.StepId,
                stepPos: planStep.StepPos,
                stepDesc: (planStep.StepDesc || '').trim(),
                color: planStep.color || 'Yellow',
                setupTime: planStep.SetupTime !== undefined ? planStep.SetupTime : (planStep.setupTime || 0),
                prodTime: planStep.ProdTime !== undefined ? planStep.ProdTime : (planStep.prodTime || 0),
                scheduledMin: (planStep.SetupTime || 0) + (planStep.ProdTime || 0),
                isCompleted: planStep.SPKO === 4,
                isExecuting: planStep.SPKO === 2,
                machineName: machineName
              };
            });

          const st = s.SetupTime !== undefined ? s.SetupTime : (s.setupTime || 0);
          const pr = (s.ProdTime !== undefined && s.ProdTime > 0) ? s.ProdTime : (s.prodTime || 0);
          const sch = (s.ScheduledMin !== undefined && s.ScheduledMin > 0) ? s.ScheduledMin : (s.scheduledMin || (st + pr));

          return {
            stepId: s.StepId,
            orderId: s.OrderId,
            contractNumber: s.ContractNumber || null,
            belegArt: s.belegArt !== undefined ? s.belegArt : s.BelegArt,
            isFreigegeben: s.isFreigegeben !== undefined ? s.isFreigegeben : (s.BelegArt === 1),
            isGesperrt: (s.TypSperre > 0 || s.SperreWeiter > 0) || false,
            typSperre: s.TypSperre || 0,
            deliveryDate: s.DeliveryDate || null,
            stepPos: s.StepPos || null,
            orderPos: s.OrderPos || null,
            articleId: s.ArticleId,
            orderDesc: s.OrderDesc,
            stepDesc: (s.StepDesc || '').trim(),
            setupTime: st,
            prodTime: pr,
            scheduledMin: sch,
            originalSetupTime: s.originalSetupTime !== undefined ? s.originalSetupTime : st,
            originalProdTime: s.originalProdTime !== undefined ? s.originalProdTime : pr,
            isNightRunCapable: s.isNightRunCapable || false,
            scheduledShift: s.scheduledShift || 'DAY',
            maxNightQty: s.MaxNightQty || 0,
            maxDayQty: s.MaxDayQty || 0,
            isConflict: isConflict || false,
            targetDayTag: 'T' + Math.min(4, Math.max(1, planningDays.indexOf(day) + 1)),
            originalStartDate: originalDateStr || null,
            isSplit: s.isSplit || false,
            isLookahead: originalDateStr ? (originalDateStr > planningDays[planningDays.length - 1]) : false,
            isWrongMachine: (
               (s.StepDesc && s.StepDesc.toLowerCase().includes('c40') && s.MachineId === 4) ||
               (s.StepDesc && s.StepDesc.toLowerCase().includes('c42') && s.MachineId === 25) ||
               (s.StepDesc && s.StepDesc.toLowerCase().includes('rs2') && (s.MachineId === 5 || s.MachineId === 6))
             ) || false,
             splitPart: s.splitPart || null,
             isExecuting: s.SPKO === 2,
             bookedTime: s.BookedTime || 0,
             ncProgram: s.NCProgram || null,
             matchedListNr: s.MatchedListNr || null,
            matchedListIdent: s.MatchedListIdent || null,
            matchedListNcp: s.MatchedListNcp || null,
            matchedType: s.MatchedType || null,
            matchedScore: s.MatchedScore || null,
            masterNcProgram: s.masterNcProgram || null,
            masterMatchedListNr: s.masterMatchedListNr || null,
            masterMatchedListIdent: s.masterMatchedListIdent || null,
            masterMatchedListNcp: s.masterMatchedListNcp || null,
            masterMatchedType: s.masterMatchedType || null,
            masterMatchedScore: s.masterMatchedScore || null,
            color: s.color,
            predStepPos: s.predStepPos || null,
            predStepDesc: s.predStepDesc || null,
            predSPKO: s.predSPKO !== undefined ? s.predSPKO : null,
            PlannedDays: s.PlannedDays || 1,
            HistAvgDays: s.HistAvgDays || s.PlannedDays || 1,
            OrderPlanDays: s.OrderPlanDays || 1,
            UsedDays: s.UsedDays || 0,
            fixture: s.fixture || extractFixture(s.StepDesc),
            fixtureLocation: s.fixtureLocation || (s.fixture ? (fixtureLocationMap[s.fixture.trim().toLowerCase()] || extractLagerortFromDesc(s.StepDesc)) : null),
            fixtureLocationFromDb: s.fixtureLocationFromDb !== undefined ? s.fixtureLocationFromDb : (s.fixture ? !!fixtureLocationMap[s.fixture.trim().toLowerCase()] : false),
            machinePoolId: s.MachinePoolId || null,
            machineId: s.MachineId || null,
            manualMachineOverride: s.manualMachineOverride || null,
            entireArbeitsplan,
            missesCount: s.loadTools ? s.loadTools.length : 0,
            loadTools: (s.loadTools || []).map(tNr => {
              const details = toolsDetails[tNr];
              return {
                nr: tNr,
                desc: details ? details.desc : 'Unbekannt',
                dia: details ? details.dia : null,
                len: details ? details.len : null,
                currentMachines: (toolMachineMap || {})[tNr] || []
              };
            }),
            unloadTools: (s.unloadTools || []).map(tNr => {
              const details = toolsDetails[tNr];
              return {
                nr: tNr,
                desc: details ? details.desc : 'Unbekannt',
                dia: details ? details.dia : null,
                len: details ? details.len : null,
                currentMachines: (toolMachineMap || {})[tNr] || []
              };
            }),
            directMisses: tools.filter(tNr => !((machineMagazines[mName] && machineMagazines[mName].magazine) || []).includes(tNr)).map(tNr => {
              const details = toolsDetails[tNr];
              return {
                nr: tNr,
                desc: details ? details.desc : 'Unbekannt',
                dia: details ? details.dia : null,
                len: details ? details.len : null,
                currentMachines: (toolMachineMap || {})[tNr] || []
              };
            }),
            directHits: tools.filter(tNr => ((machineMagazines[mName] && machineMagazines[mName].magazine) || []).includes(tNr)).map(tNr => {
              const details = toolsDetails[tNr];
              return {
                nr: tNr,
                desc: details ? details.desc : 'Unbekannt',
                dia: details ? details.dia : null,
                len: details ? details.len : null,
                currentMachines: (toolMachineMap || {})[tNr] || []
              };
            }),
            toolsCount: tools.length
          };
        });
      });
    });

    // Check if any machine has overflow steps to optionally append the 'Überlauf' column
    let hasOverflow = false;
    machinesList.forEach(mName => {
      if (finalBoard[mName]['Überlauf'] && finalBoard[mName]['Überlauf'].length > 0) {
        hasOverflow = true;
      }
    });

    // Calculate setup time and tool change savings (total and per-machine)
    let totalOriginalChanges = 0;
    let totalOptimizedChanges = 0;
    let totalOriginalSetupTime = 0;
    let totalSavedMinutes = 0;
    const machineSavings = {};

    machinesList.forEach(mName => {
      const initialMag = machineMagazines[mName]?.magazine || [];
      const mSize = machineMagazines[mName]?.size || 20;

      // 2. Optimized scheduled steps (excluding 'Überlauf' for savings metrics)
      const scheduledSteps = [].concat(...planningDays.map(day => finalBoard[mName][day] || []));
      const optScheduledStepsMapped = scheduledSteps.map(s => ({
        MatchedListNr: s.matchedListNr,
        StartDate: s.startDate,
        DeliveryDate: s.deliveryDate,
        SetupTime: s.setupTime,
        StepId: s.stepId
      }));
      const optChanges = calculateToolChanges(optScheduledStepsMapped, initialMag, mSize, listToToolsMap);
      totalOptimizedChanges += optChanges;

      // 1. Unoptimized baseline: take ONLY the non-lookahead steps that were originally scheduled this week
      const origScheduledSteps = scheduledSteps.filter(s => !s.isLookahead).map(s => {
        let found = null;
        for (let day of planningDays) {
          const candidate = board[mName][day].find(c => c.StepId === (s.originalStepId || s.stepId));
          if (candidate) {
            found = candidate;
            break;
          }
        }
        return found || {
          MatchedListNr: s.matchedListNr,
          StartDate: s.originalStartDate,
          DeliveryDate: s.originalStartDate,
          SetupTime: s.setupTime,
          StepId: s.stepId
        };
      });

      origScheduledSteps.sort((a, b) => {
        const dateA = new Date(a.StartDate || a.DeliveryDate || '9999-12-31').getTime();
        const dateB = new Date(b.StartDate || b.DeliveryDate || '9999-12-31').getTime();
        return dateA - dateB;
      });

      let origChanges = calculateToolChanges(origScheduledSteps, initialMag, mSize, listToToolsMap);

      if (allowLookahead) {
        const lookaheadSteps = scheduledSteps.filter(s => s.isLookahead);
        lookaheadSteps.forEach(s => {
          const tools = listToToolsMap[s.matchedListNr] || [];
          const misses = tools.filter(t => !initialMag.includes(t));
          origChanges += Math.max(1, misses.length);
        });
      }

      totalOriginalChanges += origChanges;

      // Simulate unoptimized setup times for candidates (chronological order, optimal eviction)
      let currentMagUnopt = [...initialMag];
      const unoptimizedSetupTimes = {};
      origScheduledSteps.forEach((s, idx) => {
        const tools = listToToolsMap[s.MatchedListNr] || [];
        const load = tools.filter(t => !currentMagUnopt.includes(t));
        
        load.forEach(tNr => {
          while (currentMagUnopt.length >= mSize) {
            const candidates = currentMagUnopt.filter(mNr => !tools.includes(mNr));
            if (candidates.length === 0) break;
            
            const remaining = origScheduledSteps.slice(idx + 1);
            const victim = findOptimalVictim(candidates, remaining, listToToolsMap);
            currentMagUnopt = currentMagUnopt.filter(mNr => mNr !== victim);
          }
          currentMagUnopt.push(tNr);
        });

        const unoptSetup = tools.length > 0 
          ? s.SetupTime * (0.3 + 0.7 * (load.length / tools.length))
          : s.SetupTime;
        unoptimizedSetupTimes[s.StepId] = unoptSetup;
      });

      // Compute actual setup savings and original setup time
      let mSavedMinutes = 0;
      let mOriginalSetupTime = 0;

      scheduledSteps.forEach(s => {
        let unoptSetup = s.setupTime || 0;
        if (!s.isSplit || s.splitPart === 1) {
          unoptSetup = unoptimizedSetupTimes[s.originalStepId || s.stepId] || s.setupTime || 0;
        }

        const tools = listToToolsMap[s.matchedListNr] || [];
        const optSetup = tools.length > 0 
          ? s.setupTime * (0.3 + 0.7 * (s.missesCount / tools.length))
          : s.setupTime;

        const stepSaving = Math.max(0, unoptSetup - optSetup);
        mSavedMinutes += stepSaving;
        mOriginalSetupTime += unoptSetup;
      });

      mSavedMinutes = Math.round(mSavedMinutes);
      mOriginalSetupTime = Math.round(mOriginalSetupTime);

      totalOriginalSetupTime += mOriginalSetupTime;
      totalSavedMinutes += mSavedMinutes;

      const mSavedChanges = Math.max(0, origChanges - optChanges);
      machineSavings[mName] = {
        originalChanges: origChanges,
        optimizedChanges: optChanges,
        savedChanges: mSavedChanges,
        savedMinutes: mSavedMinutes,
        originalSetupTime: mOriginalSetupTime
      };
    });

    const savedChanges = Math.max(0, totalOriginalChanges - totalOptimizedChanges);
    const savedMinutes = totalSavedMinutes;

    const responseDays = [...planningDays];
    if (hasOverflow) {
      responseDays.push('Überlauf');
    }

    // Post-process finalBoard to add poolRecommendation where applicable
    const partnerMachineMap = {
      'C40': 'C42',
      'C42': 'C40',
      'RS2_1': 'RS2_2',
      'RS2_2': 'RS2_1'
    };

    const poolMachiningList = ['C40', 'C42', 'RS2_1', 'RS2_2'];
    poolMachiningList.forEach(mName => {
      const partnerName = partnerMachineMap[mName];
      if (!partnerName || !finalBoard[mName] || !finalBoard[partnerName]) return;

      const magSelf = machineMagazines[mName].magazine || [];
      const magPartner = machineMagazines[partnerName].magazine || [];

      responseDays.forEach(day => {
        const steps = finalBoard[mName][day] || [];
        steps.forEach(step => {
          const tools = listToToolsMap[step.matchedListNr] || [];
          if (tools.length > 0) {
            const overlapSelf = tools.filter(t => magSelf.includes(t)).length;
            const overlapPartner = tools.filter(t => magPartner.includes(t)).length;
            
            if (overlapPartner > overlapSelf) {
              step.poolRecommendation = {
                originalMachine: mName,
                partnerMachine: partnerName,
                overlapSelf,
                overlapPartner,
                savings: overlapPartner - overlapSelf
              };
            }
          }
        });
      });
    });

    res.json({
      days: responseDays,
      machines: machinesList,
      board: finalBoard,
      capacities: dailyCapacities,
      savings: {
        total: {
          originalChanges: totalOriginalChanges,
          optimizedChanges: totalOptimizedChanges,
          savedChanges,
          savedMinutes,
          originalSetupTime: totalOriginalSetupTime
        },
        machines: machineSavings
      },
      toolMachineMap: toolMachineMap || {}
    });

  } catch (err) {
    console.error('Error generating planning data:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Setup Time Optimization Simulation (Runs instantly in memory from cached base data)
app.get('/api/setup-reduction', async (req, res) => {
  try {
    if (!cachedSetupData) {
      console.log('cachedSetupData is null. Recalculating base cache dynamically for setup reduction...');
      await cacheSetupData();
    }
    const baseSetSize = parseInt(req.query.baseSetSize) || 20;
    const { startDate, endDate, machineId } = req.query;
    
    let { steps, listToToolsMap, toolsDetails } = cachedSetupData;
    let filteredSteps = steps;

    // Resolve selected machine and its magazineSize
    const machine = cachedMachines.find(m => m.id === machineId);
    const magazineSize = machine ? machine.magazineSize : null;

    // Filter by machine/pool if provided
    if (machineId) {
      const parts = machineId.split('_');
      const type = parts[0]; // 'pool' or 'machine'
      const dbId = parseInt(parts[1]); // ID as integer
      if (!isNaN(dbId)) {
        filteredSteps = filteredSteps.filter(step => {
          let effMachineId = step.MachineId;
          if ((!effMachineId || effMachineId === 0) && step.MatchedListNr && cachedSetupData.listToMachineMap && cachedSetupData.listToMachineMap[step.MatchedListNr] !== undefined) {
            const wtMachine = String(cachedSetupData.listToMachineMap[step.MatchedListNr]);
            if (step.MachinePoolId === 13) {
              if (wtMachine === '17') effMachineId = 4; // C40
              else if (wtMachine === '18') effMachineId = 25; // C42
            } else if (step.MachinePoolId === 9 || step.MachinePoolId === 12) {
              if (wtMachine === '17') effMachineId = 5; // RS2_1
              else if (wtMachine === '18') effMachineId = 6; // RS2_2
            }
          }

          if (type === 'pool') {
            return step.MachinePoolId === dbId;
          } else {
            return effMachineId === dbId;
          }
        });
      }
    }

    if (startDate || endDate) {
      filteredSteps = filteredSteps.filter(step => {
        const targetDate = step.StartDate || step.DeliveryDate;
        if (!targetDate) return false;
        const dStr = new Date(targetDate).toISOString().substring(0, 10);
        if (startDate && dStr < startDate) return false;
        if (endDate && dStr > endDate) return false;
        return true;
      });
    }

    // Always recalculate tool frequencies based on unique lists matching the timeframe and machine/pool
    const activeUsageCounts = {};
    const uniqueMatchedLists = new Set();
    filteredSteps.forEach(step => {
      if (step.MatchedListNr) {
        uniqueMatchedLists.add(step.MatchedListNr);
      }
    });
    uniqueMatchedLists.forEach(listNr => {
      const tools = listToToolsMap[listNr] || [];
      tools.forEach(tNr => {
        activeUsageCounts[tNr] = (activeUsageCounts[tNr] || 0) + 1;
      });
    });
    const toolUsageCounts = activeUsageCounts;

    const sortedTools = Object.keys(toolUsageCounts)
      .map(nr => ({ nr: parseInt(nr), count: toolUsageCounts[nr] }))
      .sort((a, b) => b.count - a.count);
      
    const baseSetTools = new Set(sortedTools.slice(0, baseSetSize).map(t => t.nr));

    const baseToolsDetails = [];
    const baseToolIds = sortedTools.slice(0, baseSetSize).map(t => t.nr);

    // Fetch parts for base tools dynamically
    let baseToolsPartsMap = {};
    if (baseToolIds.length > 0) {
      try {
        const poolWT = await getPoolWT();
        const partsResult = await poolWT.request().query(`
          SELECT
            tp.ToolNr, tp.Pos as PartPos, tp.Nbr as PartQty,
            p.Nr as PartNr, p.Descript as PartDesc, p.KeyWord as PartKeyWord
          FROM [WTDATA].[dbo].[ToolParts] tp
          INNER JOIN [WTDATA].[dbo].[Parts] p ON p.ID = tp.PartID
          WHERE tp.ToolNr IN (${baseToolIds.join(',')})
          ORDER BY tp.ToolNr, tp.Pos
        `);
        partsResult.recordset.forEach(row => {
          const tNr = row.ToolNr;
          if (!baseToolsPartsMap[tNr]) {
            baseToolsPartsMap[tNr] = [];
          }
          baseToolsPartsMap[tNr].push({
            partPos: row.PartPos,
            partQty: row.PartQty,
            partNr: row.PartNr ? row.PartNr.toString().trim() : '',
            partDesc: row.PartDesc ? row.PartDesc.toString().trim() : '',
            partKeyWord: row.PartKeyWord ? row.PartKeyWord.toString().trim() : ''
          });
        });
      } catch (err) {
        console.error('Error fetching base tools parts:', err);
      }
    }

    baseToolIds.forEach(nr => {
      const details = toolsDetails[nr];
      if (details) {
        baseToolsDetails.push({
          ...details,
          usesCount: toolUsageCounts[nr],
          parts: baseToolsPartsMap[nr] || []
        });
      }
    });

    let totalOriginalSetup = 0;
    let totalSimulatedSetup = 0;
    let analyzedStepsCount = 0;
    let matchedStepsCount = 0;
    let feasibleStepsCount = 0;

    const simulatedSteps = filteredSteps.map(step => {
      totalOriginalSetup += step.SetupTime;
      analyzedStepsCount++;

      let tools = [];
      if (step.MatchedListNr) {
        tools = listToToolsMap[step.MatchedListNr] || [];
        matchedStepsCount++;
      }

      let simulatedTime = step.SetupTime;
      let savings = 0;
      let missingToolsCount = tools.length;
      let baseToolsInJobCount = 0;
      
      if (tools.length > 0) {
        tools.forEach(tNr => {
          if (baseSetTools.has(tNr)) {
            baseToolsInJobCount++;
          }
        });
        missingToolsCount = tools.length - baseToolsInJobCount;

        const ratio = missingToolsCount / tools.length;
        const minFactor = 0.3; // 30% fixed setup time
        const reductionFactor = minFactor + (1.0 - minFactor) * ratio;
        simulatedTime = Math.round(step.SetupTime * reductionFactor);
        savings = step.SetupTime - simulatedTime;
      }

      totalSimulatedSetup += simulatedTime;

      // Magazine slot utilization calculation
      let isFeasible = true;
      let occupiedSlots = 0;
      if (magazineSize) {
        occupiedSlots = baseSetSize + missingToolsCount;
        isFeasible = occupiedSlots <= magazineSize;
        if (isFeasible) {
          feasibleStepsCount++;
        }
      } else {
        feasibleStepsCount++; // always feasible if no magazine constraint
      }

      return {
        stepId: step.StepId,
        desc: step.StepDesc.trim().replace(/\s+/g, ' '),
        originalSetup: step.SetupTime,
        simulatedSetup: simulatedTime,
        savings,
        toolsCount: tools.length,
        baseToolsCount: baseToolsInJobCount,
        missingToolsCount,
        matchedListName: step.MatchedListIdent || null,
        occupiedSlots: magazineSize ? occupiedSlots : null,
        isFeasible: magazineSize ? isFeasible : true,
        programName: step.NCProgram || null
      };
    });

    const totalSavings = totalOriginalSetup - totalSimulatedSetup;
    const savingsPercent = totalOriginalSetup > 0 ? (totalSavings / totalOriginalSetup) * 100 : 0;

    // Calculate recommended optimal base set size if magazineSize is known
    let recommendedBaseSetSize = null;
    let recommendationText = '';

    if (magazineSize && sortedTools.length > 0) {
      let bestB = null;
      let maxSavings = -1;
      let bestFeasibility = -1;

      // Sweep from 5 to magazineSize in steps of 5
      for (let b = 5; b <= magazineSize; b += 5) {
        const bTools = new Set(sortedTools.slice(0, b).map(t => t.nr));
        
        let originalSetup = 0;
        let simulatedSetup = 0;
        let feasibleCount = 0;

        filteredSteps.forEach(step => {
          originalSetup += step.SetupTime;
          
          let tools = [];
          if (step.MatchedListNr) {
            tools = listToToolsMap[step.MatchedListNr] || [];
          }

          let baseToolsInJob = 0;
          if (tools.length > 0) {
            tools.forEach(tNr => {
              if (bTools.has(tNr)) {
                baseToolsInJob++;
              }
            });
            const missing = tools.length - baseToolsInJob;
            const ratio = missing / tools.length;
            const minFactor = 0.3;
            const reductionFactor = minFactor + (1.0 - minFactor) * ratio;
            const simulatedTime = Math.round(step.SetupTime * reductionFactor);
            simulatedSetup += simulatedTime;

            const occupied = b + missing;
            if (occupied <= magazineSize) {
              feasibleCount++;
            }
          } else {
            simulatedSetup += step.SetupTime;
            if (b <= magazineSize) {
              feasibleCount++;
            }
          }
        });

        const rate = filteredSteps.length > 0 ? (feasibleCount / filteredSteps.length) * 100 : 100;
        const savings = originalSetup - simulatedSetup;

        // Prioritize highest feasibility rate first, then maximum savings
        if (rate > bestFeasibility) {
          bestFeasibility = rate;
          maxSavings = savings;
          bestB = b;
        } else if (rate === bestFeasibility && savings > maxSavings) {
          maxSavings = savings;
          bestB = b;
        }
      }

      if (bestB !== null) {
        recommendedBaseSetSize = bestB;
        recommendationText = `Ein Stamm von ${bestB} Werkzeugen spart ca. ${Math.round(maxSavings / 60)} Std. und sichert ${bestFeasibility.toFixed(1)}% Machbarkeit.`;
      }
    }

    res.json({
      config: {
        baseSetSize,
        baseSetTools: Array.from(baseSetTools),
        magazineSize
      },
      baseTools: baseToolsDetails,
      summary: {
        totalSteps: analyzedStepsCount,
        matchedSteps: matchedStepsCount,
        originalSetupHours: Math.round(totalOriginalSetup / 60),
        simulatedSetupHours: Math.round(totalSimulatedSetup / 60),
        savingsHours: Math.round(totalSavings / 60),
        savingsPercent: parseFloat(savingsPercent.toFixed(1)),
        feasibleStepsCount,
        feasibilityRate: analyzedStepsCount > 0 ? parseFloat(((feasibleStepsCount / analyzedStepsCount) * 100).toFixed(1)) : 100,
        optimalBaseSetSize: recommendedBaseSetSize,
        recommendation: recommendationText
      },
      sampleSteps: simulatedSteps.filter(s => s.savings > 0).slice(0, 50)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Tools for a specific machine or pool in a period (accumulated by tool list)
app.get('/api/machines/:id/tools', async (req, res) => {
  try {
    if (!cachedSetupData) {
      console.log('cachedSetupData is null. Recalculating base cache dynamically for machine tools...');
      await cacheSetupData();
    }
    const paramId = req.params.id;
    const parts = paramId.split('_');
    const type = parts[0]; // 'pool' or 'machine'
    const dbId = parseInt(parts[1]); // e.g. 9 or 21

    if (isNaN(dbId)) {
      return res.status(400).json({ error: 'Ungültige Maschinen- oder Pool-ID' });
    }

    const { startDate, endDate } = req.query;
    const { listToToolsMap, toolsDetails } = cachedSetupData;

    // Fetch steps dynamically for this machine/pool from the D4 database
    const poolD4 = await getPoolD4();
    const request = poolD4.request();
    request.input('dbId', sql.Int, dbId);

    let whereClause = `p.PSP_TYP_POSITION = 0 AND bk.BK_BKBE_STATUS_BEARBEITUNG = 0 AND bk.BK_BKBE_TYP_BELEG = 2`;
    if (type === 'pool') {
      whereClause += ` AND p.PSP_IDMP = @dbId`;
    } else {
      whereClause += ` AND p.PSP_IDMS = @dbId`;
    }

    const query = `
      SELECT
        b.ID as OrderId,
        p.ID as StepId,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupTime,
        bk.BK_BKBE_NUMMER as ContractNumber,
        CASE
          WHEN b.BP_PP_DATUM_TERMIN IS NOT NULL THEN b.BP_PP_DATUM_TERMIN
          ELSE
            CASE
              WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM
              ELSE au.BK_BKBE_AU_LI_DATUM
            END
        END as DeliveryDate,
        (
          SELECT MIN(PSPP_DATUM_START)
          FROM tPPS_SKKALP_PLAN
          WHERE tPPS_SKKALP_PLAN.PSPP_IDPSKP = p.ID
            AND tPPS_SKKALP_PLAN.PSPP_STATUS_PLANUNG <> 1
        ) as StartDate
      FROM [D4].[dbo].[tbe_Belp] b
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.PSK_IDBEBP = b.ID
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
      WHERE ${whereClause}
    `;
    const result = await request.query(query);
    const dbSteps = result.recordset;

    // Filter steps by date range in Node.js to avoid conversion errors
    const filteredSteps = dbSteps.filter(step => {
      const targetDate = step.StartDate || step.DeliveryDate;
      if (!targetDate) return false;
      const dStr = new Date(targetDate).toISOString().substring(0, 10);
      if (startDate && dStr < startDate) return false;
      if (endDate && dStr > endDate) return false;
      return true;
    });

    // Match NC programs to cached tool lists
    const matchCache = {};
    filteredSteps.forEach(step => {
      const progs = extractNCPrograms(step.StepDesc);
      if (progs.length > 0) {
        const prog = progs[0];
        if (matchCache[prog] === undefined) {
          const matches = findMatches(prog, cachedToolLists, 0.6);
          if (matches.length > 0) {
            matchCache[prog] = {
              Nr: matches[0].Nr,
              Ident: matches[0].Ident
            };
          } else {
            matchCache[prog] = null;
          }
        }

        const match = matchCache[prog];
        if (match) {
          step.MatchedListNr = match.Nr;
          step.MatchedListIdent = match.Ident;
        }
      }
    });

    const activeLists = {};
    filteredSteps.forEach(step => {
      if (!step.MatchedListNr) return;
      const listNr = step.MatchedListNr;
      if (!activeLists[listNr]) {
        activeLists[listNr] = {
          listNr,
          ident: step.MatchedListIdent || `List #${listNr}`,
          stepsCount: 0,
          totalSetupTime: 0,
          orders: new Set(),
          tools: []
        };
      }
      activeLists[listNr].stepsCount++;
      activeLists[listNr].totalSetupTime += step.SetupTime || 0;
      activeLists[listNr].orders.add(step.OrderId);
    });

    Object.values(activeLists).forEach(item => {
      const toolIds = listToToolsMap[item.listNr] || [];
      item.tools = toolIds.map(tNr => {
        return toolsDetails[tNr] || { nr: tNr, desc: 'Unbekannt' };
      });
      item.ordersCount = item.orders.size;
      delete item.orders;
    });

    const accumulatedTools = {};
    Object.values(activeLists).forEach(item => {
      const toolIds = listToToolsMap[item.listNr] || [];
      toolIds.forEach(tNr => {
        if (!accumulatedTools[tNr]) {
          const details = toolsDetails[tNr] || { nr: tNr, desc: 'Unbekannt' };
          accumulatedTools[tNr] = {
            ...details,
            totalUsesCount: 0,
            toolLists: []
          };
        }
        accumulatedTools[tNr].totalUsesCount += item.stepsCount;
        accumulatedTools[tNr].toolLists.push({
          listNr: item.listNr,
          ident: item.ident,
          stepsCount: item.stepsCount
        });
      });
    });

    const sortedAccumulatedTools = Object.values(accumulatedTools)
      .sort((a, b) => b.totalUsesCount - a.totalUsesCount);

    const activeToolIds = Object.keys(accumulatedTools).map(Number);
    let accumulatedParts = [];
    if (activeToolIds.length > 0) {
      try {
        const poolWT = await getPoolWT();
        const partsResult = await poolWT.request().query(`
          SELECT
            tp.ToolNr, tp.Pos as PartPos, tp.Nbr as PartQty,
            p.Nr as PartNr, p.Descript as PartDesc, p.KeyWord as PartKeyWord
          FROM [WTDATA].[dbo].[ToolParts] tp
          INNER JOIN [WTDATA].[dbo].[Parts] p ON p.ID = tp.PartID
          WHERE tp.ToolNr IN (${activeToolIds.join(',')})
          ORDER BY p.Nr, tp.Pos
        `);

        const partsMap = {};
        partsResult.recordset.forEach(row => {
          const partNr = row.PartNr ? row.PartNr.toString().trim() : 'Unbekannt';
          if (!partsMap[partNr]) {
            partsMap[partNr] = {
              partNr,
              desc: row.PartDesc ? row.PartDesc.toString().trim() : '',
              keyword: row.PartKeyWord ? row.PartKeyWord.toString().trim() : '',
              totalQty: 0,
              tools: []
            };
          }
          const tDetail = accumulatedTools[row.ToolNr];
          if (tDetail) {
            partsMap[partNr].totalQty += (row.PartQty || 1);
            partsMap[partNr].tools.push({
              toolNr: row.ToolNr,
              desc: tDetail.desc,
              partQty: row.PartQty || 1,
              totalUsesCount: tDetail.totalUsesCount
            });
          }
        });

        accumulatedParts = Object.values(partsMap).sort((a, b) => b.totalQty - a.totalQty);
      } catch (err) {
        console.error('Error fetching accumulated parts:', err);
      }
    }

    res.json({
      machineId: paramId,
      activeToolLists: Object.values(activeLists).sort((a, b) => b.stepsCount - a.stepsCount),
      accumulatedTools: sortedAccumulatedTools,
      accumulatedParts: accumulatedParts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// === INVENTORY & MAGAZINE SIMULATION ENDPOINTS ===

// 1. Get Machines catalog from Toollist
app.get('/api/inventory/machines', async (req, res) => {
  try {
    const poolTL = await getPoolTL();
    const result = await poolTL.request().query('SELECT Id, Name, MagazineSize, Path FROM Machines ORDER BY Name');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching inventory machines:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get current tools in a machine
app.get('/api/inventory/machine/:name/current-tools', async (req, res) => {
  try {
    const { name } = req.params;
    const poolTL = await getPoolTL();
    
    // Find machine first
    const machineResult = await poolTL.request()
      .input('name', sql.VarChar, name)
      .query('SELECT Id, Name, MagazineSize FROM Machines WHERE Name = @name');
      
    if (machineResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Maschine nicht gefunden' });
    }
    
    const machineId = machineResult.recordset[0].Id;
    
    // Resolve ALL programs for this machine (both geparkt/Parkplatz and active programs)
    const programResult = await poolTL.request()
      .input('machineId', sql.Int, machineId)
      .query(`
        SELECT Id, ProgramName
        FROM MachineToProgram
        WHERE Machine = @machineId
      `);
      
    if (programResult.recordset.length === 0) {
      return res.json([]);
    }
    
    const programIds = programResult.recordset.map(p => p.Id);
    
    // Get tools inside all these programs
    const toolsResult = await poolTL.request()
      .query(`SELECT T, ToolName, Comment FROM ProgramToTool WHERE MachineToProgramId IN (${programIds.join(',')}) ORDER BY T`);
      
    const toolsList = toolsResult.recordset;
    
    // Parse WinTool Nr from suffix, deduplicate, and resolve detailed data
    const resolvedTools = [];
    const wtToolIds = [];
    const seenTools = new Set();
    const uniqueToolsList = [];
    
    toolsList.forEach(t => {
      const nameStr = t.ToolName || '';
      const idx = nameStr.lastIndexOf('-');
      let wtNr = null;
      if (idx !== -1) {
        const suffix = nameStr.substring(idx + 1);
        const nr = parseInt(suffix, 10);
        if (!isNaN(nr)) {
          wtNr = nr;
        }
      }
      
      const key = wtNr ? `nr:${wtNr}` : `name:${nameStr}`;
      if (!seenTools.has(key)) {
        seenTools.add(key);
        t.wtNr = wtNr;
        uniqueToolsList.push(t);
        if (wtNr) {
          wtToolIds.push(wtNr);
        }
      }
    });
    
    // Fetch WT Details
    let wtDetailsMap = {};
    if (wtToolIds.length > 0) {
      try {
        const poolWT = await getPoolWT();
        const detailsResult = await poolWT.request().query(`
          SELECT Nr, Descript, KeyWord, Ds, CLength FROM [WTDATA].[dbo].[Tools] WHERE Nr IN (${wtToolIds.join(',')})
        `);
        detailsResult.recordset.forEach(row => {
          wtDetailsMap[row.Nr] = {
            desc: row.Descript ? row.Descript.toString().trim() : '',
            keyword: row.KeyWord ? row.KeyWord.toString().trim() : '',
            dia: row.Ds,
            len: row.CLength
          };
        });
      } catch (err) {
        console.error('Error loading WT details for current tools:', err);
      }
    }
    
    uniqueToolsList.forEach(t => {
      const wtDetails = t.wtNr ? wtDetailsMap[t.wtNr] : null;
      resolvedTools.push({
        pocket: t.T,
        toolName: t.ToolName,
        comment: t.Comment || '',
        wtNr: t.wtNr || null,
        desc: wtDetails ? wtDetails.desc : 'Unbekannt',
        keyword: wtDetails ? wtDetails.keyword : 'N/A',
        dia: wtDetails ? wtDetails.dia : 0,
        len: wtDetails ? wtDetails.len : 0
      });
    });
    
    res.json(resolvedTools);
  } catch (err) {
    console.error('Error fetching current machine tools:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to map Toollist machine names to D4 identifiers
function mapToollistMachineToD4(machineName) {
  const nameUpper = machineName.toUpperCase().trim();
  const matched = cachedMachines.filter(m => {
    const numUpper = m.number.toUpperCase();
    const nmUpper = m.name.toUpperCase();
    if (nameUpper === 'C40') {
      return (numUpper.includes('C40') && !numUpper.includes('C400')) || 
             (nmUpper.includes('C40') && !nmUpper.includes('C400'));
    }
    return numUpper.includes(nameUpper) || nmUpper.includes(nameUpper);
  });
  return {
    machineIds: matched.filter(m => m.type === 'machine').map(m => m.dbId),
    poolIds: matched.filter(m => m.type === 'pool').map(m => m.dbId)
  };
}

// Reverse mapping D4 Machine/Pool ID to Toollist Machine Name
function findMachineNameFromD4(machineId, machinePoolId) {
  const names = ['C40', 'C400', 'RS1', 'RS2', 'Chiron', 'C42'];
  for (let name of names) {
    const mapping = mapToollistMachineToD4(name);
    if (machineId && mapping.machineIds.includes(machineId)) {
      return name;
    }
    if (machinePoolId && mapping.poolIds.includes(machinePoolId)) {
      return name;
    }
  }
  return null;
}

// Reusable Machine Simulation Engine
async function runSimulationForMachine(name, unloadPrograms, loadPrograms, targetDate, optimize, startDate) {
  const poolTL = await getPoolTL();
  
  // Find machine definition
  const machineResult = await poolTL.request()
    .input('name', sql.VarChar, name)
    .query('SELECT Id, Name, MagazineSize FROM Machines WHERE Name = @name');
    
  if (machineResult.recordset.length === 0) {
    throw new Error('Maschine nicht gefunden');
  }
  
  const machine = machineResult.recordset[0];
  const magazineSize = machine.MagazineSize || 40;
  
  // Get all loaded programs for this machine (both geparkt and active ones)
  const programResult = await poolTL.request()
    .input('machineId', sql.Int, machine.Id)
    .query('SELECT Id, ProgramName FROM MachineToProgram WHERE Machine = @machineId');
    
  // Determine which programs are active (not unloaded)
  let activePrograms = programResult.recordset;
  
  // Parse unloaded program IDs
  let unloadIds = [];
  if (unloadPrograms) {
    unloadIds = unloadPrograms.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  }
  
  // Filter out unloaded programs
  if (unloadIds.length > 0) {
    activePrograms = activePrograms.filter(p => !unloadIds.includes(parseInt(p.Id, 10)));
  }
  
  // Fetch tools for all active programs
  let initialToolNrs = [];
  if (activePrograms.length > 0) {
    const activeProgramIds = activePrograms.map(p => p.Id);
    const toolsResult = await poolTL.request()
      .query(`SELECT ToolName FROM ProgramToTool WHERE MachineToProgramId IN (${activeProgramIds.join(',')})`);
      
    toolsResult.recordset.forEach(t => {
      const nameStr = t.ToolName || '';
      const idx = nameStr.lastIndexOf('-');
      if (idx !== -1) {
        const suffix = nameStr.substring(idx + 1);
        const nr = parseInt(suffix, 10);
        if (!isNaN(nr) && !initialToolNrs.includes(nr)) {
          initialToolNrs.push(nr);
        }
      }
    });
  }

  // Filter and sort upcoming orders chronologically
  let { steps, listToToolsMap, toolsDetails } = cachedSetupData;

  // Load specified upcoming lists (NC programs or tool list names)
  const preloadedToolNrs = [];
  const activeMachineToolNrs = [...initialToolNrs];
  if (loadPrograms) {
    const loadListNames = loadPrograms.split(',').map(name => name.trim()).filter(name => name.length > 0);
    loadListNames.forEach(listName => {
      const matches = findMatches(listName, cachedToolLists, 0.6);
      if (matches.length > 0) {
        const matchedNr = matches[0].Nr;
        const tools = listToToolsMap[matchedNr] || [];
        tools.forEach(tNr => {
          if (!preloadedToolNrs.includes(tNr)) {
            preloadedToolNrs.push(tNr);
          }
        });
      }
    });
  }
  
  // Map machine to D4 machine/pool IDs
  const mapping = mapToollistMachineToD4(name);
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Calculate default simulation start (today - 14 days)
  let simStartStr = startDate;
  if (!simStartStr) {
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 14);
    const y = defaultStart.getFullYear();
    const m = String(defaultStart.getMonth() + 1).padStart(2, '0');
    const d = String(defaultStart.getDate()).padStart(2, '0');
    simStartStr = `${y}-${m}-${d}`;
  }

  let machineSteps = steps.filter(step => {
    const tDate = step.StartDate || step.DeliveryDate;
    if (!tDate) return false;
    const stepDateStr = new Date(tDate).toISOString().substring(0, 10);
    if (stepDateStr < simStartStr) return false;
    if (stepDateStr < todayStr && step.StatusProduction === 1) return false;
    return mapping.machineIds.includes(step.MachineId) || mapping.poolIds.includes(step.MachinePoolId);
  });
  
  machineSteps.sort((a, b) => new Date(a.StartDate || a.DeliveryDate) - new Date(b.StartDate || b.DeliveryDate));

  // Optimize sequence if requested (setup minimization using greedy Nearest Neighbor)
  if (optimize === 'true') {
    let remainingSteps = [...machineSteps];
    let optimizedSteps = [];
    let currentSimMagazine = [...initialToolNrs];
    let simLastUsedIndex = {};
    currentSimMagazine.forEach(tNr => {
      simLastUsedIndex[tNr] = -1;
    });

    // Simulate loading preloaded programs before sequence optimization
    preloadedToolNrs.forEach(tNr => {
      if (!currentSimMagazine.includes(tNr)) {
        while (currentSimMagazine.length >= magazineSize) {
          const candidates = currentSimMagazine.filter(mNr => !preloadedToolNrs.includes(mNr));
          if (candidates.length === 0) break;
          const victim = findOptimalVictim(candidates, remainingSteps, listToToolsMap, simLastUsedIndex);
          currentSimMagazine = currentSimMagazine.filter(mNr => mNr !== victim);
        }
        currentSimMagazine.push(tNr);
      }
    });

    while (remainingSteps.length > 0) {
      let bestStepIdx = -1;
      let minMissesCount = Infinity;
      
      for (let i = 0; i < remainingSteps.length; i++) {
        const step = remainingSteps[i];
        const stepToolNrs = listToToolsMap[step.MatchedListNr] || [];
        
        let missesCount = 0;
        stepToolNrs.forEach(tNr => {
          if (!currentSimMagazine.includes(tNr)) {
            missesCount++;
          }
        });
        
        if (missesCount < minMissesCount) {
          minMissesCount = missesCount;
          bestStepIdx = i;
        } else if (missesCount === minMissesCount) {
          if (bestStepIdx === -1 || new Date(step.StartDate || step.DeliveryDate) < new Date(remainingSteps[bestStepIdx].StartDate || remainingSteps[bestStepIdx].DeliveryDate)) {
            bestStepIdx = i;
          }
        }
      }
      
      const chosenStep = remainingSteps.splice(bestStepIdx, 1)[0];
      optimizedSteps.push(chosenStep);
      
      const stepToolNrs = listToToolsMap[chosenStep.MatchedListNr] || [];
      const misses = stepToolNrs.filter(tNr => !currentSimMagazine.includes(tNr));
      
      misses.forEach(tNr => {
        while (currentSimMagazine.length >= magazineSize) {
          const candidates = currentSimMagazine.filter(mNr => !stepToolNrs.includes(mNr) && !preloadedToolNrs.includes(mNr));
          if (candidates.length === 0) break;
          
          const victim = findOptimalVictim(candidates, remainingSteps, listToToolsMap, simLastUsedIndex);
          currentSimMagazine = currentSimMagazine.filter(mNr => mNr !== victim);
        }
        currentSimMagazine.push(tNr);
      });
      
      stepToolNrs.forEach(tNr => {
        simLastUsedIndex[tNr] = optimizedSteps.length - 1;
      });
    }
    
    machineSteps = optimizedSteps;
  }
  
  // Run simulation step-by-step
  let virtualMagazine = [...initialToolNrs];
  let lastUsedIndex = {}; // toolNr -> step index when last used
  
  // Initialize last used indexes for tools in magazine
  virtualMagazine.forEach(tNr => {
    lastUsedIndex[tNr] = -1;
  });

  // Simulate loading of preloaded programs BEFORE the timeline starts
  const preloadedUnloads = [];
  preloadedToolNrs.forEach(tNr => {
    if (!virtualMagazine.includes(tNr)) {
      while (virtualMagazine.length >= magazineSize) {
        const candidates = virtualMagazine.filter(mNr => !preloadedToolNrs.includes(mNr));
        if (candidates.length === 0) break;
        const remaining = machineSteps;
        const victim = findOptimalVictim(candidates, remaining, listToToolsMap, lastUsedIndex);
        virtualMagazine = virtualMagazine.filter(mNr => mNr !== victim);
        preloadedUnloads.push(victim);
      }
      virtualMagazine.push(tNr);
    }
  });

  const startMagazineForSimulation = [...virtualMagazine];
  
  const simulatedTimeline = [];
  const loadedToolsSet = new Set(); // holds all tool Nrs that had to be loaded/setup
  preloadedToolNrs.forEach(tNr => {
    if (!activeMachineToolNrs.includes(tNr)) {
      loadedToolsSet.add(tNr);
    }
  });
  
  machineSteps.forEach((step, idx) => {
    const stepDate = step.StartDate || step.DeliveryDate;
    const stepDateStr = stepDate ? new Date(stepDate).toISOString().substring(0, 10) : '';
    
    // Stop condition: if targetDate is provided and this step is after targetDate, we don't apply it to the magazine
    const isPastTarget = targetDate && stepDateStr > targetDate;
    
    const stepToolNrs = listToToolsMap[step.MatchedListNr] || [];
    const hits = [];
    const misses = [];
    
    // Always calculate hits and misses first
    stepToolNrs.forEach(tNr => {
      if (virtualMagazine.includes(tNr)) {
        hits.push(tNr);
      } else {
        misses.push(tNr);
      }
    });

    // The occupied slots represents the current magazine tools plus the new tools that must be loaded
    const occupiedSlots = isPastTarget ? virtualMagazine.length : (virtualMagazine.length + misses.length);
    const isFeasible = isPastTarget ? (virtualMagazine.length <= magazineSize) : (occupiedSlots <= magazineSize);
    
    if (!isPastTarget) {
      // Eviction / Insert loop for misses
      misses.forEach(tNr => {
        loadedToolsSet.add(tNr);
        
        while (virtualMagazine.length >= magazineSize) {
          const candidates = virtualMagazine.filter(mNr => !stepToolNrs.includes(mNr) && !preloadedToolNrs.includes(mNr));
          if (candidates.length === 0) {
            break; 
          }
          
          const remaining = machineSteps.slice(idx + 1);
          const victim = findOptimalVictim(candidates, remaining, listToToolsMap, lastUsedIndex);
          
          // Remove victim
          virtualMagazine = virtualMagazine.filter(mNr => mNr !== victim);
        }
        
        // Now add the new tool
        virtualMagazine.push(tNr);
      });
      
      // Update last used indexes for all tools active in this step
      stepToolNrs.forEach(tNr => {
        lastUsedIndex[tNr] = idx;
      });
    }
    
    simulatedTimeline.push({
      stepId: step.StepId,
      contractNumber: step.ContractNumber || 'N/A',
      stepPos: step.StepPos || null,
      orderPos: step.OrderPos || null,
      desc: step.StepDesc.trim().replace(/\s+/g, ' '),
      date: stepDateStr,
      setupTime: step.SetupTime,
      programName: step.NCProgram || null,
      toolsCount: stepToolNrs.length,
      hitsCount: hits.length,
      missesCount: misses.length,
      misses: misses.map(tNr => toolsDetails[tNr] || { nr: tNr, desc: 'Unbekannt' }),
      magazineTools: virtualMagazine.map(tNr => toolsDetails[tNr] || { nr: tNr, desc: 'Unbekannt', keyword: 'N/A' }),
      occupiedSlots: occupiedSlots,
      isFeasible: isFeasible,
      isPastTarget,
      statusColor: step.color || 'Green',
      spko: step.SPKO
    });
  });
  
  // Resolve initial magazine tools details (after preloading)
  const initialMagazineResolved = startMagazineForSimulation.map(tNr => {
    return toolsDetails[tNr] || { nr: tNr, desc: 'Unbekannt', keyword: 'N/A' };
  });

  // Resolve final magazine tools details
  const finalMagazineResolved = virtualMagazine.map(tNr => {
    return toolsDetails[tNr] || { nr: tNr, desc: 'Unbekannt', keyword: 'N/A' };
  });
  
  // Resolve aggregated setup tools (that had to be loaded)
  const setupToolsResolved = Array.from(loadedToolsSet).map(tNr => {
    return toolsDetails[tNr] || { nr: tNr, desc: 'Unbekannt', keyword: 'N/A' };
  });
  
  return {
    machineName: name,
    magazineSize,
    initialToolsCount: initialToolNrs.length,
    simulatedTimeline,
    initialMagazine: initialMagazineResolved,
    finalMagazine: finalMagazineResolved,
    setupTools: setupToolsResolved
  };
}

// 2.5. Get loaded programs (tool lists) associated with a machine in Toollist-DB (excluding parked programs)
app.get('/api/inventory/machine/:name/programs', async (req, res) => {
  try {
    const { name } = req.params;
    const poolTL = await getPoolTL();
    
    const machineResult = await poolTL.request()
      .input('name', sql.VarChar, name)
      .query('SELECT Id FROM Machines WHERE Name = @name');
      
    if (machineResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Maschine nicht gefunden' });
    }
    
    const machineId = machineResult.recordset[0].Id;
    
    const programsResult = await poolTL.request()
      .input('machineId', sql.Int, machineId)
      .query(`
        SELECT Id, ProgramName 
        FROM MachineToProgram 
        WHERE Machine = @machineId
        ORDER BY ProgramName
      `);
      
    res.json(programsResult.recordset);
  } catch (err) {
    console.error('Error fetching machine programs:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Simulate future magazine tools and consolidated setup demand
app.get('/api/inventory/machine/:name/simulation', async (req, res) => {
  try {
    const { name } = req.params;
    const { targetDate, optimize, unloadPrograms, loadPrograms, startDate } = req.query;
    
    if (!cachedSetupData) {
      console.log('cachedSetupData is null. Recalculating base cache dynamically for inventory simulation...');
      await cacheSetupData();
    }
    
    // Save scenario globally
    activeScenarios[name] = {
      unloadPrograms: unloadPrograms || '',
      loadPrograms: loadPrograms || ''
    };
    
    const cleanStartDate = (startDate && startDate !== 'undefined' && startDate !== '') ? startDate : null;
    const result = await runSimulationForMachine(name, unloadPrograms, loadPrograms, targetDate, optimize, cleanStartDate);
    
    // Resolve setup parts for setupTools
    let setupParts = [];
    if (result.setupTools.length > 0) {
      try {
        const poolWT = await getPoolWT();
        const setupToolIds = result.setupTools.map(t => t.nr);
        const partsResult = await poolWT.request().query(`
          SELECT
            tp.ToolNr, tp.Pos as PartPos, tp.Nbr as PartQty,
            p.Nr as PartNr, p.Descript as PartDesc, p.KeyWord as PartKeyWord
          FROM [WTDATA].[dbo].[ToolParts] tp
          INNER JOIN [WTDATA].[dbo].[Parts] p ON p.ID = tp.PartID
          WHERE tp.ToolNr IN (${setupToolIds.join(',')})
          ORDER BY p.Nr, tp.Pos
        `);
        
        const partsMap = {};
        partsResult.recordset.forEach(row => {
          const partNr = row.PartNr ? row.PartNr.toString().trim() : 'Unbekannt';
          if (!partsMap[partNr]) {
            partsMap[partNr] = {
              partNr,
              desc: row.PartDesc ? row.PartDesc.toString().trim() : '',
              keyword: row.PartKeyWord ? row.PartKeyWord.toString().trim() : '',
              totalQty: 0,
              tools: []
            };
          }
          const tDetail = cachedSetupData.toolsDetails[row.ToolNr];
          if (tDetail) {
            partsMap[partNr].totalQty += (row.PartQty || 1);
            partsMap[partNr].tools.push({
              toolNr: row.ToolNr,
              desc: tDetail.desc,
              partQty: row.PartQty || 1
            });
          }
        });
        setupParts = Object.values(partsMap).sort((a, b) => b.totalQty - a.totalQty);
      } catch (err) {
        console.error('Error fetching parts for simulated setup tools:', err);
      }
    }
    
    res.json({
      ...result,
      setupParts
    });
  } catch (err) {
    console.error('Error running inventory simulation:', err);
    res.status(500).json({ error: err.message });
  }
});

function getDMSCredentials() {
  if (process.env.NODE_ENV === 'production') {
    const domain = process.env.USERDOMAIN || 'rr';
    const user = process.env.USERNAME || 'simon';
    const pass = process.env.DMS_PASSWORD || '88171';
    return {
      username: `${domain}\\${user}`,
      password: pass
    };
  } else {
    return {
      username: process.env.DMS_USERNAME || 'rr\\simon',
      password: process.env.DMS_PASSWORD || '88171'
    };
  }
}

async function fetchDrawingFromDMS(articleId, index = 0, fixture = null) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const diag = {
    articleId,
    loginUrl: 'https://srvdms/identityprovider/login',
    loginStatus: null,
    hasSessionCookie: false,
    repositoryId: '4fd39dfc-d88d-541f-8bfb-839608941ed4',
    searchQueriesAttempted: [],
    detailsFetch: null,
    downloadFetch: null
  };

  const { username, password } = getDMSCredentials();
  const loginRes = await fetch(diag.loginUrl, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64') }
  });
  diag.loginStatus = loginRes.status;
  
  if (loginRes.status !== 204) {
    throw new Error(`DMS Login failed with status ${loginRes.status} (expected 204). Check your password.`);
  }
  
  const allCookies = loginRes.headers.getSetCookie();
  let authSessionId = null;
  for (let c of allCookies) {
    if (c && c.includes('AuthSessionId=')) {
      authSessionId = c.match(/AuthSessionId=([^;]+)/)[1];
      break;
    }
  }
  
  if (!authSessionId) {
    throw new Error('DMS Login succeeded but AuthSessionId cookie was not returned.');
  }
  diag.hasSessionCookie = true;
  
  const propParam = JSON.stringify({ "5": [articleId] });
  let docId = null;
  const docTypes = ['DADZ', 'DARTD'];
  
  for (let type of docTypes) {
    const objdefParam = JSON.stringify([type]);
    const searchUrl = `https://srvdms/dms/r/${diag.repositoryId}/sr/?properties=${encodeURIComponent(propParam)}&objectdefinitionids=${encodeURIComponent(objdefParam)}`;
    
    const searchRes = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/hal+json, application/json',
        'Cookie': `AuthSessionId=${authSessionId}`
      }
    });
    
    const queryLog = {
      type,
      url: searchUrl,
      status: searchRes.status,
      itemsFound: 0,
      rawResponse: null
    };
    
    if (searchRes.status === 200) {
      const searchData = await searchRes.json();
      queryLog.itemsFound = (searchData.items || []).length;
      queryLog.rawResponse = searchData;
      if (searchData.items && searchData.items.length > 0) {
        let items = searchData.items;
        if (fixture) {
          const cleanFixture = fixture.trim().toLowerCase();
          const matches = items.filter(item => (item.caption || '').toLowerCase().includes(cleanFixture));
          const nonMatches = items.filter(item => !(item.caption || '').toLowerCase().includes(cleanFixture));
          items = [...matches, ...nonMatches];
        }
        const targetIndex = Math.min(Math.max(0, index), items.length - 1);
        docId = items[targetIndex].id;
        diag.searchQueriesAttempted.push(queryLog);
        break;
      }
    } else {
      try {
        queryLog.rawResponse = await searchRes.text();
      } catch (e) {}
    }
    diag.searchQueriesAttempted.push(queryLog);
  }
  
  if (!docId) {
    const err = new Error('Keine Zeichnung im DMS gefunden');
    err.diagnostics = diag;
    throw err;
  }
  
  const detailsUrl = `https://srvdms/dms/r/${diag.repositoryId}/o2/${docId}`;
  const detailsRes = await fetch(detailsUrl, {
    headers: {
      'Accept': 'application/hal+json, application/json',
      'Cookie': `AuthSessionId=${authSessionId}`
    }
  });
  
  diag.detailsFetch = {
    url: detailsUrl,
    status: detailsRes.status
  };
  
  if (detailsRes.status !== 200) {
    const err = new Error(`DMS Details fetch failed with status ${detailsRes.status}`);
    err.diagnostics = diag;
    throw err;
  }
  
  const detailsData = await detailsRes.json();
  
  let pdfUri = null;
  if (detailsData.pdfInlineUri) {
    pdfUri = detailsData.pdfInlineUri;
  } else if (detailsData._links && detailsData._links.mainblobcontent && detailsData._links.mainblobcontent.href) {
    pdfUri = detailsData._links.mainblobcontent.href;
  } else if (detailsData._links && detailsData._links.blobs && detailsData._links.blobs.href) {
    pdfUri = detailsData._links.blobs.href;
  }
  
  if (!pdfUri) {
    const err = new Error('DMS Document has no download or preview link');
    err.diagnostics = diag;
    throw err;
  }
  
  const downloadUrl = `https://srvdms${pdfUri}`;
  const downloadRes = await fetch(downloadUrl, {
    headers: { 'Cookie': `AuthSessionId=${authSessionId}` }
  });
  
  diag.downloadFetch = {
    url: downloadUrl,
    status: downloadRes.status
  };
  
  if (downloadRes.status !== 200) {
    const err = new Error(`DMS PDF download failed with status ${downloadRes.status}`);
    err.diagnostics = diag;
    throw err;
  }
  
  const buffer = await downloadRes.arrayBuffer();
  return Buffer.from(buffer);
}

async function getArticleNumberById(articleId) {
  if (!articleId) return articleId;
  if (isNaN(articleId)) {
    return articleId;
  }
  
  try {
    const poolD4 = await getPoolD4();
    const result = await poolD4.request()
      .input('id', sql.Int, parseInt(articleId, 10))
      .query('SELECT AR_NUMMER FROM [D4].[dbo].[tARST] WHERE ID = @id');
    
    if (result.recordset && result.recordset.length > 0) {
      return result.recordset[0].AR_NUMMER.trim();
    }
  } catch (err) {
    console.error('Error fetching AR_NUMMER for articleId:', articleId, err);
  }
  return articleId;
}

app.get('/api/dms/drawing/:articleId/meta', async (req, res) => {
  try {
    const { articleId } = req.params;
    if (!articleId) {
      return res.status(400).json({ error: 'articleId parameter is required' });
    }
    
    const resolvedNumber = await getArticleNumberById(articleId);
    
    // Login to DMS
    const loginUrl = 'https://srvdms/identityprovider/login';
    const { username, password } = getDMSCredentials();
    const loginRes = await fetch(loginUrl, {
      headers: { 'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64') }
    });
    
    if (loginRes.status !== 204) {
      return res.status(500).json({ error: 'DMS login failed' });
    }
    
    const allCookies = loginRes.headers.getSetCookie();
    let authSessionId = null;
    for (let c of allCookies) {
      if (c && c.includes('AuthSessionId=')) {
        authSessionId = c.match(/AuthSessionId=([^;]+)/)[1];
        break;
      }
    }
    
    const repoId = '4fd39dfc-d88d-541f-8bfb-839608941ed4';
    const propParam = JSON.stringify({ "5": [resolvedNumber] });
    
    let allDocuments = [];
    const docTypes = ['DADZ', 'DARTD'];
    
    for (let type of docTypes) {
      const objdefParam = JSON.stringify([type]);
      const searchUrl = `https://srvdms/dms/r/${repoId}/sr/?properties=${encodeURIComponent(propParam)}&objectdefinitionids=${encodeURIComponent(objdefParam)}`;
      
      const searchRes = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/hal+json, application/json',
          'Cookie': `AuthSessionId=${authSessionId}`
        }
      });
      
      if (searchRes.status === 200) {
        const searchData = await searchRes.json();
        if (searchData.items && searchData.items.length > 0) {
          searchData.items.forEach(item => {
            allDocuments.push({
              id: item.id,
              caption: item.caption,
              lastModified: item.lastModified,
              mimeType: item.mimeType,
              type
            });
          });
        }
      }
    }
    
    const { fixture } = req.query;
    if (fixture) {
      const cleanFixture = fixture.trim().toLowerCase();
      const matches = allDocuments.filter(doc => (doc.caption || '').toLowerCase().includes(cleanFixture));
      const nonMatches = allDocuments.filter(doc => !(doc.caption || '').toLowerCase().includes(cleanFixture));
      allDocuments = [...matches, ...nonMatches];
    }
    
    res.json({
      resolvedArticleNumber: resolvedNumber,
      fixture: fixture || null,
      count: allDocuments.length,
      documents: allDocuments
    });
  } catch (err) {
    console.error('Error fetching DMS metadata:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dms/drawing/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;
    const { mode, index, fixture } = req.query; // 'proxy' or 'direct', index (default 0), fixture
    
    if (!articleId) {
      return res.status(400).json({ error: 'articleId parameter is required' });
    }
    
    const resolvedNumber = await getArticleNumberById(articleId);
    const docIndex = index ? parseInt(index, 10) : 0;
    console.log(`DMS Drawing Request for Article: ${articleId} -> ${resolvedNumber} (mode: ${mode || 'direct'}, index: ${docIndex}, fixture: ${fixture || 'none'})`);
    
    const repoId = '4fd39dfc-d88d-541f-8bfb-839608941ed4';
    const propParam = JSON.stringify({ "5": [resolvedNumber] });
    const objdefParam = JSON.stringify(["DADZ"]);
    
    // Direct client redirect (Default)
    if (mode !== 'proxy') {
      const directUrl = `https://srvdms/dms/r/${repoId}/s/?properties=${encodeURIComponent(propParam)}&objectdefinitionids=${encodeURIComponent(objdefParam)}&showresultlist=true`;
      return res.redirect(directUrl);
    }
    
    // Proxy download mode (if explicitly requested)
    const pdfBuffer = await fetchDrawingFromDMS(resolvedNumber, docIndex, fixture);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="drawing_${resolvedNumber}_${docIndex}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(`Error in /api/dms/drawing:`, err);
    const resolvedNumber = await getArticleNumberById(req.params.articleId);
    const docIndex = req.query.index ? parseInt(req.query.index, 10) : 0;
    if (err.diagnostics) {
      res.status(404).json({
        error: err.message,
        resolvedArticleNumber: resolvedNumber,
        docIndex,
        diagnostics: err.diagnostics
      });
    } else {
      res.status(500).json({ error: err.message, resolvedArticleNumber: resolvedNumber, docIndex });
    }
  }
});

async function fetchAndCacheMachineTimeEvaluation(startDate, endDate) {
  const poolD4 = await getPoolD4();
  
  // Read the query directly from Maschinenzeiten.sql on disk
  const sqlPath = path.join(__dirname, '..', 'Maschinenzeiten.sql');
  let sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // strip the 'go' at the end
  sqlContent = sqlContent.replace(/\bgo\b/gi, '');
  
  const whereIndex = sqlContent.toLowerCase().lastIndexOf('where');
  if (whereIndex === -1) {
    throw new Error('Could not find WHERE clause in Maschinenzeiten.sql');
  }
  
  const orderByIndex = sqlContent.toLowerCase().lastIndexOf('order by');
  let selectAndFrom = sqlContent.substring(0, whereIndex);
  let orderByPart = orderByIndex !== -1 ? sqlContent.substring(orderByIndex) : '';
  
  // Inject capacities right before the FIRST FROM of the main query
  const fromMatch = selectAndFrom.match(/\bfrom\b/i);
  if (fromMatch) {
    const fromIndex = fromMatch.index;
    let selectPart = selectAndFrom.substring(0, fromIndex);
    let fromPart = selectAndFrom.substring(fromIndex);
    
    selectAndFrom = `
      ${selectPart}
      , ISNULL(tPPS_MASTA.MS_KAPAZITAET_ZEIT_MINUTEN_MO, 0) AS MS_KAPAZITAET_ZEIT_MINUTEN_MO
      , ISNULL(tPPS_MASTA.MS_KAPAZITAET_ZEIT_MINUTEN_DI, 0) AS MS_KAPAZITAET_ZEIT_MINUTEN_DI
      , ISNULL(tPPS_MASTA.MS_KAPAZITAET_ZEIT_MINUTEN_MI, 0) AS MS_KAPAZITAET_ZEIT_MINUTEN_MI
      , ISNULL(tPPS_MASTA.MS_KAPAZITAET_ZEIT_MINUTEN_DO, 0) AS MS_KAPAZITAET_ZEIT_MINUTEN_DO
      , ISNULL(tPPS_MASTA.MS_KAPAZITAET_ZEIT_MINUTEN_FR, 0) AS MS_KAPAZITAET_ZEIT_MINUTEN_FR
      , ISNULL(tPPS_MASTA.MS_KAPAZITAET_ZEIT_MINUTEN_SA, 0) AS MS_KAPAZITAET_ZEIT_MINUTEN_SA
      , ISNULL(tPPS_MASTA.MS_KAPAZITAET_ZEIT_MINUTEN_SO, 0) AS MS_KAPAZITAET_ZEIT_MINUTEN_SO
      ${fromPart}
    `;
  }
  
  const query = `
    ${selectAndFrom}
    WHERE tZE_BUCH_BEWE.ZBUBW_DATUM_ZEIT_START >= @start
      AND tZE_BUCH_BEWE.ZBUBW_DATUM_ZEIT_STOP <= @end
    ${orderByPart}
  `;

  const nextDay = new Date(endDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().substring(0, 10);

  const startVal = new Date(`${startDate}T06:00:00`);
  const endVal = new Date(`${nextDayStr}T05:59:59`);

  const result = await poolD4.request()
    .input('start', sql.DateTime, startVal)
    .input('end', sql.DateTime, endVal)
    .query(query);

  const cacheKey = `${startDate}_${endDate}`;
  machineTimeEvaluationCache[cacheKey] = result.recordset;
  return result.recordset;
}

async function refreshMachineTimeEvaluationCache() {
  console.log('[Zeitauswertung Cache] Clearing and recalculating background cache (5 min cycle)...');
  
  const rangesToRefresh = new Set(activeEvaluationDateRanges);

  // Clear existing cache
  machineTimeEvaluationCache = {};

  // If no date ranges were requested yet, default to last 7 days up to today
  if (rangesToRefresh.size === 0) {
    const today = new Date();
    const endDate = today.toISOString().substring(0, 10);
    const startObj = new Date(today);
    startObj.setDate(startObj.getDate() - 7);
    const startDate = startObj.toISOString().substring(0, 10);
    rangesToRefresh.add(`${startDate}_${endDate}`);
  }

  for (const rangeKey of rangesToRefresh) {
    const parts = rangeKey.split('_');
    if (parts.length === 2) {
      try {
        await fetchAndCacheMachineTimeEvaluation(parts[0], parts[1]);
        console.log(`[Zeitauswertung Cache] Successfully recalculated cache for range: ${parts[0]} to ${parts[1]}`);
      } catch (err) {
        console.error(`[Zeitauswertung Cache] Error recalculating range ${rangeKey}:`, err.message);
      }
    }
  }
}

app.get('/api/machine-time-evaluation', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate und endDate werden benötigt (Format: YYYY-MM-DD).' });
    }

    const cacheKey = `${startDate}_${endDate}`;
    activeEvaluationDateRanges.add(cacheKey);

    if (machineTimeEvaluationCache[cacheKey]) {
      console.log(`[Cache Hit] Serving machine time evaluation from memory for range: ${startDate} to ${endDate}`);
      return res.json(machineTimeEvaluationCache[cacheKey]);
    }

    const data = await fetchAndCacheMachineTimeEvaluation(startDate, endDate);
    res.json(data);
  } catch (err) {
    console.error('Error fetching machine time evaluation:', err);
    res.status(500).json({ error: err.message });
  }
});

// Initialize server and execute cache pre-warmup in background
const certPath = path.join(__dirname, 'certs');
const sslKeyPath = path.join(certPath, 'server.key');
const sslCertPath = path.join(certPath, 'server.crt');
const rootCaPath = path.join(certPath, 'rootCA.crt');

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  const sslOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
    ca: fs.existsSync(rootCaPath) ? fs.readFileSync(rootCaPath) : undefined,
    requestCert: false
  };

  https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
    console.log(`HTTPS Server running on https://0.0.0.0:${PORT}`);
    warmupAllCaches();
    setInterval(() => {
      console.log('Running periodic background cache update...');
      warmupAllCaches();
    }, 5 * 60 * 1000);
  });

  const httpPort = process.env.HTTP_PORT || 5001;
  http.createServer(app).listen(httpPort, '0.0.0.0', () => {
    console.log(`HTTP Server running on http://0.0.0.0:${httpPort}`);
  });
} else {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    warmupAllCaches();
    setInterval(() => {
      console.log('Running periodic background cache update...');
      warmupAllCaches();
    }, 5 * 60 * 1000);
  });
}
