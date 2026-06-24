const fs = require('fs');
const content = fs.readFileSync('C:\\git_repos\\ToolListInsights\\frontend\\src\\App.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.toLowerCase().includes('geplante') || line.toLowerCase().includes('produktionsaufträge') || line.includes('ExplorerTab') || line.includes('Aufträge')) {
    if (line.trim().length > 0 && line.trim().length < 150) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});
