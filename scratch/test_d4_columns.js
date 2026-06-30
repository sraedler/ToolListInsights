const sql = require('mssql/msnodesqlv8');

async function main() {
  const connStr = "server=SRVD4\\SQLD4;Database=D4;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
  console.log('Connecting to D4...');
  
  try {
    const pool = await sql.connect(connStr);
    console.log('Connected! Querying tbe_Belp columns...');
    
    // Select one row joining tARST
    const query = `
      SELECT TOP 5 
        b.BP_IDAR,
        b.BP_ARTIKEL_BEZEICHNUNG,
        ar.AR_NUMMER
      FROM [D4].[dbo].[tbe_Belp] b
      LEFT JOIN [D4].[dbo].[tARST] ar ON ar.ID = b.BP_IDAR
      WHERE b.BP_IDAR IS NOT NULL
    `;
    const res = await pool.request().query(query);
    console.log('Results:');
    console.log(res.recordset);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sql.close();
  }
}

main();
