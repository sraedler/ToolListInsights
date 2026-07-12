const sql = require('mssql/msnodesqlv8');

const config = {
  driver: 'msnodesqlv8',
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=D4;Trusted_Connection=yes;TrustServerCertificate=yes;',
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

async function main() {
  try {
    await sql.connect(config);
    const res = await sql.query(`
      SELECT PSP_IDMS, PSP_IDMP, COUNT(*) as cnt 
      FROM [D4].[dbo].[tPPS_PLANUNGSHILFE_SCHRITTE]
      WHERE PSP_STATUS_PRODUKTION = 1
      GROUP BY PSP_IDMS, PSP_IDMP
    `);
    console.log(JSON.stringify(res.recordset, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.close();
  }
}
main();
