const fs = require('fs');
const content = fs.readFileSync('C:\\git_repos\\ToolListInsights\\frontend\\src\\App.jsx', 'utf8');
const lines = content.split('\n');

let inSimTab = false;
let braceCount = 0;
lines.forEach((line, index) => {
  if (line.includes('function SimulationTab')) {
    inSimTab = true;
  }
  if (inSimTab) {
    if (line.includes('{')) braceCount++;
    if (line.includes('}')) braceCount--;
    
    // Print lines containing table, list, tr, td, header, th, or orders
    if (line.toLowerCase().includes('auftr') || line.toLowerCase().includes('magazin') || line.toLowerCase().includes('rüst') || line.toLowerCase().includes('table') || line.toLowerCase().includes('thead') || line.toLowerCase().includes('tbody')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
    
    if (braceCount === 0 && index > 2220) {
      inSimTab = false;
    }
  }
});
