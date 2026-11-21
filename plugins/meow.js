if (!window.__meowInstalled) {
  window.__meowInstalled = true;
  window.PluginHost.register({
    id: 'meow',
    name: 'Meow',
    description: 'M-meowww~',
    start() {
      window.PluginHost.addFetchTransformer('meow', function(content) {
        let c = content;
        if (Math.random() < 0.5) {
          c = c.replace(/r/g, 'w').replace(/R/g, 'W').replace(/l/g, 'w').replace(/L/g, 'W');
        }
        const t = Math.random() < 0.75 ? '~' : '~~';
        return c.replace(/\s+$/, '') + t;
      });
    },
    stop() {
      window.PluginHost.removeFetchTransformer('meow');
    }
  });
}
