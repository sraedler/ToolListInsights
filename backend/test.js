const { extractNCPrograms, findMatches } = require('./matching');
const { getPoolD4, getPoolWT } = require('./db');

console.log('--- STARTING BACKEND UNIT TESTS ---');

// 1. Test regex extraction
console.log('\n1. Testing NC Program Extraction Regex:');
const sampleTexts = [
  'Fräsen CHIRON NC-Programm: Docklock 20-92                VBZ1',
  'Fräsen RS2 NC-Programm:7964                VBZ1',
  'Fräsen CHIRON NC-Programm:1938-0091-SP3     Vorrichtung:1938-0091V1                VBZ4',
  'Fräsen CHIRON NC-Programm: 1938_0091_03_SP4         Vorrichtung:1938-0091V1                      VBZ3  Auf Symetrie achten!',
  'Fräsen CHIRON NC-Programm: Dock-Lock 20-92 (für Ø48 Maß in Z46     Vorrichtung: Schraubstock                VBZ1   Fräsen Brother NC-Programm: 8488                VBZ1',
  'Fräsen Programm: L093-0201-05-SP5                VBZ1'
];

sampleTexts.forEach((text, i) => {
  const extracted = extractNCPrograms(text);
  console.log(`Sample ${i + 1}:`);
  console.log(`  Input: "${text.trim().substring(0, 80)}..."`);
  console.log(`  Output: ${JSON.stringify(extracted)}`);
});

// 2. Test database connection
async function testDb() {
  console.log('\n2. Testing database connections:');
  try {
    const poolD4 = await getPoolD4();
    const resultD4 = await poolD4.request().query('SELECT TOP 1 ID FROM [D4].[dbo].[tARST]');
    console.log('   [PASS] Connected to D4 and queried tARST, sample ID:', resultD4.recordset[0]?.ID);
  } catch (e) {
    console.error('   [FAIL] D4 Connection failed:', e.message);
  }

  try {
    const poolWT = await getPoolWT();
    const resultWT = await poolWT.request().query('SELECT TOP 1 Nr FROM [WTDATA].[dbo].[ToolLists]');
    console.log('   [PASS] Connected to WTDATA and queried ToolLists, sample Nr:', resultWT.recordset[0]?.Nr);
  } catch (e) {
    console.error('   [FAIL] WTDATA Connection failed:', e.message);
  }
}

async function run() {
  await testDb();
  console.log('\n--- TESTS COMPLETED ---');
  process.exit(0);
}

run();
