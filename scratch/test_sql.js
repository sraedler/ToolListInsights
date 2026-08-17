const { getPoolD4 } = require('../backend/db');

async function test() {
  try {
    const pool = await getPoolD4();
    console.log("Testing p.VORGAENGER...");

    const sql1 = `
      SELECT TOP 1 p.VORGAENGER
      FROM [D4].[dbo].[tPPS_SKKALP] p
    `;

    const res = await pool.request().query(sql1);
    console.log("p.VORGAENGER succeeded!", res.recordset);
    process.exit(0);
  } catch (err) {
    console.error("p.VORGAENGER failed:", err.message);
    process.exit(1);
  }
}

test();
