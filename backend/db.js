const isWindows = process.platform === 'win32';

// Use msnodesqlv8 only on Windows (allows trusted Windows ODBC connections).
// On Linux/Docker, msnodesqlv8 is omitted to avoid compilation/runtime issues,
// falling back to the standard pure JS 'tedious' driver.
const sql = isWindows && !process.env.DB_FORCE_TEDIOUS
  ? require('mssql/msnodesqlv8')
  : require('mssql');

const connStrD4 = process.env.DB_D4_CONN || 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=D4;Trusted_Connection=yes;TrustServerCertificate=yes;';
const connStrWT = process.env.DB_WT_CONN || 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=WTDATA;Trusted_Connection=yes;TrustServerCertificate=yes;';

// Build database configuration dynamically.
// If DB_D4_SERVER / DB_WT_SERVER parameters are provided, we configure
// a standard TCP/IP connection. Otherwise, we fallback to the Windows ODBC connection string.
// We support Server\Instance parsing for named instances.
const d4Server = process.env.DB_D4_SERVER || '';
const d4ServerParts = d4Server.split('\\');
const d4Host = d4ServerParts[0];
const d4Instance = d4ServerParts[1] || null;

const configD4 = process.env.DB_D4_SERVER ? {
  server: d4Host,
  database: process.env.DB_D4_DATABASE || 'D4',
  user: process.env.DB_D4_USER,
  password: process.env.DB_D4_PASSWORD,
  port: process.env.DB_D4_PORT ? parseInt(process.env.DB_D4_PORT) : undefined,
  options: {
    encrypt: process.env.DB_D4_ENCRYPT === 'true',
    trustServerCertificate: true,
    instanceName: d4Instance
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
} : {
  driver: 'msnodesqlv8',
  connectionString: connStrD4,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

const wtServer = process.env.DB_WT_SERVER || '';
const wtServerParts = wtServer.split('\\');
const wtHost = wtServerParts[0];
const wtInstance = wtServerParts[1] || null;

const configWT = process.env.DB_WT_SERVER ? {
  server: wtHost,
  database: process.env.DB_WT_DATABASE || 'WTDATA',
  user: process.env.DB_WT_USER,
  password: process.env.DB_WT_PASSWORD,
  port: process.env.DB_WT_PORT ? parseInt(process.env.DB_WT_PORT) : undefined,
  options: {
    encrypt: process.env.DB_WT_ENCRYPT === 'true',
    trustServerCertificate: true,
    instanceName: wtInstance
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
} : {
  driver: 'msnodesqlv8',
  connectionString: connStrWT,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

const connStrTL = process.env.DB_TL_CONN || 'Driver={ODBC Driver 17 for SQL Server};Server=SRVDEVELOP;Database=Toollist;Trusted_Connection=yes;TrustServerCertificate=yes;';
const tlServer = process.env.DB_TL_SERVER || '';
const tlServerParts = tlServer.split('\\');
const tlHost = tlServerParts[0];
const tlInstance = tlServerParts[1] || null;

const configTL = process.env.DB_TL_SERVER ? {
  server: tlHost,
  database: process.env.DB_TL_DATABASE || 'Toollist',
  user: process.env.DB_TL_USER,
  password: process.env.DB_TL_PASSWORD,
  port: process.env.DB_TL_PORT ? parseInt(process.env.DB_TL_PORT) : undefined,
  options: {
    encrypt: process.env.DB_TL_ENCRYPT === 'true',
    trustServerCertificate: true,
    instanceName: tlInstance
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
} : {
  driver: 'msnodesqlv8',
  connectionString: connStrTL,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

let poolD4 = null;
let poolWT = null;
let poolTL = null;

async function getPoolD4() {
  if (!poolD4) {
    console.log('Initializing D4 database pool...');
    poolD4 = new sql.ConnectionPool(configD4);
    await poolD4.connect();
    console.log('D4 database pool initialized.');
  }
  return poolD4;
}

async function getPoolWT() {
  if (!poolWT) {
    console.log('Initializing WTDATA database pool...');
    poolWT = new sql.ConnectionPool(configWT);
    await poolWT.connect();
    console.log('WTDATA database pool initialized.');
  }
  return poolWT;
}

async function getPoolTL() {
  if (!poolTL) {
    console.log('Initializing Toollist database pool...');
    poolTL = new sql.ConnectionPool(configTL);
    await poolTL.connect();
    console.log('Toollist database pool initialized.');
  }
  return poolTL;
}

module.exports = {
  getPoolD4,
  getPoolWT,
  getPoolTL,
  sql
};
