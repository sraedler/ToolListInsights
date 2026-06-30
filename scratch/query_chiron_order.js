const fs = require('fs');

async function main() {
  const url = 'http://localhost:5000/api/planning';
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Failed to fetch from backend. Status:', res.status);
      return;
    }
    const data = await res.json();
    console.log('Successfully fetched planning data.');
    console.log('Available keys:', Object.keys(data));
    
    // Save to scratch files to analyze if too large
    fs.writeFileSync('C:/git_repos/ToolListInsights/scratch/planning_data.json', JSON.stringify(data, null, 2));
    
    // Let's search inside data for 'P202584577'
    const searchString = 'P202584577';
    console.log(`Searching for '${searchString}'...`);
    
    // Check in sequenced days
    if (data.days) {
      for (let day of data.days) {
        if (day.machines) {
          for (let mName of Object.keys(day.machines)) {
            const steps = day.machines[mName];
            for (let s of steps) {
              if (s.contractNumber === searchString || (s.OrderDesc && s.OrderDesc.includes(searchString))) {
                console.log(`FOUND STEP in day ${day.date} on machine ${mName}:`);
                console.log(JSON.stringify(s, null, 2));
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
