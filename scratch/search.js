const fs = require('fs');
const content = fs.readFileSync('C:\\git_repos\\ToolListInsights\\backend\\server.js', 'utf8');
const lines = content.split('\n');

const query = 'MatchedListNr';
lines.slice(0, 1000).forEach((line, index) => {
  if (line.includes(query)) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
