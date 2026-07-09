const sql = require('mssql/msnodesqlv8');

async function test() {
  const config = {
    driver: 'msnodesqlv8',
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=192.168.100.5\\D4;Database=D4;Uid=werkzeug;Pwd=werkzeug;TrustServerCertificate=yes;',
    pool: { max: 1 }
  };
  
  console.log('Testing live connection with config:', config);
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Success! Connected to Live DB.');
    await pool.close();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

test();
