const { getPoolD4 } = require('../backend/db');

async function listOperations() {
  const pool = await getPoolD4();
  const res = await pool.request().query(`
    SELECT ID, AS_NUMMER, CAST(AS_BEZEICHNUNG AS VARCHAR(255)) as Name 
    FROM [D4].[dbo].[tPPS_ARBSCHR] 
    WHERE CAST(AS_BEZEICHNUNG AS VARCHAR(255)) LIKE '%Montage%'
       OR CAST(AS_BEZEICHNUNG AS VARCHAR(255)) LIKE '%Prüf%'
       OR CAST(AS_BEZEICHNUNG AS VARCHAR(255)) LIKE '%Versand%'
       OR CAST(AS_BEZEICHNUNG AS VARCHAR(255)) LIKE '%Laser%'
       OR CAST(AS_BEZEICHNUNG AS VARCHAR(255)) LIKE '%Mess%'
       OR CAST(AS_BEZEICHNUNG AS VARCHAR(255)) LIKE '%Entgrat%'
  `);
  console.log("=== OPERATIONS ===");
  res.recordset.forEach(r => {
    console.log(`ID: ${r.ID}, Number: ${r.AS_NUMMER}, Name: ${r.Name}`);
  });
  process.exit(0);
}

listOperations().catch(e => {
  console.error(e);
  process.exit(1);
});
