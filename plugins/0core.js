window.YapPlus = window.YapPlus || {};
window.YapPlus.PluginHost = {
  plugins: [],
  listeners: [],
  fetchTransformers: [],
  _fetchPatched: false,
  register(plugin) {
    this.plugins.push(plugin);
    if (localStorage.getItem(`yapplus.plugin.${plugin.id}`) === '1') {
      try { plugin.start(); } catch (e) { console.error('[Libyapcore] E> P.H, P>', plugin.id, e); }
    }
    this.listeners.forEach(fn => fn(plugin));
  },
  addFetchTransformer(id, fn) {
    this.fetchTransformers.push({ id: id, fn: fn });
    if (!this._fetchPatched) {
      this._fetchPatched = true;
      const origFetch = window.fetch;
      window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        const isInsert = url.indexOf('/rest/v1/messages') !== -1 && init && init.method === 'POST';
        if (isInsert && init.body) {
          try {
            const body = JSON.parse(init.body);
            if (typeof body.content === 'string') {
              for (let i = 0; i < window.YapPlus.PluginHost.fetchTransformers.length; i++) {
                const t = window.YapPlus.PluginHost.fetchTransformers[i];
                if (localStorage.getItem('yapplus.plugin.' + t.id) === '1') {
                  const result = t.fn(body.content);
                  if (typeof result === 'string') {
                    body.content = result;
                  }
                }
              }
              init.body = JSON.stringify(body);
            }
          } catch (e) {}
        }
        return origFetch.call(this, input, init);
      };
    }
  },
  removeFetchTransformer(id) {
    this.fetchTransformers = this.fetchTransformers.filter(function(t) {
      return t.id !== id;
    });
  },
  isEnabled(plugin) {
    return localStorage.getItem(`yapplus.plugin.${plugin.id}`) === '1';
  },
  setEnabled(plugin, on) {
    localStorage.setItem(`yapplus.plugin.${plugin.id}`, on ? '1' : '0');
    try {
      if (on) plugin.start(); else plugin.stop();
    } catch (e) { console.error('Yap++ toggle failed', plugin.id, e); }
    this.listeners.forEach(fn => fn(plugin));
  },
  all() { return this.plugins.slice(); },
  onChange(fn) { this.listeners.push(fn); }
};
window.PluginHost = window.YapPlus.PluginHost;
