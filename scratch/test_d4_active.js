const { getPoolD4 } = require('../backend/db');

async function main() {
  console.log('Connecting to D4 via db.js...');
  try {
    const pool = await getPoolD4();
    console.log('Connected! Querying active articles...');
    
    const query = `
      SELECT TOP 5 
        b.BP_IDAR as ArticleId,
        b.BP_ARTIKEL_BEZEICHNUNG as OrderDesc,
        ar.AR_NUMMER as ArticleNumber
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
    process.exit(0);
  }
}

main();
