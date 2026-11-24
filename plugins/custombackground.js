const custombackground = {
    id: 'custombackground',
    name: 'Custom Background',
    description: 'Set a custom background!!! (Credits: @shizu)',

    cssEl: null,
    themeEl: null,
    observer: null,
    _memUrl: '',
    getUrl() {
      try {
        const u = localStorage.getItem('yapplus.bg.url');
        if (u) {
          this._memUrl = u;
          return u;
        }
        if (this._memUrl) {
          localStorage.setItem('yapplus.bg.url', this._memUrl);
          return this._memUrl;
        }
      } catch (e) {}
      return this._memUrl || '';
    },
    setUrl(v) {
      this._memUrl = v;
      try {
        localStorage.setItem('yapplus.bg.url', v);
        sessionStorage.setItem('yapplus.bg.url', v);
      } catch (e) {}
      this.apply();
    },
    getOpacity() {
      const v = parseFloat(localStorage.getItem('yapplus.bg.opacity'));
      if (isNaN(v)) return 0.5;
      return Math.min(1, Math.max(0, v));
    },
    setOpacity(v) {
      try { localStorage.setItem('yapplus.bg.opacity', String(v)); } catch (e) {}
      this.apply();
    },
    getThemeCss() {
      try { return localStorage.getItem('yapplus.bg.themecss') || ''; } catch (e) { return ''; }
    },
    setThemeCss(v) {
      try { localStorage.setItem('yapplus.bg.themecss', v); } catch (e) {}
      this.applyTheme();
    },
    getServerId() {
      const active = document.querySelector('nav.rail .rail-item.active');
      if (!active) return null;
      const row = active.closest('[data-rail-row]');
      if (row && (row.dataset.railRow || row.dataset.railrow)) {
        return row.dataset.railRow || row.dataset.railrow;
      }
      return null;
    },
    getServerUrl(serverId) {
      if (!serverId) serverId = this.getServerId();
      if (!serverId) return '';
      try {
        return localStorage.getItem('yapplus.bg.server.' + serverId) || '';
      } catch (e) {
        return '';
      }
    },
    setServerUrl(serverId, url) {
      if (!serverId) serverId = this.getServerId();
      if (!serverId) return;
      try {
        if (url && url.trim()) {
          localStorage.setItem('yapplus.bg.server.' + serverId, url.trim());
        } else {
          localStorage.removeItem('yapplus.bg.server.' + serverId);
        }
      } catch (e) {}
      this.apply();
    },
    getActiveUrl() {
      const sId = this.getServerId();
      if (sId) {
        const sUrl = this.getServerUrl(sId);
        if (sUrl && sUrl.trim()) return sUrl.trim();
      }
      return this.getUrl().trim();
    },
    start() {
      try {
        const s = sessionStorage.getItem('yapplus.bg.url');
        if (s && !localStorage.getItem('yapplus.bg.url')) {
          localStorage.setItem('yapplus.bg.url', s);
        }
      } catch (e) {}
      this.injectCss();
      this.apply();
      this.applyTheme();
      if (!this.observer) {
        const self = this;
        let lastServer = self.getServerId();
        this.observer = new MutationObserver(function() {
          const currentServer = self.getServerId();
          if (currentServer !== lastServer) {
            lastServer = currentServer;
            self.apply();
          }
        });
        this.observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      }
    },
    stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      if (this.cssEl) { this.cssEl.remove(); this.cssEl = null; }
      if (this.themeEl) { this.themeEl.remove(); this.themeEl = null; }
      document.documentElement.classList.remove('ypp-bg-active');
      const root = document.documentElement.style;
      root.removeProperty('--ypp-bg-image');
      root.removeProperty('--ypp-bg-overlay');
    },
    injectCss() {
      if (this.cssEl || document.getElementById('ypp-bg-css')) return;
      const css = document.createElement('style');
      css.id = 'ypp-bg-css';
      css.textContent = `
        :root {
          --ypp-bg-image: none;
          --ypp-bg-overlay: transparent;
        }
        html.ypp-bg-active body::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -9999;
          background-image: linear-gradient(var(--ypp-bg-overlay), var(--ypp-bg-overlay)), var(--ypp-bg-image);
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          background-attachment: fixed !important;
          pointer-events: none;
        }
        html.ypp-bg-active,
        html.ypp-bg-active body,
        html.ypp-bg-active .app {
          background-color: transparent !important;
        }
        html.ypp-bg-active nav.rail,
        html.ypp-bg-active aside.sidebar,
        html.ypp-bg-active aside.side-panel,
        html.ypp-bg-active main.main,
        html.ypp-bg-active .chat-wrap,
        html.ypp-bg-active .chat,
        html.ypp-bg-active .messages,
        html.ypp-bg-active .messages-inner,
        html.ypp-bg-active .main-head {
          background-color: transparent !important;
          background-image: none !important;
        }
        html.ypp-bg-active .user-bar {
          background-color: #141519 !important;
          background-image: none !important;
        }
        html.ypp-bg-active .composer-box,
        html.ypp-bg-active .invite-embed {
          background-color: #1e1f22 !important;
          background-image: none !important;
        }
        html.ypp-bg-active .overlay {
          background-color: rgba(0, 0, 0, 0.6) !important; 
          backdrop-filter: blur(2px) !important;
        }
        html.ypp-bg-active .modal,
        html.ypp-bg-active .settings,
        html.ypp-bg-active .settings-nav,
        html.ypp-bg-active .settings-main,
        html.ypp-bg-active [role="dialog"],
        html.ypp-bg-active [role="menu"],
        html.ypp-bg-active .popout,
        html.ypp-bg-active .profile-card {
          background-color: #141519 !important;
          background-image: none !important;
        }
        html.ypp-bg-active .settings-main .input,
        html.ypp-bg-active .settings-main .btn.ghost {
          background-color: #1e1f22 !important;
        }
      `;
      (document.head || document.documentElement).appendChild(css);
      this.cssEl = css;
    },

    applyTheme() {
      if (!this.themeEl) {
        this.themeEl = document.createElement('style');
        this.themeEl.id = 'ypp-custom-theme-css';
        (document.head || document.documentElement).appendChild(this.themeEl);
      }
      this.themeEl.textContent = this.getThemeCss();
    },

    apply() {
      const url = this.getActiveUrl();
      const op = this.getOpacity();
      const alpha = Math.max(0, Math.min(1, 1 - op));
      const overlay = 'rgba(20, 21, 25, ' + alpha.toFixed(3) + ')';
      const root = document.documentElement;
      if (url) {
        root.style.setProperty('--ypp-bg-image', 'url("' + url.replace(/"/g, '\\"') + '")');
        root.style.setProperty('--ypp-bg-overlay', overlay);
        root.classList.add('ypp-bg-active');
      } else {
        root.classList.remove('ypp-bg-active');
        root.style.setProperty('--ypp-bg-image', 'none');
        root.style.setProperty('--ypp-bg-overlay', 'transparent');
      }
    }
};

window.custombackground = custombackground;
window.PluginHost.register(custombackground);
