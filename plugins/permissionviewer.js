(function () {
  'use strict';
  const ANON_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZmt1cXpkZHd2dGRvanpnbWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2Mzk0ODgsImV4cCI6MjEwNzIxNTQ4OH0.kMZcUf8DgMrYFNGtMPW9SGja2m1cRdMq5WJv5XBNgCU';
  const SUPABASE_BASE = 'https://dnfkuqzddwvtdojzgmdm.supabase.co';

  const permissionsviewer = {
    id: 'permissionsviewer',
    name: 'Permissions Viewer',
    description: 'see every role + permission of any server!!',

    cssElement: null,
    observer: null,
    scanTimer: null,
    periodicScan: null,
    cache: new Map(),
    memberCache: new Map(),
    userByUsername: new Map(),

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

    roleHas(role, key) {
      return !!(role.perms && role.perms.administrator) ||
        !!(role.manage_server && this.IMPLIED_BY_MANAGE_SERVER.includes(key)) ||
        !!(role.manage_messages && this.IMPLIED_BY_MANAGE_MESSAGES.includes(key)) ||
        !!(role.perms && role.perms[key]);
    },

    effective(server, roles, memberRoleIds, userId) {
      const owner = !!(server && server.owner_id === userId);
      const myRoles = (roles || []).filter((r) => memberRoleIds.includes(r.id) && (!r.auto || r.auto === 'none'));
      const admin = myRoles.some((r) => r.perms && r.perms.administrator);
      const perms = new Set();
      if (owner || admin) {
        this.ALL_KEYS.forEach((k) => perms.add(k));
      } else {
        for (const k of this.ALL_KEYS) if (myRoles.some((r) => this.roleHas(r, k))) perms.add(k);
        const everyonePerms = server && server.everyone_perms && typeof server.everyone_perms === 'object' ? server.everyone_perms : null;
        for (const k of this.EVERYONE_DEFAULTS) if (!everyonePerms || everyonePerms[k] !== false) perms.add(k);
      }
      return { owner, admin, perms, roles: myRoles };
    },

    getToken() {
      if (window.requestToken) return window.requestToken;
      
      try {
        let s = localStorage.getItem("yp:1n00fw");
        const K = "yapper·v1";
        
        if (s != null) {
          try {
            let r = decodeURIComponent(escape(atob(s.split('').reverse().join(''))));
            let o = '';
            for (let i = 0; i < r.length; i++) {
              o += String.fromCharCode(r.charCodeAt(i) ^ K.charCodeAt(i % K.length));
            }
            s = o;
          } catch (e) {
            s = '';
          }
        } else {
          s = localStorage.getItem("sb-dnfkuqzddwvtdojzgmdm-auth-token");
        }

        if (!s) return null;

        let parsed = JSON.parse(s);
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        
        return parsed.access_token || (parsed.currentSession && parsed.currentSession.access_token);
      } catch (e) {
        return null;
      }
    },

    getAnonKey() {
      return window.__yapAnonKey || ANON_KEY_FALLBACK;
    },

    async fetchJson(path) {
      const token = this.getToken();
      if (!token) throw new Error('Could not find your auth token. Make sure you are logged in.');
      const res = await fetch(SUPABASE_BASE + path, {
        headers: { apikey: this.getAnonKey(), Authorization: 'Bearer ' + token },
      });
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch (_) {}
        throw new Error('HTTP ' + res.status + (body ? ': ' + body.slice(0, 120) : ''));
      }
      return res.json();
    },

    async getServer(serverId) {
      const rows = await this.fetchJson('/rest/v1/servers?id=eq.' + encodeURIComponent(serverId) + '&select=*&limit=1');
      return Array.isArray(rows) ? rows[0] || null : null;
    },

    async getRoles(serverId) {
      const rows = await this.fetchJson('/rest/v1/roles?server_id=eq.' + encodeURIComponent(serverId) + '&select=*&order=position.asc');
      return Array.isArray(rows) ? rows : [];
    },

    async getMemberRoles(serverId, userId) {
      const rows = await this.fetchJson('/rest/v1/member_roles?server_id=eq.' + encodeURIComponent(serverId) + '&user_id=eq.' + encodeURIComponent(userId) + '&select=role_id');
      return Array.isArray(rows) ? rows.map((r) => r.role_id) : [];
    },

    async getProfile(userId) {
      const rows = await this.fetchJson('/rest/v1/profiles?id=eq.' + encodeURIComponent(userId) + '&select=id,username,display_name,avatar_path&limit=1');
      return Array.isArray(rows) ? rows[0] || null : null;
    },

    async getUserByUsername(username) {
      if (!username) return null;
      const key = String(username).toLowerCase();
      if (this.userByUsername.has(key)) return this.userByUsername.get(key);
      const rows = await this.fetchJson('/rest/v1/profiles?username=eq.' + encodeURIComponent(username) + '&select=id,username,display_name&limit=1');
      const hit = Array.isArray(rows) ? rows[0] || null : null;
      if (hit) this.userByUsername.set(key, hit);
      return hit;
    },

    async isMember(serverId, userId) {
      const key = serverId + ':' + userId;
      const cached = this.memberCache.get(key);
      if (cached && Date.now() - cached.at < 60000) return cached.value;
      const rows = await this.fetchJson('/rest/v1/server_members?server_id=eq.' + encodeURIComponent(serverId) + '&user_id=eq.' + encodeURIComponent(userId) + '&select=user_id&limit=1');
      const value = Array.isArray(rows) && rows.length > 0;
      this.memberCache.set(key, { value, at: Date.now() });
      return value;
    },

    async getServerData(serverId) {
      const cached = this.cache.get(serverId);
      if (cached && Date.now() - cached.at < 60000) return cached;
      const [server, roles] = await Promise.all([this.getServer(serverId), this.getRoles(serverId)]);
      if (!server) throw new Error('Could not load that server.');
      const data = { server, roles, at: Date.now() };
      this.cache.set(serverId, data);
      return data;
    },

    activeServerId() {
      const active = document.querySelector('nav.rail .rail-item.active');
      if (!active) return null;
      const row = active.closest('[data-rail-row]');
      if (row && row.dataset.railRow) return row.dataset.railRow;
      return null;
    },

    identifyProfileUser(card) {
      const direct = card.getAttribute('data-user-id') || card.getAttribute('data-userid');
      if (direct) return direct;
      const child = card.querySelector('[data-user-id], [data-userid]');
      if (child) return child.getAttribute('data-user-id') || child.getAttribute('data-userid');
      for (const img of card.querySelectorAll('img')) {
        const m = (img.src || '').match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (m) return m[1];
      }
      const unameEl = card.querySelector('.pc2-username, .pc2-handle, .pc2-user-tag, [class*="username"]');
      if (unameEl) {
        const text = (unameEl.textContent || '').trim().replace(/^@/, '').split(/\s/)[0];
        if (text && /^[a-z0-9_.]+$/i.test(text)) return { username: text };
      }
      const m = (card.textContent || '').match(/@([a-z0-9_.]+)/i);
      if (m) return { username: m[1] };
      return null;
    },

    renderPermList(hasFn) {
      const wrap = document.createElement('div');
      for (const [group, list] of this.GROUPS) {
        const h = document.createElement('div');
        h.className = 'yp-pv-section';
        h.textContent = group;
        wrap.appendChild(h);
        const chips = document.createElement('div');
        chips.className = 'yp-pv-chips';
        for (const [key, label] of list) {
          const chip = document.createElement('span');
          const on = hasFn(key);
          chip.className = 'yp-pv-chip ' + (on ? (this.DANGER.has(key) ? 'danger' : 'on') : 'off');
          chip.textContent = label;
          chip.title = key;
          chips.appendChild(chip);
        }
        wrap.appendChild(chips);
      }
      return wrap;
    },

    showModal(title, subtitle, content) {
      document.querySelectorAll('.yp-pv-overlay').forEach((n) => n.remove());
      const close = () => {
        overlay.remove();
        document.removeEventListener('keydown', onKey, true);
      };
      const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
      const card = document.createElement('div');
      card.className = 'yp-pv-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');
      card.setAttribute('aria-label', title);
      
      const head = document.createElement('div');
      head.className = 'yp-pv-head';
      const h2 = document.createElement('h2');
      h2.textContent = title;
      head.appendChild(h2);
      
      const subtitleEl = document.createElement('p');
      subtitleEl.textContent = subtitle || '';
      head.appendChild(subtitleEl);
      
      const body = document.createElement('div');
      body.className = 'yp-pv-body';
      if (typeof content === 'string') body.innerHTML = content;
      else if (Array.isArray(content)) content.forEach((c) => body.appendChild(c));
      else if (content) body.appendChild(content);
      
      const foot = document.createElement('div');
      foot.className = 'yp-pv-foot';
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'yp-pv-close';
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', close);
      foot.appendChild(closeBtn);
      
      card.appendChild(head);
      card.appendChild(body);
      card.appendChild(foot);
      
      const overlay = document.createElement('div');
      overlay.className = 'yp-pv-overlay';
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      overlay.addEventListener('pointerdown', (e) => e.stopPropagation());
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      document.addEventListener('keydown', onKey, true);
      
      return { overlay, card, body, head, h2, subtitleEl, close };
    },

    async openMember(serverId, userId) {
      const ref = this.showModal('Permissions', 'Loading...', '<div class="yp-pv-hint">Loading permissions...</div>');
      try {
        const [serverData, memberRoleIds, profile] = await Promise.all([
          this.getServerData(serverId),
          this.getMemberRoles(serverId, userId),
          this.getProfile(userId),
        ]);
        const eff = this.effective(serverData.server, serverData.roles, memberRoleIds, userId);
        const name = profile ? (profile.display_name || profile.username || 'Unknown') : 'Unknown user';
        ref.h2.textContent = 'Permissions of ' + name;
        ref.subtitleEl.textContent = serverData.server.name +
          (eff.owner ? ' · server owner (everything)' : eff.admin ? ' · administrator (everything)' : '');
        ref.body.innerHTML = '';

        const rolesH = document.createElement('div');
        rolesH.className = 'yp-pv-section';
        rolesH.textContent = 'Roles';
        ref.body.appendChild(rolesH);

        if (eff.roles.length) {
          const chips = document.createElement('div');
          chips.className = 'yp-pv-chips';
          for (const r of eff.roles) {
            const chip = document.createElement('span');
            chip.className = 'yp-pv-role';
            const dot = document.createElement('i');
            dot.style.background = r.color || '#888';
            chip.appendChild(dot);
            chip.appendChild(document.createTextNode(r.name || 'Role'));
            chips.appendChild(chip);
          }
          ref.body.appendChild(chips);
        } else {
          const hint = document.createElement('div');
          hint.className = 'yp-pv-hint';
          hint.textContent = 'No roles (only the permissions every member has).';
          ref.body.appendChild(hint);
        }

        ref.body.appendChild(this.renderPermList((k) => eff.perms.has(k)));
      } catch (err) {
        ref.h2.textContent = 'Permissions';
        ref.subtitleEl.textContent = 'Failed to load';
        ref.body.innerHTML = '';
        const e = document.createElement('div');
        e.className = 'yp-pv-hint';
        e.textContent = String((err && err.message) || err);
        ref.body.appendChild(e);
      }
    },

    async openServer(serverId) {
      const ref = this.showModal('Roles and permissions', 'Loading...', '<div class="yp-pv-hint">Loading roles...</div>');
      try {
        const serverData = await this.getServerData(serverId);
        ref.h2.textContent = 'Roles and permissions';
        ref.subtitleEl.textContent = serverData.server.name;
        ref.body.innerHTML = '';
        const labelOf = (k) => (this.GROUPS.flatMap(([, l]) => l).find(([x]) => x === k) || [k, k])[1];

        const everyonePerms = serverData.server.everyone_perms && typeof serverData.server.everyone_perms === 'object' ? serverData.server.everyone_perms : null;
        const everyoneKeys = this.EVERYONE_DEFAULTS.filter((k) => !everyonePerms || everyonePerms[k] !== false);

        const everyoneH = document.createElement('div');
        everyoneH.className = 'yp-pv-section';
        everyoneH.textContent = '@everyone (defaults)';
        ref.body.appendChild(everyoneH);

        if (everyoneKeys.length) {
          const chips = document.createElement('div');
          chips.className = 'yp-pv-chips';
          for (const k of everyoneKeys) {
            const chip = document.createElement('span');
            chip.className = 'yp-pv-chip on';
            chip.textContent = labelOf(k);
            chip.title = k;
            chips.appendChild(chip);
          }
          ref.body.appendChild(chips);
        } else {
          const hint = document.createElement('div');
          hint.className = 'yp-pv-hint';
          hint.textContent = 'No default permissions.';
          ref.body.appendChild(hint);
        }

        const realRoles = (serverData.roles || []).filter((r) => !r.auto || r.auto === 'none');
        if (!realRoles.length) {
          const hint = document.createElement('div');
          hint.className = 'yp-pv-hint';
          hint.textContent = 'No roles in this server.';
          ref.body.appendChild(hint);
          return;
        }

        for (const r of realRoles) {
          const roleH = document.createElement('div');
          roleH.className = 'yp-pv-section';
          const dot = document.createElement('i');
          dot.className = 'yp-pv-dot';
          dot.style.background = r.color || '#888';
          roleH.appendChild(dot);
          roleH.appendChild(document.createTextNode(r.name || 'Role'));
          ref.body.appendChild(roleH);

          const own = this.GROUPS.flatMap(([, l]) => l).filter(([k]) => this.roleHas(r, k));
          if (own.length) {
            const chips = document.createElement('div');
            chips.className = 'yp-pv-chips';
            for (const [k, label] of own) {
              const chip = document.createElement('span');
              chip.className = 'yp-pv-chip ' + (this.DANGER.has(k) ? 'danger' : 'on');
              chip.textContent = label;
              chip.title = k;
              chips.appendChild(chip);
            }
            ref.body.appendChild(chips);
          } else {
            const hint = document.createElement('div');
            hint.className = 'yp-pv-hint';
            hint.textContent = 'All the good oll default perms so like 0 extra perms';
            ref.body.appendChild(hint);
          }
        }
      } catch (err) {
        ref.h2.textContent = 'Roles and permissions';
        ref.subtitleEl.textContent = 'Failed to load';
        ref.body.innerHTML = '';
        const e = document.createElement('div');
        e.className = 'yp-pv-hint';
        e.textContent = String((err && err.message) || err);
        ref.body.appendChild(e);
      }
    },

    async scanProfileCards() {
      const serverId = this.activeServerId();
      const cards = document.querySelectorAll('.profile-card');
      for (const card of cards) {
        const head = card.querySelector('.pc2-head');
        if (!head) continue;
        if (!serverId) {
          const old = head.querySelector('.yp-pv-btn');
          if (old) old.remove();
          continue;
        }
        const ident = this.identifyProfileUser(card);
        if (!ident) continue;
        
        let userId = typeof ident === 'string' ? ident : ident.userId;
        if (!userId && ident.username) {
          try {
            const profile = await this.getUserByUsername(ident.username);
            if (!profile) continue;
            userId = profile.id;
          } catch (_) { continue; }
        }
        
        if (!userId) continue;
        let member;
        try { member = await this.isMember(serverId, userId); }
        catch (_) { continue; }
        if (!member) {
          const old = head.querySelector('.yp-pv-btn');
          if (old) old.remove();
          continue;
        }
        
        const existing = head.querySelector('.yp-pv-btn');
        if (existing &&
            existing.getAttribute('data-user-id') === userId &&
            existing.getAttribute('data-server-id') === serverId) continue;
        if (existing) existing.remove();
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'yp-pv-btn';
        btn.setAttribute('data-user-id', userId);
        btn.setAttribute('data-server-id', serverId);
        btn.textContent = 'Permissions';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openMember(serverId, userId);
        });
        head.appendChild(btn);
      }
    },

    scanServerMenus() {
      const serverId = this.activeServerId();
      if (!serverId) return;
      document.querySelectorAll('.server-menu').forEach((menu) => {
        if (menu.querySelector('.yp-pv-server-item')) return;
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'yp-pv-server-item';
        item.textContent = 'Roles and permissions';
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const overlay = menu.closest('.overlay');
          if (overlay) overlay.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          this.openServer(serverId);
        });
        item.addEventListener('pointerdown', (e) => e.stopPropagation());
        menu.appendChild(item);
      });
    },

    scan() {
      this.scanProfileCards();
      this.scanServerMenus();
    },

    injectCSS() {
      if (this.cssElement || document.getElementById('ypp-pv-css')) return;
      const css = document.createElement('style');
      css.id = 'ypp-pv-css';
      css.textContent = `
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
      (document.head || document.documentElement).appendChild(css);
      this.cssElement = css;
    },

    start() {
      if (this.observer) return;
      this.injectCSS();
      const self = this;
      this.periodicScan = setInterval(() => self.scan(), 1500);
      this.observer = new MutationObserver(() => {
        if (self.scanTimer) return;
        self.scanTimer = setTimeout(() => {
          self.scanTimer = null;
          self.scan();
        }, 120);
      });
      this.observer.observe(document.body, { childList: true, subtree: true });
      this.scan();
    },

    stop() {
      if (this.scanTimer) { clearTimeout(this.scanTimer); this.scanTimer = null; }
      if (this.periodicScan) { clearInterval(this.periodicScan); this.periodicScan = null; }
      if (this.observer) { this.observer.disconnect(); this.observer = null; }
      if (this.cssElement) { this.cssElement.remove(); this.cssElement = null; }
      document.querySelectorAll('.yp-pv-btn, .yp-pv-server-item').forEach((n) => n.remove());
      document.querySelectorAll('.yp-pv-overlay').forEach((n) => n.remove());
      this.cache.clear();
      this.memberCache.clear();
      this.userByUsername.clear();
    },
  };
  window.PluginHost.register(permissionsviewer);
})();
