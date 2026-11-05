const { app, BrowserWindow, ipcMain, Menu, shell, desktopCapturer, session } = require('electron');
const fs = require('fs');
const path = require('path');
const hotdir = process.env.YAPPLUS_HOT_DIR;
const appdir = process.env.YAPPLUS_APP_DIR;
const internalhosts = ['yapper.website', 'yapin.gg'];
const externalprotocols = ['http:', 'https:', 'mailto:', 'tel:'];
const passprotocols = ['blob:', 'about:', 'devtools:'];




async function updatebadges() {
    if (!hotdir) return;
    try {
        const rawurl = `https://raw.githubusercontent.com/salami-reborn/yapplusplus/main/plugins/badges.js?t=${Date.now()}`;
        const response = await fetch(rawurl, { headers: { 'User-Agent': 'YapPlusPlus-App' } });
        if (!response.ok) return;
        const remotebuffer = Buffer.from(await response.arrayBuffer());
        const localpath = path.join(hotdir, 'plugins', 'badges.js');
        if (fs.existsSync(localpath)) {
            if (fs.readFileSync(localpath).equals(remotebuffer)) return; 
        }
        fs.mkdirSync(path.dirname(localpath), { recursive: true });
        fs.writeFileSync(localpath, remotebuffer);
    } catch (e) {
    }
}

function parseurl(url) {
    try {
        return new URL(url);
    } catch (e) {
        return null;
    }
}
function isinternal(url) {
    const parsed = parseurl(url);
    if (!parsed) return false;
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return internalhosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h));
}
function openexternal(url) {
    const parsed = parseurl(url);
    if (!parsed || !externalprotocols.includes(parsed.protocol)) return false;
    shell.openExternal(parsed.href).catch(() => {});
    return true;
}





app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        if (isinternal(url)) return { action: 'allow' };
        openexternal(url);
        return { action: 'deny' };
    });
    const guard = (navevent, legacyurl) => {
        const target = navevent.url || legacyurl || '';
        const parsed = parseurl(target);
        if (parsed && passprotocols.includes(parsed.protocol)) return;
        if (isinternal(target)) return;
        if (parsed && parsed.protocol === 'file:' && contents.getType() !== 'webview') return;
        navevent.preventDefault();
        openexternal(target);
    };
    contents.on('will-navigate', guard);
    contents.on('will-redirect', guard);
});


function resolve(relpath) {
    if (hotdir) {
        const hotpath = path.join(hotdir, relpath);
        if (fs.existsSync(hotpath)) return hotpath;
    }
    return path.join(appdir, relpath);
}



function getplugincode() {
    const dirs = [
        hotdir ? path.join(hotdir, 'plugins') : null,
        path.join(appdir, 'plugins')
    ].filter(Boolean);
    const seen = new Set();
    let combinedcode = '';
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        fs.readdirSync(dir).forEach(file => {
            if (file.endsWith('.js') && !seen.has(file)) {
                seen.add(file);
                try {
                    combinedcode += `\n// [Libyapcore] [P.L]> ${file} >.<\n`;
                    combinedcode += fs.readFileSync(path.join(dir, file), 'utf-8') + '\n';
                } catch (e) {}
            }
        });
    }
    return combinedcode;
}

function getthemecode() {
    const dirs = [
        hotdir ? path.join(hotdir, 'themes') : null,
        path.join(appdir, 'themes')
    ].filter(Boolean);
    const themes = {};
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        fs.readdirSync(dir).forEach(file => {
            if (file.endsWith('.css') && !themes[file]) {
                try { themes[file] = fs.readFileSync(path.join(dir, file), 'utf-8'); } catch (e) {}
            }
        });
    }
    return themes;
}

ipcMain.handle('get-plugins', () => getplugincode());
ipcMain.handle('get-themes', () => getthemecode());
ipcMain.handle('get-asset', (event, assetname) => {
    const candidates = [
        hotdir ? path.join(hotdir, 'assets', assetname) : null,
        path.join(appdir, 'assets', assetname)
    ].filter(Boolean);
    for (const assetpath of candidates) {
        if (fs.existsSync(assetpath)) {
            try {
                const bitmap = fs.readFileSync(assetpath);
                const base64 = Buffer.from(bitmap).toString('base64');
                const ext = path.extname(assetname).toLowerCase();
                let mime = 'image/png';
                if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
                if (ext === '.gif') mime = 'image/gif';
                if (ext === '.webp') mime = 'image/webp';
                return `data:${mime};base64,${base64}`;
            } catch (e) {}
        }
    }
    return null;
});

ipcMain.handle('save-custom-plugin', async (event, filename, code) => {
    try {
        if (!filename.endsWith('.js')) filename += '.js';
        const pluginshotdir = path.join(hotdir, 'plugins');
        if (!fs.existsSync(pluginshotdir)) fs.mkdirSync(pluginshotdir, { recursive: true });
        fs.writeFileSync(path.join(pluginshotdir, filename), code, 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('open-external', async (event, url) => {
    try {
        if (!openexternal(String(url))) return { success: false, error: 'blocked protocol' };
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

async function update() {
    const repoowner = 'salami-reborn';
    const reponame = 'yapplusplus';
    const branch = 'main';
    try {
        const treeurl = `https://api.github.com/repos/${repoowner}/${reponame}/git/trees/${branch}?recursive=1`;
        const response = await fetch(treeurl, { headers: { 'User-Agent': 'YapPlusPlus-App' } });
        if (!response.ok) {
            if (response.status === 403 || response.status === 404) {
                throw new Error(`Github rate limited you for 10 min for spamming this button, you can use a VPN if you REALLY want to update without waiting 10minutes `);
            }
            throw new Error(`Github said ${response.status}`);
        }
        const treedata = await response.json();
        let updatedcount = 0;
        const validpaths = new Set();
        const safepaths = /^(app\.js|main\.js|preload\.js|html\/client\.html|assets\/.*|plugins\/.*|themes\/.*)$/;
        for (const file of treedata.tree || []) {
            if (file.type !== 'blob' || !safepaths.test(file.path)) continue;
            validpaths.add(file.path);
            const localpath = path.join(hotdir, file.path);
            const bloburl = `https://api.github.com/repos/${repoowner}/${reponame}/git/blobs/${file.sha}`;
            const blobres = await fetch(bloburl, { headers: { 'User-Agent': 'YapPlusPlus-App' } });
            if (!blobres.ok) continue;
            const blobdata = await blobres.json();
            if (blobdata.encoding !== 'base64') continue;
            const remotebuffer = Buffer.from(blobdata.content, 'base64');
            let needsupdate = false;
            if (!fs.existsSync(localpath)) {
                needsupdate = true;
            } else {
                const localbuffer = fs.readFileSync(localpath);
                if (!localbuffer.equals(remotebuffer)) {
                    needsupdate = true;
                }
            }

            if (needsupdate) {
                fs.mkdirSync(path.dirname(localpath), { recursive: true });
                fs.writeFileSync(localpath, remotebuffer);
                updatedcount++;
            }
        }

        function cleandir(dir) {
            if (!fs.existsSync(dir)) return;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullpath = path.join(dir, file);
                const relpath = path.relative(hotdir, fullpath).replace(/\\/g, '/');
                if (fs.statSync(fullpath).isDirectory()) {
                    cleandir(fullpath);
                } else if (!validpaths.has(relpath)) {
                    fs.unlinkSync(fullpath);
                }
            }
        }
        cleandir(hotdir);

        return { success: true, count: updatedcount };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

ipcMain.handle('update', async () => update());

ipcMain.handle('restart-app', () => {
    app.relaunch();
    app.exit(0);
});

app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    await updatebadges(); 

    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
        try {
            const sources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 } });

            const pickerwindow = new BrowserWindow({
                width: 800,
                height: 600,
                title: 'Select Screen to Share',
                autoHideMenuBar: true,
                alwaysOnTop: true,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });



            let sourcesdata = sources.map(s => ({
                id: s.id,
                name: s.name,
                thumbnail: s.thumbnail.toDataURL()
            }));

            const html = `
                <html>
                <body style="background: #1e1f22; color: #dbdee1; font-family: sans-serif; padding: 20px;">
                    <h2 style="margin-top: 0;">Select a screen or window to share</h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                        ${sourcesdata.map((s, i) => `
                            <div onclick="pick(${i})" style="cursor: pointer; text-align: center; width: 220px; padding: 10px; border-radius: 8px; background: #2b2d31;">
                                <img src="${s.thumbnail}" style="width: 100%; border-radius: 4px; border: 1px solid #111;" />
                                <div style="margin-top: 8px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}</div>
                            </div>
                        `).join('')}
                    </div>
                    <script>
                        const { ipcRenderer } = require('electron');
                        window.pick = (i) => {
                            ipcRenderer.send('picked-screen', ${JSON.stringify(sourcesdata)}[i]);
                        };
                    </script>
                </body>
                </html>
            `;
            pickerwindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
            ipcMain.once('picked-screen', (event, picked) => {
                pickerwindow.close();
                if (!picked) {
                    callback({});
                    return;
                }

                const streams = { video: picked };
                if (request.audioRequested && process.platform === 'win32') {
                    streams.audio = 'loopback';
                }
                callback(streams);
            });

            pickerwindow.on('closed', () => {
                callback({});
            });

        } catch (err) {
            callback({});
        }
    });
    const preloadpath = resolve('preload.js').replace(/\\/g, '/');
    const clientpath = resolve('html/client.html');
    const mainwindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        icon: path.join(appdir, 'assets', 'Icon.ico'),
        webPreferences: {
            webviewTag: true,
            preload: preloadpath,
            contextIsolation: true,
            nodeIntegration: false,
            additionalArguments: [`--preload-path=${preloadpath}`]
        }
    });

    mainwindow.loadFile(clientpath);
});



app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});