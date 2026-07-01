const { getPoolD4 } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  const pool = await getPoolD4();
  
  const res = await pool.request().query(`
    SELECT TOP 100 CAST(PSP_BEZEICHNUNG AS VARCHAR(1000)) as PSP_BEZEICHNUNG
    FROM [D4].[dbo].[tPPS_SKKALP]
    WHERE PSP_BEZEICHNUNG LIKE '%Vorrichtung%' OR PSP_BEZEICHNUNG LIKE '%VBZ%'
  `);
  
  console.log('Sample step descriptions containing Vorrichtung or VBZ:');
  res.recordset.forEach((r, idx) => {
    console.log(`\n#${idx + 1}:`);
    console.log(r.PSP_BEZEICHNUNG);
  });
  
  process.exit(0);
}
run();
