const fs = require('fs');
const content = fs.readFileSync('C:\\git_repos\\ToolListInsights\\backend\\server.js', 'utf8');

const routePattern = "function fetchActiveStepsAndMaterials";
const startIndex = content.indexOf(routePattern);
if (startIndex === -1) {
  console.log("Could not find the function definition!");
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('fetchActiveStepsAndMaterials')) console.log(`${i+1}: ${l}`);
  });
} else {
  console.log(content.substring(startIndex, startIndex + 3000));
}
