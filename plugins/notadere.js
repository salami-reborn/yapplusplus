if (!window._imnotadereStarted) window._imnotadereStarted = false;

window.PluginHost.register({
  id: 'imnotadere',
  name: 'IMNOTADERE',
  description: `A-Adds H-HMNPH.. and s-stutters y-your w-words.. I-it's not like I wanted to make t-this plugin!! HMPH!`,
  start() {
    if (window._imnotadereStarted) return;
    window._imnotadereStarted = true;
    window.PluginHost.addFetchTransformer('imnotadere', function(content) {
      if (content.startsWith('H-HMNPH.. ')) {
        content = content.slice('H-HMNPH.. '.length);
      }
      let words = content.trim().split(/\s+/).filter(Boolean);
      if (!words.length) return content;
      const parts = [];
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const first = word.charAt(0);
        if (first === ':' || first === ';' || first === '%' || /[0-9]/.test(first)) {
          parts.push(word);
        } else if (first.match(/[A-Za-z]/)) {
          parts.push(first + '-' + word);
        } else {
          parts.push(word);
        }
      }
      return 'H-HMNPH.. ' + parts.join(' ');
    });
  },
  stop() {
    window._imnotadereStarted = false;
    window.PluginHost.removeFetchTransformer('imnotadere');
  }
});
