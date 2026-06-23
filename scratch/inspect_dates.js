const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query(`
      SELECT 
        MIN(CASE WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM ELSE au.BK_BKBE_AU_LI_DATUM END) as MinDate,
        MAX(CASE WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM ELSE au.BK_BKBE_AU_LI_DATUM END) as MaxDate,
        COUNT(*) as TotalCount
      FROM [D4].[dbo].[tbe_Belp] b
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.PSK_IDBEBP = b.ID
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
      WHERE p.PSP_TYP_POSITION = 0
        AND (b.BP_LI_DATUM IS NOT NULL OR au.BK_BKBE_AU_LI_DATUM IS NOT NULL)
    `);
    
    console.log('D4 DeliveryDate Statistics:');
    console.log('Min Date:', result.recordset[0].MinDate);
    console.log('Max Date:', result.recordset[0].MaxDate);
    console.log('Total Steps:', result.recordset[0].TotalCount);
    
    const countFuture = await pool.request().query(`
      SELECT COUNT(*) as FutureCount
      FROM [D4].[dbo].[tbe_Belp] b
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.PSK_IDBEBP = b.ID
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
      WHERE p.PSP_TYP_POSITION = 0
        AND (b.BP_LI_DATUM IS NOT NULL OR au.BK_BKBE_AU_LI_DATUM IS NOT NULL)
        AND (CASE WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM ELSE au.BK_BKBE_AU_LI_DATUM END) >= GETDATE()
    `);
    console.log('Steps with Date >= Today:', countFuture.recordset[0].FutureCount);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
