// These are the developer variables mentioned in the docs.
// This is so that it's like 1000X easier to make plugins.
// The reason for why plugins that use your token like staffbadge don't use it, is because I made this like 25 updates after those plugins

// how to use:
// Make your very tuff plugin
// you can use: window.requesttoken (token), window.userid (your userid), window.username (your username), window.smexypic
// selfbot plugin contributions will get instantly rejected. i can see what yall are thinking.

(function () {
  if (window.__yg) return;
  window.__yg = 1;
  window.requesttoken = null;
  window.userid = null;
  window.username = null;
  window.smexypic = null;
  const dec = j => {
    try {
      const p = String(j).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(p + '='.repeat((4 - p.length % 4) % 4)));
    } catch (e) { return null; }
  };
  const findtok = () => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('sb-') && k.includes('-auth-token')) {
          let v = JSON.parse(localStorage.getItem(k));
          if (typeof v === 'string') v = JSON.parse(v);
          const t = v?.access_token || v?.currentSession?.access_token;
          if (t) return t;
        }
      }
    } catch (e) {}
    return null;
  };
  const toData = async src => {
    if (!src) return null;
    if (src.startsWith('data:')) return src;
    try {
      const r = await fetch(src);
      if (!r.ok) return src;
      const b = await r.blob();
      return await new Promise((res, rej) => {
        const f = new FileReader();
        f.onloadend = () => res(f.result);
        f.onerror = rej;
        f.readAsDataURL(b);
      });
    } catch (e) { return src; }
  };
  let hydrating = false;
  const hydrate = async () => {
    if (hydrating || !window.userid || !window.requesttoken) return;
    hydrating = true;
    try {
      const r = await fetch(`https://dnfkuqzddwvtdojzgmdm.supabase.co/rest/v1/profiles?id=eq.${window.userid}&select=*&limit=1`, { // (I tried using api.yapper.website, it didn't work because it's for facking BOTS and not users like stop complaining about this)
        headers: { apikey: window.__yapAnonKey || '', Authorization: `Bearer ${window.requesttoken}` }
      });
      if (!r.ok) return;
      const rows = await r.json();
      const p = Array.isArray(rows) ? rows[0] : rows;
      if (!p) return;
      window.username = p.username || p.display_name || p.name || p.handle || window.username;
      const av = p.avatar_url || p.avatar || p.profile_picture || p.pfp;
      if (av) window.smexypic = await toData(av);
    } catch (e) {} finally { hydrating = false; }
  };
  const remember = t => {
    if (!t) return;
    const c = dec(t);
    if (!c?.sub) return;
    window.requesttoken = t;
    window.userid = String(c.sub).toLowerCase();
    if (!window.username || !window.smexypic) hydrate();
  };
  const s = findtok();
  if (s) remember(s);
  const of = window.fetch;
  if (of && !of.__yg) {
    const pf = function (input, init) {
      try {
        const h = init?.headers || (input && input.headers);
        if (h) {
          let a = null, k = null;
          if (h instanceof Headers) { a = h.get('authorization'); k = h.get('apikey'); }
          else if (Array.isArray(h)) {
            const f = h.find(x => String(x[0]).toLowerCase() === 'authorization');
            a = f && f[1];
            const g = h.find(x => String(x[0]).toLowerCase() === 'apikey');
            k = g && g[1];
          } else { a = h.authorization || h.Authorization; k = h.apikey || h.Apikey; }
          if (a?.startsWith('Bearer ')) remember(a.slice(7));
          if (k && !window.__yapAnonKey) window.__yapAnonKey = k;
        }
      } catch (e) {}
      const p = of.call(this, input, init);
      try {
        const u = typeof input === 'string' ? input : (input?.url || '');
        if (u.includes('/rest/v1/profiles') || u.includes('/rest/v1/users') || u.includes('who_online')) {
          p.then(r => {
            if (!r.ok) return;
            r.clone().json().then(rows => {
              const arr = Array.isArray(rows) ? rows : [rows];
              const me = arr.find(x => x && String(x.id).toLowerCase() === window.userid);
              if (me) {
                if (me.username || me.display_name || me.name) window.username = me.username || me.display_name || me.name;
                const av = me.avatar_url || me.avatar || me.profile_picture || me.pfp;
                if (av && !window.smexypic) toData(av).then(d => { window.smexypic = d; });
              }
            }).catch(() => {});
          }).catch(() => {});
        }
      } catch (e) {}
      return p;
    };
    pf.__yg = 1;
    window.fetch = pf;
  }
  const oa = WebSocket.prototype.addEventListener;
  if (!oa.__yg) {
    WebSocket.prototype.addEventListener = function (type, listener, options) {
      if (type !== 'message') return oa.call(this, type, listener, options);
      const w = function (ev) {
        try {
          const f = JSON.parse(ev.data);
          const d = f?.payload?.data;
          if (d?.record) {
            const r = d.record;
            if (r.author_id && String(r.author_id).toLowerCase() === window.userid) {
              if (!window.username && (r.author_username || r.username)) window.username = r.author_username || r.username;
            }
          }
        } catch (e) {}
        return listener.call(this, ev);
      };
      return oa.call(this, type, w, options);
    };
    WebSocket.prototype.addEventListener.__yg = 1;
  }
  setInterval(() => {
    if (!window.requesttoken) { const t = findtok(); if (t) remember(t); }
    if (window.requesttoken && (!window.username || !window.smexypic)) hydrate();
  }, 30000);
})();