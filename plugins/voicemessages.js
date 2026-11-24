// please do not use this plugin to catfish people.

const customvoice = {
  id: 'customvoice',
  name: 'Custom voice messages',
  description: 'Send an audio file as a voice message!! please do not use this for you know what.',
  origgum: null,
  armed: null,
  btn: null,
  input: null,
  timer: null,
  toast(msg, bad) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e1f22;border:1px solid ' + (bad ? '#ff4b4b' : '#e27ed3') + ';color:#dbdee1;padding:8px 14px;border-radius:8px;font-size:13px;z-index:2147483647;box-shadow:0 8px 24px rgba(0,0,0,.5);max-width:360px;';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  },
  findrec() {
    return document.querySelector('button[aria-label="Record a voice message"]');
  },
  makeinput() {
    const self = this;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp3,.ogg,.wav,audio/mpeg,audio/ogg,audio/wav,audio/x-wav';
    input.style.display = 'none';
    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      input.value = '';
      if (file) self.arm(file);
    });
    document.body.appendChild(input);
    return input;
  },
  makebtn() {
    const self = this;
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.setAttribute('aria-label', 'Send an audio file as a voice message');
    btn.title = 'Send an audio file as a voice message';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!self.input || !self.input.isConnected) self.input = self.makeinput();
      self.input.click();
    });
    return btn;
  },
  ensurebtn() {
    const rec = this.findrec();
    if (!rec || !rec.parentNode) {
      if (this.btn) { this.btn.remove(); this.btn = null; }
      return;
    }
    if (this.btn && this.btn.isConnected && this.btn.nextSibling === rec) return;
    if (!this.btn) this.btn = this.makebtn();
    rec.parentNode.insertBefore(this.btn, rec);
  },
  arm(file) {
    this.armed = file;
    const rec = this.findrec();
    if (rec) {
      this.toast('Sending ' + file.name + ' as a voice message');
      rec.click();
    } else {
      this.toast('Armed ' + file.name + '. Click the voice message button now.');
    }
  },
  async makestream() {
    const file = this.armed;
    this.armed = null;
    try {
      const ctx = new AudioContext();
      await ctx.resume();
      const data = await file.arrayBuffer();
      const buf = await ctx.decodeAudioData(data);
      const dest = ctx.createMediaStreamDestination();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(dest);
      const stream = dest.stream;
      src.onended = function () {
        setTimeout(function () {
          stream.getTracks().forEach(function (t) { t.stop(); });
          ctx.close();
        }, 400);
      };
      src.start(ctx.currentTime + 0.4);
      return stream;
    } catch (e) {
      this.toast('Could not read that audio file', true);
      throw e;
    }
  },
  start() {
    if (this.timer) return;
    const self = this;
    const md = navigator.mediaDevices;
    if (md && !this.origgum) {
      this.origgum = md.getUserMedia;
      md.getUserMedia = function (constraints) {
        if (self.armed && constraints && constraints.audio && !constraints.video) {
          return self.makestream();
        }
        return self.origgum.call(md, constraints);
      };
    }
    this.timer = setInterval(function () { self.ensurebtn(); }, 800);
    this.ensurebtn();
    console.log('[CustomVoice] armed');
  },
  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.origgum && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = this.origgum;
      this.origgum = null;
    }
    if (this.btn) { this.btn.remove(); this.btn = null; }
    if (this.input) { this.input.remove(); this.input = null; }
    this.armed = null;
    console.log('[CustomVoice] disarmed');
  },
};

window.PluginHost.register(customvoice);
