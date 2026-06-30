const mssql = require('mssql/msnodesqlv8');

const configD4 = {
  driver: 'msnodesqlv8',
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=D4;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

async function main() {
  try {
    const pool = await mssql.connect(configD4);
    
    console.log('--- Finding Order P202675738 ---');
    const orderRes = await pool.request()
      .input('num', mssql.VarChar, 'P202675738')
      .query(`
        SELECT b.ID as BelpId, b.BP_POSITION_NUMMER, bk.BK_BKBE_NUMMER, k.ID as KalkId
        FROM tbe_Belp b
        INNER JOIN tBE_BELK_BKBE bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
        LEFT JOIN tPPS_SKKALK k ON k.PSK_IDBEBP = b.ID
        WHERE bk.BK_BKBE_NUMMER = @num
      `);
    console.log('Order:', orderRes.recordset);

    if (orderRes.recordset.length > 0) {
      const orderId = orderRes.recordset[0].BelpId;
      console.log(`\n--- Steps in tPPS_SKKALP for orderId = ${orderId} ---`);
      const stepsRes = await pool.request()
        .input('orderId', mssql.Int, orderId)
        .query(`
          SELECT p.ID, p.PSP_POSITION_NUMMER, p.PSP_BEZEICHNUNG, p.PSP_TYP_POSITION, p.PSP_PP_STATUS_PRODUKTION,
            COALESCE(masta.MS_BEZEICHNUNG, pool.MP_BEZEICHNUNG, masta.MS_NUMMER, '') as MachineName
          FROM tPPS_SKKALP p
          INNER JOIN tPPS_SKKALK k ON p.PSP_IDPSKKK = k.ID
          LEFT JOIN tPPS_MASTA masta ON masta.ID = p.PSP_IDMS
          LEFT JOIN tPPS_MASCHPOOL pool ON pool.ID = p.PSP_IDMP
          WHERE k.PSK_IDBEBP = @orderId
          ORDER BY p.PSP_POSITION_NUMMER
        `);
      console.table(stepsRes.recordset);
    }
    await pool.close();
  } catch (err) {
    console.error(err);
  }
}

main();
