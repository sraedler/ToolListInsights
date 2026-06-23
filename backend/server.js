const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { getPoolD4, getPoolWT, sql } = require('./db');
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
let cachedSetupData = null;
let cachedMachines = [];

// Warm-up functions
async function loadToolListsCache() {
  const poolWT = await getPoolWT();
  console.log('Loading ToolLists from WinTool database into cache...');
  const result = await poolWT.request().query(
    'SELECT Nr, Ident, NCP, Descript, MachineNr FROM [WTDATA].[dbo].[ToolLists]'
  );
  cachedToolLists = result.recordset;
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
  const result = await poolD4.request().query(`
    SELECT
      b.ID as OrderId,
      b.BP_PP_DATUM_START as StartDate,
      b.BP_PP_DATUM_TERMIN as EndDate,
      p.PSP_BEZEICHNUNG as StepDesc,
      p.PSP_MENGE_SOLL as Quantity
    FROM [D4].[dbo].[tbe_Belp] b
    INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.PSK_IDBEBP = b.ID
    INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
    WHERE p.PSP_TYP_POSITION = 0
      AND b.BP_PP_DATUM_START IS NOT NULL
    ORDER BY b.BP_PP_DATUM_START ASC
  `);

  const steps = result.recordset;

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

  const demandByDate = {};
  steps.forEach(step => {
    const dateStr = new Date(step.StartDate).toISOString().substring(0, 10);
    const progs = extractNCPrograms(step.StepDesc);

    progs.forEach(prog => {
      const matches = findMatches(prog, cachedToolLists, 0.7);
      if (matches.length > 0) {
        const matchedList = matches[0];
        const listTools = listToToolsMap[matchedList.Nr] || [];

        listTools.forEach(lt => {
          const requiredQty = lt.qty * (step.Quantity || 1);
          if (!demandByDate[dateStr]) {
            demandByDate[dateStr] = {};
          }
          if (!demandByDate[dateStr][lt.toolNr]) {
            demandByDate[dateStr][lt.toolNr] = 0;
          }
          demandByDate[dateStr][lt.toolNr] += requiredQty;
        });
      }
    });
  });

  cachedDemand = Object.keys(demandByDate).sort().map(date => {
    const toolsReq = demandByDate[date];
    const items = Object.keys(toolsReq).map(tNr => ({
      toolNr: parseInt(tNr),
      quantity: toolsReq[tNr],
      details: toolDetails[tNr] || { nr: tNr, desc: 'Unbekannt' }
    }));
    
    const totalTools = items.reduce((acc, curr) => acc + curr.quantity, 0);

    return {
      date,
      totalTools,
      tools: items
    };
  });
  console.log('Tool demand timeline cached.');
}

async function cacheSetupData() {
  const poolD4 = await getPoolD4();
  const poolWT = await getPoolWT();

  console.log('Caching steps and tools mappings for setup simulation...');
  const stepsResult = await poolD4.request().query(`
    SELECT
      b.ID as OrderId,
      b.BP_ARTIKEL_BEZEICHNUNG as OrderDesc,
      b.BP_IDAR as ArticleId,
      p.ID as StepId,
      p.PSP_BEZEICHNUNG as StepDesc,
      p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupTime,
      p.PSP_IDMS as MachineId,
      p.PSP_IDMP as MachinePoolId,
      CASE
        WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM
        ELSE au.BK_BKBE_AU_LI_DATUM
      END as DeliveryDate,
      bk.BK_BKBE_NUMMER as ContractNumber
    FROM [D4].[dbo].[tbe_Belp] b
    INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.PSK_IDBEBP = b.ID
    INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
    LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
    LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
    WHERE p.PSP_TYP_POSITION = 0 AND p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL > 0
  `);

  const mappingResult = await poolWT.request().query(`
    SELECT ToolListNr, ToolNr
    FROM [WTDATA].[dbo].[ToolList]
    WHERE ToolNr IS NOT NULL
  `);

  const listToToolsMap = {};
  const toolUsageCounts = {};
  mappingResult.recordset.forEach(row => {
    if (!listToToolsMap[row.ToolListNr]) {
      listToToolsMap[row.ToolListNr] = [];
    }
    listToToolsMap[row.ToolListNr].push(row.ToolNr);
    toolUsageCounts[row.ToolNr] = (toolUsageCounts[row.ToolNr] || 0) + 1;
  });

  const toolsDetailResult = await poolWT.request().query(`
    SELECT Nr, Descript, KeyWord, Ds, CLength
    FROM [WTDATA].[dbo].[Tools]
  `);
  
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

  const steps = stepsResult.recordset;
  console.log(`Matching NC programs for ${steps.length} setup steps...`);
  const matchCache = {};
  steps.forEach(step => {
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
      if (!step.DeliveryDate) return false;
      const dStr = new Date(step.DeliveryDate).toISOString().substring(0, 10);
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

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Order steps with NC-program names and WinTool matches (Dynamic lookup)
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
        p.PSP_PP_STATUS_PRODUKTION as StatusProduction
      FROM [D4].[dbo].[tPPS_SKKALK] k
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
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
        IsFinished: step.StatusProduction === 1
      };
    });

    res.json(processedSteps);
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
  if (!cachedDemand) {
    return res.status(503).json({ error: 'Bedarfstimeline wird noch geladen' });
  }
  
  const { startDate, endDate } = req.query;
  if (startDate || endDate) {
    let filtered = cachedDemand;
    if (startDate) filtered = filtered.filter(item => item.date >= startDate);
    if (endDate) filtered = filtered.filter(item => item.date <= endDate);
    return res.json(filtered);
  }
  
  res.json(cachedDemand);
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
        if (!step.DeliveryDate) return false;
        const dStr = new Date(step.DeliveryDate).toISOString().substring(0, 10);
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

    let whereClause = `p.PSP_TYP_POSITION = 0`;
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
          WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM
          ELSE au.BK_BKBE_AU_LI_DATUM
        END as DeliveryDate
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
      if (!step.DeliveryDate) return false;
      const dStr = new Date(step.DeliveryDate).toISOString().substring(0, 10);
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

// Initialize server and execute cache pre-warmup in background
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  warmupAllCaches();
});
