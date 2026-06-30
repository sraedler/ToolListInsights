const { getPoolWT, sql } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  const pool = await getPoolWT();
  
  const toolsRes = await pool.request()
    .input('listNr', sql.Int, 121)
    .query(`
      SELECT tl.ToolNr, t.Descript, t.Ds as Diameter, t.CLength as Length
      FROM [WTDATA].[dbo].[ToolList] tl
      LEFT JOIN [WTDATA].[dbo].[Tools] t ON t.Nr = tl.ToolNr
      WHERE tl.ToolListNr = @listNr
    `);
    
  console.log('Tools in List 121:');
  console.log(toolsRes.recordset);
  process.exit(0);
}
run();
