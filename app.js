const { app } = require('electron');
const fs = require('fs');
const path = require('path');
// github actions plsss work
const hotDir = path.join(app.getPath('userData'), 'yapplus-hot');
const hotMain = path.join(hotDir, 'main.js');
const bundledMain = path.join(__dirname, 'main.js');
process.env.YAPPLUS_HOT_DIR = hotDir;
process.env.YAPPLUS_APP_DIR = __dirname;










let chosenMain = bundledMain;
if (fs.existsSync(hotMain)) {
  try {
    new Function(fs.readFileSync(hotMain, 'utf-8')); 
    chosenMain = hotMain;
  } catch (e) {
    console.error('[Bootstrap] Hot main.js is invalid, falling back to bundled:', e);
  }
}
try {
  const code = fs.readFileSync(chosenMain, 'utf-8');
  const Module = require('module');
  const m = new Module(chosenMain, module);
  m.filename = chosenMain;
  m.paths = Module._nodeModulePaths(path.dirname(chosenMain));
  m._compile(code, chosenMain);
} catch (e) {
  if (chosenMain !== bundledMain) {
    try {
      const code = fs.readFileSync(bundledMain, 'utf-8');
      const Module = require('module');
      const m = new Module(bundledMain, module);
      m.filename = bundledMain;
      m.paths = Module._nodeModulePaths(path.dirname(bundledMain));
      m._compile(code, bundledMain);
    } catch (err) {
    }
  }
}
