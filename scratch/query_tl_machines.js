const sql = require('mssql');

async function run() {
  const config = {
    server: '192.168.100.8',
    port: 54297,
    database: 'Toollist',
    user: 'werkzeug',
    password: 'werkzeug',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };
  const pool = new sql.ConnectionPool(config);
  try {
    await pool.connect();
    const result = await pool.request().query('SELECT TOP 5 * FROM Machines');
    console.log('--- Machines Columns ---');
    if (result.recordset.length > 0) {
      console.log(Object.keys(result.recordset[0]));
      console.log(result.recordset[0]);
    } else {
      console.log('No rows found in Machines.');
    }
    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}
run();
