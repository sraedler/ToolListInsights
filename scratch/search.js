const fs = require('fs');

function searchFile(path) {
  const content = fs.readFileSync(path, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('chiron') || line.includes('Chiron')) {
      console.log(`${path} : ${index + 1}: ${line.trim()}`);
    }
  });
}

searchFile('C:/git_repos/ToolListInsights/backend/server.js');
searchFile('C:/git_repos/ToolListInsights/frontend/src/App.jsx');
