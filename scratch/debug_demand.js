const { getPoolD4, getPoolWT } = require('../backend/db');

// Mock extractNCPrograms and findMatches
const extractNCPrograms = (text) => {
  if (!text) return [];
  const matches = text.match(/(?:NC[-_]?[Pp]rog(?:ramm)?:?\s*|NC:?\s*)?(\d{4,8}\b)/g) || [];
  return matches.map(m => m.replace(/[^\d]/g, ''));
};

const findMatches = (prog, cachedList, minConfidence) => {
  // Simple match logic to simulate the backend
  return cachedList.filter(item => {
    return item.Ident && item.Ident.includes(prog);
  });
};

async function run() {
  try {
    console.log('=== DEBUGGING DEMAND DATABASE QUERY ===');
    const poolD4 = await getPoolD4();
    const poolWT = await getPoolWT();

    console.log('1. Fetching steps...');
    const result = await poolD4.request().query(`
      SELECT TOP 20
        b.ID as OrderId,
        CASE
          WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM
          ELSE au.BK_BKBE_AU_LI_DATUM
        END as DeliveryDate,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_MENGE_SOLL as Quantity,
        p.PSP_IDMS as MachineId,
        p.PSP_IDMP as MachinePoolId
      FROM [D4].[dbo].[tbe_Belp] b
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.PSK_IDBEBP = b.ID
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
      WHERE p.PSP_TYP_POSITION = 0
      ORDER BY b.ID ASC
    `);

    console.log(`Fetched ${result.recordset.length} steps.`);
    if (result.recordset.length > 0) {
      console.log('Sample step descriptions and delivery dates:');
      result.recordset.forEach(r => {
        console.log(`- Date: ${r.DeliveryDate}, Desc: ${r.StepDesc}`);
      });
    }

    const countResult = await poolD4.request().query(`
      SELECT COUNT(*) as count
      FROM [D4].[dbo].[tbe_Belp] b
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.PSK_IDBEBP = b.ID
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
      WHERE p.PSP_TYP_POSITION = 0
        AND (b.BP_LI_DATUM IS NOT NULL OR au.BK_BKBE_AU_LI_DATUM IS NOT NULL)
    `);
    console.log('Total steps with valid delivery date in database:', countResult.recordset[0].count);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
