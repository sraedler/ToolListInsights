const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

console.log('====================================================');
console.log('       ToolListInsights - Feature Test Runner');
console.log('====================================================\n');

const featuresDir = __dirname;
const entries = fs.readdirSync(featuresDir, { withFileTypes: true });

let totalSuites = 0;
let passedSuites = 0;
let failedSuites = 0;

entries.forEach(entry => {
  if (entry.isDirectory()) {
    const testFile = path.join(featuresDir, entry.name, 'test.js');
    if (fs.existsSync(testFile)) {
      totalSuites++;
      console.log(`\n▶ Running test suite for feature: [${entry.name}]...`);
      const result = spawnSync(process.execPath, [testFile], { stdio: 'inherit', env: process.env });
      if (result.status === 0) {
        console.log(`✓ [${entry.name}] PASSED`);
        passedSuites++;
      } else {
        console.error(`❌ [${entry.name}] FAILED (exit code: ${result.status})`);
        failedSuites++;
      }
    }
  }
});

console.log('\n====================================================');
console.log(`Test Execution Summary:`);
console.log(`- Total Suites : ${totalSuites}`);
console.log(`- Passed       : ${passedSuites}`);
console.log(`- Failed       : ${failedSuites}`);
console.log('====================================================\n');

if (failedSuites > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
