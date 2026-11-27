const { app, BrowserWindow, ipcMain, Menu, shell, desktopCapturer, session } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const hotdir = process.env.YAPPLUS_HOT_DIR;
const appdir = process.env.YAPPLUS_APP_DIR;
const localmode = process.env.YAPPLUS_LOCAL === '1' || process.env.YAPPLUS_DEV === '1';
const internalhosts = ['yapper.website', 'yapin.gg'];
const externalprotocols = ['http:', 'https:', 'mailto:', 'tel:'];
const passprotocols = ['blob:', 'about:', 'devtools:'];

app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');



async function updatebadges() {
    if (!hotdir || localmode) return;

    const headers = {
        'User-Agent': 'YapPlusPlus-App',
        'Cache-Control': 'no-cache'
    };
    const baseurl = 'https://raw.githubusercontent.com/salami-reborn/yapplusplus/main/';

    try {
        const pluginurl = `${baseurl}plugins/badges.js?t=${Date.now()}`;
        const pluginres = await fetch(pluginurl, { headers, cache: 'no-store' });

        if (pluginres.ok) {
            const remotebuffer = Buffer.from(await pluginres.arrayBuffer());
            const localpath = path.join(hotdir, 'plugins', 'badges.js');

            if (!fs.existsSync(path.dirname(localpath))) {
                fs.mkdirSync(path.dirname(localpath), { recursive: true });
            }

            fs.writeFileSync(localpath, remotebuffer);
        } else {
        }
    } catch (e) {}
    try {
        const apires = await fetch('https://api.github.com/repos/salami-reborn/yapplusplus/git/trees/main?recursive=1', { headers });
        if (!apires.ok) return;
        const tree = await apires.json();
        if (!tree || !tree.tree) return;
        const assetfiles = tree.tree.filter(f => f.type === 'blob' && f.path.startsWith('assets/'));
        await Promise.all(assetfiles.map(async (file) => {
            try {
                const asseturl = `${baseurl}${file.path}?t=${Date.now()}`;
                const assetres = await fetch(asseturl, { headers, cache: 'no-store' });
                if (!assetres.ok) return;
                const remotebuffer = Buffer.from(await assetres.arrayBuffer());
                const localpath = path.join(hotdir, file.path);
                if (!fs.existsSync(path.dirname(localpath))) {
                    fs.mkdirSync(path.dirname(localpath), { recursive: true });
                }
                if (fs.existsSync(localpath)) {
                    const localbuffer = fs.readFileSync(localpath);
                    if (gitblobsha(localbuffer) === gitblobsha(remotebuffer)) {
                        return;
                    }
                }
                fs.writeFileSync(localpath, remotebuffer);
            } catch (e) {}
        }));
    } catch (e) {}
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
        openexternal(url);
        return { action: 'deny' };
    });
    const guard = (navevent, legacyurl) => {
        const target = navevent.url || legacyurl || '';
        const parsed = parseurl(target);
        if (parsed && passprotocols.includes(parsed.protocol)) return;
        if (parsed && parsed.protocol === 'file:') return;
        if (contents.getType() === 'webview') return;
        navevent.preventDefault();
        openexternal(target);
    };

    contents.on('will-navigate', guard);
    contents.on('will-redirect', guard);
});

function resolve(relpath) {
    const localpath = path.join(appdir, relpath);
    if (localmode) return localpath;
    if (hotdir) {
        const hotpath = path.join(hotdir, relpath);
        if (fs.existsSync(hotpath)) return hotpath;
    }
    return localpath;
}

function getplugindirs() {
    const dirs = [
        path.join(appdir, 'plugins'),
        hotdir ? path.join(hotdir, 'plugins') : null
    ].filter(Boolean);
    return localmode ? dirs : dirs.reverse();
}

function getthemedirs() {
    const dirs = [
        path.join(appdir, 'themes'),
        hotdir ? path.join(hotdir, 'themes') : null
    ].filter(Boolean);
    return localmode ? dirs : dirs.reverse();
}

function getplugincode() {
    const dirs = getplugindirs();
    const files = new Map();
    let combinedcode = '';
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        fs.readdirSync(dir).forEach(file => {
            if (file.endsWith('.js') && !files.has(file)) files.set(file, path.join(dir, file));
        });
    }
    const names = [...files.keys()].sort((left, right) => {
        if (left === '0core.js') return -1;
        if (right === '0core.js') return 1;
        return left.localeCompare(right);
    });
    for (const name of names) {
        try { combinedcode += fs.readFileSync(files.get(name), 'utf-8') + '\n'; } catch (e) {}
    }
    return combinedcode;
}

function getthemecode() {
    const dirs = getthemedirs();
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

const yaplaysessions = new Map();
const yaplayActions = ['set_mute', 'set_deafen', 'leave_call'];
const yaplayexpiry = 30000;

function yaplaybackground(connection) {
    const contents = connection.contents;
    if (!contents || contents.isDestroyed()) return false;
    const host = contents.hostWebContents || contents;
    if (!host || host.isDestroyed()) return false;
    const win = BrowserWindow.fromWebContents(host);
    return Boolean(win && (!win.isVisible() || !win.isFocused() || win.isMinimized()));
}

function yaplaysource(event) {
    const frame = event.senderFrame;
    const url = frame && parseurl(frame.url);
    if (event.sender.getType() !== 'webview' || frame !== event.sender.mainFrame || !url
        || !['https://yapper.website', 'https://www.yapper.website', 'https://yapin.gg', 'https://www.yapin.gg'].includes(url.origin)) {
        throw new Error('Yaplay requires the Yapin window.');
    }
    return event.sender.id;
}

function yapmodsource(event) {
    const frame = event.senderFrame;
    const url = frame && parseurl(frame.url);
    if (event.sender.getType() !== 'webview' || frame !== event.sender.mainFrame || !url
        || !['https://yapper.website', 'https://www.yapper.website', 'https://yapin.gg', 'https://www.yapin.gg'].includes(url.origin)) {
        throw new Error('Yapmod requires the Yapin window.');
    }
    return event.sender;
}

ipcMain.handle('run-yapmod-client', async (event, source) => {
    const contents = yapmodsource(event);
    if (typeof source !== 'string' || !source.trim() || Buffer.byteLength(source, 'utf8') > 2 * 1024 * 1024) {
        throw new Error('Invalid Yapmod client bundle.');
    }
    await contents.executeJavaScript(source);
    return true;
});

ipcMain.handle('stop-yapmod-client', (event) => {
    const contents = yapmodsource(event);
    return contents.executeJavaScript('globalThis.YapmodClient?.dispose?.();');
});

ipcMain.handle('fetch-yapmod-release', async (event) => {
    yapmodsource(event);
    const headers = { 'User-Agent': 'YapPlusPlus-App', Accept: 'application/vnd.github+json' };
    const releaseResponse = await fetch('https://api.github.com/repos/yapmod/client/releases/latest', {
        headers,
        signal: AbortSignal.timeout(20000)
    });
    if (!releaseResponse.ok) throw new Error(`GitHub release lookup failed (${releaseResponse.status}).`);
    const release = await releaseResponse.json();
    const asset = release && Array.isArray(release.assets)
        ? release.assets.find(item => item && item.name === 'yapmod-client.js')
        : null;
    if (typeof release.tag_name !== 'string' || !release.tag_name || !asset
        || !Number.isInteger(asset.size) || asset.size <= 0 || asset.size > 2 * 1024 * 1024) {
        throw new Error('The latest GitHub release does not contain a valid Yapmod Client bundle.');
    }
    const downloadurl = parseurl(asset.browser_download_url);
    const expectedpath = `/yapmod/client/releases/download/${encodeURIComponent(release.tag_name)}/yapmod-client.js`;
    if (!downloadurl || downloadurl.protocol !== 'https:' || downloadurl.hostname !== 'github.com'
        || downloadurl.pathname !== expectedpath || downloadurl.search || downloadurl.hash
        || downloadurl.username || downloadurl.password) {
        throw new Error('The latest release bundle URL is invalid.');
    }
    const assetResponse = await fetch(downloadurl.href, {
        headers: { 'User-Agent': 'YapPlusPlus-App', Accept: 'application/octet-stream' },
        signal: AbortSignal.timeout(20000)
    });
    if (!assetResponse.ok) throw new Error(`GitHub bundle download failed (${assetResponse.status}).`);
    const finalurl = parseurl(assetResponse.url);
    if (!finalurl || !['github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com'].includes(finalurl.hostname)) {
        throw new Error('GitHub redirected the bundle download to an unexpected host.');
    }
    const bundle = Buffer.from(await assetResponse.arrayBuffer());
    if (bundle.length !== asset.size || bundle.length > 2 * 1024 * 1024) {
        throw new Error('The downloaded Yapmod Client bundle has an invalid size.');
    }
    if (asset.digest) {
        const digest = 'sha256:' + crypto.createHash('sha256').update(bundle).digest('hex');
        if (asset.digest !== digest) throw new Error('The Yapmod Client release checksum did not match.');
    }
    const source = new TextDecoder('utf-8', { fatal: true }).decode(bundle);
    if (!source.trim()) throw new Error('The downloaded Yapmod Client bundle is empty.');
    return { tag: release.tag_name, filename: asset.name, source };
});

function yaplayfields(value, fields) {
    return value && typeof value === 'object' && !Array.isArray(value)
        && Object.keys(value).every(key => fields.includes(key));
}

function yaplayvalidate(snapshot, notices) {
    if (!yaplayfields(snapshot, ['in_call', 'members', 'muted', 'deafened'])
        || typeof snapshot.in_call !== 'boolean' || typeof snapshot.muted !== 'boolean'
        || typeof snapshot.deafened !== 'boolean' || !Array.isArray(snapshot.members)
        || snapshot.members.length > 4096
        || (!snapshot.in_call && (snapshot.members.length || snapshot.muted || snapshot.deafened))) {
        throw new Error('Invalid Yaplay call state.');
    }
    const ids = new Set();
    for (const member of snapshot.members) {
        if (!yaplayfields(member, ['id', 'name', 'avatar_url', 'color', 'speaking', 'muted', 'is_self'])
            || typeof member.id !== 'string' || !member.id.length || Buffer.byteLength(member.id) > 128
            || ids.has(member.id) || typeof member.name !== 'string' || Buffer.byteLength(member.name) > 512
            || !Array.isArray(member.color) || member.color.length !== 3
            || !member.color.every(value => Number.isInteger(value) && value >= 0 && value <= 255)
            || typeof member.speaking !== 'boolean' || typeof member.muted !== 'boolean' || typeof member.is_self !== 'boolean') {
            throw new Error('Invalid Yaplay member.');
        }
        ids.add(member.id);
        if (member.avatar_url !== undefined) {
            const url = typeof member.avatar_url === 'string' && parseurl(member.avatar_url);
            if (!url || url.protocol !== 'https:' || url.username || url.password || Buffer.byteLength(member.avatar_url) > 2048) {
                throw new Error('Invalid Yaplay avatar.');
            }
        }
    }
    if (Buffer.byteLength(JSON.stringify(snapshot)) > 1024 * 1024 - 1024) throw new Error('Yaplay state is too large.');
    if (!Array.isArray(notices) || notices.length > 5 || notices.some(notice =>
        !yaplayfields(notice, ['title', 'body']) || typeof notice.title !== 'string' || typeof notice.body !== 'string'
        || Buffer.byteLength(notice.title) > 512 || Buffer.byteLength(notice.body) > 4096)) {
        throw new Error('Invalid Yaplay notifications.');
    }
}

function yaplayclose(connection) {
    clearTimeout(connection.timeout);
    const socket = connection.socket;
    connection.socket = null;
    connection.actions = [];
    connection.last = '';
    if (socket) {
        try {
            if (socket.readyState === WebSocket.OPEN) socket.send('{"type":"voice_state","in_call":false,"members":[]}');
            socket.close();
        } catch (e) {}
    }
}

function yaplayconnect(connection) {
    if (connection.socket || Date.now() < connection.retry) return;
    const socket = new WebSocket(`ws://127.0.0.1:${connection.port}`);
    connection.socket = socket;
    let accepted = null;
    const failed = () => {
        if (connection.socket !== socket) return;
        yaplayclose(connection);
        connection.retry = Date.now() + 2000;
    };
    connection.timeout = setTimeout(failed, 2000);
    socket.addEventListener('open', () => {
        if (connection.socket !== socket) return;
        clearTimeout(connection.timeout);
        try {
            socket.send(JSON.stringify({ type: 'hello', version: 2, name: 'Yap++', client_version: app.getVersion(), actions: yaplayActions }));
        } catch { failed(); return; }
        // A v1 overlay never acknowledges the hello. It supports all three controls.
        connection.timeout = setTimeout(() => {
            if (connection.socket !== socket || socket.readyState !== WebSocket.OPEN || accepted !== null) return;
            try {
                socket.send('{"type":"hello","version":1,"controls":true}');
                accepted = new Set(yaplayActions);
                connection.last = '';
            } catch { failed(); }
        }, 1500);
    });
    socket.addEventListener('error', failed);
    socket.addEventListener('close', failed);
    socket.addEventListener('message', event => {
        if (connection.socket !== socket) return;
        if (typeof event.data !== 'string' || Buffer.byteLength(event.data) > 4096) { failed(); return; }
        try {
            const action = JSON.parse(event.data);
            if (action?.type === 'hello_ack' && accepted === null && action.version === 2
                && Array.isArray(action.actions) && action.actions.every(name => typeof name === 'string')) {
                clearTimeout(connection.timeout);
                accepted = new Set(yaplayActions.filter(name => action.actions.includes(name)));
                return;
            }
            if (!accepted?.has(action?.type)) return;
            const valid = (yaplayfields(action, ['type', 'muted']) && action.type === 'set_mute' && typeof action.muted === 'boolean')
                || (yaplayfields(action, ['type', 'deafened']) && action.type === 'set_deafen' && typeof action.deafened === 'boolean')
                || (yaplayfields(action, ['type']) && action.type === 'leave_call');
            if (valid && connection.actions.length < 8) connection.actions.push(action);
        } catch (e) {}
    });
}

ipcMain.handle('yaplay-start', (event, sessionid, port) => {
    const senderid = yaplaysource(event);
    if (typeof sessionid !== 'string' || !sessionid.length || sessionid.length > 64
        || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid Yaplay session or port.');
    const old = yaplaysessions.get(senderid);
    if (old) yaplayclose(old);
    yaplaysessions.set(senderid, { sessionid, port, socket: null, actions: [], last: '', call: null, seen: Date.now(), retry: 0, contents: event.sender });
});

ipcMain.handle('yaplay-exchange', (event, sessionid, snapshot, notices, call) => {
    const senderid = yaplaysource(event);
    yaplayvalidate(snapshot, notices);
    if (typeof call !== 'string' || call.length > 512) throw new Error('Invalid Yaplay call.');
    const connection = yaplaysessions.get(senderid);
    if (!connection || connection.sessionid !== sessionid) throw new Error('Yaplay session expired.');
    connection.seen = Date.now();
    if (connection.call !== call) { connection.actions = []; connection.call = call; }
    yaplayconnect(connection);
    const socket = connection.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) return { connected: false, actions: [] };
    try {
        if (socket.bufferedAmount > 1024 * 1024) throw new Error('Yaplay is not receiving updates.');
        const state = JSON.stringify(snapshot);
        if (connection.last !== state) {
            socket.send(JSON.stringify({ type: 'voice_state', in_call: snapshot.in_call, members: snapshot.members }));
            socket.send(JSON.stringify({ type: 'mic_state', muted: snapshot.muted }));
            socket.send(JSON.stringify({ type: 'deafen_state', deafened: snapshot.deafened }));
            connection.last = state;
        }
        for (const notice of notices) socket.send(JSON.stringify({ type: 'notification', ...notice }));
        return { connected: true, actions: connection.actions.splice(0) };
    } catch (e) {
        yaplayclose(connection);
        connection.retry = Date.now() + 2000;
        return { connected: false, actions: [] };
    }
});

ipcMain.handle('yaplay-stop', (event, sessionid) => {
    const senderid = yaplaysource(event);
    const connection = yaplaysessions.get(senderid);
    if (connection && connection.sessionid === sessionid) {
        yaplayclose(connection);
        yaplaysessions.delete(senderid);
    }
});

app.on('web-contents-created', (event, contents) => {
    const senderid = contents.id;
    const clear = () => {
        const connection = yaplaysessions.get(senderid);
        if (connection) yaplayclose(connection);
        yaplaysessions.delete(senderid);
    };
    contents.on('did-start-navigation', (event, url, inPlace, mainFrame) => { if (mainFrame && !inPlace) clear(); });
    contents.on('render-process-gone', clear);
    contents.once('destroyed', clear);
});

let yaplaylastcheck = Date.now();
setInterval(() => {
    const now = Date.now();
    const paused = now - yaplaylastcheck > 5000;
    yaplaylastcheck = now;
    for (const [senderid, connection] of yaplaysessions) {
        if (!connection.contents || connection.contents.isDestroyed()) {
            yaplayclose(connection);
            yaplaysessions.delete(senderid);
            continue;
        }
        if (!paused && now - connection.seen > yaplayexpiry && !yaplaybackground(connection)) {
            yaplayclose(connection);
            yaplaysessions.delete(senderid);
        }
    }
}, 1000).unref();

app.on('before-quit', () => {
    for (const connection of yaplaysessions.values()) yaplayclose(connection);
    yaplaysessions.clear();
});
ipcMain.handle('get-themes', () => getthemecode());
ipcMain.handle('get-asset', (event, assetname) => {
    const candidates = [
        path.join(appdir, 'assets', assetname),
        hotdir ? path.join(hotdir, 'assets', assetname) : null
    ].filter(Boolean);
    if (!localmode) candidates.reverse();
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

// Contributions by @duckycore12
function gitblobsha(buf) {
    return crypto.createHash('sha1')
        .update(`blob ${buf.length}\0`)
        .update(buf)
        .digest('hex');
}

// Contribution by @duckycore12
async function gettree(repoowner, reponame, branch, headers) {
    try {
        const manifesturl = `https://raw.githubusercontent.com/${repoowner}/${reponame}/${branch}/manifest.json?t=${Date.now()}`;
        const res = await fetch(manifesturl, { headers });
        if (!res.ok) return [];
        const manifest = await res.json();
        if (!manifest || typeof manifest !== 'object') return [];
        return Object.entries(manifest).map(([p, sha]) => ({ type: 'blob', path: p, sha }));
    } catch (e) {
        return [];
    }
}

async function update() { // contribution by @duckycore12
    const repoowner = 'salami-reborn';
    const reponame = 'yapplusplus';
    const branch = 'main';
    const headers = { 'User-Agent': 'YapPlusPlus-App' };

    try {
        const tree = await gettree(repoowner, reponame, branch, headers);
        if (!tree || tree.length === 0) return { success: true, count: 0 };

        const safepaths = /^(app\.js|main\.js|preload\.js|html\/client\.html|assets\/.*|plugins\/.*|themes\/.*)$/;
        const files = tree.filter(f => f.type === 'blob' && safepaths.test(f.path));
        const validpaths = new Set(files.map(f => f.path));
        const todo = files.filter(f => {
            const localpath = path.join(hotdir, f.path);
            if (!fs.existsSync(localpath)) return true;
            return gitblobsha(fs.readFileSync(localpath)) !== f.sha;
        });

        let updatedcount = 0;
        const failed = [];

        async function download(file) {
            const rawurl = `https://raw.githubusercontent.com/${repoowner}/${reponame}/${branch}/${file.path.split('/').map(encodeURIComponent).join('/')}`;
            try {
                const res = await fetch(rawurl, { headers });
                if (!res.ok) throw new Error(String(res.status));
                const buf = Buffer.from(await res.arrayBuffer());
                const localpath = path.join(hotdir, file.path);
                fs.mkdirSync(path.dirname(localpath), { recursive: true });
                fs.writeFileSync(localpath, buf);
                updatedcount++;
            } catch (e) {
                failed.push(file.path);
            }
        }
        const BATCH = 8;
        for (let i = 0; i < todo.length; i += BATCH) {
            await Promise.all(todo.slice(i, i + BATCH).map(download));
        }

        if (failed.length) {
            return { success: false, error: `Failed to download: ${failed.join(', ')}`, count: updatedcount };
        }
        function cleandir(dir) {
            if (!fs.existsSync(dir)) return;
            for (const file of fs.readdirSync(dir)) {
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

    const pendingPicks = new Map();

    ipcMain.on('picked-screen', (event, picked) => {
        const entry = pendingPicks.get(event.sender.id);
        if (!entry) return;
        pendingPicks.delete(event.sender.id);
        const { callback, request, win } = entry;
        if (!win.isDestroyed()) win.close();
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

    function setupDisplayMediaRequestHandler(targetSession) {
        targetSession.setDisplayMediaRequestHandler(async (request, callback) => {
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

                const wcId = pickerwindow.webContents.id;
                pendingPicks.set(wcId, { callback, request, win: pickerwindow });

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

                pickerwindow.on('closed', () => {
                    const entry = pendingPicks.get(wcId);
                    if (entry) {
                        pendingPicks.delete(wcId);
                        entry.callback({});
                    }
                });

            } catch (err) {
                callback({});
            }
        });
    }

    setupDisplayMediaRequestHandler(session.defaultSession);
    setupDisplayMediaRequestHandler(session.fromPartition('persist:yapper'));

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
            backgroundThrottling: false,
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
