const fs = require('fs');

const sql = fs.readFileSync('C:/git_repos/ToolListInsights/KV_test.sql', 'utf8');
const lines = sql.split('\n');

const tables = new Set();
lines.forEach(line => {
  const match = line.match(/(?:FROM|JOIN)\s+(?:\[dbo\]\.)?\[?(\w+)\]?/i);
  if (match) {
    tables.add(match[1]);
  }
});
console.log('Tables used in KV_test.sql:', Array.from(tables));
