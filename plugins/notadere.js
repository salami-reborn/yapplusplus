if (!window.__imnotadereInstalled) {
  window.__imnotadereInstalled = true;
  window.PluginHost.register({
    id: 'imnotadere',
    name: 'IMNOTADERE',
    description: `A-Adds H-HMNPH.. and s-stutters y-your w-words.. I-it's not like I wanted to make t-this plugin!! HMPH!`,
    start() {
      window.PluginHost.addFetchTransformer('imnotadere', function(content) {
        const words = content.trim().split(/\s+/).filter(Boolean);
        if (!words.length) return content;
        const parts = [];
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const first = word.charAt(0);
          if (first === ':' || first === ';' || first === '%' || /[0-9]/.test(first)) {
            parts.push(word);
          } else if (first.match(/[A-Za-z]/)) {
            parts.push(first + '- ' + word);
          } else {
            parts.push(word);
          }
        }
        return parts.join(' ');
      });
    },
    stop() {
      window.PluginHost.removeFetchTransformer('imnotadere');
    }
  });
}
