const { getPoolD4, getPoolWT } = require('../backend/db');
const fs = require('fs');
const path = require('path');

function extractNCPrograms(text) {
  if (!text) return [];
  const matches = [];
  const regex = /NC-Programm:\s*([A-Za-z0-9_\-\/]+)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && match[1].trim()) {
      matches.push(match[1].trim());
    }
  }
  return matches;
}

function findMatches(query, toolLists, threshold = 0.70) {
  if (!query || !toolLists) return [];
  const cleanQ = query.trim().toLowerCase();
  const results = [];

  toolLists.forEach(tl => {
    const ident = (tl.Ident || '').trim().toLowerCase();
    const ncp = (tl.NCP || '').trim().toLowerCase();
    const nr = (tl.Nr || '').trim().toLowerCase();
    const desc = (tl.Descript || '').trim().toLowerCase();

    let score = 0;
    let matchType = null;

    if (ident === cleanQ) { score = 1.0; matchType = 'Ident Exact'; }
    else if (ncp === cleanQ) { score = 1.0; matchType = 'NCP Exact'; }
    else if (nr === cleanQ) { score = 0.95; matchType = 'Nr Exact'; }
    else if (ident.includes(cleanQ) || cleanQ.includes(ident)) { score = 0.85; matchType = 'Ident Partial'; }
    else if (ncp.includes(cleanQ) || cleanQ.includes(ncp)) { score = 0.85; matchType = 'NCP Partial'; }
    else if (desc.includes(cleanQ)) { score = 0.75; matchType = 'Descript Partial'; }

    if (score >= threshold) {
      results.push({ ...tl, score, matchType });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

async function test() {
  try {
    const poolWT = await getPoolWT();
    const resWT = await poolWT.request().query('SELECT Nr, Ident, NCP, Descript, MachineNr FROM [WTDATA].[dbo].[ToolLists]');
    const toolLists = resWT.recordset;

    const desc = "Fräsen RS2\r\nNC-Programm: 6152-NA\r\n    Vorrichtung:\r\n               VBZ siehe Bilder";
    const progs = extractNCPrograms(desc);
    console.log("Extracted NC Progs for 433948:", progs);

    const matches = findMatches(progs[0], toolLists, 0.70);
    console.log("Matches for 6152-NA in WinTool:", matches);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
