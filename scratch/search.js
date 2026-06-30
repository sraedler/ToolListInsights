const fs = require('fs');
const content = fs.readFileSync('C:/git_repos/ToolListInsights/KV_test.sql', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('FROM ') || line.includes('JOIN ')) {
    if (line.includes('tSK_') || line.includes('tPPS_')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});
