const mssql = require('mssql/msnodesqlv8');

const configD4 = {
  driver: 'msnodesqlv8',
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=D4;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

async function main() {
  try {
    const pool = await mssql.connect(configD4);
    const orderId = 111090;

    console.log(`\n--- All columns in tSK_KALP for KK_IDBEBP = ${orderId} ---`);
    const tskRes = await pool.request()
      .input('orderId', mssql.Int, orderId)
      .query(`
        SELECT p.*
        FROM tSK_KALP p
        INNER JOIN tSK_KALK k ON p.KP_IDSKKK = k.ID
        WHERE k.KK_IDBEBP = @orderId
        ORDER BY p.KP_POSITION_NUMMER
      `);
    console.table(tskRes.recordset.map(r => ({
      ID: r.ID,
      Pos: r.KP_POSITION_NUMMER,
      Bezeichnung: r.KP_BEZEICHNUNG,
      Typ: r.KP_TYP_POSITION,
      Machine: r.KP_IDMS
    })));

    await pool.close();
  } catch (err) {
    console.error(err);
  }
}

main();
