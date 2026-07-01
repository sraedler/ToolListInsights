/**
 * Parses and extracts NC program names from production step descriptions.
 * E.g., "Fräsen CHIRON NC-Programm: Docklock 20-92 VBZ1" -> "Docklock 20-92"
 */
function extractNCPrograms(text) {
  if (!text) return [];
  const results = [];
  // Regex to match "NC-Programm:" or "Programm:" followed by the text
  const regex = /(?:NC-)?Programm:\s*([^\r\n\t]+)/gi;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    let part = match[1].trim();
    
    // Truncate at double spaces (often used to space out comments or columns)
    const doubleSpaceIdx = part.indexOf('  ');
    if (doubleSpaceIdx !== -1) {
      part = part.substring(0, doubleSpaceIdx).trim();
    }
    
    // Truncate if "Vorrichtung:" starts
    const vorrichtungIdx = part.toLowerCase().indexOf('vorrichtung:');
    if (vorrichtungIdx !== -1) {
      part = part.substring(0, vorrichtungIdx).trim();
    }
    
    // Truncate if "vbz" starts (e.g. VBZ1, VBZ4, VBZ-Info)
    const vbzIdx = part.toLowerCase().search(/vbz\d?/);
    if (vbzIdx !== -1) {
      part = part.substring(0, vbzIdx).trim();
    }
    
    if (part) {
      // Remove trailing delimiters like semicolons or commas
      part = part.replace(/[;,]$/, '').trim();
      results.push(part);
    }
  }
  return results;
}

/**
 * Computes the Jaro-Winkler similarity between two strings.
 * Returns a score between 0.0 (no similarity) and 1.0 (exact match).
 */
function jaroWinklerSimilarity(s1, s2) {
  s1 = (s1 || '').trim().toLowerCase();
  s2 = (s2 || '').trim().toLowerCase();
  if (s1 === s2) return 1.0;
  
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0.0;
  
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(len2 - 1, i + matchWindow);
    for (let j = start; j <= end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }
  
  if (matches === 0) return 0.0;
  
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }
  
  const jaro = ((matches / len1) + (matches / len2) + ((matches - transpositions / 2) / matches)) / 3.0;
  
  // Winkler modification
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  
  return jaro + (prefix * 0.1 * (1.0 - jaro));
}

/**
 * Computes Levenshtein distance between two strings.
 */
function levenshteinDistance(s1, s2) {
  s1 = (s1 || '').trim().toLowerCase();
  s2 = (s2 || '').trim().toLowerCase();
  if (s1 === s2) return 0;
  
  const len1 = s1.length;
  const len2 = s2.length;
  const d = Array.from({ length: len1 + 1 }, () => new Array(len2 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) d[i][0] = i;
  for (let j = 0; j <= len2; j++) d[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[len1][len2];
}

function levenshteinSimilarity(s1, s2) {
  s1 = (s1 || '').trim().toLowerCase();
  s2 = (s2 || '').trim().toLowerCase();
  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - dist / maxLen;
}

/**
 * Finds the top matching tool lists for a given program name.
 * Looks for exact match first, then falls back to similarity.
 */
function findMatches(progName, cachedToolLists, threshold = 0.6) {
  if (!progName) return [];
  
  const searchName = progName.trim().toLowerCase();
  
  // 1. Check exact matches on Ident or NCP
  const exactMatches = cachedToolLists.filter(
    list => (list.Ident || '').trim().toLowerCase() === searchName || 
            (list.NCP || '').trim().toLowerCase() === searchName
  );
  
  if (exactMatches.length > 0) {
    return exactMatches.map(m => ({ ...m, matchType: 'exact', score: 1.0 }));
  }
  
  // 2. Perform fuzzy search
  const matches = [];
  for (let list of cachedToolLists) {
    const identScore = jaroWinklerSimilarity(progName, list.Ident || '');
    const ncpScore = jaroWinklerSimilarity(progName, list.NCP || '');
    const maxScore = Math.max(identScore, ncpScore);
    
    // Also try substring matching (e.g. "M2080045-SP1" is a substring of "M2080045-06-SP1")
    const isSubstring = (list.Ident && progName.toLowerCase().includes(list.Ident.toLowerCase())) ||
                        (list.NCP && progName.toLowerCase().includes(list.NCP.toLowerCase())) ||
                        (list.Ident && list.Ident.toLowerCase().includes(progName.toLowerCase())) ||
                        (list.NCP && list.NCP.toLowerCase().includes(progName.toLowerCase()));
                        
    const finalScore = isSubstring ? Math.max(maxScore, 0.75) : maxScore;
    
    if (finalScore >= threshold) {
      matches.push({
        ...list,
        matchType: 'fuzzy',
        score: parseFloat(finalScore.toFixed(3))
      });
    }
  }
  
  // Sort descending by similarity score
  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}

module.exports = {
  extractNCPrograms,
  jaroWinklerSimilarity,
  levenshteinSimilarity,
  findMatches
};
