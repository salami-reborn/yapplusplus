(function () {
  'use strict';

  var anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZmt1cXpkZHd2dGRvanpnbWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2Mzk0ODgsImV4cCI6MjEwNzIxNTQ4OH0.kMZcUf8DgMrYFNGtMPW9SGja2m1cRdMq5WJv5XBNgCU';
  var base_url = 'https://dnfkuqzddwvtdojzgmdm.supabase.co';
  var cache_ms = 30000;
  var page_size = 1000;
  var server_cache_limit = 32;
  var member_selectors = ['.side-panel-body', '.members-panel', '.member-list', '.chat-members', '.members-sidebar'];
  var row_selectors = ['.pick-row', '.member-row', '.member', '[data-member-id]'];

  function get_token() {
    if (window.requesttoken) return window.requesttoken;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) {
          try {
            var v = JSON.parse(localStorage.getItem(k));
            if (typeof v === 'string') v = JSON.parse(v);
            var t = v && (v.access_token || (v.currentSession && v.currentSession.access_token));
            if (t) return t;
          } catch (e) {}
        }
      }
    } catch (e) {}
    return null;
  }

  function get_anon() {
    return window.__yapAnonKey || anon_key;
  }

  function active_server() {
    var sels = ['.rail-item.active', '.rail-item[aria-current="page"]', 'nav.rail button.rail-item.active'];
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (!el) continue;

      var row = el.closest('[data-rail-row]');
      if (row && row.dataset.railRow) return row.dataset.railRow;

      var ds = el.getAttribute('data-server') || el.getAttribute('data-server-id');
      if (ds) return ds;

      var title = el.getAttribute('title') || el.getAttribute('aria-label');
      if (title && title !== 'Direct messages') {
        var servers = document.querySelectorAll('nav.rail button.rail-item[data-server]');
        for (var j = 0; j < servers.length; j++) {
          if (servers[j].getAttribute('title') === title ||
              servers[j].getAttribute('aria-label') === title) {
            return servers[j].getAttribute('data-server');
          }
        }
      }
    }

    var m = location.href.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    return m ? m[1] : null;
  }

  async function fetch_user_ids(path, token) {
    var ids = new Set();
    var offset = 0;
    var exact_total = null;

    while (true) {
      var headers = {
        apikey: get_anon(),
        Authorization: 'Bearer ' + token
      };
      if (offset === 0) headers.Prefer = 'count=exact';
      var res = await fetch(base_url + path + '&limit=' + page_size + '&offset=' + offset, { headers });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      if (offset === 0) {
        var range = res.headers.get('content-range');
        var match = range && /\/(\d+)$/.exec(range.trim());
        if (match) exact_total = Number(match[1]);
      }

      var page = await res.json();
      if (!Array.isArray(page)) throw new Error('unexpected response');
      if (page.length === 0) break;

      for (var row of page) {
        if (row && row.user_id != null) ids.add(String(row.user_id));
      }
      offset += page.length;
      if (exact_total !== null && offset >= exact_total) break;
    }

    return ids;
  }

  function find_member_container() {
    for (var i = 0; i < member_selectors.length; i++) {
      var containers = document.querySelectorAll(member_selectors[i]);

      for (var j = 0; j < containers.length; j++) {
        var c = containers[j];

        for (var r = 0; r < row_selectors.length; r++) {
          if (c.querySelector(row_selectors[r])) return c;
        }
      }
    }

    var any = document.querySelectorAll('[class*="member"], [class*="Member"]');
    for (var k = 0; k < any.length; k++) {
      for (var rr = 0; rr < row_selectors.length; rr++) {
        if (any[k].querySelector(row_selectors[rr])) return any[k];
      }
    }

    return null;
  }

  var membercount = {
    id: 'membercount',
    name: 'Member Count',
    description: 'See the amount of total members in a server',
    css_el: null,
    observer: null,
    timer: null,
    refresh_frame: null,
    auth_cache: null,
    logged_no_container: false,

    get_online_ids(cache) {
      if (cache.online && Date.now() < cache.online.expires) return cache.online.promise;

      var snapshot = { expires: Infinity };
      snapshot.promise = fetch_user_ids('/rest/v1/who_online?select=user_id&order=user_id.asc', cache.token)
        .catch(() => null)
        .finally(() => { snapshot.expires = Date.now() + cache_ms; });
      cache.online = snapshot;
      return snapshot.promise;
    },

    async get_counts(server_id) {
      var token = get_token();
      if (this.auth_cache?.token !== token) {
        this.auth_cache = token ? { token: token, counts: new Map(), inflight: new Map(), online: null } : null;
      }
      var cache = this.auth_cache;
      if (!cache) return null;

      var cached = cache.counts.get(server_id);
      if (cached && Date.now() - cached.at < cache_ms) return cached;
      var pending = cache.inflight.get(server_id);
      if (pending) return pending;

      var request = (async () => {
        try {
          var [member_ids, online_ids] = await Promise.all([
            fetch_user_ids('/rest/v1/server_members?server_id=eq.' +
              encodeURIComponent(server_id) + '&select=user_id&order=user_id.asc', token),
            this.get_online_ids(cache)
          ]);

          var online = null;
          if (online_ids) {
            online = 0;
            for (var user_id of member_ids) {
              if (online_ids.has(user_id)) online++;
            }
          }

          var result = { total: member_ids.size, online: online, at: Date.now() };
          cache.counts.delete(server_id);
          cache.counts.set(server_id, result);
          if (cache.counts.size > server_cache_limit) cache.counts.delete(cache.counts.keys().next().value);
          return result;
        } catch (err) {
          console.warn('[MemberCount] fetch failed', err.message);
          return null;
        } finally {
          cache.inflight.delete(server_id);
        }
      })();

      cache.inflight.set(server_id, request);
      return request;
    },

    render_one(container, counts) {
      var row = container.querySelector(':scope > .yp-mc-row');

      if (!counts) {
        if (row) row.remove();
        return;
      }

      if (!row) {
        row = document.createElement('div');
        row.className = 'yp-mc-row';
        row.innerHTML =
          '<span class="yp-mc-stat yp-mc-online" title="Online"><span class="yp-mc-dot"></span><span class="yp-mc-num"></span></span>' +
          '<span class="yp-mc-stat yp-mc-total" title="Members"><span class="yp-mc-dot"></span><span class="yp-mc-num"></span></span>';
        container.insertBefore(row, container.firstChild);
      }

      var online_el = row.querySelector('.yp-mc-online');
      var total_el = row.querySelector('.yp-mc-total');

      if (counts.online === null) {
        online_el.style.display = 'none';
      } else {
        online_el.style.display = 'inline-flex';
        var on_num = online_el.querySelector('.yp-mc-num');
        if (on_num.textContent !== String(counts.online)) {
          on_num.textContent = String(counts.online);
        }
      }

      var tot_num = total_el.querySelector('.yp-mc-num');
      if (tot_num.textContent !== String(counts.total)) {
        tot_num.textContent = String(counts.total);
      }
    },

    async refresh() {
      var container = find_member_container();

      if (!container) {
        if (!this.logged_no_container) {
          console.log('[MemberCount] no member list container found. Trying every 8 seconds.');
          this.logged_no_container = true;
        }
        return;
      }

      this.logged_no_container = false;

      var server_id = active_server();
      if (!server_id) {
        this.render_one(container, null);
        return;
      }

      var pending = this.get_counts(server_id);
      var cache = this.auth_cache;
      var counts = await pending;

      // Avoid rendering a result for a previous server, login or plugin activation.
      if (!this.observer || this.auth_cache !== cache || active_server() !== server_id) return;

      var current_container = find_member_container();
      if (!current_container) return;

      if (counts || !cache) this.render_one(current_container, counts);
    },

    inject_css() {
      if (this.css_el) return;

      var s = document.createElement('style');
      s.id = 'yp-mc-css';
      s.textContent =
        '.yp-mc-row { display: flex; gap: 14px; padding: 8px 12px 4px; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }' +
        '.yp-mc-stat { display: inline-flex; align-items: center; gap: 6px; }' +
        '.yp-mc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; box-sizing: border-box; }' +
        '.yp-mc-online .yp-mc-dot { background: #23a55a; }' +
        '.yp-mc-online .yp-mc-num { color: #23a55a; }' +
        '.yp-mc-total .yp-mc-dot { border: 1.5px solid #80848e; background: transparent; }' +
        '.yp-mc-total .yp-mc-num { color: #80848e; }';

      document.head.appendChild(s);
      this.css_el = s;
    },

    start() {
      if (this.observer) return;

      var self = this;
      this.inject_css();

      this.observer = new MutationObserver(function() {
        if (self.refresh_frame !== null) return;
        self.refresh_frame = requestAnimationFrame(function() {
          self.refresh_frame = null;
          self.refresh();
        });
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      this.timer = setInterval(function() {
        self.refresh();
      }, 8000);

      this.refresh();
      console.log('[MemberCount] armed');
    },

    stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }

      if (this.css_el) {
        this.css_el.remove();
        this.css_el = null;
      }

      document.querySelectorAll('.yp-mc-row').forEach(function(n) {
        n.remove();
      });

      if (this.refresh_frame !== null) {
        cancelAnimationFrame(this.refresh_frame);
        this.refresh_frame = null;
      }
      this.auth_cache = null;
      console.log('[MemberCount] disarmed');
    },
  };

  window.PluginHost.register(membercount);
})();