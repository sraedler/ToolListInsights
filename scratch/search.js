const fs = require('fs');
const content = fs.readFileSync('C:/git_repos/ToolListInsights/backend/server.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('getCurrentToolsForMachine')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
