const mssql = require('mssql/msnodesqlv8');

const configD4 = {
  driver: 'msnodesqlv8',
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=D4;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

async function main() {
  try {
    const pool = await mssql.connect(configD4);
    const orderId = 101652;

    const result = await pool.request().query(`
      SELECT p.ID, p.KP_POSITION_NUMMER, p.KP_BEZEICHNUNG,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM tSK_KALP_LGBEWE
            WHERE KPLG_IDSKKP = p.ID
          ) THEN 4
          ELSE 1
        END as SimulatedSPKO
      FROM tSK_KALP p
      INNER JOIN tSK_KALK k ON p.KP_IDSKKK = k.ID
      WHERE k.KK_IDBEBP = ${orderId}
      ORDER BY p.KP_POSITION_NUMMER
    `);
    console.table(result.recordset);
    await pool.close();
  } catch (err) {
    console.error(err);
  }
}

main();
