(function () {
  if (window.__yapplusmenuinstalled) return;
  window.__yapplusmenuinstalled = true;
  const navid = 'yapplus-nav-button';
  const navsettingsid = 'yapplus-nav-settings-button';
  const navthemesid = 'yapplus-nav-themes-button';
  const navcustomid = 'yapplus-nav-custom-button';
  const panelid = 'yapplus-panel';
  const settingspanelid = 'yapplus-plugin-settings-panel';
  const themespanelid = 'yapplus-themes-panel';
  const custompanelid = 'yapplus-custom-plugins-panel';
  const devkey = 'yapplus.devmode';
  const customkey = 'yapplus.customplugins';

  const customset = new Set();
  const customruns = new Map();
  let customnavbtn = null;

  const style = document.createElement('style');
  style.textContent = `
    #${navid}, #${navsettingsid}, #${navthemesid}, #${navcustomid} { display: flex; align-items: center; gap: 8px; color: #e27ed3; }
    #${navid} svg, #${navsettingsid} svg, #${navthemesid} svg, #${navcustomid} svg { width: 18px; height: 18px; }
    #${panelid}, #${settingspanelid}, #${themespanelid}, #${custompanelid} { padding: 28px 40px; color: #dbdee1; line-height: 1.5; }
    #${panelid} h2, #${settingspanelid} h2, #${themespanelid} h2, #${custompanelid} h2 { margin: 0 0 18px; font-size: 20px; color: #fff; }
    #${panelid} a, #${settingspanelid} a, #${themespanelid} a, #${custompanelid} a { color: #e27ed3; text-decoration: none; }
    #${panelid} a:hover, #${settingspanelid} a:hover, #${themespanelid} a:hover, #${custompanelid} a:hover { text-decoration: underline; }
    .yp-section { margin-bottom: 24px; }
    .yp-section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #b5bac1; margin: 0 0 10px; }
    .yp-switch { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
    .yp-switch input { opacity: 0; width: 0; height: 0; }
    .yp-slider { position: absolute; inset: 0; background: #4e5058; border-radius: 22px; transition: background .15s; cursor: pointer; }
    .yp-slider::before { content: ""; position: absolute; width: 16px; height: 16px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform .15s; }
    .yp-switch input:checked + .yp-slider { background: #e27ed3; }
    .yp-switch input:checked + .yp-slider::before { transform: translateX(18px); }
    .yp-plugin-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2b2d31; }
    .yp-plugin-row:last-child { border-bottom: none; }
    .yp-plugin-name { font-weight: 600; color: #fff; }
    .yp-plugin-desc { font-size: 12px; color: #949ba4; margin-top: 2px; }
    .yp-row-actions { display: flex; align-items: center; gap: 12px; }
    .yp-btn { background: #e27ed3; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; }
    .yp-btn:disabled { background: #4e5058; cursor: default; }
    .yp-btn-gray { background: #4e5058; }
    .yp-btn-danger { background: #ff4b4b; }
    .yp-code { width: 100%; background: #1e1f22; border: 1px solid #3f4147; border-radius: 6px; color: #dbdee1; padding: 8px 10px; font-size: 13px; font-family: monospace; outline: none; box-sizing: border-box; resize: vertical; line-height: 1.5; }
    .yp-input { width: 100%; background: #1e1f22; border: 1px solid #3f4147; border-radius: 6px; color: #dbdee1; padding: 8px 10px; font-size: 14px; outline: none; box-sizing: border-box; }
    .yp-type-tag { display: inline-flex; align-items: center; gap: 5px; background: #2b2d31; border: 1px solid #3f4147; border-radius: 6px; padding: 4px 8px; font-size: 12px; color: #dbdee1; margin: 3px; }
    .yp-type-tag button { background: none; border: none; color: #949ba4; cursor: pointer; font-size: 14px; line-height: 1; padding: 0; display: flex; align-items: center; }
    .yp-type-tag button:hover { color: #ff4b4b; }
    .yp-tags-wrap { display: flex; flex-wrap: wrap; margin-bottom: 8px; min-height: 32px; }
    .yp-search-wrap { position: relative; margin-bottom: 20px; }
    .yp-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #949ba4; }
    .yp-search-wrap input { padding-left: 36px; }
    .yp-theme-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2b2d31; }
    .yp-theme-info { display: flex; align-items: center; gap: 12px; }
    .yp-theme-icon { color: #949ba4; display: flex; }
    .yp-theme-icon svg { width: 20px; height: 20px; }
    .yp-theme-name { font-weight: 600; color: #fff; text-transform: capitalize; }
  `;
  document.head.appendChild(style);

  const SVGS = {
    plugins: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 5 3-3"/><path d="m2 22 3-3"/><path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/><path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"/></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 17H5"/><path d="M19 7h-9"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>`,
    theme: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 10 3 3"/><path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z"/><path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>`,
    palette: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/></svg>`,
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
  };

  function isdev() {
    try { return localStorage.getItem(devkey) === '1'; } catch (e) { return false; }
  }

  function setdev(on) {
    try { localStorage.setItem(devkey, on ? '1' : '0'); } catch (e) {}
  }

  function readcustom() {
    try {
      const raw = JSON.parse(localStorage.getItem(customkey) || '[]');
      return Array.isArray(raw) ? raw.filter((item) => item && typeof item.key === 'string' && typeof item.code === 'string') : [];
    } catch (e) {
      return [];
    }
  }

  function writecustom(list) {
    try {
      localStorage.setItem(customkey, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function reloadpage() {
    location.reload();
  }

  function updatecustomnav() {
    if (customnavbtn) customnavbtn.style.display = isdev() ? 'flex' : 'none';
  }

  function runsource(code, label) {
    let failure = null;
    function onerror(ev) {
      if (!failure) failure = ev.error || new Error(ev.message);
    }
    window.addEventListener('error', onerror);
    try {
      const script = document.createElement('script');
      script.textContent = code + '\n//# sourceURL=yapplus-custom-' + label + '.js';
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    } finally {
      window.removeEventListener('error', onerror);
    }
    if (failure) throw failure;
  }

  function loadentry(entry, enable) {
    const host = window.PluginHost;
    if (!host || typeof host.all !== 'function' || typeof host.register !== 'function') {
      throw new Error('PluginHost API is unavailable.');
    }
    const before = new Set(host.all());
    runsource(entry.code, entry.key);
    const added = host.all().filter((plugin) => !before.has(plugin));
    if (!added.length) {
      throw new Error('no plugin was registered. your code needs to call window.PluginHost.register(...)');
    }
    added.forEach((plugin) => customset.add(plugin));
    customruns.set(entry.key, added);
    if (enable && typeof host.setEnabled === 'function' && typeof host.isEnabled === 'function') {
      added.forEach((plugin) => {
        if (!host.isEnabled(plugin)) host.setEnabled(plugin, true);
      });
    }
    return added;
  }

  function loadsaved() {
    readcustom().forEach((entry) => {
      if (customruns.has(entry.key)) return;
      try {
        loadentry(entry, false);
      } catch (e) {
        console.error('[Yap++ Custom Plugins] ' + entry.key + ' failed to load', e);
      }
    });
  }

  function deleteentry(key) {
    const host = window.PluginHost;
    const plugins = customruns.get(key) || [];
    plugins.forEach((plugin) => {
      try {
        if (host.isEnabled(plugin)) host.setEnabled(plugin, false);
      } catch (e) {}
      ['unregister', 'remove', 'unload'].forEach((name) => {
        if (typeof host[name] === 'function') {
          try { host[name](plugin); } catch (e) {}
        }
      });
    });
    customruns.delete(key);
    writecustom(readcustom().filter((entry) => entry.key !== key));
  }
  function buildpanel() {
    const p = document.createElement('div');
    p.id = panelid;
    p.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1>Yap++</h1>
          <h2>The <b>Cutest</b> Client mod for yapper</h2>
        </div>
      </div>
      <hr><p></p>
      <div class="yp-section">
        <h3>Plugins</h3>
        <div id="yapplus-plugin-list"></div>
      </div>
      <hr>
      <div class="yp-section">
        <h3>About</h3>
        <p>Thank you for using Yap++</p>
        <p>Yapper: <b>salami</b></p>
        <p>YouTube: <a href="https://www.youtube.com/@sedesuu" target="_blank">@sedesuu</a></p>
        <p>Discord: <a href="https://discord.com/users/1384802116106719384" target="_blank">.salamidev</a></p>
        <p>Thank you to our biggest helper and Co-Owner too;</p>
        <p>I'm ofcourse talking about the goat @Lemon</p>
        <hr><p></p>
        <div class="yp-section">
          <h3>Ethics</h3>
          <p>Yap++ Does <b>not</b> Save, Distribute, Or maliciously use your login tokens/login information. We want @Antic to notice and support us!</p>
        </div>
      </div>
    `;
    const list = p.querySelector('#yapplus-plugin-list');
    function render() {
      list.innerHTML = '';
      window.PluginHost.all().forEach(plugin => {
        if (customset.has(plugin)) return;
        const row = document.createElement('div');
        row.className = 'yp-plugin-row';
        const info = document.createElement('div');
        info.innerHTML = `<div class="yp-plugin-name">${plugin.name}</div><div class="yp-plugin-desc">${plugin.description || ''}</div>`;
        const label = document.createElement('label');
        label.className = 'yp-switch';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = window.PluginHost.isEnabled(plugin);
        const slider = document.createElement('span');
        slider.className = 'yp-slider';
        label.appendChild(input);
        label.appendChild(slider);
        input.addEventListener('change', () => { window.PluginHost.setEnabled(plugin, input.checked); });
        row.appendChild(info);
        row.appendChild(label);
        list.appendChild(row);
      });
    }
    render();
    window.PluginHost.onChange(render);

    return p;
  }
  function builddevsection() {
    const section = document.createElement('div');
    section.className = 'yp-section';
    section.innerHTML = `
      <h3>Developer Mode</h3>
      <p style="font-size:12px;color:#949ba4;margin:0 0 10px;">Lets you paste your own plugins. They run with full access to the page, so only add code you wrote or fully trust.</p>
      <div class="yp-plugin-row">
        <div>
          <div class="yp-plugin-name">Developer mode</div>
          <div class="yp-plugin-desc">Shows the customplugin box and the Custom Plugins tab.</div>
        </div>
        <label class="yp-switch">
          <input type="checkbox" id="yp-dev-switch">
          <span class="yp-slider"></span>
        </label>
      </div>
      <div id="yp-dev-box" style="display:none;margin-top:14px;">
        <p style="font-size:12px;color:#949ba4;margin:0 0 6px;">customplugin</p>
        <textarea id="yp-dev-code" class="yp-code" rows="12" spellcheck="false" placeholder="window.PluginHost.register({ id: '676767', name: 'testing', description: 'hi this is my very cool plugin (credits: @skibidilarp)', start() {}, stop() {} });"></textarea>
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px;">
          <button id="yp-dev-add" class="yp-btn">Add plugin</button>
          <button id="yp-dev-reload" class="yp-btn yp-btn-gray">Reload</button>
          <span id="yp-dev-status" style="font-size:13px;color:#949ba4;"></span>
        </div>
      </div>
    `;
    const devswitch = section.querySelector('#yp-dev-switch');
    const box = section.querySelector('#yp-dev-box');
    const codeinput = section.querySelector('#yp-dev-code');
    const addbtn = section.querySelector('#yp-dev-add');
    const reloadbtn = section.querySelector('#yp-dev-reload');
    const status = section.querySelector('#yp-dev-status');
    function setstatus(text, color) {
      status.textContent = text;
      status.style.color = color || '#949ba4';
    }
    devswitch.checked = isdev();
    box.style.display = isdev() ? 'block' : 'none';
    devswitch.addEventListener('change', () => {
      if (devswitch.checked && !confirm('Developer mode lets you run UNNOFICIAL plugins that COULD be malicious with full access to your account and messages inside Yappin. Only paste code you wrote or fully trust. Turn it on? PLEASE do not paste random plugins from random people in here.')) {
        devswitch.checked = false;
        return;
      }
      setdev(devswitch.checked);
      box.style.display = devswitch.checked ? 'block' : 'none';
      updatecustomnav();
      if (devswitch.checked) {
        loadsaved();
        setstatus('', '#949ba4');
      } else {
        setstatus('Custom plugins load after you reloads', '#949ba4');
      }
    });
    addbtn.addEventListener('click', () => {
      const code = codeinput.value;
      if (!code.trim()) {
        setstatus('Paste your plugin first;', '#ff4b4b');
        return;
      }
      const entry = { key: 'cp' + Date.now().toString(36), code: code };
      try {
        try {
          new Function(code);
        } catch (e) {
          if (e instanceof SyntaxError) throw e;
        }
        const added = loadentry(entry, true);
        const saved = readcustom();
        saved.push(entry);
        const names = added.map((plugin) => plugin.name || plugin.id).join(', ');
        if (writecustom(saved)) {
          setstatus('Added ' + names + '. Glad to have you making their own plugins on yap++!', '#00ff00');
        } else {
          setstatus('hm.. thats strange. ' + names + ', couldnt get added for some reason.. Are you sure the plugin code even works?', '#ff4b4b');
        }
        codeinput.value = '';
      } catch (e) {
        setstatus('Some additional info, this might be the reason why your plugin couldnt load: ' + (e && e.message ? e.message : e), '#ff4b4b');
      }
    });

    reloadbtn.addEventListener('click', reloadpage);

    return section;
  }
  function buildsettingspanel() {
    const p = document.createElement('div');
    p.id = settingspanelid;
    p.innerHTML = `
      <h1>Plugin Settings</h1>
      <h2>Settings for yap++ plugins</h2>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <button id="yp-update-btn" style="background: #e27ed3; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: background 0.2s;">
          Look for updates >,>
        </button>
        <span id="yp-update-status" style="font-size: 13px; color: #949ba4;"></span>
      </div>
      <hr><p></p>
    `;
    const updateBtn = p.querySelector('#yp-update-btn');
    const updateStatus = p.querySelector('#yp-update-status');
    updateBtn.addEventListener('click', async () => {
      updateBtn.disabled = true;
      updateBtn.style.background = '#4e5058';
      updateStatus.textContent = 'Checking for updates, hold on tight.';
      updateStatus.style.color = '#e27ed3';

      try {
        const result = await window.electronAPI.update();

        if (result.success) {
          if (result.count > 0) {
            updateStatus.textContent = `Updated ${result.count} file(s)! You MUST restart the app to apply changes.`;
            updateStatus.style.color = '#00ff00';
            
            updateBtn.textContent = "Restart App";
            updateBtn.style.background = '#ff4b4b';
            updateBtn.disabled = false;
            
            updateBtn.onclick = () => { 
                window.electronAPI.restartApp(); 
            };
          } else {
            updateStatus.textContent = 'Everything is already up to date!';
            updateStatus.style.color = '#949ba4';
            updateBtn.disabled = false;
            updateBtn.style.background = '#e27ed3';
          }
        } else {
          updateStatus.textContent = `Error: ${result.error}`;
          updateStatus.style.color = '#ff4b4b';
          updateBtn.disabled = false;
          updateBtn.style.background = '#e27ed3';
        }
      } catch (e) {
        updateStatus.textContent = 'IPC connection failed.';
        updateStatus.style.color = '#ff4b4b';
        updateBtn.disabled = false;
        updateBtn.style.background = '#e27ed3';
      }
    });

    const aesection = document.createElement('div');
    aesection.className = 'yp-section';
    aesection.innerHTML = `
      <h3>Auto Edit</h3>
      <p style="font-size:12px;color:#949ba4;margin:0 0 8px;">Type the command and it get's autoreplaced!!!</p>
      <input id="yapplus-ae-cmd" type="text" placeholder="/command" autocomplete="off" class="yp-input" style="margin-bottom:8px;">
      <input id="yapplus-ae-text" type="text" placeholder="text" autocomplete="off" class="yp-input">
    `;
    p.appendChild(aesection);
    const aecmd = aesection.querySelector('#yapplus-ae-cmd');
    const aetext = aesection.querySelector('#yapplus-ae-text');
    try { aecmd.value = localStorage.getItem('yapplus.autoedit.cmd') || ''; aetext.value = localStorage.getItem('yapplus.autoedit.text') || ''; } catch (e) {}
    aecmd.addEventListener('input', () => { try { localStorage.setItem('yapplus.autoedit.cmd', aecmd.value); } catch (e) {} });
    aetext.addEventListener('input', () => { try { localStorage.setItem('yapplus.autoedit.text', aetext.value); } catch (e) {} });

    const alltypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'text/plain'];
    const fdsection = document.createElement('div');
    fdsection.className = 'yp-section';
    fdsection.innerHTML = `
      <h3>Filename Disguiser</h3>
      <p style="font-size:12px;color:#949ba4;margin:0 0 10px;">Choose which file extensions get randomized on upload.</p>
      <div class="yp-tags-wrap" id="ypp-fd-tags"></div>
      <div style="display:flex;gap:8px;margin-bottom:6px;">
        <input id="ypp-fd-custom" type="text" placeholder="example: image/bmp" autocomplete="off" style="flex:1;background:#1e1f22;border:1px solid #3f4147;border-radius:6px;color:#dbdee1;padding:6px 10px;font-size:13px;outline:none;">
        <button id="ypp-fd-add" style="background:#e27ed3;border:none;border-radius:6px;color:#fff;padding:6px 14px;font-size:13px;font-weight:600;cursor:pointer;">Add type</button>
      </div>
    `;
    p.appendChild(fdsection);
    const tagswrap = fdsection.querySelector('#ypp-fd-tags');
    const custominput = fdsection.querySelector('#ypp-fd-custom');
    const addbtn = fdsection.querySelector('#ypp-fd-add');
    function gettypes() { return window.filenamedisguiser ? window.filenamedisguiser.getEnabledTypes() : []; }
    function savetypes(arr) { if (window.filenamedisguiser) window.filenamedisguiser.setEnabledTypes(arr); }
    function rendertags() {
      tagswrap.innerHTML = '';
      const enabled = gettypes();
      const allknown = alltypes.concat(enabled.filter(t => !alltypes.includes(t)));
      allknown.forEach(type => {
        const on = enabled.includes(type);
        const tag = document.createElement('span');
        tag.className = 'yp-type-tag';
        tag.style.borderColor = on ? '#e27ed3' : '#3f4147';
        tag.style.color = on ? '#e27ed3' : '#949ba4';
        tag.style.cursor = 'pointer';
        tag.textContent = type;
        tag.addEventListener('click', () => {
          const cur = gettypes();
          savetypes(cur.includes(type) ? cur.filter(t => t !== type) : cur.concat([type]));
          rendertags();
        });
        tagswrap.appendChild(tag);
      });
    }
    rendertags();
    addbtn.addEventListener('click', () => {
      const v = custominput.value.trim().toLowerCase();
      if (!v || !v.includes('/')) return;
      const cur = gettypes();
      if (!cur.includes(v)) savetypes(cur.concat([v]));
      custominput.value = '';
      rendertags();
    });

    const cbsection = document.createElement('div');
    cbsection.className = 'yp-section';
    cbsection.innerHTML = `
      <h3>Custom Background</h3>
      <p style="font-size:12px;color:#949ba4;margin:0 0 8px;">Paste a direct image link and pick opacity.</p>
      <input id="ypp-bg-url" type="text" placeholder="https://example.com/image.png" autocomplete="off" class="yp-input" style="margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-size:12px;color:#949ba4;">Opacity</span>
        <input id="ypp-bg-opacity" type="range" min="0" max="100" step="1" style="flex:1;">
        <span id="ypp-bg-opacity-val" style="font-size:12px;color:#e27ed3;width:42px;text-align:right;">50%</span>
      </div>
      <p style="font-size:12px;color:#949ba4;margin:0 0 6px;">Custom CSS theme</p>
      <textarea id="ypp-bg-themecss" rows="8" placeholder=".msg-author { color: hotpink !important; }" style="width:100%;background:#1e1f22;border:1px solid #3f4147;border-radius:6px;color:#dbdee1;padding:8px 10px;font-size:13px;font-family:monospace;outline:none;box-sizing:border-box;resize:vertical;line-height:1.5;"></textarea>
    `;
    p.appendChild(cbsection);
    const urlinput = cbsection.querySelector('#ypp-bg-url');
    const opinput = cbsection.querySelector('#ypp-bg-opacity');
    const opval = cbsection.querySelector('#ypp-bg-opacity-val');
    const cssinput = cbsection.querySelector('#ypp-bg-themecss');
    if (window.custombackground) {
      urlinput.value = window.custombackground.getUrl();
      opinput.value = String(Math.round(window.custombackground.getOpacity() * 100));
      opval.textContent = opinput.value + '%';
      cssinput.value = window.custombackground.getThemeCss();
      urlinput.addEventListener('input', () => window.custombackground.setUrl(urlinput.value));
      opinput.addEventListener('input', () => {
        window.custombackground.setOpacity(parseInt(opinput.value, 10) / 100);
        opval.textContent = opinput.value + '%';
      });
      cssinput.addEventListener('input', () => window.custombackground.setThemeCss(cssinput.value));
    }

    p.appendChild(builddevsection());

    return p;
  }

  function buildcustompanel() {
    const p = document.createElement('div');
    p.id = custompanelid;
    p.innerHTML = `
      <h1>Custom Plugins</h1>
      <h2>Plugins you added in developer mode</h2>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <button id="yp-custom-reload" class="yp-btn">Reload</button>
        <span style="font-size: 13px; color: #949ba4;">Reload to fully remove deleted plugins.</span>
      </div>
      <hr><p></p>
      <div class="yp-section">
        <div id="yp-custom-list"></div>
      </div>
    `;

    p.querySelector('#yp-custom-reload').addEventListener('click', reloadpage);

    const list = p.querySelector('#yp-custom-list');
    function render() {
      list.textContent = '';
      const entries = readcustom();
      if (!entries.length) {
        const empty = document.createElement('div');
        empty.style.cssText = 'color:#949ba4; font-size:13px; text-align:center; padding:20px;';
        empty.textContent = 'No custom plugins yet. Add one from Yap++ Settings, at the bottom.';
        list.appendChild(empty);
        return;
      }
      entries.forEach((entry) => {
        const plugins = customruns.get(entry.key) || [];
        const row = document.createElement('div');
        row.className = 'yp-plugin-row';

        const info = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'yp-plugin-name';
        name.textContent = plugins.length ? plugins.map((plugin) => plugin.name || plugin.id).join(', ') : 'Failed to load';
        const desc = document.createElement('div');
        desc.className = 'yp-plugin-desc';
        desc.textContent = plugins.length ? (plugins[0].description || '') : 'Check the console for the error, or delete it.';
        info.appendChild(name);
        info.appendChild(desc);

        const actions = document.createElement('div');
        actions.className = 'yp-row-actions';

        if (plugins.length) {
          const label = document.createElement('label');
          label.className = 'yp-switch';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.checked = plugins.every((plugin) => window.PluginHost.isEnabled(plugin));
          const slider = document.createElement('span');
          slider.className = 'yp-slider';
          label.appendChild(input);
          label.appendChild(slider);
          input.addEventListener('change', () => {
            plugins.forEach((plugin) => window.PluginHost.setEnabled(plugin, input.checked));
          });
          actions.appendChild(label);
        }

        const del = document.createElement('button');
        del.className = 'yp-btn yp-btn-danger';
        del.textContent = 'Delete';
        del.addEventListener('click', () => {
          deleteentry(entry.key);
          render();
        });
        actions.appendChild(del);

        row.appendChild(info);
        row.appendChild(actions);
        list.appendChild(row);
      });
    }
    render();
    window.PluginHost.onChange(() => { if (list.isConnected) render(); });

    return p;
  }

  function buildthemespanel() {
    const p = document.createElement('div');
    p.id = themespanelid;
    p.innerHTML = `
      <h1>Themes</h1>
      <h2>Customize your Yapper experience</h2>
      <hr><p></p>
      <div class="yp-search-wrap">
        ${SVGS.search}
        <input type="text" id="yp-theme-search" class="yp-input" placeholder="Search themes...">
      </div>
      <div id="yp-theme-list" class="yp-section"></div>
    `;

    const searchInput = p.querySelector('#yp-theme-search');
    const listContainer = p.querySelector('#yp-theme-list');

    let themeStyleEl = document.getElementById('yapplus-active-theme');
    if (!themeStyleEl) {
      themeStyleEl = document.createElement('style');
      themeStyleEl.id = 'yapplus-active-theme';
      document.head.appendChild(themeStyleEl);
    }

    let availableThemes = {};
    
    async function loadThemes() {
      try {
        if (window.electronAPI && window.electronAPI.getThemes) {
          availableThemes = await window.electronAPI.getThemes();
        } else {
          availableThemes = { "placeholder.css": "/* Example CSS */" };
        }
      } catch(e) {}
      renderThemes();
    }

    function renderThemes(filter = '') {
      listContainer.innerHTML = '';
      const activeTheme = localStorage.getItem('yapplus.activeTheme') || '';
      const lowerFilter = filter.toLowerCase();
      
      let hasThemes = false;
      Object.keys(availableThemes).sort().forEach(filename => {
        if (!filename.endsWith('.css')) return;
        const name = filename.replace('.css', '');
        
        if (lowerFilter && !name.toLowerCase().includes(lowerFilter)) return;
        hasThemes = true;

        const isActive = activeTheme === filename;
        
        const row = document.createElement('div');
        row.className = 'yp-theme-row';
        
        const info = document.createElement('div');
        info.className = 'yp-theme-info';
        info.innerHTML = `
          <div class="yp-theme-icon">${SVGS.palette}</div>
          <div class="yp-theme-name">${name}</div>
        `;
        
        const label = document.createElement('label');
        label.className = 'yp-switch';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = isActive;
        
        const slider = document.createElement('span');
        slider.className = 'yp-slider';
        
        input.addEventListener('change', () => {
          if (input.checked) {
            listContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
              if (cb !== input) cb.checked = false;
            });
            applyTheme(filename);
          } else {
            applyTheme(null);
          }
        });
        
        label.appendChild(input);
        label.appendChild(slider);
        row.appendChild(info);
        row.appendChild(label);
        listContainer.appendChild(row);
      });

      if (!hasThemes) {
        listContainer.innerHTML = '<div style="color:#949ba4; font-size:13px; text-align:center; padding:20px;">No themes found.</div>';
      }
    }

    function applyTheme(filename) {
      if (!filename) {
        localStorage.removeItem('yapplus.activeTheme');
        themeStyleEl.textContent = '';
        renderThemes(searchInput.value);
        return;
      }
      
      localStorage.setItem('yapplus.activeTheme', filename);
      themeStyleEl.textContent = availableThemes[filename] || '';
      renderThemes(searchInput.value);
    }

    const saved = localStorage.getItem('yapplus.activeTheme');
    if (saved && availableThemes[saved]) {
      themeStyleEl.textContent = availableThemes[saved];
    }

    searchInput.addEventListener('input', (e) => renderThemes(e.target.value));
    loadThemes();

    return p;
  }

  function safebuild(builder, target) {
    try {
      target.appendChild(builder());
    } catch (err) {
      const msg = document.createElement('div');
      msg.style.cssText = 'padding:28px 40px;color:#ff4b4b;';
      msg.textContent = 'Well shit, error code 67 (Panel failed to load). post this in the bug repport channel please.';
      target.appendChild(msg);
    }
  }

  let currentMode = null;

  function inject() {
    if (document.getElementById(navid)) return;
    const nav = document.querySelector('.settings-nav');
    const main = document.querySelector('.settings-main');
    if (!nav || !main) return;

    const observer = new MutationObserver(() => {
      if (currentMode === 'settings' && !document.getElementById(settingspanelid) && main.innerHTML === '') {
        safebuild(buildsettingspanel, main);
      } else if (currentMode === 'plugins' && !document.getElementById(panelid) && main.innerHTML === '') {
        safebuild(buildpanel, main);
      } else if (currentMode === 'themes' && !document.getElementById(themespanelid) && main.innerHTML === '') {
        safebuild(buildthemespanel, main);
      } else if (currentMode === 'custom' && !document.getElementById(custompanelid) && main.innerHTML === '') {
        safebuild(buildcustompanel, main);
      }
    });
    observer.observe(main, { childList: true });

    const btn = document.createElement('button');
    btn.id = navid;
    btn.innerHTML = `${SVGS.plugins} <span>Yap++ Plugins</span>`;
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      currentMode = 'plugins';
      nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      main.innerHTML = '';
      safebuild(buildpanel, main);
    });
    nav.appendChild(btn);

    const themesbtn = document.createElement('button');
    themesbtn.id = navthemesid;
    themesbtn.innerHTML = `${SVGS.theme} <span>Themes</span>`;
    themesbtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      currentMode = 'themes';
      nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      themesbtn.classList.add('active');
      main.innerHTML = '';
      safebuild(buildthemespanel, main);
    });
    nav.appendChild(themesbtn);

    const settingsbtn = document.createElement('button');
    settingsbtn.id = navsettingsid;
    settingsbtn.innerHTML = `${SVGS.settings} <span>Yap++ Settings</span>`;
    settingsbtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentMode = 'settings';
      nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      settingsbtn.classList.add('active');
      main.innerHTML = '';
      safebuild(buildsettingspanel, main);
    }, true);
    nav.appendChild(settingsbtn);

    const custombtn = document.createElement('button');
    custombtn.id = navcustomid;
    custombtn.innerHTML = `${SVGS.code} <span>Custom Plugins</span>`;
    custombtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentMode = 'custom';
      nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      custombtn.classList.add('active');
      main.innerHTML = '';
      safebuild(buildcustompanel, main);
    }, true);
    nav.appendChild(custombtn);
    customnavbtn = custombtn;
    updatecustomnav();

    nav.addEventListener('pointerdown', (e) => {
      const ours = [btn, settingsbtn, themesbtn, custombtn];
      if (!ours.some((b) => e.target === b || b.contains(e.target))) {
        currentMode = null;
      }
    });
  }
  setTimeout(() => {
    if (isdev() && window.PluginHost) loadsaved();
  }, 0);
  new MutationObserver(inject).observe(document.body, { childList: true, subtree: true });
  inject();
})();