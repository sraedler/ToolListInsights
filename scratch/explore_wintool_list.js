const { getPoolWT, sql } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  try {
    const pool = await getPoolWT();
    
    // Find matching WinTool lists
    const searchRes = await pool.request().query(`
      SELECT Nr, Ident, NCP, Descript
      FROM [WTDATA].[dbo].[ToolLists]
      WHERE Nr LIKE '%L117%' OR Ident LIKE '%L117%' OR NCP LIKE '%L117%'
    `);
    
    console.log('--- Matching WinTool Lists ---');
    console.log(searchRes.recordset);
    
    if (searchRes.recordset.length === 0) {
      console.log('No lists found.');
      process.exit(0);
    }
    
    // For each list found, query the tools inside it
    for (let list of searchRes.recordset) {
      const toolsRes = await pool.request()
        .input('listNr', sql.Int, list.Nr)
        .query(`
          SELECT tl.ToolNr, t.Descript, t.Ds as Diameter, t.CLength as Length
          FROM [WTDATA].[dbo].[ToolList] tl
          LEFT JOIN [WTDATA].[dbo].[Tools] t ON t.Nr = tl.ToolNr
          WHERE tl.ToolListNr = @listNr
        `);
        
      console.log(`\nTools in List Nr ${list.Nr} (${list.Ident}, NCP: ${list.NCP}):`);
      console.log(toolsRes.recordset);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
