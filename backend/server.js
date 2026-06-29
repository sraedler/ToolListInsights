const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { getPoolD4, getPoolWT, getPoolTL, sql } = require('./db');
const { extractNCPrograms, findMatches } = require('./matching');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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
      p.PSP_IDMS as MachineId,
      p.PSP_IDMP as MachinePoolId,
      p.PSP_MENGE_SOLL as Quantity,
      p.PSP_PP_STATUS_PRODUKTION as StatusProduction,
      CASE
        WHEN b.BP_PP_DATUM_TERMIN IS NOT NULL THEN b.BP_PP_DATUM_TERMIN
        ELSE
          CASE
            WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM
            ELSE au.BK_BKBE_AU_LI_DATUM
          END
      END as DeliveryDate,
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
      bk.BK_BKBE_NUMMER as ContractNumber
    FROM (
      ${selectPart}
    ) AS OuterTemp
    INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
    INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
    LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
    LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
    WHERE bk.BK_BKBE_STATUS_BEARBEITUNG = 0 
      AND bk.BK_BKBE_TYP_BELEG = 2
  `;

  console.log('Executing database query for active steps/materials...');
  const result = await poolD4.request().query(finalSql);
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

async function cacheSetupData() {
  const poolD4 = await getPoolD4();
  const poolWT = await getPoolWT();

  console.log('Caching steps, tools, and night-run bookings in parallel...');
  const [rows, mappingResult, toolsDetailResult, nightBookingsResult] = await Promise.all([
    fetchActiveStepsAndMaterials(poolD4),
    poolWT.request().query('SELECT ToolListNr, ToolNr FROM [WTDATA].[dbo].[ToolList] WHERE ToolNr IS NOT NULL'),
    poolWT.request().query('SELECT Nr, Descript, KeyWord, Ds, CLength FROM [WTDATA].[dbo].[Tools]'),
    poolD4.request().query(`
      SELECT b.BP_IDAR as ArticleId, p.PSP_POSITION_NUMMER as StepPos, COUNT(*) as NightBookings
      FROM [D4].[dbo].[tZE_BUCH] zb
      INNER JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbb ON zbb.ZBUBW_IDZBU = zb.ID
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = zb.ZBU_IDBEBP
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = zb.ZBU_IDPSKP
      WHERE DATEPART(hour, zbb.ZBUBW_DATUM_ZEIT_START) >= 22 OR DATEPART(hour, zbb.ZBUBW_DATUM_ZEIT_START) < 6
      GROUP BY b.BP_IDAR, p.PSP_POSITION_NUMMER
    `)
  ]);

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
  toolsDetailResult.recordset.forEach(t => {
    toolsDetails[t.Nr] = {
      nr: t.Nr,
      desc: t.Descript,
      keyword: t.KeyWord,
      dia: t.Ds,
      len: t.CLength
    };
  });

  const nightSteps = new Set();
  nightBookingsResult.recordset.forEach(row => {
    if (row.NightBookings >= 3) {
      nightSteps.add(`${row.ArticleId}-${row.StepPos}`);
    }
  });

  // Group steps by OrderId to resolve predecessors correctly within each order
  const ordersMap = {};
  rows.forEach(row => {
    row.isNightRunCapable = nightSteps.has(`${row.ArticleId}-${row.StepPos}`);
    row.prodTime = row.ProdTime || 0;

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

    stepsGroup.forEach((step, idx) => {
      // Rule: If self is 2, status is Green (In-Progress can always be run/continued)
      if (step.SPKO === 2) {
        step.color = 'Green';
        return;
      }
      // If completed, keep it Green (already run)
      if (step.SPKO === 4) {
        step.color = 'Green';
        return;
      }

      // Predecessor check
      let predPos = null;
      let vgRaw = (step.VORGAENGER || '').trim();
      if (vgRaw.startsWith('|')) {
        vgRaw = vgRaw.replace('|', '').trim();
      }

      if (vgRaw === '') {
        // "Wenn Vorgänger ist leer, dann nehme nächst kleinere PSP_Position_Nummer als eigene PSP_Position_Nummer als Vorgänger."
        if (idx > 0) {
          predPos = stepsGroup[idx - 1].StepPos;
        }
      } else {
        // "Ist Vorgänger eine Zahl, nehme diese Zahl als PSP_Position_nummer Vorgänger."
        predPos = vgRaw;
      }

      let predStep = null;
      if (predPos !== null) {
        predStep = stepsGroup.find(s => s.StepPos === predPos);
      }

      if (!predStep) {
        // No predecessor -> Can start, so Green
        step.color = 'Green';
      } else {
        // "Ist der Vorgäner = 2, dann hast du selbst den Status Gelb."
        // "Ist der Vorgänger = 1, dann bist du Rot."
        if (predStep.SPKO === 2) {
          step.color = 'Yellow';
        } else if (predStep.SPKO === 1) {
          step.color = 'Red';
        } else if (predStep.SPKO === 4) {
          step.color = 'Green';
        } else {
          step.color = 'Green';
        }
      }
    });
  });

  // Keep only normal work steps (StepTyp = 0) with valid setup time (> 0) and assigned to a machine or pool
  // Also filter out completed steps (SPKO === 4)
  const steps = rows.filter(step => 
    step.TypHerkunft === 0 &&
    step.StepTyp === 0 && 
    step.SetupTime > 0 &&
    step.SPKO !== 4 &&
    ((step.MachineId !== null && step.MachineId !== 0) || (step.MachinePoolId !== null && step.MachinePoolId !== 0))
  );
  console.log(`Matching NC programs for ${steps.length} setup steps...`);
  const matchCache = {};
  steps.forEach((step, idx) => {
    if (idx % 25 === 0) {
      systemState.progress = `5. Rüstzeitmodelle: Ordne NC-Programme zu (${idx} / ${steps.length} verarbeitet)...`;
    }
    const progs = extractNCPrograms(step.StepDesc);
    if (progs.length > 0) {
      const prog = progs[0];
      step.NCProgram = prog;
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

  cachedSetupData = {
    steps,
    listToToolsMap,
    toolUsageCounts,
    toolsDetails,
    listToMachineMap
  };
  console.log('Setup reduction base data cached.');
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

    const request = poolD4.request();
    request.input('orderId', sql.Int, id);
    const result = await request.query(`
      SELECT
        p.ID as StepId,
        p.PSP_POSITION_NUMMER as StepPos,
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
        p.PSP_IDMP as MachinePoolId
      FROM [D4].[dbo].[tPPS_SKKALK] k
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = k.PSK_IDBEBP
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
      WHERE k.PSK_IDBEBP = @orderId
      ORDER BY p.PSP_POSITION_NUMMER
    `);

    const processedSteps = result.recordset.map(step => {
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
    const nameUpper = machineName.toUpperCase().trim();
    const machineResult = await poolTL.request()
      .input('name', sql.VarChar, `%${machineName}%`)
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
function sequenceStepsGA(stepsList, initialMagazine, magazineSize, listToToolsMap) {
  if (stepsList.length <= 1) return stepsList;

  // Pre-calculate timestamps and normalize them for tie-breaking
  const times = stepsList.map(s => new Date(s.StartDate || s.DeliveryDate || '9999-12-31').getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;

  function evaluatePermutation(permutation) {
    let currentMag = [...initialMagazine];
    let changes = 0;
    permutation.forEach(s => {
      const tools = listToToolsMap[s.MatchedListNr] || [];
      const load = tools.filter(t => !currentMag.includes(t));
      changes += load.length;
      const combined = Array.from(new Set([...currentMag, ...load]));
      currentMag = combined.slice(-magazineSize);
    });

    let penalty = 0;
    const N = permutation.length;
    permutation.forEach((s, idx) => {
      const t = new Date(s.StartDate || s.DeliveryDate || '9999-12-31').getTime();
      const norm = (t - minTime) / timeRange;
      penalty += (N - 1 - idx) * norm;
    });

    const scaledPenalty = N > 1 ? (penalty / (N * N)) * 0.45 : 0;
    return changes + scaledPenalty;
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

// Helper to sequence steps using selected algorithm and simulate magazine transition
function sequenceSteps(stepsList, currentMagazine, magazineSize, listToToolsMap, algo = 'greedy') {
  if (stepsList.length === 0) {
    return { sequenced: [], finalMagazine: currentMagazine };
  }

  let ordered = [];
  if (algo === 'ga') {
    ordered = sequenceStepsGA(stepsList, currentMagazine, magazineSize, listToToolsMap);
  } else if (algo === 'mip') {
    ordered = sequenceStepsMIP(stepsList, currentMagazine, magazineSize, listToToolsMap);
  } else if (algo === 'none') {
    ordered = [...stepsList];
  } else {
    // Default: greedy Nearest Neighbor
    let remaining = [...stepsList];
    let magazine = [...currentMagazine];
    while (remaining.length > 0) {
      let bestIdx = -1;
      let minMisses = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const step = remaining[i];
        const tools = listToToolsMap[step.MatchedListNr] || [];
        const misses = tools.filter(tNr => !magazine.includes(tNr));
        if (misses.length < minMisses) {
          minMisses = misses.length;
          bestIdx = i;
        } else if (misses.length === minMisses && bestIdx !== -1) {
          // Tie-breaker: prefer the step with the older StartDate / DeliveryDate (more in the past)
          const dateCurrent = new Date(step.StartDate || step.DeliveryDate || '9999-12-31').getTime();
          const dateBest = new Date(remaining[bestIdx].StartDate || remaining[bestIdx].DeliveryDate || '9999-12-31').getTime();
          if (dateCurrent < dateBest) {
            bestIdx = i;
          }
        }
      }
      const chosen = remaining.splice(bestIdx, 1)[0];
      ordered.push(chosen);
      const tools = listToToolsMap[chosen.MatchedListNr] || [];
      magazine = Array.from(new Set([...magazine, ...tools])).slice(-magazineSize);
    }
  }

  // Now simulate magazine transitions over the determined sequence
  let magazine = [...currentMagazine];
  const sequenced = [];

  ordered.forEach(chosen => {
    const tools = listToToolsMap[chosen.MatchedListNr] || [];
    const loadTools = tools.filter(tNr => !magazine.includes(tNr));
    let unloadTools = [];
    const newMagazine = [...magazine];
    loadTools.forEach(tNr => {
      while (newMagazine.length >= magazineSize) {
        const candidates = newMagazine.filter(mNr => !tools.includes(mNr));
        if (candidates.length === 0) break;
        const victim = candidates[0];
        const idx = newMagazine.indexOf(victim);
        newMagazine.splice(idx, 1);
        unloadTools.push(victim);
      }
      newMagazine.push(tNr);
    });
    magazine = newMagazine;
    sequenced.push({
      ...chosen,
      loadTools,
      unloadTools,
      missesCount: loadTools.length
    });
  });

  return { sequenced, finalMagazine: magazine };
}

// Helper to get next 5 working days (Monday-Friday) starting from a date
function getNext5WorkingDays(startDateStr) {
  const days = [];
  let curr = new Date(startDateStr);
  let limit = 0;
  while (days.length < 5 && limit < 15) {
    limit++;
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(curr.toISOString().substring(0, 10));
    }
    curr.setDate(curr.getDate() + 1);
  }
  return days;
}

// Helper to simulate unoptimized tool changes for comparison
function calculateToolChanges(stepsList, initialMagazine, magazineSize, listToToolsMap) {
  let currentMag = [...initialMagazine];
  let totalChanges = 0;
  stepsList.forEach(s => {
    const tools = listToToolsMap[s.MatchedListNr] || [];
    const load = tools.filter(t => !currentMag.includes(t));
    totalChanges += load.length;

    // Simulate magazine update
    const combined = Array.from(new Set([...currentMag, ...load]));
    if (combined.length > magazineSize) {
      currentMag = combined.slice(combined.length - magazineSize);
    } else {
      currentMag = combined;
    }
  });
  return totalChanges;
}

// 7b. Planning Tab Kanban Data Endpoint
app.get('/api/planning', async (req, res) => {
  try {
    if (!cachedSetupData) {
      return res.status(503).json({ error: 'Systemdaten werden noch geladen' });
    }

    const { startDate, optimize, algo } = req.query;
    let { steps, listToToolsMap, toolsDetails } = cachedSetupData;

    // Build machine id -> name lookup map
    const machineMap = {};
    if (cachedMachines) {
      cachedMachines.forEach(m => {
        if (m.type === 'machine' && m.dbId) {
          machineMap[m.dbId] = m.name || m.number;
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

    // Filter to green steps only
    const greenSteps = steps.filter(step => step.color === 'Green');

    // Find default start date (always today to avoid planning in the past by default!)
    const defaultStartStr = new Date().toISOString().substring(0, 10);

    const startStr = startDate || defaultStartStr;
    const planningDays = getNext5WorkingDays(startStr);

    const machinesList = ['Brother', 'chiron', 'C400', 'C40', 'C42', 'RS2_1', 'RS2_2'];

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
      'chiron': 21,
      'C400': 2,
      'C40': 4,
      'C42': 25,
      'RS2_1': 5,
      'RS2_2': 6
    };

    let capacities = {};
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
        WHERE ID IN (2, 4, 5, 6, 8, 21, 25)
      `);
      capResult.recordset.forEach(row => {
        const id = parseInt(row.ID);
        capacities[id] = {
          1: row.MS_KAPAZITAET_ZEIT_MINUTEN_MO || 0, // Monday
          2: row.MS_KAPAZITAET_ZEIT_MINUTEN_DI || 0, // Tuesday
          3: row.MS_KAPAZITAET_ZEIT_MINUTEN_MI || 0, // Wednesday
          4: row.MS_KAPAZITAET_ZEIT_MINUTEN_DO || 0, // Thursday
          5: row.MS_KAPAZITAET_ZEIT_MINUTEN_FR || 0, // Friday
          6: row.MS_KAPAZITAET_ZEIT_MINUTEN_SA || 0, // Saturday
          0: row.MS_KAPAZITAET_ZEIT_MINUTEN_SO || 0  // Sunday
        };
      });
    } catch (err) {
      console.error('Error fetching capacities:', err);
    }

    const getCapacityForDay = (mName, dateStr) => {
      if (dateStr === 'Überlauf') return 99999;
      const dbId = machineIdMap[mName];
      if (!dbId || !capacities[dbId]) return 360; // Default capacity: 6 hours
      const dayOfWeek = new Date(dateStr).getDay(); // 0 = Sunday, 1 = Monday, etc.
      const cap = capacities[dbId][dayOfWeek];
      return cap > 0 ? cap : 360; // Fallback to 360 if 0 or null
    };

    // Filter and group steps by Machine and Date
    const board = {};
    machinesList.forEach(mName => {
      board[mName] = {};
      planningDays.forEach(day => {
        board[mName][day] = [];
      });
    });

    // List to hold pool steps that need dynamic distribution
    const poolSteps = [];

    // Populate steps
    greenSteps.forEach(step => {
      const stepDate = step.StartDate || step.DeliveryDate;
      if (!stepDate) return;
      let stepDateStr = new Date(stepDate).toISOString().substring(0, 10);

      // Backlog catch-up: if step is in the past, reschedule to the first day of planning!
      if (stepDateStr < planningDays[0]) {
        stepDateStr = planningDays[0];
      }

      // Skip future steps that are outside the 5-day planning range
      if (!planningDays.includes(stepDateStr)) {
        return;
      }

      // Check if the step has a specific machine assignment
      if (step.MachineId === 8) {
        board['Brother'][stepDateStr].push(step);
      } else if (step.MachineId === 21) {
        board['chiron'][stepDateStr].push(step);
      } else if (step.MachineId === 2) {
        board['C400'][stepDateStr].push(step);
      } else if (step.MachineId === 4) {
        board['C40'][stepDateStr].push(step);
      } else if (step.MachineId === 25) {
        board['C42'][stepDateStr].push(step);
      } else if (step.MachineId === 5) {
        board['RS2_1'][stepDateStr].push(step);
      } else if (step.MachineId === 6) {
        board['RS2_2'][stepDateStr].push(step);
      } else if (!step.MachineId || step.MachineId === 0) {
        // Pool assignment step - save to list to distribute dynamically after baseline load
        if (step.MachinePoolId === 13 || step.MachinePoolId === 9 || step.MachinePoolId === 12) {
          poolSteps.push({ step, dateStr: stepDateStr });
        }
      }
    });

    // Dynamically distribute pool steps to balance workload (total SetupTime on that day)
    poolSteps.forEach(({ step, dateStr }) => {
      if (step.MachinePoolId === 13) {
        // Pool C40-C42: distribute to machine with lower setup load on that day
        const loadC40 = board['C40'][dateStr].reduce((sum, s) => sum + s.SetupTime, 0);
        const loadC42 = board['C42'][dateStr].reduce((sum, s) => sum + s.SetupTime, 0);
        if (loadC40 <= loadC42) {
          board['C40'][dateStr].push(step);
        } else {
          board['C42'][dateStr].push(step);
        }
      } else if (step.MachinePoolId === 9 || step.MachinePoolId === 12) {
        // Pool RS2: distribute to machine with lower setup load on that day
        const loadRS2_1 = board['RS2_1'][dateStr].reduce((sum, s) => sum + s.SetupTime, 0);
        const loadRS2_2 = board['RS2_2'][dateStr].reduce((sum, s) => sum + s.SetupTime, 0);
        if (loadRS2_1 <= loadRS2_2) {
          board['RS2_1'][dateStr].push(step);
        } else {
          board['RS2_2'][dateStr].push(step);
        }
      }
    });

    const shouldOptimize = optimize !== 'false';
    const optimizeNightRun = req.query.optimizeNightRun !== 'false';
    const activeAlgo = shouldOptimize ? (algo || 'greedy') : 'none';

    const finalBoard = {};
    const dailyCapacities = {};

    machinesList.forEach(mName => {
      finalBoard[mName] = {};
      dailyCapacities[mName] = {};
      let runningMagazine = [...machineMagazines[mName].magazine];
      const mSize = machineMagazines[mName].size;
      let overflowQueue = [];

      // We optimize chronologically Day 1 -> Day 2 -> ... -> Day 5
      planningDays.forEach(day => {
        const dayCapacity = getCapacityForDay(mName, day);
        dailyCapacities[mName][day] = dayCapacity;

        const dayCandidates = [...overflowQueue, ...board[mName][day]];
        let sequencedSteps = [];

        if (dayCandidates.length > 0) {
          if (shouldOptimize && optimizeNightRun) {
            // Night-run optimization: split into normal and night-run steps
            const nightSteps = dayCandidates.filter(s => s.isNightRunCapable);
            const normalSteps = dayCandidates.filter(s => !s.isNightRunCapable);

            let currentMag = [...runningMagazine];
            const isChironOrBrother = mName === 'chiron' || mName === 'Brother';

            if (isChironOrBrother) {
              // For Chiron and Brother, prioritize night-run tasks first
              if (nightSteps.length > 0) {
                const { sequenced, finalMagazine } = sequenceSteps(nightSteps, currentMag, mSize, listToToolsMap, activeAlgo);
                sequencedSteps = sequencedSteps.concat(sequenced);
                currentMag = finalMagazine;
              }
              if (normalSteps.length > 0) {
                const { sequenced, finalMagazine } = sequenceSteps(normalSteps, currentMag, mSize, listToToolsMap, activeAlgo);
                sequencedSteps = sequencedSteps.concat(sequenced);
                currentMag = finalMagazine;
              }
            } else {
              // Standard night-run optimization: normal steps first, night-run steps last
              if (normalSteps.length > 0) {
                const { sequenced, finalMagazine } = sequenceSteps(normalSteps, currentMag, mSize, listToToolsMap, activeAlgo);
                sequencedSteps = sequencedSteps.concat(sequenced);
                currentMag = finalMagazine;
              }
              if (nightSteps.length > 0) {
                const { sequenced, finalMagazine } = sequenceSteps(nightSteps, currentMag, mSize, listToToolsMap, activeAlgo);
                sequencedSteps = sequencedSteps.concat(sequenced);
                currentMag = finalMagazine;
              }
            }

            runningMagazine = currentMag;
          } else {
            // Standard sequencing (whole list together)
            const { sequenced, finalMagazine } = sequenceSteps(dayCandidates, runningMagazine, mSize, listToToolsMap, activeAlgo);
            sequencedSteps = sequenced;
            runningMagazine = finalMagazine;
          }
        }

        // Apply capacity constraint scheduling
        let totalLoad = 0;
        let dayScheduled = [];
        let nextDayOverflow = [];

        sequencedSteps.forEach(s => {
          const stepDuration = (s.SetupTime || 0) + (s.prodTime || 0);
          const canBypassCapacity = s.isNightRunCapable && s.loadTools && s.loadTools.length === 0;
          const fitsOnDay = (totalLoad + stepDuration <= dayCapacity) || (totalLoad === 0) || canBypassCapacity;

          if (fitsOnDay) {
            // Check 24h limit (1440 mins)
            if (totalLoad + stepDuration <= 1440) {
              dayScheduled.push(s);
              totalLoad += stepDuration;
            } else {
              // Exceeds 24h limit, split the task!
              const dayRemaining = 1440 - totalLoad;
              if (dayRemaining > 0) {
                const fittedProdTime = Math.max(0, dayRemaining - (s.SetupTime || 0));
                const remainingProdTime = (s.prodTime || 0) - fittedProdTime;

                dayScheduled.push({
                  ...s,
                  prodTime: fittedProdTime,
                  isSplit: true,
                  splitPart: s.splitPart || 1,
                  originalStepId: s.originalStepId || s.StepId
                });
                totalLoad = 1440;

                if (remainingProdTime > 0) {
                  nextDayOverflow.push({
                    ...s,
                    SetupTime: 0, // setup is done
                    prodTime: remainingProdTime,
                    isSplit: true,
                    splitPart: (s.splitPart || 1) + 1,
                    originalStepId: s.originalStepId || s.StepId
                  });
                }
              } else {
                nextDayOverflow.push(s);
              }
            }
          } else {
            nextDayOverflow.push(s);
          }
        });

        overflowQueue = nextDayOverflow;

        // Enrich step details for response
        finalBoard[mName][day] = dayScheduled.map(s => {
          const tools = listToToolsMap[s.MatchedListNr] || [];
          const originalDate = s.StartDate || s.DeliveryDate;
          const originalDateStr = originalDate ? new Date(originalDate).toISOString().substring(0, 10) : '';
          const isConflict = originalDateStr && (originalDateStr < planningDays[0]);

          const entireArbeitsplan = (ordersMap[s.OrderId] || [])
            .map(planStep => {
              const machineName = machineMap[planStep.MachineId] || (planStep.MachineId ? `Maschine #${planStep.MachineId}` : 'Unbekannt');
              return {
                stepId: planStep.StepId,
                stepPos: planStep.StepPos,
                stepDesc: (planStep.StepDesc || '').trim(),
                color: planStep.color || 'Yellow',
                setupTime: planStep.SetupTime || 0,
                prodTime: planStep.prodTime || 0,
                isCompleted: planStep.SPKO === 4,
                isExecuting: planStep.SPKO === 2,
                machineName: machineName
              };
            });

          return {
            stepId: s.StepId,
            orderId: s.OrderId,
            contractNumber: s.ContractNumber || null,
            stepPos: s.StepPos || null,
            articleId: s.ArticleId,
            orderDesc: s.OrderDesc,
            stepDesc: s.StepDesc.trim(),
            setupTime: s.SetupTime,
            prodTime: s.prodTime || 0,
            isNightRunCapable: s.isNightRunCapable || false,
            isConflict: isConflict || false,
            originalStartDate: originalDateStr || null,
            isSplit: s.isSplit || false,
            splitPart: s.splitPart || null,
            isExecuting: s.SPKO === 2,
            ncProgram: s.NCProgram || null,
            matchedListNr: s.MatchedListNr || null,
            matchedListIdent: s.MatchedListIdent || null,
            color: s.color,
            entireArbeitsplan,
            missesCount: s.loadTools.length,
            loadTools: s.loadTools.map(tNr => {
              const details = toolsDetails[tNr];
              return {
                nr: tNr,
                desc: details ? details.desc : 'Unbekannt',
                dia: details ? details.dia : null,
                len: details ? details.len : null
              };
            }),
            unloadTools: s.unloadTools.map(tNr => {
              const details = toolsDetails[tNr];
              return {
                nr: tNr,
                desc: details ? details.desc : 'Unbekannt',
                dia: details ? details.dia : null,
                len: details ? details.len : null
              };
            }),
            toolsCount: tools.length
          };
        });
      });

      // After Day 5, any remaining overflow goes to the 'Überlauf' column
      dailyCapacities[mName]['Überlauf'] = 99999;
      finalBoard[mName]['Überlauf'] = overflowQueue.map(s => {
        const tools = listToToolsMap[s.MatchedListNr] || [];
        const originalDate = s.StartDate || s.DeliveryDate;
        const originalDateStr = originalDate ? new Date(originalDate).toISOString().substring(0, 10) : '';
        const isConflict = originalDateStr && (originalDateStr < planningDays[0]);

        const entireArbeitsplan = (ordersMap[s.OrderId] || [])
          .map(planStep => {
            const machineName = machineMap[planStep.MachineId] || (planStep.MachineId ? `Maschine #${planStep.MachineId}` : 'Unbekannt');
            return {
              stepId: planStep.StepId,
              stepPos: planStep.StepPos,
              stepDesc: (planStep.StepDesc || '').trim(),
              color: planStep.color || 'Yellow',
              setupTime: planStep.SetupTime || 0,
              prodTime: planStep.prodTime || 0,
              isCompleted: planStep.SPKO === 4,
              isExecuting: planStep.SPKO === 2,
              machineName: machineName
            };
          });

        return {
          stepId: s.StepId,
          orderId: s.OrderId,
          contractNumber: s.ContractNumber || null,
          stepPos: s.StepPos || null,
          articleId: s.ArticleId,
          orderDesc: s.OrderDesc,
          stepDesc: s.StepDesc.trim(),
          setupTime: s.SetupTime,
          prodTime: s.prodTime || 0,
          isNightRunCapable: s.isNightRunCapable || false,
          isConflict: isConflict || false,
          originalStartDate: originalDateStr || null,
          isSplit: s.isSplit || false,
          splitPart: s.splitPart || null,
          isExecuting: s.SPKO === 2,
          ncProgram: s.NCProgram || null,
          matchedListNr: s.MatchedListNr || null,
          matchedListIdent: s.MatchedListIdent || null,
          color: s.color,
          entireArbeitsplan,
          missesCount: s.loadTools.length,
          loadTools: s.loadTools.map(tNr => {
            const details = toolsDetails[tNr];
            return {
              nr: tNr,
              desc: details ? details.desc : 'Unbekannt',
              dia: details ? details.dia : null,
              len: details ? details.len : null
            };
          }),
          unloadTools: s.unloadTools.map(tNr => {
            const details = toolsDetails[tNr];
            return {
              nr: tNr,
              desc: details ? details.desc : 'Unbekannt',
              dia: details ? details.dia : null,
              len: details ? details.len : null
            };
          }),
          toolsCount: tools.length
        };
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

      // 1. All candidates for the 5 days
      const allCandidates = [].concat(...planningDays.map(day => board[mName][day] || []));
      const origChanges = calculateToolChanges(allCandidates, initialMag, mSize, listToToolsMap);
      totalOriginalChanges += origChanges;

      // Simulate unoptimized setup times for candidates
      let currentMagUnopt = [...initialMag];
      const unoptimizedSetupTimes = {};
      allCandidates.forEach(s => {
        const tools = listToToolsMap[s.MatchedListNr] || [];
        const load = tools.filter(t => !currentMagUnopt.includes(t));
        const combined = Array.from(new Set([...currentMagUnopt, ...load]));
        currentMagUnopt = combined.slice(-mSize);

        const unoptSetup = tools.length > 0 
          ? s.SetupTime * (0.3 + 0.7 * (load.length / tools.length))
          : s.SetupTime;
        unoptimizedSetupTimes[s.StepId] = unoptSetup;
      });

      // 2. Optimized scheduled steps (excluding 'Überlauf' for savings metrics)
      const scheduledSteps = [].concat(...planningDays.map(day => finalBoard[mName][day] || []));
      const optChanges = scheduledSteps.reduce((acc, s) => acc + (s.missesCount || 0), 0);
      totalOptimizedChanges += optChanges;

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
      }
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
      return res.status(503).json({ error: 'Rüstdaten werden noch geladen' });
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
          if (type === 'pool') {
            return step.MachinePoolId === dbId;
          } else {
            return step.MachineId === dbId;
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
      return res.status(503).json({ error: 'Systemdaten werden noch geladen' });
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
          if (!initialToolNrs.includes(tNr)) {
            initialToolNrs.push(tNr);
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
          
          let victim = candidates[0];
          let oldestIdx = simLastUsedIndex[victim] !== undefined ? simLastUsedIndex[victim] : -2;
          candidates.forEach(cand => {
            const candIdx = simLastUsedIndex[cand] !== undefined ? simLastUsedIndex[cand] : -2;
            if (candIdx < oldestIdx) {
              oldestIdx = candIdx;
              victim = cand;
            }
          });
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
          
          // Find the LRU candidate
          let victim = candidates[0];
          let oldestIndex = lastUsedIndex[victim] !== undefined ? lastUsedIndex[victim] : -2;
          
          candidates.forEach(cand => {
            const candIndex = lastUsedIndex[cand] !== undefined ? lastUsedIndex[cand] : -2;
            if (candIndex < oldestIndex) {
              oldestIndex = candIndex;
              victim = cand;
            }
          });
          
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
  
  // Resolve initial magazine tools details
  const initialMagazineResolved = initialToolNrs.map(tNr => {
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
      return res.status(503).json({ error: 'Rüstdaten werden noch geladen' });
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

// Initialize server and execute cache pre-warmup in background
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  warmupAllCaches();
});
