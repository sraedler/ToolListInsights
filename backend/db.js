const isWindows = process.platform === 'win32';

// Use msnodesqlv8 only on Windows (allows trusted Windows ODBC connections).
// On Linux/Docker, msnodesqlv8 is omitted to avoid compilation/runtime issues,
// falling back to the standard pure JS 'tedious' driver.
const sql = isWindows && !process.env.DB_FORCE_TEDIOUS
  ? require('mssql/msnodesqlv8')
  : require('mssql');

const connStrD4 = process.env.DB_D4_CONN || 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=D4;Trusted_Connection=yes;TrustServerCertificate=yes;';
const connStrWT = process.env.DB_WT_CONN || 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=WTDATA;Trusted_Connection=yes;TrustServerCertificate=yes;';
const connStrTL = process.env.DB_TL_CONN || (
  process.env.NODE_ENV === 'production'
    ? 'Driver={ODBC Driver 17 for SQL Server};Server=192.168.100.8\\CIM4NET;Database=Toollist;Uid=werkzeug;Pwd=werkzeug;TrustServerCertificate=yes;'
    : 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=Toollist;Trusted_Connection=yes;TrustServerCertificate=yes;'
);

// Build database configuration dynamically.
// If DB_D4_SERVER / DB_WT_SERVER parameters are provided, we configure
// a standard TCP/IP connection. Otherwise, we fallback to the Windows ODBC connection string.
// We support Server\Instance parsing for named instances.
function buildConfig(serverEnv, databaseEnv, userEnv, passwordEnv, portEnv, encryptEnv, defaultConnStr, defaultUser, defaultPassword) {
  if (serverEnv) {
    const serverParts = serverEnv.split('\\');
    const host = serverParts[0];
    const instance = serverParts[1] || null;
    return {
      server: host,
      database: databaseEnv,
      user: userEnv,
      password: passwordEnv,
      port: portEnv ? parseInt(portEnv) : undefined,
      options: {
        encrypt: encryptEnv === 'true',
        trustServerCertificate: true,
        instanceName: instance
      },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
    };
  }

  // Use msnodesqlv8 if we are on Windows and not forcing tedious
  const useMsnodesql = isWindows && !process.env.DB_FORCE_TEDIOUS;
  if (useMsnodesql) {
    return {
      driver: 'msnodesqlv8',
      connectionString: defaultConnStr,
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
    };
  }

  // Parse ODBC connection string for pure tedious (Linux/Docker fallback)
  const parsed = {};
  const pairs = defaultConnStr.split(';');
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim().toLowerCase();
    const value = pair.slice(eqIdx + 1).trim();
    if (key === 'server' || key === 'data source') {
      const serverParts = value.split('\\');
      parsed.server = serverParts[0];
      if (serverParts[1]) {
        parsed.instanceName = serverParts[1];
      }
    } else if (key === 'database' || key === 'initial catalog') {
      parsed.database = value;
    } else if (key === 'uid' || key === 'user id' || key === 'user') {
      parsed.user = value;
    } else if (key === 'pwd' || key === 'password') {
      parsed.password = value;
    } else if (key === 'encrypt') {
      parsed.encrypt = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
    }
  }

  return {
    server: parsed.server || 'localhost',
    database: parsed.database || databaseEnv,
    user: parsed.user || userEnv || defaultUser,
    password: parsed.password || passwordEnv || defaultPassword,
    options: {
      encrypt: parsed.encrypt || false,
      trustServerCertificate: true,
      instanceName: parsed.instanceName || null
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  };
}

const configD4 = buildConfig(
  process.env.DB_D4_SERVER,
  process.env.DB_D4_DATABASE || 'D4',
  process.env.DB_D4_USER,
  process.env.DB_D4_PASSWORD,
  process.env.DB_D4_PORT,
  process.env.DB_D4_ENCRYPT,
  connStrD4,
  'werkzeug',
  'werkzeug'
);

const configWT = buildConfig(
  process.env.DB_WT_SERVER,
  process.env.DB_WT_DATABASE || 'WTDATA',
  process.env.DB_WT_USER,
  process.env.DB_WT_PASSWORD,
  process.env.DB_WT_PORT,
  process.env.DB_WT_ENCRYPT,
  connStrWT,
  'werkzeug',
  'werkzeug'
);

const configTL = buildConfig(
  process.env.DB_TL_SERVER,
  process.env.DB_TL_DATABASE || 'Toollist',
  process.env.DB_TL_USER,
  process.env.DB_TL_PASSWORD,
  process.env.DB_TL_PORT,
  process.env.DB_TL_ENCRYPT,
  connStrTL,
  'werkzeug',
  'werkzeug'
);

let poolD4 = null;
let poolWT = null;
let poolTL = null;

let poolD4Promise = null;
let poolWTPromise = null;
let poolTLPromise = null;

async function getPoolD4() {
  if (poolD4) return poolD4;
  if (!poolD4Promise) {
    poolD4Promise = (async () => {
      console.log('Initializing D4 database pool...');
      const pool = new sql.ConnectionPool(configD4);
      try {
        await pool.connect();
        poolD4 = pool;
        console.log('D4 database pool initialized.');
        return pool;
      } catch (err) {
        console.error('Failed to initialize D4 pool:', err.message);
        poolD4Promise = null;
        throw err;
      }
    })();
  }
  return poolD4Promise;
}

async function getPoolWT() {
  if (poolWT) return poolWT;
  if (!poolWTPromise) {
    poolWTPromise = (async () => {
      console.log('Initializing WTDATA database pool...');
      const pool = new sql.ConnectionPool(configWT);
      try {
        await pool.connect();
        poolWT = pool;
        console.log('WTDATA database pool initialized.');
        return pool;
      } catch (err) {
        console.error('Failed to initialize WTDATA pool:', err.message);
        poolWTPromise = null;
        throw err;
      }
    })();
  }
  return poolWTPromise;
}

async function getPoolTL() {
  if (poolTL) return poolTL;
  if (!poolTLPromise) {
    poolTLPromise = (async () => {
      console.log('Initializing Toollist database pool...');
      const pool = new sql.ConnectionPool(configTL);
      try {
        await pool.connect();
        poolTL = pool;
        console.log('Toollist database pool initialized.');
        return pool;
      } catch (err) {
        console.error('Failed to initialize Toollist pool:', err.message);
        poolTLPromise = null;
        throw err;
      }
    })();
  }
  return poolTLPromise;
}

module.exports = {
  getPoolD4,
  getPoolWT,
  getPoolTL,
  sql
};
