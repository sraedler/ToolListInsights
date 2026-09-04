const { getPoolD4 } = require('../backend/db');

async function main() {
  try {
    const pool = await getPoolD4();
    const res = await pool.request().query(`
      SELECT 
        zb.ID as BuchId,
        zb.ZBU_IDPSKP as StepId,
        zb.ZBU_IDMS as BookedMachineId,
        m.MS_BEZEICHNUNG as BookedMachineName,
        m.MS_NUMMER as BookedMachineNummer,
        zb.ZBU_MENGE_IST as MengeIst,
        zb.ZBU_MENGE_AUSSCHUSS as Ausschuss,
        zbb.ZBUBW_DATUM_ZEIT_START as StartTime,
        zbb.ZBUBW_DATUM_ZEIT_STOP as StopTime,
        zbb.ZBUBW_TYP_PRODUKTION as TypProd
      FROM [D4].[dbo].[tZE_BUCH] zb WITH (NOLOCK)
      LEFT JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbb WITH (NOLOCK) ON zbb.ZBUBW_IDZBU = zb.ID
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m WITH (NOLOCK) ON m.ID = zb.ZBU_IDMS
      WHERE zb.ZBU_IDPSKP = 440382
      ORDER BY zb.ID DESC
    `);

    console.log('Bookings count:', res.recordset.length);
    console.table(res.recordset.slice(0, 10));

    // Also check if Pos 10 (440369) has bookings
    const res10 = await pool.request().query(`
      SELECT 
        zb.ID as BuchId,
        zb.ZBU_IDPSKP as StepId,
        zb.ZBU_IDMS as BookedMachineId,
        m.MS_BEZEICHNUNG as BookedMachineName,
        zb.ZBU_MENGE_IST as MengeIst,
        zbb.ZBUBW_DATUM_ZEIT_START as StartTime,
        zbb.ZBUBW_DATUM_ZEIT_STOP as StopTime
      FROM [D4].[dbo].[tZE_BUCH] zb WITH (NOLOCK)
      LEFT JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbb WITH (NOLOCK) ON zbb.ZBUBW_IDZBU = zb.ID
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m WITH (NOLOCK) ON m.ID = zb.ZBU_IDMS
      WHERE zb.ZBU_IDPSKP = 440369
      ORDER BY zb.ID DESC
    `);

    console.log('Pos 10 Bookings count:', res10.recordset.length);
    console.table(res10.recordset.slice(0, 5));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
