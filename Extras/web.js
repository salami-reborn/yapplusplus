(async () => {
  if (window.__yapplusweb) return;
  window.__yapplusweb = true;
  const rawbase = 'https://raw.githubusercontent.com/salami-reborn/yapplusplus/main/';
  const assetmap = {
    staff: 'Staffcontrib.png',
    helper: 'Helper.png',
    vim: 'Vim.png',
    potato: 'Cutepotato.png',
    whitebox: 'whiteboxbadgeidkwhy.png',
    sigma: 'Hefeelsverysigma.png',
    chud: 'CERTIFIEDCHUD.png',
    yppIcon: 'yppIcon.png',
    yapjsbadge: 'yapjsbadge.png'
  };
  const cache = {};




  function note(msg, bad) {
    try {
      const t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText =
        'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#1e1f22;border:1px solid ' +
        (bad ? '#ff4b4b' : '#e27ed3') +
        ';color:#dbdee1;padding:8px 14px;border-radius:8px;font:13px sans-serif;z-index:2147483647;max-width:90vw;';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 4000);
    } catch (e) {}
  }



  async function gettext(path) {
    const r = await fetch(rawbase + path);
    if (!r.ok) throw new Error(path + ' returned ' + r.status);
    return r.text();
  }
  function todataurl(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader(); // fr cuz we real fr
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }
  async function getasset(name) {
    try {
      const r = await fetch(rawbase + 'assets/' + name);
      if (!r.ok) {
        console.warn('[Yap++ web] asset ' + name + ' returned ' + r.status);
        return null;
      }
      return await todataurl(await r.blob());
    } catch (e) {
      console.warn('[Yap++ web] asset ' + name + ' failed', e);
      return null;
    }
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
      const s = document.createElement('script');
      s.textContent = code;
      document.documentElement.appendChild(s);
      s.remove();
    }
  }

  try {
    const tr = await fetch(
      'https://api.github.com/repos/salami-reborn/yapplusplus/git/trees/main?recursive=1'
    );
    if (!tr.ok) {
    }
    const tree = await tr.json();
    const paths = (tree.tree || []).filter((f) => f.type === 'blob').map((f) => f.path);
    const pluginpaths = paths.filter((p) => /^plugins\/[^\/]+\.js$/.test(p)).sort(byname);
    const themepaths = paths.filter((p) => /^themes\/[^\/]+\.css$/.test(p));
    const assets = {};
    const themes = {};
    const loaded = await Promise.all([
      Promise.all(
        Object.keys(assetmap).map(async (key) => {
          const file = assetmap[key];
          assets[key] = paths.indexOf('assets/' + file) !== -1 ? await getasset(file) : null;
          if (assets[key]) cache[file] = assets[key];
        })
      ),
      Promise.all(
        themepaths.map(async (p) => {
          try {
            themes[p.slice(7)] = await gettext(p);
          } catch (e) {}
        })
      ),
      Promise.all(pluginpaths.map((p) => gettext(p)))
    ]);
    const sources = loaded[2];
    if (!sources.length) throw new Error(`no plugins found, thats strange. you're probs rate limited for a few min by github.`);
    window.YapPlusAssets = assets;
    if (!window.electronAPI) {
      window.electronAPI = {
        getPlugins: async () => sources.join('\n'),
        getAsset: async (name) => cache[name] || (await getasset(name)),
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
      const saved = localStorage.getItem('yapplus.activeTheme');
      if (saved && themes[saved]) {
        let el = document.getElementById('yapplus-active-theme');
        if (!el) {
          el = document.createElement('style');
          el.id = 'yapplus-active-theme';
          document.head.appendChild(el);
        }
        el.textContent = themes[saved];
      }
    } catch (e) {}

    runcode(sources.join('\n'));
    note('Welcome to yap++ web!! You should have like (' + sources.length + ' plugins now)', false);
  } catch (e) {
    window.__yapplusweb = false;
    note('Yap++ web FAILED... ' + (e && e.message ? e.message : e), true);
  }
})();