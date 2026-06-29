const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query('SELECT ID, MS_NUMMER, MS_BEZEICHNUNG, MS_KAPAZITAET_ZEIT_MINUTEN_MO, MS_KAPAZITAET_ZEIT_MINUTEN_DI, MS_KAPAZITAET_ZEIT_MINUTEN_MI, MS_KAPAZITAET_ZEIT_MINUTEN_DO, MS_KAPAZITAET_ZEIT_MINUTEN_FR FROM [D4].[dbo].[tPPS_MASTA] WHERE ID IN (2, 4, 5, 6, 8, 21, 25)');
    console.log('--- Target Machine IDs and Capacities ---');
    console.log(result.recordset);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
