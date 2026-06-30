const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:/git_repos/ToolListInsights/scratch/planning_data.json', 'utf8'));

// data.board is an object of columns: machineId -> step list
// Let's print the machine IDs (columns) in the board
console.log('Board columns:', Object.keys(data.board || {}));

// Let's search inside data.board for all steps matching contractNumber 'P202584577'
let boardMatches = [];
Object.keys(data.board || {}).forEach(colName => {
  const colObj = data.board[colName];
  // colObj is either an array of steps or a day-grouped object
  // Let's traverse it
  function traverse(obj) {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(s => {
        if (s && s.contractNumber === 'P202584577') {
          boardMatches.push({ column: colName, step: s });
        }
      });
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach(k => traverse(obj[k]));
    }
  }
  traverse(colObj);
});

console.log(`Found ${boardMatches.length} matching steps on the board:`);
boardMatches.forEach(bm => {
  console.log(`- Column: ${bm.column}, StepPos: ${bm.step.stepPos}, Desc: ${bm.step.stepDesc.replace(/\r?\n/g, ' ')}`);
  console.log(`  Load Tools:`, bm.step.loadTools);
  console.log(`  Unload Tools:`, bm.step.unloadTools);
});
