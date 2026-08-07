const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

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

async function run() {
  try {
    const pool = await getPoolD4();
    const startDateStr = '2026-08-04';
    const endDateStr = '2026-08-11';
    const res = await pool.request().query(`
      SELECT TOP 20
        p.ID as PlanId,
        bk.BK_BKBE_NUMMER as ContractNumber,
        bp.BP_POSITION_NUMMER as OrderPos,
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
      LEFT JOIN (SELECT AGBW_IDEKBK, MIN(ID) AS AGBW_MIN_ID FROM [D4].[dbo].[tAG_BEWE] WHERE AGBW_IDEKBK IS NOT NULL GROUP BY AGBW_IDEKBK) AS tAG_BEWE_BK_MIN ON tAG_BEWE_BK_MIN.AGBW_IDEKBK = bk.BK_BKBE_IDBEBK
      LEFT JOIN [D4].[dbo].[tAG_BEWE] agbw_bk WITH (NOLOCK) ON agbw_bk.ID = tAG_BEWE_BK_MIN.AGBW_MIN_ID
      LEFT JOIN [D4].[dbo].[tKAGO] kago_bk WITH (NOLOCK) ON kago_bk.ID = agbw_bk.AGBW_IDKAGO
      LEFT JOIN (SELECT AGBW_IDEKBP, MIN(ID) AS AGBW_MIN_ID FROM [D4].[dbo].[tAG_BEWE] WHERE AGBW_IDEKBP IS NOT NULL GROUP BY AGBW_IDEKBP) AS tAG_BEWE_POS_MIN ON tAG_BEWE_POS_MIN.AGBW_IDEKBP = bp.ID
      LEFT JOIN [D4].[dbo].[tAG_BEWE] agbw_pos WITH (NOLOCK) ON agbw_pos.ID = tAG_BEWE_POS_MIN.AGBW_MIN_ID
      LEFT JOIN [D4].[dbo].[tKAGO] kago_pos WITH (NOLOCK) ON kago_pos.ID = agbw_pos.AGBW_IDKAGO
      WHERE sk.PSP_PP_STATUS_PRODUKTION <> 4
        AND bk.BK_BKBE_STATUS_BEARBEITUNG = 0
        AND bk.BK_BKBE_TYP_BELEG = 2
        AND p.PSPP_DATUM_START >= CAST('${startDateStr}' AS DATE)
        AND p.PSPP_DATUM_START <= CAST('${endDateStr}' AS DATE)
    `);
    
    console.log('=== SAMPLE CURRENT PLANNING STEPS & D4 COLORS ===');
    console.log(res.recordset.map(row => ({
      ContractNumber: row.ContractNumber,
      OrderPos: row.OrderPos,
      OrderCategoryColor: row.OrderCategoryColor,
      OrderHex: mapD4ColorToHex(row.OrderCategoryColor),
      OrderCategoryName: row.OrderCategoryName,
      PositionCategoryColor: row.PositionCategoryColor,
      PositionHex: mapD4ColorToHex(row.PositionCategoryColor),
      PositionCategoryName: row.PositionCategoryName
    })));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
