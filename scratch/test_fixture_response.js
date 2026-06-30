const http = require('http');

http.get('http://localhost:5000/api/planning', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const json = JSON.parse(data);
    let found = 0;
    
    // Search the board for any step with a fixture
    for (const machine of Object.keys(json.board)) {
      for (const day of Object.keys(json.board[machine])) {
        const steps = json.board[machine][day];
        for (const step of steps) {
          if (step.fixture) {
            console.log(`Machine: ${machine}, Day: ${day}`);
            console.log(`Step ID: ${step.stepId}, Description: ${step.stepDesc}`);
            console.log(`Fixture Extracted: "${step.fixture}"`);
            console.log('-----------------------------');
            found++;
            if (found >= 5) process.exit(0);
          }
        }
      }
    }
    console.log(`Found ${found} steps with fixtures.`);
    process.exit(0);
  });
});
