const { getPoolD4 } = require('../backend/db');
const http = require('http');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    const res = await pool.request().query(`
      SELECT 
        p.ID as PlanId,
        sk.ID as StepId,
        CONVERT(varchar(10), p.PSPP_DATUM_START, 120) as DateStr,
        p.PSPP_ZEIT as ScheduledMin,
        bk.BK_BKBE_NUMMER as ContractNumber,
        bp.BP_POSITION_NUMMER as OrderPos,
        sk.PSP_POSITION_NUMMER as StepPos,
        sk.PSP_BEZEICHNUNG as StepDesc,
        m.MS_BEZEICHNUNG as MachineName,
        sk.PSP_IDMS as MachineId,
        sk.PSP_IDMP as MachinePoolId
      FROM [D4].[dbo].[tPPS_SKKALP_PLAN] p WITH (NOLOCK)
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] sk WITH (NOLOCK) ON sk.ID = p.PSPP_IDPSKP
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m WITH (NOLOCK) ON m.ID = sk.PSP_IDMS
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k WITH (NOLOCK) ON k.ID = sk.PSP_IDPSKKK
      INNER JOIN [D4].[dbo].[tbe_Belp] bp WITH (NOLOCK) ON bp.ID = k.PSK_IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk WITH (NOLOCK) ON bk.BK_BKBE_IDBEBK = bp.BP_IDBEBK
      WHERE bk.BK_BKBE_NUMMER = 'P202575409'
        AND bp.BP_POSITION_NUMMER = '60'
        AND sk.PSP_POSITION_NUMMER = '040'
      ORDER BY p.PSPP_DATUM_START
    `);

    console.log('=== D4 DB RECORDS FOR P202575409 POS 60 AS 040 ===');
    console.log(`Count: ${res.recordset.length}`);
    res.recordset.forEach(r => {
      console.log(`Date: ${r.DateStr} | Min: ${r.ScheduledMin} (${(r.ScheduledMin/60).toFixed(1)}h) | Machine: ${r.MachineName || ('Pool #' + r.MachinePoolId)} | StepId: ${r.StepId} | ${r.StepDesc.replace(/[\r\n]+/g, ' ').substring(0, 40)}`);
    });

    const apiRes = await new Promise(r => http.get('http://localhost:5001/api/planning?daysCount=28&includeNonGreen=true&useD4Plan=true', resp => {
      let b = ''; resp.on('data', c => b += c); resp.on('end', () => r(JSON.parse(b)));
    }));

    console.log('\n=== API BOARD SEARCH FOR P202575409 POS 60 AS 040 ===');
    let apiFound = [];
    Object.keys(apiRes.board).forEach(m => {
      Object.keys(apiRes.board[m]).forEach(d => {
        (apiRes.board[m][d] || []).forEach(s => {
          const c = String(s.contractNumber || s.ContractNumber || '');
          const o = String(s.orderPos || s.OrderPos || '');
          const st = String(s.stepPos || s.StepPos || '');
          if (c.includes('P202575409') && o === '60' && (st === '040' || st === '40')) {
            apiFound.push({ machine: m, day: d, scheduledMin: s.scheduledMin, isFreigegeben: s.isFreigegeben, isGesperrt: s.isGesperrt });
          }
        });
      });
    });
    console.log(JSON.stringify(apiFound, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
