const fs = require('fs');
const content = fs.readFileSync('C:\\git_repos\\ToolListInsights\\backend\\server.js', 'utf8');

const routePattern = "/orders";
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('/orders') || l.includes('articles')) {
    console.log(`${i+1}: ${l}`);
  }
});
