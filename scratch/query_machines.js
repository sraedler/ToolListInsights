const { getPoolD4 } = require('../backend/db');

async function findFixturesInSteps() {
  const pool = await getPoolD4();
  
  const res = await pool.request().query(`
    SELECT TOP 50 CAST(PSP_BEZEICHNUNG AS VARCHAR(1000)) as text
    FROM [D4].[dbo].[tPPS_SKKALP]
    WHERE CAST(PSP_BEZEICHNUNG AS VARCHAR(1000)) LIKE '%Vorrichtung%' 
       OR CAST(PSP_BEZEICHNUNG AS VARCHAR(1000)) LIKE '%Spann%'
  `);
  
  console.log("=== STEP DESCRIPTIONS WITH FIXTURES ===");
  res.recordset.forEach(r => {
    console.log(r.text);
    console.log("------------------------");
  });
  process.exit(0);
}

findFixturesInSteps().catch(e => {
  console.error(e);
  process.exit(1);
});
