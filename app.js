const { app } = require('electron');
const fs = require('fs');
const path = require('path');
// github actions plsss work
const hotDir = path.join(app.getPath('userData'), 'yapplus-hot');
const hotMain = path.join(hotDir, 'main.js');
const bundledMain = path.join(__dirname, 'main.js');
const localmode = process.env.YAPPLUS_LOCAL === '1' || process.env.YAPPLUS_DEV === '1'
    || process.argv.includes('--local') || process.argv.includes('--dev');
if (localmode) process.env.YAPPLUS_LOCAL = '1';
process.env.YAPPLUS_HOT_DIR = hotDir;
process.env.YAPPLUS_APP_DIR = __dirname;

if (localmode) {
  console.log('[Bootstrap] Local mode: using files from', __dirname);
} else if (fs.existsSync(hotMain)) {
  try {
    require(hotMain);
    return;
  } catch (error) {
    console.error('[Bootstrap] Could not load hot main.js, falling back to bundled:', error);
  }
}

require(bundledMain);
