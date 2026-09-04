const http = require('http');

http.get('http://localhost:5001/api/planning?daysCount=21&searchQuery=620187', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Planning API result:');
      
      const foundIn = [];
      const board = json.board || {};
      for (const machine of Object.keys(board)) {
        for (const day of Object.keys(board[machine])) {
          const steps = board[machine][day] || [];
          for (const s of steps) {
            if (String(s.contractNumber).includes('620187') || String(s.orderId).includes('620187')) {
              foundIn.push({
                machine,
                day,
                stepId: s.stepId,
                stepPos: s.stepPos,
                orderPos: s.orderPos,
                desc: s.desc,
                machineId: s.machineId,
                machinePoolId: s.machinePoolId,
                manualMachineOverride: s.manualMachineOverride
              });
            }
          }
        }
      }
      console.table(foundIn);
    } catch (e) {
      console.error('Error parsing response:', e.message, data.substring(0, 500));
    }
  });
}).on('error', err => {
  console.error('HTTP error:', err.message);
});
