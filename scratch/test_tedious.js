const sql = require('mssql');

async function testTedious() {
  console.log('Testing pure tedious (TCP/IP) connection...');
  const config = {
    server: '192.168.100.8',
    database: 'Toollist',
    user: 'werkzeug',
    password: 'werkzeug',
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    connectionTimeout: 5000,
    requestTimeout: 5000
  };
  
  const pool = new sql.ConnectionPool(config);
  try {
    await pool.connect();
    console.log('Tedious Auth Succeeded!');
    await pool.close();
    return true;
  } catch (err) {
    console.log('Tedious Auth Failed:', err.message);
    return false;
  }
}

testTedious().then(() => process.exit(0));
