const fs = require('fs');
const content = fs.readFileSync('C:\\git_repos\\ToolListInsights\\frontend\\src\\App.jsx', 'utf8');
const lines = content.split('\n');

for (let i = 1350; i < 1515; i++) {
  const line = lines[i];
  if (line.includes('optimize') || line.includes('setOptimize') || line.includes('Reihenfolge') || line.includes('Checkbox') || line.includes('toggle')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
