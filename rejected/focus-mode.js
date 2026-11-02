// Contributed by @LordWarpix, 78e1b7f6-7e15-42fb-9537-d9cf5dc48933

// rejected. Why R you using window.primitive instead of window.yapplus.primitive???? 
// and the name is both "Focus mode" and "Primitive" sob

const primitive = {
  id: 'primitive',
  name: 'Primitive',
  description: 'Toggle a minimal interface.',
  cssEl: null,
  active: false,
  start() {
    this.injectCss();
  },
  stop() {
    this.active = false;
    document.documentElement.classList.remove('ypp-primitive-active');

    if (this.cssEl) {
      this.cssEl.remove();
      this.cssEl = null;
    }
  },

  toggle() {
    this.active = !this.active;
    document.documentElement.classList.toggle(
      'ypp-primitive-active',
      this.active
    );
  },

  injectCss() {
    if (this.cssEl || document.getElementById('ypp-primitive-css')) return;

    const style = document.createElement('style');
    style.id = 'ypp-primitive-css';
    style.textContent = `
      html.ypp-primitive-active nav.rail,
      html.ypp-primitive-active aside.sidebar,
      html.ypp-primitive-active .user-bar,
      html.ypp-primitive-active .main-head {
        display: none !important;
      }

      html.ypp-primitive-active main.main {
        width: 100% !important;
        max-width: 900px !important;
        margin: 0 auto !important;
      }

      html.ypp-primitive-active .chat-wrap,
      html.ypp-primitive-active .chat,
      html.ypp-primitive-active .messages,
      html.ypp-primitive-active .messages-inner {
        background: transparent !important;
      }

      #ypp-primitive-toggle {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 99999;
        padding: 8px 12px;
        border: 0;
        border-radius: 8px;
        background: #5865f2;
        color: white;
        cursor: pointer;
        font: inherit;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
    this.cssEl = style;

    const button = document.createElement('button');
    button.id = 'ypp-primitive-toggle';
    button.textContent = 'Toggle Focus Mode'
    button.addEventListener('click', () => this.toggle());
    document.body.appendChild(button);
  },
};

window.primitive = primitive;
window.PluginHost.register(primitive);