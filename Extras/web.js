(async () => {
  if (window.__yapplusweb) return;
  window.__yapplusweb = true;
  const owner = 'salami-reborn';
  const repo = 'yapplusplus';
  const branch = 'main';
  const rawbase = 'https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + branch + '/';
  const cachekey = 'yapplus.webcache';
  const aliases = {
    staff: 'Staffcontrib.png',
    helper: 'Helper.png',
    vim: 'Vim.png',
    potato: 'Cutepotato.png',
    whitebox: 'whiteboxbadgeidkwhy.png',
    sigma: 'Hefeelsverysigma.png',
    chud: 'CERTIFIEDCHUD.png',
    yppIcon: 'yppIcon.png',
    yapjsbadge: 'yapjsbadge.png',
    gothheart: 'blackheart.png'
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
  const store = window.__yapplusstore || (window.__yapplusstore = { text: {}, assets: {}, manifest: {}, etag: '' });
  const filecache = {};
  let injected = [];
  let madeelectron = false;
  const FALLBACK_PLUGINS = [
    'plugins/0core.js', 'plugins/1menu.js', 'plugins/nya.js',
    'plugins/permissionviewer.js', 'plugins/reverseimagesearch.js',
    'plugins/emojimarkdowncopy.js', 'plugins/quickmention.js',
    'plugins/custombackground.js', 'plugins/messagelogger.js',
    'plugins/draftsave.js', 'plugins/badges.js', 'plugins/developervariables.js',
    'plugins/memberamount.js', 'plugins/Localnicknames.js', 'plugins/yaplay.js'
  ];
  const FALLBACK_THEMES = [
    'themes/AnticBlue.css', 'themes/Stuff.css', 'themes/amoled.css',
    'themes/adhd_muted.css', 'themes/bamboo.css',
    'themes/catppuccin_animated.css', 'themes/catppuccin_frappe.css',
    'themes/catppuccin_mocha.css', 'themes/catppucin_macchiato.css',
    'themes/contrast_demon.css', 'themes/cursed.css', 'themes/dirt.css',
    'themes/disrespect.css', 'themes/dyslexia_friendly.css',
    'themes/everforest.css', 'themes/eyegasm.css',
    'themes/futuristic_dark.css', 'themes/futuristic_light.css',
    'themes/gruvboxdark.css', 'themes/jellyfish.css', 'themes/jungleberry.css',
    'themes/kanagawa.css', 'themes/lavender.css', 'themes/lemon_light.css',
    'themes/matrix.css', 'themes/mellow.css', 'themes/monochrome.css',
    'themes/mrrobot_larp.css', 'themes/nightfly.css',
    'themes/oxocarbon.css', 'themes/productivityPro.css', 'themes/purple_haze.css',
    'themes/retro95.css', 'themes/robloxstudio.css', 'themes/rosepine.css',
    'themes/sad_sky.css', 'themes/simplekawaii.css', 'themes/sonokai.css',
    'themes/solarized.css', 'themes/squircly.css', 'themes/tokyodark.css',
    'themes/tokyonight.css', 'themes/vampire.css', 'themes/victory_oled.css',
    'themes/whattheactual.css'
  ];
  const FALLBACK_ASSETS = [
    'assets/Staffcontrib.png', 'assets/Helper.png', 'assets/Vim.png',
    'assets/Cutepotato.png', 'assets/whiteboxbadgeidkwhy.png',
    'assets/Hefeelsverysigma.png', 'assets/CERTIFIEDCHUD.png',
    'assets/yppIcon.png', 'assets/yapjsbadge.png'
  ];

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
  function persist() {
    try {
      localStorage.setItem(cachekey, JSON.stringify({
        text: store.text,
        assets: store.assets,
        manifest: store.manifest,
        etag: store.etag
      }));
    } catch (e) {}
  }
  async function fetchManifest() {
    try {
      const r = await fetch(rawbase + 'manifest.json' + '?t=' + Date.now());
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  async function gettree() {
    const manifest = await fetchManifest();
    if (manifest && typeof manifest === 'object' && Object.keys(manifest).length > 0) {
      store.manifest = manifest;
      return Object.keys(manifest).map((path) => ({ path, sha: manifest[path] || '' }));
    }
    const files = [...FALLBACK_PLUGINS, ...FALLBACK_THEMES, ...FALLBACK_ASSETS];
    return files.map((path) => ({ path, sha: '' }));
  }

  async function fetchfile(entry) {
    const tries = [
      () => fetch(rawbase + entry.path + '?t=' + Date.now()),
      () => fetch(rawbase + entry.path),
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
    const key = entry.sha || entry.path;
    // Cache hit — no network needed at all (bypasses rate limits completely for unchanged files)
    if (store.text[key] !== undefined) return store.text[key];
    const r = await fetchfile(entry);
    const text = await r.text();
    store.text[key] = text;
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
    const key = entry.sha || entry.path;
    if (store.assets[key]) return store.assets[key];
    const r = await fetchfile(entry);
    const blob = await r.blob();
    const url = await todataurl(new Blob([blob], { type: mimefor(entry.path) }));
    store.assets[key] = url;
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
  async function doUpdate() {
    const manifest = await fetchManifest();
    if (!manifest || typeof manifest !== 'object' || Object.keys(manifest).length === 0) {
      return { success: false, error: 'could not fetch manifest from github' };
    }
    const relevant = Object.keys(manifest).filter((p) =>
      /^(plugins\/[^\/]+\.js|themes\/[^\/]+\.css|assets\/[^/]+\.(png|jpg|jpeg|gif|webp|svg|ico))$/i.test(p)
    );
    let updated = 0;
    const failed = [];

    for (const path of relevant) {
      const sha = manifest[path] || '';
      const key = sha || path;
      const alreadyHas = store.text[key] !== undefined || store.assets[key] !== undefined;
      if (alreadyHas && store.manifest[path] === sha) continue; // unchanged, skip entirely

      try {
        if (path.endsWith('.js') || path.endsWith('.css')) {
          const entry = { path, sha };
          const text = await gettext(entry);
          store.text[key] = text;
          store.manifest[path] = sha;
          updated++;
        } else if (assetpattern.test(path)) {
          const entry = { path, sha };
          const url = await getasset(entry);
          store.assets[key] = url;
          store.manifest[path] = sha;
          updated++;
        }
      } catch (e) {
        failed.push(path);
      }
    }
    for (const path of Object.keys(store.manifest)) {
      if (!(path in manifest)) {
        delete store.manifest[path];
        const sha = store.manifest[path];
        if (sha) { delete store.text[sha]; delete store.assets[sha]; }
      }
    }

    persist();
    return { success: true, count: updated, failed };
  }

  try {
    window.__yapplusteardowns = [];
    window.__yapplusunload = () => {
      unload();
      note(`awww, sad to see you go! unless you're unloading to update!`, false);
    };

    const saved = readsaved();
    if (!store.tree && saved.tree) {
    }
    Object.keys(saved.text || {}).forEach((key) => {
      if (!(key in store.text)) store.text[key] = saved.text[key];
    });
    Object.keys(saved.assets || {}).forEach((key) => {
      if (!(key in store.assets)) store.assets[key] = saved.assets[key];
    });
    Object.keys(saved.manifest || {}).forEach((key) => {
      if (!(key in store.manifest)) store.manifest[key] = saved.manifest[key];
    });
    if (saved.etag) store.etag = saved.etag;

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
    persist();

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
        update: async () => doUpdate(),
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
