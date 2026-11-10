(function () {
  'use strict';

  var anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZmt1cXpkZHd2dGRvanpnbWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2Mzk0ODgsImV4cCI6MjEwNzIxNTQ4OH0.kMZcUf8DgMrYFNGtMPW9SGja2m1cRdMq5WJv5XBNgCU';
  var base_url = 'https://dnfkuqzddwvtdojzgmdm.supabase.co';
  var cache_ms = 30000;
  var page_size = 1000;
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

  async function fetch_all_rows(path) {
    var token = get_token();
    if (!token) throw new Error('no token');

    var all_rows = [];
    var offset = 0;
    var exact_total = null;

    while (true) {
      var separator = path.indexOf('?') === -1 ? '?' : '&';
      var url = base_url + path + separator +
        'limit=' + page_size + '&offset=' + offset;

      var res = await fetch(url, {
        headers: {
          apikey: get_anon(),
          Authorization: 'Bearer ' + token,
          Prefer: 'count=exact'
        }
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      var content_range = res.headers && res.headers.get
        ? res.headers.get('content-range')
        : null;

      if (content_range) {
        var match = /\/(\d+|\*)$/.exec(content_range.trim());
        if (match && match[1] !== '*') {
          var parsed_total = Number(match[1]);
          if (Number.isFinite(parsed_total)) exact_total = parsed_total;
        }
      }

      var page = await res.json();
      if (!Array.isArray(page)) throw new Error('unexpected response');

      if (page.length === 0) break;

      all_rows.push.apply(all_rows, page);
      offset += page.length;

      // If the server supplies the exact count, stop as soon as every row is fetched.
      if (exact_total !== null && offset >= exact_total) break;
    }

    return all_rows;
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
    cache: new Map(),
    inflight: new Map(),
    logged_no_container: false,

    async get_counts(server_id) {
      var cached = this.cache.get(server_id);
      if (cached && Date.now() - cached.at < cache_ms) return cached;

      var pending = this.inflight.get(server_id);
      if (pending) return pending;

      var self = this;

      var request = (async function() {
        try {
          var members = await fetch_all_rows(
            '/rest/v1/server_members?server_id=eq.' +
            encodeURIComponent(server_id) +
            '&select=user_id&order=user_id.asc'
          );

          // Count unique user IDs rather than the length of a single capped response.
          var member_ids = new Set();
          members.forEach(function(member) {
            if (member && member.user_id != null) {
              member_ids.add(String(member.user_id));
            }
          });

          var online = null;

          try {
            var online_rows = await fetch_all_rows(
              '/rest/v1/who_online?select=user_id&order=user_id.asc'
            );

            var online_ids = new Set();
            online_rows.forEach(function(row) {
              if (row && row.user_id != null) {
                online_ids.add(String(row.user_id));
              }
            });

            online = 0;
            member_ids.forEach(function(user_id) {
              if (online_ids.has(user_id)) online++;
            });
          } catch (e) {
            // Keep showing the total if the online-user endpoint is unavailable.
          }

          var result = {
            total: member_ids.size,
            online: online,
            at: Date.now()
          };

          self.cache.set(server_id, result);
          return result;
        } catch (err) {
          console.warn('[MemberCount] fetch failed', err.message);
          return null;
        }
      })();

      this.inflight.set(server_id, request);

      try {
        return await request;
      } finally {
        if (this.inflight.get(server_id) === request) {
          this.inflight.delete(server_id);
        }
      }
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

      var counts = await this.get_counts(server_id);

      // Avoid rendering a result for the previous server after a quick server switch.
      if (active_server() !== server_id) return;

      var current_container = find_member_container();
      if (!current_container) return;

      if (counts) this.render_one(current_container, counts);
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
        self.refresh();
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

      this.cache.clear();
      this.inflight.clear();
      console.log('[MemberCount] disarmed');
    },
  };

  window.PluginHost.register(membercount);
})();