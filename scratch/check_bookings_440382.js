const { getPoolD4 } = require('../backend/db');

async function main() {
  try {
    const pool = await getPoolD4();
    console.log('Querying tZE_BUCH bookings for Step 440382...');

    const res = await pool.request().query(`
      SELECT 
        zb.ID as BuchId,
        zb.ZBU_IDPSKP as StepId,
        zb.ZBU_IDMS as BookedMachineId,
        m.MS_BEZEICHNUNG as BookedMachineName,
        m.MS_NUMMER as BookedMachineNummer,
        zb.ZBU_MENGE_IST as MengeIst,
        zbb.ZBUBW_DATUM_ZEIT_START as StartTime,
        zbb.ZBUBW_DATUM_ZEIT_STOP as StopTime
      FROM [D4].[dbo].[tZE_BUCH] zb WITH (NOLOCK)
      LEFT JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbb WITH (NOLOCK) ON zbb.ZBUBW_IDZBU = zb.ID
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m WITH (NOLOCK) ON m.ID = zb.ZBU_IDMS
      WHERE zb.ZBU_IDPSKP = 440382
      ORDER BY zb.ID DESC
    `);

    console.table(res.recordset);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
