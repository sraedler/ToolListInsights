const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '..', 'KV_test.sql');
    const sqlQuery = fs.readFileSync(sqlPath, 'utf8');
    const stepsResult = await pool.request().query(sqlQuery);
    
    const dates = stepsResult.recordset
      .map(r => r.StartDate || r.DeliveryDate)
      .filter(Boolean)
      .map(d => new Date(d).toISOString().substring(0, 10));
      
    const uniqueDates = [...new Set(dates)].sort();
    console.log('Unique active step dates (first 10):', uniqueDates.slice(0, 10));
    console.log('Unique active step dates (last 10):', uniqueDates.slice(-10));
    console.log('Total steps:', stepsResult.recordset.length);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
