const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

function mapD4ColorToHex(kgFarbe) {
  if (kgFarbe === null || kgFarbe === undefined || kgFarbe === -1) return 'Keine Farbe (-1)';
  const num = Number(kgFarbe);
  switch (num) {
    case 1: case 11: case 16: case 43: return '#ef4444 (Rot)';
    case 2: case 17: case 36: case 52: return '#f97316 (Orange)';
    case 3: case 50: return '#eab308 (Gelb)';
    case 4: case 13: case 18: case 23: case 30: case 37: return '#eab308 (Gelb)';
    case 5: case 34: case 48: return '#38bdf8 (Hellblau)';
    case 6: case 41: case 42: case 47: return '#22c55e (Hellgrün)';
    case 7: case 14: case 19: case 24: case 38: case 49: return '#10b981 (Grün)';
    case 8: case 15: case 20: case 25: case 32: case 39: case 40: case 45: return '#3b82f6 (Blau)';
    case 10: case 55: return '#a855f7 (Lila)';
    case 12: case 13: case 31: case 46: case 59: case 60: return '#991b1b (Dunkelrot)';
    case 15: case 19: case 56: case 65: case 66: return '#8b5cf6 (Violett)';
    case 22: case 57: case 64: return '#6b7280 (Grau)';
    case 23: case 63: return '#4b5563 (Dunkelgrau)';
    case 24: return '#06b6d4 (Türkis)';
    default:
      if (num > 255) {
        const r = num & 0xFF;
        const g = (num >> 8) & 0xFF;
        const b = (num >> 16) & 0xFF;
        return `rgb(${r}, ${g}, ${b})`;
      }
      return `#${num} (Standard)`;
  }
}

async function run() {
  try {
    const pool = await getPoolD4();
    const res = await pool.request().query(`
      SELECT ID, KG_BEZEICHNUNG, KG_FARBE 
      FROM [D4].[dbo].[tKAGO]
      ORDER BY CAST(ID AS INT) ASC
    `);
    
    console.log(JSON.stringify(res.recordset.map(row => ({
      ID: row.ID,
      Bezeichnung: row.KG_BEZEICHNUNG,
      KG_FARBE: row.KG_FARBE,
      MappedColor: mapD4ColorToHex(row.KG_FARBE)
    })), null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
