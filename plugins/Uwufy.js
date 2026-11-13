window.PluginHost.register({
  id: 'uwufy',
  name: 'Uwufy',
  description: 'Awe you just a wittwe siwwy? This pwugin is for you!',
  origFetch: null,
  start() {
    if (this.origFetch) return;
    this.origFetch = window.fetch;
    const origFetch = this.origFetch;
    const actions = ['*BLUSHES*', '*SMIRKS*', '*tears*'];
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const isInsert = url.indexOf('/rest/v1/messages') !== -1 && init && init.method === 'POST';
      if (isInsert && init.body) {
        try {
          const body = JSON.parse(init.body);
          if (typeof body.content === 'string') {
            let content = body.content.replace(/l/g, 'w').replace(/L/g, 'W').replace(/r/g, 'w').replace(/R/g, 'W');
            let words = content.split(' ');
            let newWords = [];
            for (let i = 0; i < words.length; i++) {
              newWords.push(words[i]);
              if (i < words.length - 1 && Math.random() < 0.25) {
                newWords.push(actions[Math.floor(Math.random() * actions.length)]);
              }
            }
            body.content = newWords.join(' ');
            init.body = JSON.stringify(body);
          }
        } catch (e) {}
      }
      return origFetch.call(this, input, init);
    };
  },
  stop() {
    if (this.origFetch) {
      window.fetch = this.origFetch;
      this.origFetch = null;
    }
  }
});