// mb yapcord i copy pasted yours lel

(function () {
  'use strict';
  const ANON_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZmt1cXpkZHd2dGRvanpnbWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2Mzk0ODgsImV4cCI6MjEwNzIxNTQ4OH0.kMZcUf8DgMrYFNGtMPW9SGja2m1cRdMq5WJv5XBNgCU';
  const SUPABASE_BASE = 'https://dnfkuqzddwvtdojzgmdm.supabase.co';
  const permissionsviewer = {
    id: 'permissionsviewer',
    name: 'Permissions Viewer',
    description: 'see every role + permission of any server!!',




    csselement: null,
    observer: null,
    scantimer: null,
    periodicscan: null,
    cache: new Map(),
    membercache: new Map(),
    userbyusername: new Map(),
    GROUPS: [
      ['General', [
        ['manage_channels', 'Manage Channels'],
        ['manage_roles', 'Manage Roles'],
        ['manage_emojis', 'Manage Emoji'],
        ['manage_server', 'Manage Server'],
        ['manage_webhooks', 'Manage Webhooks'],
        ['create_invite', 'Create Invite'],
        ['change_nickname', 'Change Nickname'],
        ['manage_nicknames', 'Manage Nicknames'],
      ]],
      ['Membership', [
        ['kick_members', 'Kick Members'],
        ['ban_members', 'Ban Members'],
        ['timeout_members', 'Timeout Members'],
      ]],
      ['Text', [
        ['send_messages', 'Send Messages'],
        ['embed_links', 'Embed Links'],
        ['attach_files', 'Attach Files'],
        ['send_voice_messages', 'Send Voice Messages'],
        ['add_reactions', 'Add Reactions'],
        ['use_external_emojis', 'Use External Emoji'],
        ['create_polls', 'Create Polls'],
        ['mention_everyone', 'Mention @everyone'],
        ['manage_messages', 'Manage Messages'],
        ['read_history', 'Read Message History'],
      ]],
      ['Voice', [
        ['connect', 'Connect'],
        ['speak', 'Speak'],
        ['mute_members', 'Mute Members'],
        ['move_members', 'Move Members'],
      ]],
    ],
    DANGER: new Set(['kick_members', 'ban_members', 'timeout_members', 'manage_server', 'manage_roles', 'administrator']),
    IMPLIED_BY_MANAGE_SERVER: ['manage_server', 'manage_channels', 'manage_roles', 'manage_emojis', 'kick_members', 'ban_members', 'timeout_members', 'manage_nicknames', 'manage_messages', 'mention_everyone', 'mute_members', 'move_members'],
    IMPLIED_BY_MANAGE_MESSAGES: ['manage_messages', 'timeout_members', 'manage_nicknames', 'mention_everyone', 'mute_members'],
    EVERYONE_DEFAULTS: ['send_messages', 'add_reactions', 'attach_files', 'embed_links', 'use_external_emojis', 'create_invite', 'change_nickname', 'connect', 'speak', 'create_polls', 'read_history', 'send_voice_messages'],
    ALL_KEYS: [
      'manage_channels', 'manage_roles', 'manage_emojis', 'manage_server', 'manage_webhooks',
      'create_invite', 'change_nickname', 'manage_nicknames',
      'kick_members', 'ban_members', 'timeout_members',
      'send_messages', 'embed_links', 'attach_files', 'send_voice_messages',
      'add_reactions', 'use_external_emojis', 'create_polls', 'mention_everyone',
      'manage_messages', 'read_history',
      'connect', 'speak', 'mute_members', 'move_members',
    ],
    rolehas(role, key) {
      return !!(role.perms && role.perms.administrator) ||
        !!(role.manage_server && this.IMPLIED_BY_MANAGE_SERVER.includes(key)) ||
        !!(role.manage_messages && this.IMPLIED_BY_MANAGE_MESSAGES.includes(key)) ||
        !!(role.perms && role.perms[key]);
    },
    effective(server, roles, memberroleids, userid) {
      const owner = !!(server && server.owner_id === userid);
      const myroles = (roles || []).filter((r) => memberroleids.includes(r.id) && (!r.auto || r.auto === 'none'));
      const admin = myroles.some((r) => r.perms && r.perms.administrator);
      const perms = new Set();
      if (owner || admin) {
        this.ALL_KEYS.forEach((k) => perms.add(k));
      } else {
        for (const k of this.ALL_KEYS) if (myroles.some((r) => this.rolehas(r, k))) perms.add(k);
        const everyoneperms = server && server.everyone_perms && typeof server.everyone_perms === 'object' ? server.everyone_perms : null;
        for (const k of this.EVERYONE_DEFAULTS) if (!everyoneperms || everyoneperms[k] !== false) perms.add(k);
      }
      return { owner, admin, perms, roles: myroles };
    },
    gettoken() { // to get the roles inside supabase; 
      if (window.requesttoken) return window.requesttoken;
      try {
        for (let i = 0; i < localstorage.length; i++) {
          const k = localstorage.key(i);
          if (k && k.indexof('sb-') === 0 && k.indexof('-auth-token') !== -1) {
            try {
              let v = JSON.parse(localstorage.getitem(k));
              if (typeof v === 'string') v = JSON.parse(v);
              const t = v && (v.access_token || (v.currentsession && v.currentsession.access_token));
              if (t) return t;
            } catch (_) {}
          }
        }
      } catch (_) {}
      return null;
    },
    getanonkey() {
      return window.__yapanonkey || ANON_KEY_FALLBACK;
    },
    async fetchjson(path) {
      const token = this.gettoken();
      if (!token) throw new Error('didnt work');
      const res = await fetch(SUPABASE_BASE + path, {
        headers: { apikey: this.getanonkey(), authorization: 'Bearer ' + token },
      });
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch (_) {}
        throw new Error('HTTP ' + res.status + (body ? ': ' + body.slice(0, 120) : ''));
      }
      return res.json();
    },

    async getserver(serverid) {
      const rows = await this.fetchjson('/rest/v1/servers?id=eq.' + encodeuricomponent(serverid) + '&select=*&limit=1');
      return Array.isArray(rows) ? rows[0] || null : null;
    },
    async getroles(serverid) {
      const rows = await this.fetchjson('/rest/v1/roles?server_id=eq.' + encodeuricomponent(serverid) + '&select=*&order=position.asc');
      return Array.isArray(rows) ? rows : [];
    },
    async getmemberroles(serverid, userid) {
      const rows = await this.fetchjson('/rest/v1/member_roles?server_id=eq.' + encodeuricomponent(serverid) + '&user_id=eq.' + encodeuricomponent(userid) + '&select=role_id');
      return Array.isArray(rows) ? rows.map((r) => r.role_id) : [];
    },
    async getprofile(userid) {
      const rows = await this.fetchjson('/rest/v1/profiles?id=eq.' + encodeuricomponent(userid) + '&select=id,username,display_name,avatar_path&limit=1');
      return Array.isArray(rows) ? rows[0] || null : null;
    },
    async getuserbyusername(username) {
      if (!username) return null;
      const key = String(username).tolowercase();
      if (this.userbyusername.has(key)) return this.userbyusername.get(key);
      const rows = await this.fetchjson('/rest/v1/profiles?username=eq.' + encodeuricomponent(username) + '&select=id,username,display_name&limit=1');
      const hit = Array.isArray(rows) ? rows[0] || null : null;
      if (hit) this.userbyusername.set(key, hit);
      return hit;
    },
    async ismember(serverid, userid) {
      const key = serverid + ':' + userid;
      const cached = this.membercache.get(key);
      if (cached && Date.now() - cached.at < 60000) return cached.value;
      const rows = await this.fetchjson('/rest/v1/server_members?server_id=eq.' + encodeuricomponent(serverid) + '&user_id=eq.' + encodeuricomponent(userid) + '&select=user_id&limit=1');
      const value = Array.isArray(rows) && rows.length > 0;
      this.membercache.set(key, { value, at: Date.now() });
      return value;
    },
    async getserverdata(serverid) {
      const cached = this.cache.get(serverid);
      if (cached && Date.now() - cached.at < 60000) return cached;
      const [server, roles] = await Promise.all([this.getserver(serverid), this.getroles(serverid)]);
      if (!server) throw new Error('Could not load that server.');
      const data = { server, roles, at: Date.now() };
      this.cache.set(serverid, data);
      return data;
    },

    activeserverid() {
      const active = document.queryselector('nav.rail .rail-item.active');
      if (!active) return null;
      const row = active.closest('[data-rail-row]');
      if (row && row.dataset.railrow) return row.dataset.railrow;
      return null;
    },

    identifyprofileuser(card) {
      const direct = card.getattribute('data-user-id') || card.getattribute('data-userid');
      if (direct) return direct;
      const child = card.queryselector('[data-user-id], [data-userid]');
      if (child) return child.getattribute('data-user-id') || child.getattribute('data-userid');
      for (const img of card.queryselectorall('img')) {
        const m = (img.src || '').match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (m) return m[1];
      }
      const unameel = card.queryselector('.pc2-username, .pc2-handle, .pc2-user-tag, [class*="username"]');
      if (unameel) {
        const text = (unameel.textcontent || '').trim().replace(/^@/, '').split(/\s/)[0];
        if (text && /^[a-z0-9_.]+$/i.test(text)) return { username: text };
      }
      const m = (card.textcontent || '').match(/@([a-z0-9_.]+)/i);
      if (m) return { username: m[1] };
      return null;
    },

    renderpermlist(hasfn) {
      const wrap = document.createelement('div');
      for (const [group, list] of this.GROUPS) {
        const h = document.createelement('div');
        h.classname = 'yp-pv-section';
        h.textcontent = group;
        wrap.appendchild(h);
        const chips = document.createelement('div');
        chips.classname = 'yp-pv-chips';
        for (const [key, label] of list) {
          const chip = document.createelement('span');
          const on = hasfn(key);
          chip.classname = 'yp-pv-chip ' + (on ? (this.DANGER.has(key) ? 'danger' : 'on') : 'off');
          chip.textcontent = label;
          chip.title = key;
          chips.appendchild(chip);
        }
        wrap.appendchild(chips);
      }
      return wrap;
    },

    showmodal(title, subtitle, content) {
      document.queryselectorall('.yp-pv-overlay').foreach((n) => n.remove());
      const close = () => {
        overlay.remove();
        document.removeeventlistener('keydown', onkey, true);
      };
      const onkey = (e) => { if (e.key === 'Escape') { e.stoppropagation(); close(); } };
      const card = document.createelement('div');
      card.classname = 'yp-pv-card';
      card.setattribute('role', 'dialog');
      card.setattribute('aria-modal', 'true');
      card.setattribute('aria-label', title);
      const head = document.createelement('div');
      head.classname = 'yp-pv-head';
      const h2 = document.createelement('h2');
      h2.textcontent = title;
      head.appendchild(h2);
      const subtitleel = document.createelement('p');
      subtitleel.textcontent = subtitle || '';
      head.appendchild(subtitleel);
      const body = document.createelement('div');
      body.classname = 'yp-pv-body';
      if (typeof content === 'string') body.innerhtml = content;
      else if (Array.isArray(content)) content.foreach((c) => body.appendchild(c));
      else if (content) body.appendchild(content);
      const foot = document.createelement('div');
      foot.classname = 'yp-pv-foot';
      const closebtn = document.createelement('button');
      closebtn.type = 'button';
      closebtn.classname = 'yp-pv-close';
      closebtn.textcontent = 'Close';
      closebtn.addeventlistener('click', close);
      foot.appendchild(closebtn);
      card.appendchild(head);
      card.appendchild(body);
      card.appendchild(foot);
      const overlay = document.createelement('div');
      overlay.classname = 'yp-pv-overlay';
      overlay.addeventlistener('click', (e) => { if (e.target === overlay) close(); });
      overlay.addeventlistener('pointerdown', (e) => e.stoppropagation());
      overlay.appendchild(card);
      document.body.appendchild(overlay);
      document.addeventlistener('keydown', onkey, true);
      return { overlay, card, body, head, h2, subtitleel, close };
    },





    async openmember(serverid, userid) {
      const ref = this.showmodal('Permissions', 'Loading...', '<div class="yp-pv-hint">Loading permissions...</div>');
      try {
        const [serverdata, memberroleids, profile] = await Promise.all([
          this.getserverdata(serverid),
          this.getmemberroles(serverid, userid),
          this.getprofile(userid),
        ]);
        const eff = this.effective(serverdata.server, serverdata.roles, memberroleids, userid);
        const name = profile ? (profile.display_name || profile.username || 'Unknown') : 'Unknown user';
        ref.h2.textcontent = 'Permissions of ' + name;
        ref.subtitleel.textcontent = serverdata.server.name +
          (eff.owner ? ' · server owner (everything)' : eff.admin ? ' · administrator (everything)' : '');
        ref.body.innerhtml = '';

        const rolesh = document.createelement('div');
        rolesh.classname = 'yp-pv-section';
        rolesh.textcontent = 'Roles';
        ref.body.appendchild(rolesh);

        if (eff.roles.length) {
          const chips = document.createelement('div');
          chips.classname = 'yp-pv-chips';
          for (const r of eff.roles) {
            const chip = document.createelement('span');
            chip.classname = 'yp-pv-role';
            const dot = document.createelement('i');
            dot.style.background = r.color || '#888';
            chip.appendchild(dot);
            chip.appendchild(document.createtextnode(r.name || 'Role'));
            chips.appendchild(chip);
          }
          ref.body.appendchild(chips);
        } else {
          const hint = document.createelement('div');
          hint.classname = 'yp-pv-hint';
          hint.textcontent = 'No roles (only the permissions every member has).';
          ref.body.appendchild(hint);
        }

        ref.body.appendchild(this.renderpermlist((k) => eff.perms.has(k)));
      } catch (err) {
        ref.h2.textcontent = 'Permissions';
        ref.subtitleel.textcontent = 'Failed to load';
        ref.body.innerhtml = '';
        const e = document.createelement('div');
        e.classname = 'yp-pv-hint';
        e.textcontent = String((err && err.message) || err);
        ref.body.appendchild(e);
      }
    },

    async openserver(serverid) {
      const ref = this.showmodal('Roles and permissions', 'Loading...', '<div class="yp-pv-hint">Loading roles...</div>');
      try {
        const serverdata = await this.getserverdata(serverid);
        ref.h2.textcontent = 'Roles and permissions';
        ref.subtitleel.textcontent = serverdata.server.name;
        ref.body.innerhtml = '';
        const labelof = (k) => (this.GROUPS.flatmap(([, l]) => l).find(([x]) => x === k) || [k, k])[1];

        const everyoneperms = serverdata.server.everyone_perms && typeof serverdata.server.everyone_perms === 'object' ? serverdata.server.everyone_perms : null;
        const everyonekeys = this.EVERYONE_DEFAULTS.filter((k) => !everyoneperms || everyoneperms[k] !== false);

        const everyoneh = document.createelement('div');
        everyoneh.classname = 'yp-pv-section';
        everyoneh.textcontent = '@everyone (defaults)';
        ref.body.appendchild(everyoneh);

        if (everyonekeys.length) {
          const chips = document.createelement('div');
          chips.classname = 'yp-pv-chips';
          for (const k of everyonekeys) {
            const chip = document.createelement('span');
            chip.classname = 'yp-pv-chip on';
            chip.textcontent = labelof(k);
            chip.title = k;
            chips.appendchild(chip);
          }
          ref.body.appendchild(chips);
        } else {
          const hint = document.createelement('div');
          hint.classname = 'yp-pv-hint';
          hint.textcontent = 'No default permissions.';
          ref.body.appendchild(hint);
        }

        const realroles = (serverdata.roles || []).filter((r) => !r.auto || r.auto === 'none');
        if (!realroles.length) {
          const hint = document.createelement('div');
          hint.classname = 'yp-pv-hint';
          hint.textcontent = 'No roles in this server.';
          ref.body.appendchild(hint);
          return;
        }

        for (const r of realroles) {
          const roleh = document.createelement('div');
          roleh.classname = 'yp-pv-section';
          const dot = document.createelement('i');
          dot.classname = 'yp-pv-dot';
          dot.style.background = r.color || '#888';
          roleh.appendchild(dot);
          roleh.appendchild(document.createtextnode(r.name || 'Role'));
          ref.body.appendchild(roleh);

          const own = this.GROUPS.flatmap(([, l]) => l).filter(([k]) => this.rolehas(r, k));
          if (own.length) {
            const chips = document.createelement('div');
            chips.classname = 'yp-pv-chips';
            for (const [k, label] of own) {
              const chip = document.createelement('span');
              chip.classname = 'yp-pv-chip ' + (this.DANGER.has(k) ? 'danger' : 'on');
              chip.textcontent = label;
              chip.title = k;
              chips.appendchild(chip);
            }
            ref.body.appendchild(chips);
          } else {
            const hint = document.createelement('div');
            hint.classname = 'yp-pv-hint';
            hint.textcontent = 'All the good oll default perms, 0 extra perms';
            ref.body.appendchild(hint);
          }
        }
      } catch (err) {
        ref.h2.textcontent = 'Roles and permissions';
        ref.subtitleel.textcontent = 'Failed to load';
        ref.body.innerhtml = '';
        const e = document.createelement('div');
        e.classname = 'yp-pv-hint';
        e.textcontent = String((err && err.message) || err);
        ref.body.appendchild(e);
      }
    },

    async scanprofilecards() {
      const serverid = this.activeserverid();
      const cards = document.queryselectorall('.profile-card');
      for (const card of cards) {
        const head = card.queryselector('.pc2-head');
        if (!head) continue;
        if (!serverid) {
          const old = head.queryselector('.yp-pv-btn');
          if (old) old.remove();
          continue;
        }
        const ident = this.identifyprofileuser(card);
        if (!ident) continue;
        let userid = typeof ident === 'string' ? ident : ident.userid;
        if (!userid && ident.username) {
          try {
            const profile = await this.getuserbyusername(ident.username);
            if (!profile) continue;
            userid = profile.id;
          } catch (_) { continue; }
        }
        if (!userid) continue;
        let member;
        try { member = await this.ismember(serverid, userid); }
        catch (_) { continue; }
        if (!member) {
          const old = head.queryselector('.yp-pv-btn');
          if (old) old.remove();
          continue;
        }
        const existing = head.queryselector('.yp-pv-btn');
        if (existing &&
            existing.getattribute('data-user-id') === userid &&
            existing.getattribute('data-server-id') === serverid) continue;
        if (existing) existing.remove();
        const btn = document.createelement('button');
        btn.type = 'button';
        btn.classname = 'yp-pv-btn';
        btn.setattribute('data-user-id', userid);
        btn.setattribute('data-server-id', serverid);
        btn.textcontent = 'Permissions';
        btn.addeventlistener('click', (e) => {
          e.stoppropagation();
          this.openmember(serverid, userid);
        });
        head.appendchild(btn);
      }
    },

    scanservermenus() {
      const serverid = this.activeserverid();
      if (!serverid) return;
      document.queryselectorall('.server-menu').foreach((menu) => {
        if (menu.queryselector('.yp-pv-server-item')) return;
        const item = document.createelement('button');
        item.type = 'button';
        item.classname = 'yp-pv-server-item';
        item.textcontent = 'Roles and permissions';
        item.addeventlistener('click', (e) => {
          e.stoppropagation();
          const overlay = menu.closest('.overlay');
          if (overlay) overlay.dispatchevent(new PointerEvent('pointerdown', { bubbles: true }));
          this.openserver(serverid);
        });
        item.addeventlistener('pointerdown', (e) => e.stoppropagation());
        menu.appendchild(item);
      });
    },

    scan() {
      this.scanprofilecards();
      this.scanservermenus();
    },

    injectcss() {
      if (this.csselement || document.getelementbyid('ypp-pv-css')) return;
      const css = document.createelement('style');
      css.id = 'ypp-pv-css';
      css.textcontent = `
        .yp-pv-overlay { position: fixed; inset: 0; z-index: 2147483000; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .yp-pv-card { width: min(640px, 100%); max-height: 85vh; display: flex; flex-direction: column; background: #1e1f22; border: 1px solid #3f4147; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); color: #dbdee1; font: 14px/1.5 "Segoe UI", system-ui, sans-serif; animation: yp-pv-pop 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes yp-pv-pop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .yp-pv-head { padding: 20px 24px 8px; }
        .yp-pv-head h2 { margin: 0; font-size: 20px; color: #fff; }
        .yp-pv-head p { margin: 4px 0 0; color: #949ba4; font-size: 13px; }
        .yp-pv-body { padding: 8px 24px 20px; overflow-y: auto; flex: 1; }
        .yp-pv-foot { padding: 12px 24px 16px; border-top: 1px solid #2b2d31; display: flex; justify-content: flex-end; }
        .yp-pv-close { background: #e27ed3; color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .yp-pv-close:hover { background: #d56fc8; }
        .yp-pv-section { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #b5bac1; margin: 16px 0 8px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .yp-pv-section:first-child { margin-top: 4px; }
        .yp-pv-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .yp-pv-chip { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
        .yp-pv-chip.on { background: rgba(59,165,93,0.18); color: #7fd69a; }
        .yp-pv-chip.off { background: rgba(255,255,255,0.06); color: #8b8d96; text-decoration: line-through; }
        .yp-pv-chip.danger { background: rgba(237,66,69,0.18); color: #f3898b; }
        .yp-pv-hint { color: #949ba4; font-size: 13px; font-style: italic; padding: 4px 0; }
        .yp-pv-role { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: #2b2d31; font-size: 12px; }
        .yp-pv-role i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .yp-pv-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .yp-pv-btn { margin-top: 8px; background: #e27ed3; color: #fff; border: none; border-radius: 6px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-block; }
        .yp-pv-btn:hover { background: #d56fc8; }
        .yp-pv-server-item { display: block; width: 100%; padding: 8px 10px; background: transparent; border: none; color: #dbdee1; font-size: 13px; text-align: left; cursor: pointer; border-radius: 4px; }
        .yp-pv-server-item:hover { background: #e27ed3; color: #fff; }
      `;
      (document.head || document.documentelement).appendchild(css);
      this.csselement = css;
    },

    start() {
      if (this.observer) return;
      this.injectcss();
      const self = this;
      this.periodicscan = setinterval(() => self.scan(), 1500);
      this.observer = new MutationObserver(() => {
        if (self.scantimer) return;
        self.scantimer = settimeout(() => {
          self.scantimer = null;
          self.scan();
        }, 120);
      });
      this.observer.observe(document.body, { childlist: true, subtree: true });
      this.scan();
    },
    stop() {
      if (this.scantimer) { cleartimeout(this.scantimer); this.scantimer = null; }
      if (this.periodicscan) { clearinterval(this.periodicscan); this.periodicscan = null; }
      if (this.observer) { this.observer.disconnect(); this.observer = null; }
      if (this.csselement) { this.csselement.remove(); this.csselement = null; }
      document.queryselectorall('.yp-pv-btn, .yp-pv-server-item').foreach((n) => n.remove());
      document.queryselectorall('.yp-pv-overlay').foreach((n) => n.remove());
      this.cache.clear();
      this.membercache.clear();
      this.userbyusername.clear();
    },
  };
  window.PluginHost.register(permissionsviewer);
})();