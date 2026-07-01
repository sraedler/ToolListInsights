const fs = require('fs');

const sql = fs.readFileSync('C:/git_repos/ToolListInsights/KV_test.sql', 'utf8');
const lines = sql.split('\n');

const matches = new Set();
lines.forEach(line => {
  if (line.toLowerCase().includes('vorrichtung')) {
    matches.add(line.trim());
  }
});
console.log('Unique Vorrichtung lines found in KV_test.sql:');
console.log(Array.from(matches).slice(0, 100));
