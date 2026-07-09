const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findGit(dir) {
  const paths = [
    'C:\\Program Files\\Git\\bin\\git.exe',
    'C:\\Program Files (x86)\\Git\\bin\\git.exe',
    path.join(process.env.USERPROFILE || '', 'AppData\\Local\\Programs\\Git\\cmd\\git.exe'),
    path.join(process.env.USERPROFILE || '', 'AppData\\Local\\Programs\\Git\\bin\\git.exe')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  // Search path
  try {
    const stdout = execSync('where git').toString().trim();
    if (stdout) return stdout.split('\r\n')[0];
  } catch (e) {}
  return null;
}

const gitPath = findGit();
if (gitPath) {
  console.log('Found Git at:', gitPath);
  try {
    const diff = execSync(`"${gitPath}" diff backend/server.js`).toString();
    fs.writeFileSync('scratch/server_diff.txt', diff);
    console.log('Diff saved to scratch/server_diff.txt');
  } catch (err) {
    console.error('Git diff failed:', err.message);
  }
} else {
  console.log('Git not found anywhere.');
}
