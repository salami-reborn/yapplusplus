window.PluginHost.register({
  id: 'imnotadere',
  name: 'IMNOTADERE',
  description: `A-Adds H-HMNPH.. and s-stutters y-your w-words.. I-it's not like I wanted to make t-this plugin!! HMPH!`,
  origFetch: null,
  start() {
    if (this.origFetch) return;
    this.origFetch = window.fetch;
    const origFetch = this.origFetch;
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const isInsert = url.indexOf('/rest/v1/messages') !== -1 && init && init.method === 'POST';
      if (isInsert && init.body) {
        try {
          const body = JSON.parse(init.body);
          if (typeof body.content === 'string') {
            let words = body.content.split(' ');
            for (let i = 0; i < words.length; i++) {
              if (words[i].length > 0 && Math.random() < 0.5) {
                words[i] = words[i][0] + '-' + words[i];
              }
            }
            body.content = 'H-HMNPH.. ' + words.join(' ');
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