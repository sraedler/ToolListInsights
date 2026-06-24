const fs = require('fs');
const content = fs.readFileSync('C:\\git_repos\\ToolListInsights\\backend\\server.js', 'utf8');

const routePattern = "app.get('/api/orders/:orderId/steps'";
const startIndex = content.indexOf(routePattern);
if (startIndex === -1) {
  console.log("Could not find /orders/:orderId/steps route!");
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('/steps')) console.log(`${i+1}: ${l}`);
  });
} else {
  console.log(content.substring(startIndex, startIndex + 3000));
}
