const { getPoolD4, getPoolWT, getPoolTL, sql } = require('../backend/db');
const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function runTest() {
  try {
    const poolTL = await getPoolTL();
    const poolWT = await getPoolWT();
    const poolD4 = await getPoolD4();

    // Let's find the C400 machine
    const machineResult = await poolTL.request()
      .input('name', sql.VarChar, 'C400')
      .query('SELECT Id, Name, MagazineSize FROM Machines WHERE Name = \'C400\'');
    console.log('Machine:', machineResult.recordset);

    const machineId = machineResult.recordset[0].Id;

    // Get loaded programs
    const programResult = await poolTL.request()
      .input('machineId', sql.Int, machineId)
      .query('SELECT Id, ProgramName FROM MachineToProgram WHERE Machine = @machineId');
    console.log('Loaded Programs:', programResult.recordset);
    
    // 1. Fetch simulation without unloading
    let data = await httpGet('http://localhost:5000/api/inventory/machine/C400/simulation');
    console.log('\n--- WITHOUT UNLOADING ---');
    console.log('Initial Magazine Tools Count:', data.initialToolsCount);
    if (data.simulatedTimeline && data.simulatedTimeline.length > 0) {
      const first = data.simulatedTimeline[0];
      console.log('First Step description:', first.desc);
      console.log('First Step date:', first.date);
      console.log('First Step misses:', first.missesCount);
      console.log('First Step hits:', first.hitsCount);
      console.log('First Step occupiedSlots:', first.occupiedSlots);
    }

    // 2. Fetch simulation with unloading all programs
    const allIds = programResult.recordset.map(p => p.Id).join(',');
    console.log('\nUnloading program IDs:', allIds);
    data = await httpGet(`http://localhost:5000/api/inventory/machine/C400/simulation?unloadPrograms=${allIds}`);
    console.log('\n--- WITH UNLOADING ALL ---');
    console.log('Initial Magazine Tools Count:', data.initialToolsCount);
    if (data.simulatedTimeline && data.simulatedTimeline.length > 0) {
      const first = data.simulatedTimeline[0];
      console.log('First Step misses:', first.missesCount);
      console.log('First Step hits:', first.hitsCount);
      console.log('First Step occupiedSlots:', first.occupiedSlots);
    }

  } catch (err) {
    console.error(err);
  }
}

runTest();
