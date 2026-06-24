const fs = require('fs');
const content = fs.readFileSync('C:\\git_repos\\ToolListInsights\\frontend\\src\\App.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.toLowerCase().includes('date') && (line.includes('today') || line.includes('getDefault') || line.includes('Date(') || line.includes('globalStart') || line.includes('globalEnd'))) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
