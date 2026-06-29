const sql = require('mssql/msnodesqlv8');

async function testSqlAuth() {
  console.log('Testing SQL Server Authentication...');
  const config = {
    driver: 'msnodesqlv8',
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=192.168.100.8;Database=Toollist;Uid=werkzeug;Pwd=werkzeug;TrustServerCertificate=yes;',
    requestTimeout: 5000,
    connectionTimeout: 5000
  };
  const pool = new sql.ConnectionPool(config);
  try {
    await pool.connect();
    console.log('SQL Auth Succeeded!');
    await pool.close();
    return true;
  } catch (err) {
    console.log('SQL Auth Failed:', err.message);
    return false;
  }
}

async function run() {
  await testSqlAuth();
  process.exit(0);
}
run();
