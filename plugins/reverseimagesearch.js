const imagesearch = {
    id: 'imagesearch',
    name: 'ImageSearch',
    description: 'Find out if your E-girl is REALLY a girl.. (Credits to @shizu)',
    ENGINES: [
      { name: 'Google Lens', make: function (u) { return 'https://lens.google.com/uploadbyurl?url=' + encodeURIComponent(u); } },
      { name: 'SauceNAO',    make: function (u) { return 'https://saucenao.com/search.php?url=' + encodeURIComponent(u); } },
      { name: 'IQDB',        make: function (u) { return 'https://iqdb.org/?url=' + encodeURIComponent(u); } },
      { name: 'Trace.moe',   make: function (u) { return 'https://trace.moe/?url=' + encodeURIComponent(u); } },
      { name: 'Yandex',      make: function (u) { return 'https://yandex.com/images/search?rpt=imageview&url=' + encodeURIComponent(u); } },
      { name: 'Bing',        make: function (u) { return 'https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:' + encodeURIComponent(u); } },
      { name: 'TinEye',      make: function (u) { return 'https://www.tineye.com/search?url=' + encodeURIComponent(u); } },
    ],
    menu: null,
    cssEl: null,
    start() {
      if (this._onContext) return;
      this.injectCss();
      this._onContext = (e) => this.handleContext(e);
      this._onGlobalDown = (e) => this.handleGlobalDown(e);
      this._onKey = (e) => this.handleKey(e);
      this._onClose = () => this.closeMenu();
      document.addEventListener('contextmenu', this._onContext, true);
      document.addEventListener('mousedown', this._onGlobalDown, true);
      document.addEventListener('keydown', this._onKey, true);
      window.addEventListener('resize', this._onClose, true);
      window.addEventListener('scroll', this._onClose, true);
      console.log('[ImageSearch] armed');
    },

    stop() {
      if (this._onContext) {
        document.removeEventListener('contextmenu', this._onContext, true);
        document.removeEventListener('mousedown', this._onGlobalDown, true);
        document.removeEventListener('keydown', this._onKey, true);
        window.removeEventListener('resize', this._onClose, true);
        window.removeEventListener('scroll', this._onClose, true);
        this._onContext = this._onGlobalDown = this._onKey = this._onClose = null;
      }
      if (this.cssEl) { this.cssEl.remove(); this.cssEl = null; }
      this.closeMenu();
      console.log('[ImageSearch] disarmed');
    },

    injectCss() {
      if (this.cssEl || document.getElementById('ypp-rs-css')) return;
      const css = document.createElement('style');
      css.id = 'ypp-rs-css';
      css.textContent = `
        .ypp-rs-menu {
          position: fixed; z-index: 2147483646;
          min-width: 210px; max-width: 320px;
          background: #1e1f22; border: 1px solid #3f4147; border-radius: 10px;
          box-shadow: 0 12px 32px rgba(0,0,0,.6);
          padding: 8px; color: #dbdee1;
          font: 13px/1.4 "Segoe UI", system-ui, sans-serif;
        }
        .ypp-rs-title { font-weight: 700; color: #e27ed3; padding: 4px 8px 8px; }
        .ypp-rs-thumb { display: flex; justify-content: center; margin-bottom: 6px; }
        .ypp-rs-thumb img { max-width: 180px; max-height: 120px; border-radius: 6px; object-fit: contain; }
        .ypp-rs-list { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
        .ypp-rs-item {
          display: block; width: 100%; text-align: left;
          background: transparent; border: none; border-radius: 6px;
          color: #dbdee1; padding: 7px 9px; cursor: pointer; font-size: 13px;
        }
        .ypp-rs-item:hover { background: #e27ed3; color: #fff; }
        .ypp-rs-sep { height: 1px; background: #2b2d31; margin: 6px 4px; }
      `;
      (document.head || document.documentElement).appendChild(css);
      this.cssEl = css;
    },

    handleContext(e) {
      const url = this.imageUrlFrom(e);
      if (!url) return;
      e.preventDefault();
      e.stopPropagation();
      this.openMenu(e.clientX, e.clientY, url);
    },

    imageUrlFrom(e) {
      const t = e.target;
      if (!t) return null;
      let img = null;
      if (t.matches && t.matches('img')) img = t;
      else if (t.closest) img = t.closest('img');
      if (img) {
        const cls = img.getAttribute('class') || '';
        if (cls.indexOf('emoji') !== -1) return null;
        const s = img.currentSrc || img.getAttribute('src') || img.src || '';
        return (s && s.indexOf('data:') !== 0) ? s : null;
      }
      return null;
    },

    openMenu(x, y, url) {
      this.closeMenu();
      const menu = document.createElement('div');
      menu.className = 'ypp-rs-menu';
      menu.innerHTML =
        '<div class="ypp-rs-title">Reverse Image Search</div>' +
        '<div class="ypp-rs-thumb"><img alt="" src="' + this.escapeAttr(url) + '"></div>' +
        '<div class="ypp-rs-list">' +
          this.ENGINES.map(function (en) {
            return '<button type="button" class="ypp-rs-item" data-engine="' + en.name + '">' + en.name + '</button>';
          }).join('') +
        '</div>' +
        '<div class="ypp-rs-sep"></div>' +
        '<button type="button" class="ypp-rs-item" data-action="open">Open image in new tab</button>' +
        '<button type="button" class="ypp-rs-item" data-action="copy">Copy image URL</button>';

      menu.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('.ypp-rs-item') : null;
        if (!btn) return;
        const engineName = btn.getAttribute('data-engine');
        const action = btn.getAttribute('data-action');
        if (engineName) {
          const en = this.ENGINES.find(function (x) { return x.name === engineName; });
          if (en) window.open(en.make(url), '_blank', 'noopener');
        } else if (action === 'open') {
          window.open(url, '_blank', 'noopener');
        } else if (action === 'copy') {
          this.copyText(url);
        }
        this.closeMenu();
      });

      document.body.appendChild(menu);

      const rect = menu.getBoundingClientRect();
      let px = x, py = y;
      if (x + rect.width > window.innerWidth - 8) px = window.innerWidth - rect.width - 8;
      if (y + rect.height > window.innerHeight - 8) py = window.innerHeight - rect.height - 8;
      if (px < 8) px = 8;
      if (py < 8) py = 8;
      menu.style.left = px + 'px';
      menu.style.top = py + 'px';

      this.menu = menu;
    },

    handleGlobalDown(e) {
      if (this.menu && !this.menu.contains(e.target)) this.closeMenu();
    },

    handleKey(e) {
      if (e.key === 'Escape') this.closeMenu();
    },

    closeMenu() {
      if (this.menu) { this.menu.remove(); this.menu = null; }
    },

    copyText(text) {
      const done = () => this.toast('Image URL copied');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => this.fallbackCopy(text, done));
      } else {
        this.fallbackCopy(text, done);
      }
    },

    fallbackCopy(text, done) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch (err) {}
      ta.remove();
      if (done) done();
    },
    toast(msg) {
      const t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e1f22;border:1px solid #e27ed3;color:#dbdee1;padding:8px 14px;border-radius:8px;font-size:13px;z-index:2147483647;box-shadow:0 8px 24px rgba(0,0,0,.5);';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2000);
    },
    escapeAttr(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    },
};

PluginHost.register(imagesearch);
