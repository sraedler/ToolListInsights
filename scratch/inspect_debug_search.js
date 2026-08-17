const http = require('http');

http.get('http://localhost:5001/api/debug-search', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    console.log("Count:", parsed.count);
    parsed.matches.forEach(s => {
      console.log(`StepId=${s.StepId}, Pos=${s.StepPos}, OrderId=${s.OrderId}, OrderPos=${s.OrderPos}, color=${s.color}, MachineId=${s.MachineId}, MachinePoolId=${s.MachinePoolId}, MatchedListNr=${s.MatchedListNr}`);
    });
  });
});
