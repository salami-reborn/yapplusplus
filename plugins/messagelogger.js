// YES.. I USED THE VSCODE AI AUTOCOMPLETE WHILE MAKING THIS!! #salamicancelled

(function () {
  'use strict';

  var base_url = 'https://dnfkuqzddwvtdojzgmdm.supabase.co';
  var anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZmt1cXpkZHd2dGRvanpnbWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2Mzk0ODgsImV4cCI6MjEwNzIxNTQ4OH0.kMZcUf8DgMrYFNGtMPW9SGja2m1cRdMq5WJv5XBNgCU';
  var storage_key = 'yapplus_msg_logger_cache';
  var edit_key = 'yapplus_msg_logger_edits';
  var chunk_size = 50;
  var head_size = 200;
  var heal_ms = 25;
  var channel_settle_ms = 200;

  // icons:
  // to contributors: could yall please use icons from https://lucide.dev? they look fucking PEAK.
  var off_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M4.93 4.929a10 10 0 0 0-1.938 11.412 2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 0 1.099.092 10 10 0 0 0 11.302-1.989"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/></svg>';
  var edit_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.5"/><path d="M16 4h2a2 2 0 0 1 1.73 1"/><path d="M8 18h1"/><path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/></svg>';

  function get_active_channel() {
    var sels = ['.chat-row.active[data-nav-chan]', '.channel-row.active[data-nav-chan]', '[data-nav-chan].active'];
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el) return el.getAttribute('data-nav-chan');
    }
    return null;
  }

  function get_token() { // for supabase requests, you can verify that further in the code
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

  function log_repair(reason, id) {
    if (window.__ml_debug) console.log('[MessageLogger] repair:', reason, id);
  }

  var messagelogger = {
    id: 'messagelogger',
    name: 'Message Logger',
    description: 'OH.. YOU THOUGHT YOU DELETED THAT?? HEH.. I CAN STILL SEE IT!!',
    css_el: null,
    ghosts: new Map(),
    ghost_nodes: new Map(),
    ghost_anchored: new Map(),
    anchor_tried: new Map(),
    ignored_ghosts: new Set(),
    saved_messages: new Map(),
    edited_history: new Map(),
    spawn_times: new Map(),
    last_seen: new Map(),
    stopped: false,
    checking: false,
    check_cursor: 0,
    last_channel: null,
    channel_changed_at: 0,
    stable_channel: null,
    pending_channel: null,
    pending_since: 0,
    channel_read_at: 0,
    check_timer: null,
    paint_timer: null,
    scan_timer: null,
    heal_timer: null,
    edit_timer: null,
    raf_id: null,
    observer: null,
    click_handler: null,
    orig_remove_child: null,
    orig_remove: null,
    orig_replace_children: null,
    wrapped_remove_child: null,
    wrapped_remove: null,
    wrapped_replace_children: null,
    ghost_heal_pending: false,

    load_from_storage() {
      try {
        var raw = JSON.parse(localStorage.getItem(storage_key) || '{}');
        this.saved_messages = new Map(Object.entries(raw));
        var raw_edits = JSON.parse(localStorage.getItem(edit_key) || '{}');
        this.edited_history = new Map(Object.entries(raw_edits));
      } catch (e) {
        log_repair('storage-load-error', e && e.message ? e.message : e);
      }
    },

    save_to_storage() {
      try {
        var obj = {};
        this.saved_messages.forEach(function(v, k) {
          obj[k] = v;
        });
        localStorage.setItem(storage_key, JSON.stringify(obj));

        var edit_obj = {};
        this.edited_history.forEach(function(v, k) {
          edit_obj[k] = v;
        });
        localStorage.setItem(edit_key, JSON.stringify(edit_obj));
      } catch (e) {
        log_repair('storage-save-error', e && e.message ? e.message : e);
      }
    },

    remove_node(node) {
      if (!node) return;
      if (this.orig_remove) this.orig_remove.call(node);
      else node.remove();
    },

    schedule_ghost_heal() {
      if (this.stopped || this.ghost_heal_pending) return;

      this.ghost_heal_pending = true;
      var self = this;

      var run = function() {
        self.ghost_heal_pending = false;
        if (!self.stopped) self.heal_ghosts();
      };

      if (typeof window.queueMicrotask === 'function') {
        window.queueMicrotask(run);
      } else {
        Promise.resolve().then(run);
      }
    },

    pick_container() {
      var all = document.querySelectorAll('.messages-inner');
      if (all.length === 0) return null;
      if (all.length === 1) return all[0];

      for (var i = 0; i < all.length; i++) {
        if (all[i].getClientRects().length > 0) return all[i];
      }

      return all[0];
    },

    handle_click(e) {
      var btn = null;
      if (typeof e.composedPath === 'function') {
        var path = e.composedPath();

        for (var i = 0; i < path.length; i++) {
          var path_node = path[i];

          if (path_node &&
              path_node.nodeType === 1 &&
              path_node.classList &&
              path_node.classList.contains('yp-ml-erase-tag')) {
            btn = path_node;
            break;
          }
        }
      }

      if (!btn) {
        var target = e.target;

        if (target && target.nodeType !== 1) {
          target = target.parentElement;
        }

        if (!target || !target.closest) return;
        btn = target.closest('.yp-ml-erase-tag');
      }

      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      var wrapper = btn.closest('[data-yp-ghost]');
      if (!wrapper) return;

      var id = wrapper.getAttribute('data-message-id');

      if (id) {
        this.ignored_ghosts.add(id);
        this.ghosts.delete(id);
        this.ghost_nodes.delete(id);
        this.ghost_anchored.delete(id);
        this.anchor_tried.delete(id);
        this.saved_messages.delete(id);
        this.edited_history.delete(id);
        this.last_seen.delete(id);
        this.save_to_storage();
      }

      this.remove_node(wrapper);
    },

    // autocomplete dude pls make me the injectcss function after i type "// now" i forgot :sob:
    // now
    inject_css() {
      if (this.css_el) return;
      var s = document.createElement('style');
      s.id = 'yp-ml-css';
      s.textContent =
        '.yp-ml-ghost { opacity: 0.65; background: rgba(255,75,75,0.08); border-left: 3px solid #ff4b4b; padding-left: 8px; margin-left: -11px; }' +
        '.yp-ml-tag-wrap { display: inline-flex; align-items: center; gap: 6px; margin-top: 2px; position: relative; z-index: 2147483647; pointer-events: auto !important; }' +
        '.yp-ml-tag { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #ff4b4b; }' +
        '.yp-ml-erase-tag { background: transparent; border: none; padding: 2px; color: #ff4b4b; cursor: pointer !important; display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; opacity: 0.7; position: relative; z-index: 2147483647; pointer-events: auto !important; touch-action: manipulation; }' +
        '.yp-ml-erase-tag svg { pointer-events: none !important; }' +
        '.yp-ml-erase-tag:hover { opacity: 1; background: rgba(255,75,75,0.2); }' +
        '.msg-block[data-yp-ghost] + .msg-block .msg.grouped { margin-top: 6px !important; }' +
        '.yp-ml-edited-wrap { display: flex; flex-direction: column; gap: 4px; margin-top: 2px; }' +
        '.yp-ml-edited-old { opacity: 0.5; transform: scale(0.8); transform-origin: left center; display: flex; align-items: center; gap: 6px; font-style: italic; }' +
        '.yp-ml-edited-new { opacity: 1; }' +
        '[data-yp-ghost="1"] { opacity: 1 !important; visibility: visible !important; animation: none !important; transition: none !important; }' +
        '[data-yp-ghost="1"] * { animation: none !important; transition: none !important; }' +
        '[data-yp-ghost="1"] .yp-ml-tag-wrap, [data-yp-ghost="1"] .yp-ml-erase-tag { pointer-events: auto !important; }' +
        '[data-yp-ghost="1"] .yp-ml-ghost, [data-yp-ghost="1"].yp-ml-ghost { opacity: 0.65 !important; visibility: visible !important; }';

      (document.head || document.documentElement).appendChild(s);
      this.css_el = s;
    },

    // alr thanks
    hook_react() {
      if (this.orig_remove_child) return;
      var self = this;
      this.rescue_ghosts = function(subtree) {
        if (self.stopped || !subtree || !subtree.querySelectorAll) return;
        var container = self.pick_container();
        if (!container || subtree === container || subtree.contains(container)) return;

        var ghosts = [];

        if (subtree.nodeType === 1 && subtree.hasAttribute('data-yp-ghost')) {
          ghosts.push(subtree);
        }

        ghosts = ghosts.concat(Array.from(subtree.querySelectorAll('[data-yp-ghost]')));

        ghosts.forEach(function(g) {
          if (g.parentNode && self.ghosts.has(g.getAttribute('data-message-id'))) {
            container.appendChild(g);
          }
        });
      };

      this.orig_remove_child = Node.prototype.removeChild;

      this.wrapped_remove_child = function(child) {
        if (!self.stopped && child && child.nodeType === 1 && child.hasAttribute('data-yp-ghost')) {
          var result = self.orig_remove_child.call(this, child);
          self.schedule_ghost_heal();
          return result;
        }

        if (!self.stopped && child && child.nodeType === 1) {
          self.rescue_ghosts(child);
        }

        return self.orig_remove_child.call(this, child);
      };

      Node.prototype.removeChild = this.wrapped_remove_child;

      this.orig_remove = Element.prototype.remove;

      this.wrapped_remove = function() {
        if (!self.stopped && this.nodeType === 1 && this.hasAttribute('data-yp-ghost')) {
          var result = self.orig_remove.call(this);
          self.schedule_ghost_heal();
          return result;
        }

        if (!self.stopped) self.rescue_ghosts(this);

        return self.orig_remove.call(this);
      };

      Element.prototype.remove = this.wrapped_remove;

      this.orig_replace_children = Element.prototype.replaceChildren;

      this.wrapped_replace_children = function() {
        if (!self.stopped && this.nodeType === 1 && this.hasAttribute('data-yp-ghost')) {
          var ghost_result = self.orig_replace_children.apply(this, arguments);
          self.schedule_ghost_heal();
          return ghost_result;
        }

        if (!self.stopped && this.classList && this.classList.contains('messages-inner')) {
          var list_result = self.orig_replace_children.apply(this, arguments);
          self.schedule_ghost_heal();
          return list_result;
        }

        if (!self.stopped) self.rescue_ghosts(this);

        return self.orig_replace_children.apply(this, arguments);
      };

      Element.prototype.replaceChildren = this.wrapped_replace_children;
    },

    update_channel() {
      var now = Date.now();

      if (now - this.channel_read_at >= 50) {
        this.channel_read_at = now;
        var raw = get_active_channel();

        if (raw !== this.pending_channel) {
          this.pending_channel = raw;
          this.pending_since = now;
        }

        if (raw && raw !== this.stable_channel && now - this.pending_since >= channel_settle_ms) {
          this.stable_channel = raw;
          this.purge_foreign_ghosts();
        }
      }

      return this.stable_channel;
    },

    purge_foreign_ghosts() {
      var self = this;

      document.querySelectorAll('[data-yp-ghost]').forEach(function(g) {
        var ghost_channel = g.getAttribute('data-channel-id');

        if (ghost_channel && ghost_channel !== 'unknown' && ghost_channel !== self.stable_channel) {
          self.remove_node(g);
        }
      });
    },

    block_of(container, id) {
      if (!id) return null;

      var messages = container.querySelectorAll('.msg[data-message-id]');

      for (var i = 0; i < messages.length; i++) {
        if (messages[i].getAttribute('data-message-id') === String(id)) {
          return messages[i].closest('.msg-block');
        }
      }

      return null;
    },

    anchor_ghost(container, node, data) {
      var next_block = this.block_of(container, data.next_id);

      if (next_block && next_block !== node && next_block.parentNode) {
        if (node.nextSibling !== next_block || node.parentNode !== next_block.parentNode) {
          next_block.parentNode.insertBefore(node, next_block);
        }
        return true;
      }

      var prev_block = this.block_of(container, data.prev_id);

      if (prev_block && prev_block !== node && prev_block.parentNode) {
        if (prev_block.nextSibling !== node || node.parentNode !== prev_block.parentNode) {
          prev_block.parentNode.insertBefore(node, prev_block.nextSibling);
        }
        return true;
      }

      return false;
    },

    insert_fallback(container, node) {
      var pin = container.querySelector('.msg-pin');

      if (pin && pin.parentNode) {
        pin.parentNode.insertBefore(node, pin);
      } else {
        container.appendChild(node);
      }
    },

    build_ghost(id, data) {
      var temp = document.createElement('div');
      temp.innerHTML = data.html;

      var clone = temp.firstElementChild;
      if (!clone) return null;

      clone.querySelectorAll('script, iframe, object, embed').forEach(function(el) {
        el.remove();
      });

      [clone].concat(Array.from(clone.querySelectorAll('*'))).forEach(function(el) {
        Array.from(el.attributes || []).forEach(function(attr) {
          var name = attr.name.toLowerCase();
          var value = String(attr.value || '').trim().toLowerCase();

          if (/^on[a-z]+$/i.test(name) ||
              ((name === 'href' || name === 'src' || name === 'xlink:href') && value.indexOf('javascript:') === 0)) {
            el.removeAttribute(attr.name);
          }
        });
      });

      clone.setAttribute('data-yp-ghost', '1');
      clone.setAttribute('data-message-id', id);
      clone.setAttribute('data-channel-id', data.channel || 'unknown');

      var inner = clone.querySelector('.msg');
      (inner || clone).classList.add('yp-ml-ghost');

      var actions = clone.querySelector('.msg-actions');
      if (actions) actions.remove();

      var body = clone.querySelector('.msg-body') || inner || clone;

      var tag_wrap = document.createElement('div');
      tag_wrap.className = 'yp-ml-tag-wrap';

      var tag = document.createElement('span');
      tag.className = 'yp-ml-tag';
      tag.textContent = 'Deleted';
      tag_wrap.appendChild(tag);

      var btn_tag = document.createElement('button');
      btn_tag.type = 'button';
      btn_tag.className = 'yp-ml-erase-tag';
      btn_tag.innerHTML = off_icon;
      btn_tag.title = 'Erase from logs';
      btn_tag.setAttribute('aria-label', 'Erase from logs');
      tag_wrap.appendChild(btn_tag);

      body.appendChild(tag_wrap);

      return clone;
    },

    ghost_intact(node, id) {
      return node.getAttribute('data-yp-ghost') === '1' &&
        node.getAttribute('data-message-id') === id &&
        !node.hidden &&
        node.style.display !== 'none' &&
        node.style.visibility !== 'hidden' &&
        node.querySelector('.yp-ml-erase-tag') !== null &&
        (node.classList.contains('yp-ml-ghost') || node.querySelector('.yp-ml-ghost') !== null);
    },

    heal_ghosts() {
      if (this.stopped) return;

      var channel = this.update_channel();
      if (this.ghosts.size === 0) return;

      var container = this.pick_container();
      if (!container) return;

      var self = this;
      var now = Date.now();

      container.querySelectorAll('[data-yp-ghost]').forEach(function(el) {
        var gid = el.getAttribute('data-message-id');

        if (!gid || !self.ghosts.has(gid) || self.ignored_ghosts.has(gid) || self.ghost_nodes.get(gid) !== el) {
          log_repair('orphan', gid);
          self.remove_node(el);
        }
      });

      this.ghosts.forEach(function(data, id) {
        try {
          if (self.ignored_ghosts.has(id)) return;

          if (channel && data.channel && data.channel !== 'unknown' && data.channel !== channel) return;

          if ((!data.channel || data.channel === 'unknown') && channel) {
            data.channel = channel;
          }

          var node = self.ghost_nodes.get(id);

          if (node && !self.ghost_intact(node, id)) {
            log_repair('corrupt', id);
            self.remove_node(node);
            self.ghost_nodes.delete(id);
            self.ghost_anchored.delete(id);
            node = null;
          }

          if (!node) {
            node = self.build_ghost(id, data);
            if (!node) return;
            self.ghost_nodes.set(id, node);
          }

          var channel_value = data.channel || 'unknown';

          if (node.getAttribute('data-channel-id') !== channel_value) {
            node.setAttribute('data-channel-id', channel_value);
          }

          var attached = node.parentNode !== null && container.contains(node);

          if (!attached) {
            if (self.ghost_anchored.has(id)) log_repair('detached', id);

            var anchored = self.anchor_ghost(container, node, data);

            if (!(node.parentNode !== null && container.contains(node))) {
              self.insert_fallback(container, node);
            }

            self.ghost_anchored.set(id, anchored);
            self.anchor_tried.set(id, now);
          } else if (!self.ghost_anchored.get(id) && now - (self.anchor_tried.get(id) || 0) >= 250) {
            self.ghost_anchored.set(id, self.anchor_ghost(container, node, data));
            self.anchor_tried.set(id, now);
          }
        } catch (e) {
          log_repair('heal-error', e && e.message ? e.message : e);
        }
      });
    },

    async check_database() {
      if (this.stopped || this.checking) return;

      var token = get_token();
      if (!token || this.saved_messages.size === 0) return;

      var self = this;
      var raw_channel = get_active_channel();
      var channel = this.update_channel();

      if (raw_channel && channel && raw_channel !== channel) return;

      var now = Date.now();
      var candidates = [];

      this.saved_messages.forEach(function(data, id) {
        if (self.ghosts.has(id) || self.ignored_ghosts.has(id)) return;

        if (channel && data.channel && data.channel !== 'unknown' && data.channel !== channel) return;

        var spawn = self.spawn_times.get(id) || 0;
        if ((now - spawn) <= 1500) return;

        candidates.push(id);
      });

      if (candidates.length === 0) return;

      candidates.sort(function(a, b) {
        return (self.last_seen.get(b) || 0) - (self.last_seen.get(a) || 0);
      });

      var ids = candidates.slice(0, head_size);
      var rest = candidates.slice(head_size);

      if (rest.length > 0) {
        var start_at = this.check_cursor % rest.length;
        var take = Math.min(chunk_size, rest.length);

        for (var n = 0; n < take; n++) {
          ids.push(rest[(start_at + n) % rest.length]);
        }

        this.check_cursor = (start_at + take) % rest.length;
      }

      this.checking = true;
      var added = false;

      try {
        for (var i = 0; i < ids.length; i += chunk_size) {
          if (this.stopped) break;

          var chunk = ids.slice(i, i + chunk_size);

          var res = await fetch(base_url + '/rest/v1/messages?id=in.(' + chunk.join(',') + ')&select=id', {
            headers: {
              apikey: window.__yapAnonKey || anon_key,
              Authorization: 'Bearer ' + token
            }
          });

          if (!res.ok) continue;

          var rows = await res.json();
          if (!Array.isArray(rows)) continue;

          var existing = new Set(rows.map(function(r) {
            return String(r.id);
          }));

          chunk.forEach(function(id) {
            if (existing.has(id)) return;
            if (self.ghosts.has(id) || self.ignored_ghosts.has(id)) return;

            var data = self.saved_messages.get(id);

            if (data) {
              self.ghosts.set(id, data);
              added = true;
            }
          });
        }
      } catch (e) {
        log_repair('database-error', e && e.message ? e.message : e);
      } finally {
        this.checking = false;
      }

      if (added && !this.stopped) {
        this.heal_ghosts();
      }
    },

    apply_edits() {
      if (this.stopped) return;
      if (this.edited_history.size === 0) return;

      var container = this.pick_container();
      if (!container) return;

      container.querySelectorAll('.msg-block:not([data-yp-ghost])').forEach(function(block) {
        var msg = block.querySelector('.msg[data-message-id]');
        if (!msg) return;

        var id = msg.getAttribute('data-message-id');
        var edits = messagelogger.edited_history.get(id);

        if (edits && edits.length > 0) {
          var text_container = msg.querySelector('.msg-text');
          if (!text_container) return;

          var wrap = text_container.querySelector('.yp-ml-edited-wrap');
          var target_text = edits[edits.length - 1];

          if (wrap) {
            var existing_old = wrap.querySelector('.yp-ml-edited-old span:last-child');
            if (existing_old && existing_old.textContent === target_text) return;
          }

          if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'yp-ml-edited-wrap';

            var old_text = document.createElement('div');
            old_text.className = 'yp-ml-edited-old';

            var icon = document.createElement('span');
            icon.innerHTML = edit_icon;
            icon.style.display = 'inline-flex';
            old_text.appendChild(icon);

            var old_span = document.createElement('span');
            old_text.appendChild(old_span);

            var new_text = document.createElement('div');
            new_text.className = 'yp-ml-edited-new';

            wrap.appendChild(old_text);
            wrap.appendChild(new_text);

            var live_html = text_container.innerHTML;
            text_container.innerHTML = '';
            text_container.appendChild(wrap);

            if (!new_text.innerHTML) {
              new_text.innerHTML = live_html;
            }
          }

          var old_span_el = wrap.querySelector('.yp-ml-edited-old span:last-child');
          old_span_el.textContent = target_text;
        }
      });
    },

    scan_dom() {
      if (this.stopped) return;

      var raw_channel = get_active_channel();
      var stable_channel = this.update_channel();

      if (raw_channel && stable_channel && raw_channel !== stable_channel) return;

      var channel = stable_channel || raw_channel || 'unknown';

      if (channel !== this.last_channel) {
        this.last_channel = channel;
        this.channel_changed_at = Date.now();
      }

      if (Date.now() - this.channel_changed_at < 800) return;

      var container = this.pick_container();
      if (!container) return;

      var changed = false;

      container.querySelectorAll('.msg-block:not([data-yp-ghost])').forEach(function(block) {
        var msg = block.querySelector('.msg[data-message-id]');
        if (!msg) return;

        var id = msg.getAttribute('data-message-id');
        var text_container = msg.querySelector('.msg-text');

        if (id && text_container) {
          messagelogger.last_seen.set(id, Date.now());

          var has_attachment = block.querySelector('.attachment, .file-card, img, video, audio, .embed') !== null;
          var spawn_time = messagelogger.spawn_times.get(id);

          if (!spawn_time) {
            messagelogger.spawn_times.set(id, Date.now());
            spawn_time = Date.now();
          }

          if (has_attachment && (Date.now() - spawn_time < 1000)) {
            return;
          }

          var new_text_el = text_container.querySelector('.yp-ml-edited-new');
          var current_text = new_text_el ? new_text_el.textContent.trim() : text_container.textContent.trim();

          var existing = messagelogger.saved_messages.get(id);

          var prev_id = null;
          var next_id = null;
          var prev_el = block.previousElementSibling;
          var next_el = block.nextElementSibling;

          while (prev_el && !prev_id) {
            var prev_msg = prev_el.matches && prev_el.matches('.msg-block')
              ? prev_el.querySelector('.msg[data-message-id]')
              : null;

            if (prev_msg) {
              prev_id = prev_msg.getAttribute('data-message-id');
            }

            prev_el = prev_el.previousElementSibling;
          }

          while (next_el && !next_id) {
            var next_msg = next_el.matches && next_el.matches('.msg-block')
              ? next_el.querySelector('.msg[data-message-id]')
              : null;

            if (next_msg) {
              next_id = next_msg.getAttribute('data-message-id');
            }

            next_el = next_el.nextElementSibling;
          }

          if (!existing) {
            messagelogger.saved_messages.set(id, {
              html: block.outerHTML,
              channel: channel,
              text: current_text,
              prev_id: prev_id,
              next_id: next_id
            });

            changed = true;
          } else {
            if ((!existing.channel || existing.channel === 'unknown') && channel !== 'unknown') {
              existing.channel = channel;
            }

            if (existing.text !== undefined && existing.text !== current_text && current_text !== '') {
              var hist = messagelogger.edited_history.get(id) || [];

              if (hist[hist.length - 1] !== existing.text) {
                hist.push(existing.text);
                messagelogger.edited_history.set(id, hist);
                changed = true;
              }

              messagelogger.spawn_times.set(id, Date.now());
            }

            if (!text_container.querySelector('.yp-ml-edited-wrap')) {
              existing.html = block.outerHTML;
            }

            existing.text = current_text;
            existing.prev_id = prev_id;
            existing.next_id = next_id;
          }
        }
      });

      if (changed) {
        this.save_to_storage();
      }
    },

    schedule_paint() {
      if (this.paint_timer) return;

      var self = this;

      this.paint_timer = setTimeout(function() {
        self.paint_timer = null;
        self.paint();
      }, 80);
    },

    paint() {
      if (this.stopped) return;
      this.heal_ghosts();
      this.apply_edits();
    },

    start() {
      if (this.check_timer) return;

      var self = this;

      this.stopped = false;
      this.checking = false;
      this.check_cursor = 0;
      this.last_channel = null;
      this.channel_changed_at = 0;
      this.stable_channel = null;
      this.pending_channel = null;
      this.pending_since = 0;
      this.channel_read_at = 0;

      // dude i forgot to add ts while testing and oh fuck rest in piece my storage lol (fixed)
      localStorage.removeItem(storage_key);
      localStorage.removeItem(edit_key);

      this.ghosts.clear();
      this.ghost_nodes.clear();
      this.ghost_anchored.clear();
      this.anchor_tried.clear();
      this.ignored_ghosts.clear();
      this.saved_messages.clear();
      this.edited_history.clear();
      this.spawn_times.clear();
      this.last_seen.clear();

      this.load_from_storage();
      this.inject_css();
      this.hook_react();

      this.click_handler = function(e) {
        self.handle_click(e);
      };

      // Use click rather than pointerdown so the native button activation isn't interrupted.
      document.addEventListener('click', this.click_handler, true);

      this.observer = new MutationObserver(function() {
        self.heal_ghosts();
        self.schedule_paint();
      });

      this.observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });

      var frame = function() {
        if (self.stopped) return;

        self.heal_ghosts();
        self.raf_id = requestAnimationFrame(frame);
      };

      this.raf_id = requestAnimationFrame(frame);

      this.heal_ghosts();

      this.scan_timer = setInterval(function() {
        self.scan_dom();
      }, 500);

      this.check_timer = setInterval(function() {
        self.check_database();
      }, 1250);

      this.heal_timer = setInterval(function() {
        self.heal_ghosts();
      }, heal_ms);

      this.edit_timer = setInterval(function() {
        self.paint();
      }, 1000);
    },

    stop() {
      this.stopped = true;

      if (this.check_timer) {
        clearInterval(this.check_timer);
        this.check_timer = null;
      }

      if (this.scan_timer) {
        clearInterval(this.scan_timer);
        this.scan_timer = null;
      }

      if (this.heal_timer) {
        clearInterval(this.heal_timer);
        this.heal_timer = null;
      }

      if (this.edit_timer) {
        clearInterval(this.edit_timer);
        this.edit_timer = null;
      }

      if (this.paint_timer) {
        clearTimeout(this.paint_timer);
        this.paint_timer = null;
      }

      if (this.raf_id !== null) {
        cancelAnimationFrame(this.raf_id);
        this.raf_id = null;
      }

      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      if (this.css_el) {
        this.css_el.remove();
        this.css_el = null;
      }

      if (this.click_handler) {
        document.removeEventListener('click', this.click_handler, true);
        this.click_handler = null;
      }

      if (this.orig_remove_child) {
        if (Node.prototype.removeChild === this.wrapped_remove_child) {
          Node.prototype.removeChild = this.orig_remove_child;
        }

        this.orig_remove_child = null;
        this.wrapped_remove_child = null;
      }

      if (this.orig_remove) {
        if (Element.prototype.remove === this.wrapped_remove) {
          Element.prototype.remove = this.orig_remove;
        }

        this.orig_remove = null;
        this.wrapped_remove = null;
      }

      if (this.orig_replace_children) {
        if (Element.prototype.replaceChildren === this.wrapped_replace_children) {
          Element.prototype.replaceChildren = this.orig_replace_children;
        }

        this.orig_replace_children = null;
        this.wrapped_replace_children = null;
      }

      this.rescue_ghosts = null;

      document.querySelectorAll('[data-yp-ghost]').forEach(function(n) {
        n.remove();
      });

      this.ghosts.clear();
      this.ghost_nodes.clear();
      this.ghost_anchored.clear();
      this.anchor_tried.clear();
      this.ignored_ghosts.clear();
      this.saved_messages.clear();
      this.edited_history.clear();
      this.spawn_times.clear();
      this.last_seen.clear();

      localStorage.removeItem(storage_key);
      localStorage.removeItem(edit_key);
    },
  };

  window.PluginHost.register(messagelogger);
})(); 