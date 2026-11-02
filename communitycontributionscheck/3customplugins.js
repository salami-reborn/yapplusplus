// Contributed by @LordWarpix, 78e1b7f6-7e15-42fb-9537-d9cf5dc48933

// rejected. safety issue. please include a warning.

(function () {
  if (window.__yappluspluginuploaderinstalled) return;
  window.__yappluspluginuploaderinstalled = true;
  function addUploadButton() {
    const list = document.querySelector('#yapplus-plugin-list');
    if (!list || document.getElementById('yapplus-upload-plugin-btn')) return;
    const button = document.createElement('button');
    button.id = 'yapplus-upload-plugin-btn';
    button.textContent = 'Upload plugin';
    button.style.cssText = `
      margin: 12px 0;
      padding: 8px 14px;
      background: #e27ed3;
      color: white;
      border: 0;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    `;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,text/javascript,application/javascript';
    input.hidden = true;

    button.addEventListener('click', () => input.click());

    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;

      button.disabled = true;
      button.textContent = 'Loading plugin..';
      try {
        if (!window.PluginHost ||
            typeof window.PluginHost.register !== 'function' ||
            typeof window.PluginHost.all !== 'function') {
          throw new Error('PluginHost API is unavailable.');
        }
        const previousPlugins = new Set(window.PluginHost.all());
        const source = await file.text();
        const script = document.createElement('script');
        script.textContent = `${source}\n//# sourceURL=${file.name.replace(/[\r\n]/g, '')}`;
        (document.head || document.documentElement).appendChild(script);
        script.remove();

        const registered = window.PluginHost.all().find(plugin =>
          !previousPlugins.has(plugin)
        );

        if (!registered) {
          throw new Error(
            'The plugin is likely broken. please ask for a working one.'
          );
        }

        if (typeof window.PluginHost.setEnabled === 'function') {
          window.PluginHost.setEnabled(registered, true);
        }

        button.textContent = `Loaded: ${registered.name || registered.id}`;
        button.disabled = false;
        if (typeof window.PluginHost.onChange === 'function') {
          window.PluginHost.onChange(() => {});
        }
      } catch (error) {
        console.error('[Yap++ Plugin Uploader]', error);
        button.textContent = `Upload failed: ${error.message}`;
        button.disabled = false;
      }
    });

    list.before(button, input);
  }

  const observer = new MutationObserver(addUploadButton);
  observer.observe(document.body, { childList: true, subtree: true });
  addUploadButton();
})();