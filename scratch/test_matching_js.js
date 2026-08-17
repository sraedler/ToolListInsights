const { findMatches, extractNCPrograms } = require('../backend/matching');
const { getPoolWT } = require('../backend/db');

async function test() {
  try {
    const poolWT = await getPoolWT();
    const res = await poolWT.request().query('SELECT Nr, Ident, NCP, Descript, MachineNr FROM [WTDATA].[dbo].[ToolLists]');
    const toolLists = res.recordset;

    const progName = "6152-NA";
    const matches = findMatches(progName, toolLists, 0.70);
    console.log("findMatches('6152-NA') returned:", matches);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
