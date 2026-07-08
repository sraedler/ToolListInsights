const http = require('http');

http.get('http://localhost:5000/api/planning?optimize=true&optimizeNightRun=true&algo=greedy&allowLookahead=true', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Days:', json.days);
      console.log('Total Savings:', json.savings.total);
      console.log('\nPer Machine Savings with Lookahead:');
      for (let m of Object.keys(json.savings.machines)) {
        const s = json.savings.machines[m];
        console.log(`Machine: ${m} | Before: ${s.originalChanges} | After: ${s.optimizedChanges} | Saved: ${s.savedChanges}`);
      }
      
      // Let's count how many lookahead steps were scheduled!
      let lookaheadCount = 0;
      for (let m of Object.keys(json.board)) {
        for (let d of Object.keys(json.board[m])) {
          const steps = json.board[m][d] || [];
          steps.forEach(s => {
            if (s.isLookahead) {
              lookaheadCount++;
              console.log(`Scheduled Lookahead Step on ${m} (${d}): StepId ${s.stepId}, Original Start: ${s.originalStartDate}`);
            }
          });
        }
      }
      console.log(`\nTotal Scheduled Lookahead Steps: ${lookaheadCount}`);
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  });
}).on('error', (err) => {
  console.error('Error calling API:', err);
});
