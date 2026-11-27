const charactercounter = {
  id: 'charactercounter',
  name: 'Character Counter',
  description: 'Ripped straight from vencord. It shows the amount of characters you have typed in.',
  el: null,
  timer: null,
  last: -1,
  findbox() {
    return document.querySelector('.composer-box') || document.querySelector('.composer');
  },
  findinput() {
    return document.querySelector('.composer textarea, .composer-box textarea, textarea.msg-input');
  },
  makeel() {
    const el = document.createElement('div');
    el.id = 'yapplus-charcounter';
    el.style.cssText = 'position:fixed;z-index:50;pointer-events:none;font-size:12px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums;color:#23a55a;text-shadow:0 1px 2px rgba(0,0,0,.6);display:none;right:40px;bottom:10px;';
    document.body.appendChild(el);
    return el;
  },
  colorfor(n) {
    if (n >= 1000) return '#ff4b4b';
    if (n >= 500) return '#f0b232';
    return '#23a55a';
  },
  tick() { // 10fps basically what i get when i try to run minecraft
    if (!this.el || !this.el.isConnected) this.el = this.makeel();
    const box = this.findbox();
    const input = this.findinput();
    if (!box || !input) {
      this.el.style.display = 'none';
      return;
    }
    if (document.getElementById('yapplus-panel') ||
        document.getElementById('yapplus-themes-panel') ||
        document.getElementById('yapplus-settings-panel') ||
        document.getElementById('yapplus-about-panel') ||
        document.getElementById('yapplus-custom-plugins-panel')) {
      this.el.style.display = 'none';
      return;
    }
    const n = input.value.length;
    if (n !== this.last) {
      this.el.textContent = String(n);
      this.el.style.color = this.colorfor(n);
      this.last = n;
    }
    this.el.style.display = 'block';
    const rect = box.getBoundingClientRect();
    this.el.style.right = Math.max(0, window.innerWidth - rect.right) + 'px';
    this.el.style.bottom = Math.max(0, window.innerHeight - rect.top + 15) + 'px';
  },
  start() {
    if (this.timer) return;
    const self = this;
    this.last = -1;
    this.timer = setInterval(function () { self.tick(); }, 100);
  },
  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.el) { this.el.remove(); this.el = null; }
    this.last = -1;
  },
};

window.PluginHost.register(charactercounter);