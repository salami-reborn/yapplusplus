(function () {
  if (window.__yapplusyapmodplugin) return;
  window.__yapplusyapmodplugin = true;
  const bundlekey = 'yapplus.yapmod.bundle';
  let runtime = Promise.resolve();

  function queue(action) {
    runtime = runtime.catch(() => {}).then(action).catch((error) => {
      console.error('[Yap++ Yapmod] Client integration failed', error);
    });
  }

  window.PluginHost.register({
    id: 'yapmod-client',
    name: 'Yapmod Client',
    description: 'Run the imported Yapmod Client bundle from Yap++ Settings.',
    start() {
      const source = localStorage.getItem(bundlekey);
      if (!source || !window.electronAPI || typeof window.electronAPI.runYapmodClient !== 'function') return;
      queue(() => window.electronAPI.runYapmodClient(source));
    },
    stop() {
      if (!window.electronAPI || typeof window.electronAPI.stopYapmodClient !== 'function') return;
      queue(() => window.electronAPI.stopYapmodClient());
    }
  });
})();