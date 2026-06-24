const fs = require('fs');
const content = fs.readFileSync('C:\\git_repos\\ToolListInsights\\backend\\server.js', 'utf8');
const lines = content.split('\n');

function findRoute(routePattern) {
  let start = -1;
  let end = -1;
  lines.forEach((line, index) => {
    if (line.includes(routePattern) && start === -1) {
      start = index + 1;
    }
  });
  
  if (start !== -1) {
    // Find the end by matching curly braces or just scan ahead
    let braceCount = 0;
    let foundStartBrace = false;
    for (let i = start - 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('{')) {
        braceCount += (line.split('{').length - 1);
        foundStartBrace = true;
      }
      if (line.includes('}')) {
        braceCount -= (line.split('}').length - 1);
      }
      if (foundStartBrace && braceCount === 0) {
        end = i + 1;
        break;
      }
    }
  }
  
  console.log(`Route: ${routePattern} -> Lines ${start} to ${end}`);
}

findRoute("/current-tools");
findRoute("/simulation");
