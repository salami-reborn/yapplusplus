// https://tenor.com/view/mahito-jjk-modulo-jujutsu-kaisen-modulo-anime-gif-2454758343931293959

(function () {
  'use strict';







  var storage_key = 'yapplus_msg_logger_cache';
  var edit_key = 'yapplus_msg_logger_edits';
  var edit_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.5"/><path d="M16 4h2a2 2 0 0 1 1.73 1"/><path d="M8 18h1"/><path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/></svg>';







  
  function get_active_channel() {
    var sels = ['.chat-row.active[data-nav-chan]', '.channel-row.active[data-nav-chan]', '[data-nav-chan].active'];
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el) return el.getAttribute('data-nav-chan');
    }
    return null;
  }
  var messagelogger = {
    id: 'messagelogger',
    name: 'Message Logger',
    description: 'Oh you thought you edited that.. I CAN STILL SEE IT YOU FOOL!',
    css_el: null,
    saved_messages: new Map(),
    edited_history: new Map(),
    stopped: false,
    edit_timer: null,
    paint_timer: null,
    scan_timer: null,
    load_from_storage() {
      try {
        var raw_edits = JSON.parse(localStorage.getItem(edit_key) || '{}');
        this.edited_history = new Map(Object.entries(raw_edits));
      } catch (e) {}
    },

    save_to_storage() {
      try {
        var edit_obj = {};
        this.edited_history.forEach(function(v, k) {
          edit_obj[k] = v;
        });
        localStorage.setItem(edit_key, JSON.stringify(edit_obj));
      } catch (e) {}
    },

    inject_css() {
      if (this.css_el) return;
      var s = document.createElement('style');
      s.id = 'yp-ml-css';
      s.textContent =
        '.yp-ml-edited-wrap { display: flex; flex-direction: column; gap: 4px; margin-top: 2px; }' +
        '.yp-ml-edited-old { opacity: 0.5; transform: scale(0.8); transform-origin: left center; display: flex; align-items: center; gap: 6px; font-style: italic; }' +
        '.yp-ml-edited-new { opacity: 1; }';
      (document.head || document.documentElement).appendChild(s);
      this.css_el = s;
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

    pick_container() {
      var all = document.querySelectorAll('.messages-inner');
      if (all.length === 0) return null;
      if (all.length === 1) return all[0];

      for (var i = 0; i < all.length; i++) {
        if (all[i].getClientRects().length > 0) return all[i];
      }

      return all[0];
    },

    scan_dom() {
      if (this.stopped) return;

      var channel = get_active_channel() || 'unknown';
      var container = this.pick_container();
      if (!container) return;

      var changed = false;

      container.querySelectorAll('.msg-block:not([data-yp-ghost])').forEach(function(block) {
        var msg = block.querySelector('.msg[data-message-id]');
        if (!msg) return;

        var id = msg.getAttribute('data-message-id');
        var text_container = msg.querySelector('.msg-text');

        if (id && text_container) {
          var new_text_el = text_container.querySelector('.yp-ml-edited-new');
          var current_text = new_text_el ? new_text_el.textContent.trim() : text_container.textContent.trim();

          var existing = messagelogger.saved_messages.get(id);

          if (!existing) {
            messagelogger.saved_messages.set(id, {
              channel: channel,
              text: current_text
            });
          } else {
            if (existing.text !== undefined && existing.text !== current_text && current_text !== '') {
              var hist = messagelogger.edited_history.get(id) || [];

              if (hist[hist.length - 1] !== existing.text) {
                hist.push(existing.text);
                messagelogger.edited_history.set(id, hist);
                changed = true;
              }

              existing.text = current_text;
            }
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
      this.apply_edits();
    },

    start() {
      if (this.edit_timer) return;

      var self = this;

      this.stopped = false;

      localStorage.removeItem(edit_key);

      this.saved_messages.clear();
      this.edited_history.clear();

      this.load_from_storage();
      this.inject_css();

      this.observer = new MutationObserver(function() {
        self.schedule_paint();
      });

      this.observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });

      this.scan_timer = setInterval(function() {
        self.scan_dom();
      }, 500);

      this.edit_timer = setInterval(function() {
        self.paint();
      }, 1000);
    },

    stop() {
      this.stopped = true;

      if (this.scan_timer) {
        clearInterval(this.scan_timer);
        this.scan_timer = null;
      }

      if (this.edit_timer) {
        clearInterval(this.edit_timer);
        this.edit_timer = null;
      }

      if (this.paint_timer) {
        clearTimeout(this.paint_timer);
        this.paint_timer = null;
      }

      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      if (this.css_el) {
        this.css_el.remove();
        this.css_el = null;
      }

      this.saved_messages.clear();
      this.edited_history.clear();

      localStorage.removeItem(edit_key);
    },
  };

  window.PluginHost.register(messagelogger);
})();
