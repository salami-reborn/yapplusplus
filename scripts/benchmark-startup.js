const { app } = process.versions.electron ? require('electron') : {};

if (app) {
    const fs = require('node:fs');
    const path = require('node:path');
    const { performance } = require('node:perf_hooks');
    const started = performance.now();
    const [directory, profile] = process.argv.slice(-2);
    fs.mkdirSync(profile, { recursive: true });
    app.setPath('userData', profile);

    const timings = {};
    const mark = (name) => { timings[name] ??= Math.round(performance.now() - started); };
    const timeout = setTimeout(() => {
        console.error('Startup timed out:', timings);
        app.exit(1);
    }, 30000);

    app.once('browser-window-created', (_event, window) => {
        mark('window');
        window.webContents.once('did-attach-webview', (_event, guest) => {
            guest.once('dom-ready', () => mark('pageDOM'));
        });
        window.webContents.on('console-message', (event) => {
            if (event.message !== 'YAP_BENCHMARK_PLUGINS_READY') return;
            mark('plugins');
            console.log('YAP_BENCHMARK ' + JSON.stringify(timings));
            clearTimeout(timeout);
            app.exit(0);
        });
    });

    require(path.join(directory, 'app.js'));
} else {
    const fs = require('node:fs');
    const os = require('node:os');
    const path = require('node:path');
    const { execFileSync, spawnSync } = require('node:child_process');

    const [baseline = 'HEAD', runCount = '5'] = process.argv.slice(2);
    const runs = Number(runCount);
    if (!Number.isInteger(runs) || runs < 1) throw new Error('Usage: node scripts/benchmark-startup.js [baseline-ref] [runs]');

    const root = path.resolve(__dirname, '..');
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'yap-startup-'));
    const paths = ['app.js', 'main.js', 'preload.js', 'html/client.html', 'assets', 'plugins', 'themes'];
    const versions = ['baseline', 'working-tree'];
    const samples = Object.fromEntries(versions.map(version => [version, []]));

    try {
        const oldDirectory = path.join(temp, versions[0]);
        const newDirectory = path.join(temp, versions[1]);
        fs.mkdirSync(oldDirectory);
        const archive = execFileSync('git', ['archive', baseline, ...paths], { cwd: root, maxBuffer: 32 * 1024 * 1024 });
        execFileSync('tar', ['-xf', '-', '-C', oldDirectory], { input: archive });
        for (const file of paths) {
            fs.cpSync(path.join(root, file), path.join(newDirectory, file), { recursive: true });
        }

        for (const directory of [oldDirectory, newDirectory]) {
            const file = path.join(directory, 'html/client.html');
            const html = fs.readFileSync(file, 'utf8');
            const anchor = '        document.body.appendChild(webview);';
            if (!html.includes(anchor)) throw new Error('Unsupported client.html in ' + directory);
            const instrumented = html.replaceAll('webview.executeJavaScript(', 'executeAndMeasure(');
            fs.writeFileSync(file, instrumented.replace(anchor, anchor + `
        async function executeAndMeasure(...args) {
            const result = await webview.executeJavaScript(...args);
            if (args[0].includes('window.YapPlus.PluginHost =')) {
                console.log('YAP_BENCHMARK_PLUGINS_READY');
            }
            return result;
        }`));
        }

        const electron = require('electron');
        const env = { ...process.env };
        delete env.YAPPLUS_LOCAL;
        delete env.YAPPLUS_DEV;
        delete env.ELECTRON_RUN_AS_NODE;
        for (let run = 0; run < runs; run++) {
            const order = run % 2 ? [...versions].reverse() : versions;
            for (const version of order) {
                const profile = path.join(temp, version + '-profile');
                const result = spawnSync(electron, [__filename, path.join(temp, version), profile], {
                    env, encoding: 'utf8', timeout: 35000
                });
                const row = result.stdout?.match(/^YAP_BENCHMARK (.+)$/m);
                if (result.status !== 0 || !row) {
                    throw new Error(`${version} run ${run + 1} failed\n${result.error || ''}\n${result.stdout || ''}\n${result.stderr || ''}`);
                }
                const timings = JSON.parse(row[1]);
                samples[version].push(timings);
                console.log(version, run + 1, timings);
            }
        }

        const metrics = Object.keys(samples.baseline[0]);
        const median = (rows, metric) => {
            const sorted = rows.map(row => row[metric]).sort((a, b) => a - b);
            const middle = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
        };
        console.table(Object.fromEntries(metrics.map(metric => {
            const before = median(samples.baseline, metric);
            const after = median(samples['working-tree'], metric);
            return [metric, { baselineMs: before, workingTreeMs: after, deltaMs: after - before }];
        })));
    } finally {
        fs.rmSync(temp, { recursive: true, force: true });
    }
}
