const sql = require('mssql');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  user: process.env.DB_USER_D4,
  password: process.env.DB_PASSWORD_D4,
  server: process.env.DB_SERVER_D4,
  port: parseInt(process.env.DB_PORT_D4 || '1433', 10),
  database: process.env.DB_NAME_D4 || 'D4',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function main() {
  try {
    const pool = await sql.connect(config);
    console.log('Connected to D4 database.');
    
    // Find all tables that might be related to Arbeitsplan or templates
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE '%AP%' OR TABLE_NAME LIKE '%POS%' OR TABLE_NAME LIKE '%ARBEITS%'
    `);
    console.log('Matching tables:');
    tables.recordset.forEach(r => console.log(r.TABLE_NAME));
    
    await sql.close();
  } catch (err) {
    console.error(err);
  }
}

main();
