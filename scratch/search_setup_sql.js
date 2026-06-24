const fs = require('fs');
const content = fs.readFileSync('C:\\git_repos\\ToolListInsights\\backend\\server.js', 'utf8');

const queryPattern = "SELECT p.ID as StepId";
const startIndex = content.indexOf(queryPattern);
if (startIndex === -1) {
  console.log("Could not find query pattern!");
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('cacheSetupData')) console.log(`${i+1}: ${l}`);
  });
} else {
  console.log(content.substring(startIndex, startIndex + 3000));
}
