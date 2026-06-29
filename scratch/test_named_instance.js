const sql = require('mssql');

async function testInstance(instanceName, port, dbName) {
  console.log(`Testing instance: ${instanceName} on port ${port} with DB ${dbName}...`);
  const config = {
    server: '192.168.100.8',
    port: port,
    database: dbName,
    user: 'werkzeug',
    password: 'werkzeug',
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    connectionTimeout: 3000,
    requestTimeout: 3000
  };
  const pool = new sql.ConnectionPool(config);
  try {
    await pool.connect();
    console.log(`-> SUCCESS for ${instanceName}! Connected to DB ${dbName}.`);
    await pool.close();
    return true;
  } catch (err) {
    console.log(`-> FAILED for ${instanceName}:`, err.message);
    return false;
  }
}

async function run() {
  // Test both instances for database "Toollist"
  console.log('Testing "Toollist" database:');
  const wtOk = await testInstance('CIM4NET', 54297, 'Toollist');
  const emcoOk = await testInstance('EMCOSOFTWARE', 61211, 'Toollist');
  
  // Test both instances for database "WTData" (just to be sure)
  console.log('\nTesting "WTData" database:');
  await testInstance('CIM4NET', 54297, 'WTData');
  
  process.exit(0);
}
run();
