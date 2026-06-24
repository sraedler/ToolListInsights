const sql = require('mssql');
const { getPoolTL } = require('../backend/db.js');

async function test() {
  try {
    const poolTL = await getPoolTL();
    const result = await poolTL.request().query('SELECT Id, Name, MagazineSize FROM Machines');
    console.log(result.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
}

test();
