if (!window.__gyaruInstalled) {
  window.__gyaruInstalled = true;
  const emojis = ['💖','💅','✨','😭','🎀','💗','🌸'];
  let lastEmoji = null;
  function pick() {
    let e;
    do { e = emojis[Math.floor(Math.random() * emojis.length)]; } while (e === lastEmoji);
    lastEmoji = e;
    return e;
  }
  window.PluginHost.register({
    id: 'gyaru',
    name: 'Gyaru',
    description: 'Makes you very very slayy (just puts girlie emojis inbetween your messages)',
    start() {
      window.PluginHost.addFetchTransformer('gyaru', function(content) {
        const words = content.trim().split(/\s+/).filter(Boolean);
        if (!words.length) return content;
        const parts = [];
        for (let i = 0; i < words.length; i++) {
          parts.push(pick());
          parts.push(words[i]);
        }
        parts.push(pick());
        return parts.join(' ');
      });
    },
    stop() {
      window.PluginHost.removeFetchTransformer('gyaru');
    }
  });
}
