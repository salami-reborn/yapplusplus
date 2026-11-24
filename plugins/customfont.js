(function () {
  const fontKey = 'yapplus.customfont.family';
  const customfont = {
    id: 'customfont',
    name: 'Custom Font',
    description: 'Choose your own font!',
    styleEl: null,
    getFont() {
      try {
        return localStorage.getItem(fontKey) || 'inherit';
      } catch (e) {
        return 'inherit';
      }
    },
    setFont(f) {
      try {
        localStorage.setItem(fontKey, f);
      } catch (e) {}
      this.apply();
    },
    apply() {
      const f = this.getFont();
      if (!this.styleEl) {
        this.styleEl = document.createElement('style');
        this.styleEl.id = 'yp-custom-font-style';
        document.head.appendChild(this.styleEl);
      }
      if (f && f !== 'inherit') {
        this.styleEl.textContent = '* { font-family: ' + f + ', sans-serif !important; }';
      } else {
        this.styleEl.textContent = '';
      }
    },
    start() {
      this.apply();
    },
    stop() {
      if (this.styleEl) {
        this.styleEl.remove();
        this.styleEl = null;
      }
    }
  };

  window.customfont = customfont;
  if (window.PluginHost) {
    window.PluginHost.register(customfont);
  }
})();
