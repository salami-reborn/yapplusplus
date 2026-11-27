(function () {
  if (window.__yapplusyapmodplugin) return;
  window.__yapplusyapmodplugin = true;
  const bundlekey = 'yapplus.yapmod.bundle';
  const namekey = 'yapplus.yapmod.filename';
  const statuskey = 'yapplus.yapmod.status';
  const statuscolorkey = 'yapplus.yapmod.statuscolor';
  let runtime = Promise.resolve();
  let runtoken = 0;

  function queue(action) {
    runtime = runtime.catch(() => {}).then(action).catch((error) => {
      console.error('[Yap++ Yapmod] Client integration failed', error);
    });
  }

  function api(name) {
    return window.electronAPI && typeof window.electronAPI[name] === 'function'
      ? window.electronAPI[name]
      : null;
  }

  function setstatus(message, color) {
    try { localStorage.setItem(statuskey, message); } catch (e) {}
    try { localStorage.setItem(statuscolorkey, color || '#949ba4'); } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('yapplus-yapmod-status', { detail: { message, color } }));
    } catch (e) {}
  }

  function storerelease(release) {
    if (!release || typeof release.source !== 'string' || !release.source.trim()) {
      throw new Error('The Yapmod Client release is invalid.');
    }
    try { localStorage.setItem(bundlekey, release.source); } catch (e) {
      throw new Error('Could not save the Yapmod Client bundle.');
    }
    if (typeof release.filename === 'string' && typeof release.tag === 'string') {
      try { localStorage.setItem(namekey, `${release.filename} (${release.tag})`); } catch (e) {}
    }
    return release.source;
  }

  async function fetchbundle() {
    const fetchrelease = api('fetchYapmodRelease');
    if (!fetchrelease) throw new Error('Yapmod release fetching is unavailable.');
    return storerelease(await fetchrelease());
  }

  const plugin = {
    id: 'yapmod-client',
    name: 'Yapmod Client',
    description: 'Run the imported Yapmod Client bundle from Yap++ Settings.',
    async start() {
      const token = ++runtoken;
      const run = api('runYapmodClient');
      if (!run) {
        setstatus('Yapmod cannot run: the Yap++ preload is not available.', '#ff4b4b');
        console.warn('[Yap++ Yapmod] electronAPI.runYapmodClient is unavailable; Yapmod cannot run.');
        return;
      }
      try {
        let source = null;
        try { source = localStorage.getItem(bundlekey); } catch (e) {}
        if (!source || !source.trim()) {
          // Enabling from the plugin list (or a fresh profile) has no bundle yet.
          if (token !== runtoken) return;
          setstatus('Fetching the latest GitHub release...');
          source = await fetchbundle();
        }
        if (token !== runtoken) return;
        await run(source);
        setstatus(`Running ${localStorage.getItem(namekey) || 'Yapmod Client'}.`, '#57f287');
      } catch (error) {
        if (token !== runtoken) return;
        console.error('[Yap++ Yapmod] Could not start the Yapmod Client', error);
        setstatus(error && error.message ? error.message : 'Could not start the Yapmod Client.', '#ff4b4b');
        if (window.PluginHost && typeof window.PluginHost.setEnabled === 'function') {
          window.PluginHost.setEnabled(plugin, false);
        }
      }
    },
    stop() {
      runtoken++;
      const stop = api('stopYapmodClient');
      if (!stop) return;
      queue(() => stop());
    }
  };

  window.PluginHost.register(plugin);
})();
