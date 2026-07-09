const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('C:\\Users\\Simon\\.gemini\\antigravity-cli\\brain\\0453019e-1e40-4a33-b1ba-402b92104f5e\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  for await (const line of rl) {
    if (line.includes('KK_LAGERORT') && !line.includes('read_transcript.js')) {
      console.log(`Match #${++count}:`);
      const idx = line.indexOf('KK_LAGERORT');
      console.log(line.substring(idx - 150, idx + 250));
      if (count > 10) break;
    }
  }
}

run();
