// to contributors/plugindevs
// You're at the right place, This is the barebones version of yap++, Where you can test if your plugin works.
// make sure to go to line 70 to read the rest

(function () {
  window.YapPlus = window.YapPlus || {};
  const host = window.YapPlus.PluginHost || {};
  host.plugins = host.plugins || [];
  host.listeners = host.listeners || [];
  const running = new Set();
  const storagekey = (plugin) => 'yapplus.plugin.' + plugin.id;
  host.isEnabled = function (plugin) {
    try { return localStorage.getItem(storagekey(plugin)) === '1'; } catch (e) { return false; }
  };

  function begin(plugin) {
    if (running.has(plugin.id)) return;
    running.add(plugin.id);
    try { plugin.start(); } catch (e) { console.error('[Yap++ barebones] start failed', plugin.id, e); }
  }

  function end(plugin) {
    if (!running.has(plugin.id)) return;
    running.delete(plugin.id);
    try { plugin.stop(); } catch (e) { console.error('[Yap++ barebones] stop failed', plugin.id, e); }
  }




  function notify(plugin) {
    host.listeners.forEach(function (fn) {
      try { fn(plugin); } catch (e) { console.error('[Yap++ barebones] listener failed', e); }
    });
  }
  function remember(plugin, on) {
    try { localStorage.setItem(storagekey(plugin), on ? '1' : '0'); } catch (e) {}
  }
  host.plugins.forEach(function (plugin) {
    if (host.isEnabled(plugin)) running.add(plugin.id);
  });


  host.register = function (plugin, enable) {
    const at = host.plugins.findIndex(function (p) { return p.id === plugin.id; });
    if (at !== -1) {
      end(host.plugins[at]);
      host.plugins[at] = plugin;
    } else {
      host.plugins.push(plugin);
    }
    if (enable) remember(plugin, true);
    if (host.isEnabled(plugin)) begin(plugin);
    notify(plugin);
  };



  host.setEnabled = function (plugin, on) {
    remember(plugin, on);
    if (on) begin(plugin); else end(plugin);
    notify(plugin);
  };
  host.all = function () { return host.plugins.slice(); };
  host.onChange = function (fn) { host.listeners.push(fn); };
  window.YapPlus.PluginHost = host;
  window.PluginHost = host;
})();

// TO CONTRIBUTORS:
// paste your plugin function here, make sure to also include the "window.PluginHost.register(name, <boolean;enabledbydefault>)"

// just replace this freaky ass example plugin with yours and paste it in the console inside the yapper website

const skibiditoilet = {
  id: 'skibidi',
  name: 'sixsevenlord',
  description: 'What sixsevenlord does',
  start() {
    // example: say skibidi 67 ohio rizzler
  },
  stop() {
  },
};

window.PluginHost.register(skibiditoilet, true);