const sql = require('mssql/msnodesqlv8');

const connStrD4 = process.env.DB_D4_CONN || 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=D4;Trusted_Connection=yes;TrustServerCertificate=yes;';
const connStrWT = process.env.DB_WT_CONN || 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=WTDATA;Trusted_Connection=yes;TrustServerCertificate=yes;';

const configD4 = {
  driver: 'msnodesqlv8',
  connectionString: connStrD4,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const configWT = {
  driver: 'msnodesqlv8',
  connectionString: connStrWT,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolD4 = null;
let poolWT = null;

async function getPoolD4() {
  if (!poolD4) {
    console.log('Initializing D4 database pool...');
    poolD4 = await sql.connect(configD4);
    console.log('D4 database pool initialized.');
  }
  return poolD4;
}

async function getPoolWT() {
  if (!poolWT) {
    console.log('Initializing WTDATA database pool...');
    poolWT = await sql.connect(configWT);
    console.log('WTDATA database pool initialized.');
  }
  return poolWT;
}

module.exports = {
  getPoolD4,
  getPoolWT,
  sql
};
