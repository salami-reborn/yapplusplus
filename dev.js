const { spawn } = require('child_process');

const isWindows = process.platform === 'win32';
const forge = isWindows ? 'electron-forge.cmd' : 'electron-forge';
const args = ['start'];
if (process.argv.length > 2) args.push('--', ...process.argv.slice(2));

const child = spawn(forge, args, {
    stdio: 'inherit',
    shell: isWindows,
    env: { ...process.env, YAPPLUS_LOCAL: '1' },
});

child.on('exit', (code, signal) => {
    process.exit(signal ? 1 : (code || 0));
});
