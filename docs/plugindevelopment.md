# Plugin development for Yap++
### After this guide, You will be a pro in developing plugins for yap++


Things you __might__ need to know:

[![Langandlibs](https://skillicons.dev/icons?i=js,electron&perline=6)](https://skillicons.dev)

> [!NOTE]  
> Please read the yappin' TOS before making plugins. Simple rules that you 100% should know are:
> * Don't make selfbots
> * Don't make privacy-invading software
> * Don't patch the client itself.
> * No spam related tools

<hr>

Plugin class variables:

| Variable | Usage |
| --- | --- |
| `id` | Must be an unique name that has no uppercase letters.  |
| `name` | The thing that's actually shown in the plugin menu. |
| `description` | What your plugin does, like: `Puts 67 after every single one of your messages (credits @67kid)`. |
| `start()` | Whenever the plugin suddenly switches to on. which also happens when you load yap++. |
| `stop()` | optional extra things whe your plugin is turned off. |

### Plugin development global variables
These make plugin development a lot easier.
| Variable | Usage |
| --- | --- |
| `window.requesttoken` | The user's token.  |
| `window.userid` | The user's userid |
| `window.username` | The user's username |
| `window.smexypic` | Their smexy profile picture (joke) |

<hr>

### Chapter 1. Making your first plugin

We will first make a simple plugin that adds a certain message (so like it appends an extra message to your message)

```js
const hello = {
  id: 'helloplugin',
  name: 'Greeter',
  description: 'Greets everyone!!',
  origFetch: null,
  start() {
    if (!this.origFetch) this.origFetch = window.fetch;
    const origFetch = this.origFetch;

    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const isInsert = url.indexOf('/rest/v1/messages') !== -1
                    && init && init.method === 'POST';
      if (isInsert && init.body) {
        try {
          const body = JSON.parse(init.body);
          if (typeof body.content === 'string') {
            body.content = body.content + ', Hello!';
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
  },
};
```

Explanation:
* Info (id,name,description) are self explanatory.
* window.fetch = Listening-to/intercepting/making API requests
* `/rest/v1/messages`: The message API subdomain of ~~yapper~~ Yappin'


