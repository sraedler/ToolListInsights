const fs = require('fs');
const readline = require('readline');

async function run() {
  const logFile = 'C:\\Users\\Simon\\.gemini\\antigravity-cli\\brain\\49842883-0294-42ac-a1ac-5b40ab0d2a24\\.system_generated\\logs\\transcript.jsonl';
  if (!fs.existsSync(logFile)) {
    console.log('Log file does not exist.');
    return;
  }
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log('Searching for database settings in transcript...');
  for await (const line of rl) {
    if (line.includes('connStrTL') || line.includes('srvdevelop') || line.includes('192.168.100.8') || line.includes('database') || line.includes('IP')) {
      // Print first 200 chars
      console.log(line.substring(0, 300));
    }
  }
}
run();
