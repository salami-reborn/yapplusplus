(async () => {
  if (window.__yapplusweb) return;
  window.__yapplusweb = true;
  const owner = 'salami-reborn';
  const repo = 'yapplusplus';
  const branch = 'main';
  const rawbase = 'https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + branch + '/';
  const apibase = 'https://api.github.com/repos/' + owner + '/' + repo + '/';
  const cachekey = 'yapplus.webcache';
  const aliases = {
    staff: 'Staffcontrib.png',
    potato: 'Cutepotato.png',
    whitebox: 'whiteboxbadgeidkwhy.png',
    sigma: 'Hefeelsverysigma.png',
    chud: 'CERTIFIEDCHUD.png'
  };
  const mimes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon'
  };





  const assetpattern = new RegExp('^assets/[^/]+\\.(' + Object.keys(mimes).join('|') + ')$', 'i');
  const store = window.__yapplusstore || (window.__yapplusstore = { text: {}, assets: {}, tree: null, etag: '' });
  const filecache = {};
  let injected = [];
  let madeelectron = false;






  function note(msg, bad) {
    try {
      const t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText =
        'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#1e1f22;border:1px solid ' +
        (bad ? '#ff4b4b' : '#e27ed3') +
        ';color:#dbdee1;padding:8px 14px;border-radius:8px;font:13px sans-serif;z-index:2147483647;max-width:90vw;';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 6000);
    } catch (e) {}
  }


  function readsaved() {
    try {
      return JSON.parse(localStorage.getItem(cachekey) || '{}') || {};
    } catch (e) {
      return {};
    }
  }
  function persist(tree) {
    const live = {};
    tree.forEach((f) => {
      if (store.text[f.sha] !== undefined) live[f.sha] = store.text[f.sha];
    });
    try {
      localStorage.setItem(cachekey, JSON.stringify({ tree, etag: store.etag, text: live }));
    } catch (e) {}
  }

  async function gettree() {
    const url = apibase + 'git/trees/' + branch + '?recursive=1';
    const variants = store.tree && store.etag ? [{ 'If-None-Match': store.etag }, {}] : [{}];
    let status = 'network error';
    for (const extra of variants) {
      try {
        const headers = Object.assign({ Accept: 'application/vnd.github+json' }, extra);
        const r = await fetch(url, { headers });
        if (r.status === 304 && store.tree) return store.tree;
        if (r.ok) {
          const json = await r.json();
          store.tree = (json.tree || []).filter((f) => f.type === 'blob').map((f) => ({ path: f.path, sha: f.sha }));
          store.etag = r.headers.get('ETag') || '';
          return store.tree;
        }
        status = r.status;
      } catch (e) {}
    }
    if (store.tree) return store.tree;
    throw new Error(status + '. you may be rate limited for now; you can bypass that by using a vpn or a few min, This never happens on the desktop app!');
  }

  async function fetchfile(entry) {
    const tries = [
      () => fetch(rawbase + entry.path + '?t=' + Date.now()),
      () => fetch(rawbase + entry.path),
      () => fetch(apibase + 'git/blobs/' + entry.sha, { headers: { Accept: 'application/vnd.github.raw+json' } })
    ];
    let last = 'network error';
    for (const attempt of tries) {
      try {
        const r = await attempt();
        if (r.ok) return r;
        last = r.status;
      } catch (e) {
        last = 'network error';
      }
    }
    throw new Error(entry.path + ' returned ' + last);
  }

  async function gettext(entry) {
    if (store.text[entry.sha] !== undefined) return store.text[entry.sha];
    const r = await fetchfile(entry);
    const text = await r.text();
    store.text[entry.sha] = text;
    return text;
  }

  function mimefor(path) {
    return mimes[path.split('.').pop().toLowerCase()] || 'application/octet-stream';
  }
  function todataurl(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }
  async function getasset(entry) {
    if (store.assets[entry.sha]) return store.assets[entry.sha];
    const r = await fetchfile(entry);
    const blob = await r.blob();
    const url = await todataurl(new Blob([blob], { type: mimefor(entry.path) }));
    store.assets[entry.sha] = url;
    return url;
  }


  function byname(a, b) {
    const x = a.toLowerCase();
    const y = b.toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }

  function runcode(code) {
    try {
      (0, eval)(code);
    } catch (e) {
      if (!(e instanceof EvalError)) throw e;
      const s = document.createElement('script');
      s.textContent = code;
      document.documentElement.appendChild(s);
      s.remove();
    }
  }

  function unload() {
    const host = window.PluginHost;
    (window.__yapplusteardowns || []).splice(0).forEach((fn) => {
      try {
        fn();
      } catch (e) {}
    });
    if (host && typeof host.all === 'function') {
      host.all().forEach((plugin) => {
        try {
          if (typeof host.isEnabled === 'function' && !host.isEnabled(plugin)) return;
          if (typeof plugin.stop === 'function') plugin.stop();
        } catch (e) {}
      });
    }
    const themeel = document.getElementById('yapplus-active-theme');
    if (themeel) themeel.remove();
    injected.forEach((key) => {
      try {
        delete window[key];
      } catch (e) {}
    });
    injected = [];
    ['YapPlusAssets', '__yapplusteardowns', '__yapplusunload'].forEach((key) => {
      try {
        delete window[key];
      } catch (e) {}
    });
    if (madeelectron) {
      try {
        delete window.electronAPI;
      } catch (e) {}
    }
    window.__yapplusweb = false;
  }

  try {
    window.__yapplusteardowns = [];
    window.__yapplusunload = () => {
      unload();
      note(`awww, sad to see you go! unless you're unloading to update!`, false);
    };

    const saved = readsaved();
    if (!store.tree && saved.tree) {
      store.tree = saved.tree;
      store.etag = saved.etag || '';
    }
    Object.keys(saved.text || {}).forEach((sha) => {
      if (!(sha in store.text)) store.text[sha] = saved.text[sha];
    });

    const tree = await gettree();
    const pluginentries = tree.filter((f) => /^plugins\/[^\/]+\.js$/.test(f.path)).sort((a, b) => byname(a.path, b.path));
    const themeentries = tree.filter((f) => /^themes\/[^\/]+\.css$/.test(f.path));
    const assetentries = tree.filter((f) => assetpattern.test(f.path));
    const failed = [];
    const themes = {};
    const assets = {};

    const loaded = await Promise.all([
      Promise.all(
        assetentries.map(async (entry) => {
          try {
            const name = entry.path.slice(7);
            const url = await getasset(entry);
            const stem = name.replace(/\.[^.]+$/, '');
            filecache[name] = url;
            assets[name] = url;
            assets[stem] = url;
            assets[stem.toLowerCase()] = url;
          } catch (e) {
            failed.push(entry.path);
          }
        })
      ),
      Promise.all(
        themeentries.map(async (entry) => {
          try {
            themes[entry.path.slice(7)] = await gettext(entry);
          } catch (e) {
            failed.push(entry.path);
          }
        })
      ),
      Promise.all(
        pluginentries.map(async (entry) => {
          try {
            return await gettext(entry);
          } catch (e) {
            failed.push(entry.path);
            return null;
          }
        })
      )
    ]);

    const sources = loaded[2].filter((s) => s !== null);
    if (!sources.length) throw new Error('no plugins could be loaded. github may be rate limiting you for a few min.');
    persist(tree);

    Object.keys(aliases).forEach((key) => {
      if (filecache[aliases[key]]) assets[key] = filecache[aliases[key]];
    });
    window.YapPlusAssets = assets;

    if (!window.electronAPI) {
      madeelectron = true;
      window.electronAPI = {
        getPlugins: async () => sources.join('\n'),
        getAsset: async (name) => filecache[name] || null,
        getThemes: async () => themes,
        getPreloadPath: () => '',
        update: async () => ({
          success: false,
          error: 'outdated. pls run the script again to use the latest version'
        }),
        restartApp: () => location.reload(),
        saveCustomPlugin: async () => ({ success: false, error: 'not supported in the web version' }),
        openExternal: async (url) => {
          window.open(url, '_blank', 'noopener');
          return { success: true };
        }
      };
    }

    try {
      const savedtheme = localStorage.getItem('yapplus.activeTheme');
      if (savedtheme && themes[savedtheme]) {
        let el = document.getElementById('yapplus-active-theme');
        if (!el) {
          el = document.createElement('style');
          el.id = 'yapplus-active-theme';
          document.head.appendChild(el);
        }
        el.textContent = themes[savedtheme];
      }
    } catch (e) {}

    const before = new Set(Object.getOwnPropertyNames(window));
    runcode(sources.join('\n'));
    injected = Object.getOwnPropertyNames(window).filter((key) => !before.has(key));

    let msg = 'Welcome to yap++ web!! You should have like (' + sources.length + ' plugins now)';
    if (failed.length) msg += ' - skipped ' + failed.length + ' that failed: ' + failed.join(', ');
    note(msg, failed.length > 0);
    if (failed.length) console.warn('Noo! some plugins didnt load or like we skipped em:', failed);
  } catch (e) {
    unload();
    note('Yap++ web FAILED... ' + (e && e.message ? e.message : e), true);
  }
})();