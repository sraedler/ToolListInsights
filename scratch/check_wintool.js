const { getPoolWT } = require('../backend/db');

async function test() {
  try {
    const poolWT = await getPoolWT();
    const result = await poolWT.request().query(`
      SELECT Nr, Ident, NCP, Descript, MachineNr 
      FROM [WTDATA].[dbo].[ToolLists] 
      WHERE NCP LIKE '%6152%' OR Ident LIKE '%6152%' OR Descript LIKE '%6152%' OR Nr LIKE '%6152%'
    `);
    console.log("WinTool matches for 6152:", result.recordset);

    const resultRS2 = await poolWT.request().query(`
      SELECT Nr, Ident, NCP, Descript, MachineNr 
      FROM [WTDATA].[dbo].[ToolLists] 
      WHERE MachineNr IN (3, 4) OR Descript LIKE '%RS2%' OR Descript LIKE '%RS1%'
    `);
    console.log("WinTool total RS2 lists:", resultRS2.recordset.length);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
