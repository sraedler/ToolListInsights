const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/git_repos/ToolListInsights/scratch/planning_data.json', 'utf8'));

// Traverse all steps in board and days
let stepsFound = [];
function checkStep(s, path) {
  if (s && s.contractNumber === 'P202584577') {
    stepsFound.push({
      path,
      stepId: s.stepId,
      stepPos: s.stepPos,
      desc: s.stepDesc,
      load: s.loadTools || [],
      unload: s.unloadTools || [],
      matchedListIdent: s.matchedListIdent,
      matchedListNr: s.matchedListNr
    });
  }
}

function traverse(obj, path = '') {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      if (item && item.stepId) {
        checkStep(item, `${path}[${idx}]`);
      } else {
        traverse(item, `${path}[${idx}]`);
      }
    });
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach(k => {
      traverse(obj[k], `${path}.${k}`);
    });
  }
}

traverse(data);

console.log(`Found ${stepsFound.length} steps for P202584577:`);
stepsFound.forEach(sf => {
  console.log(`\nPath: ${sf.path}`);
  console.log(`Step ID: ${sf.stepId}, Pos: ${sf.stepPos}, Desc: ${sf.desc.replace(/\r?\n/g, ' ')}`);
  console.log(`List: ${sf.matchedListIdent} (Nr: ${sf.matchedListNr})`);
  
  const inLoad = sf.load.filter(t => t.nr === 2932 || t.ToolNr === 2932);
  const inUnload = sf.unload.filter(t => t.nr === 2932 || t.ToolNr === 2932);
  
  console.log(`- T2932 in loadTools:`, inLoad.length > 0 ? 'YES' : 'NO');
  console.log(`- T2932 in unloadTools:`, inUnload.length > 0 ? 'YES' : 'NO');
  console.log(`- loadTools list:`, sf.load.map(t => `${t.nr || t.ToolNr} (${t.desc || t.Descript})`));
  console.log(`- unloadTools list:`, sf.unload.map(t => `${t.nr || t.ToolNr} (${t.desc || t.Descript})`));
});
