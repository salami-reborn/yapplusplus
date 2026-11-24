(function () {
  const suffixes = [' nya~', ' :3', ' uwu', ' >w<', ' *blushes*'];
  const femboyoptions = {
    id: 'femboyoptions',
    name: 'Femboy Enhancements',
    description: `Nya~, :3, uwu, >w<`,
    start() {
      if (window.PluginHost && window.PluginHost.addFetchTransformer) {
        window.PluginHost.addFetchTransformer('femboyoptions', function (text) {
          if (!text || typeof text !== 'string') return text;
          if (text.startsWith('/') || text.indexOf('http:') === 0 || text.indexOf('https:') === 0) return text;
          const pick = suffixes[Math.floor(Math.random() * suffixes.length)];
          return text + pick;
        });
      }
    },
    stop() {
      if (window.PluginHost && window.PluginHost.removeFetchTransformer) {
        window.PluginHost.removeFetchTransformer('femboyoptions');
      }
    }
  };

  if (window.PluginHost) {
    window.PluginHost.register(femboyoptions);
  }
})();
