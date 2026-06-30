const mssql = require('mssql/msnodesqlv8');

const configD4 = {
  driver: 'msnodesqlv8',
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=D4;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

async function main() {
  try {
    const pool = await mssql.connect(configD4);
    const orderId = 101652;

    console.log(`\n--- Steps in tSK_KALP for orderId = ${orderId} ---`);
    const tskRes = await pool.request()
      .input('orderId', mssql.Int, orderId)
      .query(`
        SELECT p.ID, p.KP_POSITION_NUMMER, p.KP_BEZEICHNUNG, p.KP_TYP_POSITION
        FROM tSK_KALP p
        INNER JOIN tSK_KALK k ON p.KP_IDSKKK = k.ID
        WHERE k.KK_IDBEBP = @orderId
        ORDER BY p.KP_POSITION_NUMMER
      `);
    console.table(tskRes.recordset);

    const step010 = tskRes.recordset.find(r => r.KP_POSITION_NUMMER === '010' || r.KP_POSITION_NUMMER === '10');
    if (step010) {
      const stepId = step010.ID;
      console.log(`\n--- Check in tSK_KALP_LGBEWE for Step 010 (KP ID = ${stepId}) ---`);
      const lgRes = await pool.request()
        .input('stepId', mssql.Int, stepId)
        .query(`
          SELECT ID, IDTR, KPLG_IDSKKP, KPLG_IDAR, KPLG_MENGE, KPLG_TYP_BEWEGUNG, KPLG_STATUS_BUCHUNG
          FROM tSK_KALP_LGBEWE
          WHERE KPLG_IDSKKP = @stepId
        `);
      console.table(lgRes.recordset);
    }

    await pool.close();
  } catch (err) {
    console.error(err);
  }
}

main();
