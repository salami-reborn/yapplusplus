(function () {
  'use strict';

  var ROOT_SEL = '.overlay, .modal, [role = "dialog"], [role = "alertdialog"]';
  var BTN_SEL = 'button, [role = "button"], a.btn, .btn';
  var CSS_ID = 'yp-alwaystrust-css';
  var HIDE_ATTR = 'data-yp-alwaystrust';
  var DONE_ATTR = 'data-yp-alwaystrust-done';

  var WARN_RE = new RegExp([
    'leav(e|ing)\\s+(yapp?in|yapper|the app|this app|the site|this site)',
    'external\\s+(link|site|website|url)',
    'untrusted',
    'suspicious',
    'potentially\\s+(harmful|dangerous|unsafe|malicious)',
    'unsafe\\s+(link|file|site)',
    'harmful\\s+(link|file)',
    'dangerous\\s+(link|file)',
    'malicious',
    'be careful',
    'you\\s+(are|\u2019re|\'re)\\s+about\\s+to\\s+(open|visit|leave|download|go)',
    'are you sure you want to\\s+(open|visit|go to|download|follow)',
    '(this|the)\\s+(file|link|site|website)\\s+(may|might|could)\\s+(be\\s+)?(harm|danger|unsafe|contain|damage)',
    'trust\\s+(this|the)\\s+(link|site|domain|file|website)'
  ].join('|'), 'i');

  var YES_RE = /^(continue|proceed|open( link| anyway| file)?|visit( site| anyway)?|go( to (site|link|website))?|yes|ok(ay)?|trust|download( anyway)?|i understand|accept|confirm|sure|run|keep)\b/i;
  var NO_RE = /cancel|close|back|dismiss|nevermind|never mind|\bno\b|\bstay\b|decline|deny|delete|remove|block|report|\u00d7|\u2715/i;
  var NO_CLASS_RE = /(^|\s)(ghost|secondary|cancel|close|link)(\s|$)/i;

  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  function injectCss() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = '[' + HIDE_ATTR + ']{opacity:0!important;pointer-events:none!important;transition:none!important;animation:none!important;}';
    document.head.appendChild(s);
  }

  function warningModal(el) {
    var text = norm(el.textContent);
    if (!text || text.length > 600) return false;
    if (!WARN_RE.test(text)) return false;
    if (el.querySelector('input[type = "text"], input[type = "password"], input[type = "email"], textarea, select')) return false;
    return true;
  }

  function findConfirm(el) {
    var buttons = Array.prototype.slice.call(el.querySelectorAll(BTN_SEL));
    var good = buttons.filter(function (b) {
      var label = norm(b.textContent || b.getAttribute('aria-label'));
      if (!label || label.length > 30) return false;
      if (NO_RE.test(label)) return false;
      if (NO_CLASS_RE.test(b.className && b.className.baseVal != null ? b.className.baseVal : (b.className || ''))) return false;
      return YES_RE.test(label);
    });
    return good[0] || null;
  }

  var alwaystrust = {
    id: 'alwaystrust',
    name: 'Always Trust',
    description: 'Removes the annoying untrusted domain and suspicious file popup. (Credits: @frejablehhh)',
    observer: null,
    timers: [],

    handle(node) {
      if (!node || node.nodeType !== 1) return;
      var self = this;
      var roots = [];
      if (node.matches && node.matches(ROOT_SEL)) roots.push(node);
      if (node.querySelectorAll) roots = roots.concat(Array.prototype.slice.call(node.querySelectorAll(ROOT_SEL)));
      roots.forEach(function (el) {
        if (el.hasAttribute(DONE_ATTR)) return;

        var outer = el.closest('.overlay') || el;
        if (outer.hasAttribute(DONE_ATTR)) return;

        [0, 80, 250].forEach(function (delay) {
          var t = setTimeout(function () { self.attempt(el, outer); }, delay);
          self.timers.push(t);
        });
      });
    },

    attempt(el, outer) {
      if (!el.isConnected || outer.hasAttribute(DONE_ATTR)) return;
      try {
        if (!warningModal(el)) return;
        var btn = findConfirm(el);
        if (!btn) return;
        outer.setAttribute(DONE_ATTR, '1');
        el.setAttribute(DONE_ATTR, '1');
        outer.setAttribute(HIDE_ATTR, '1');
        btn.click();

        var t = setTimeout(function () { if (outer.isConnected) outer.removeAttribute(HIDE_ATTR); }, 700);
        this.timers.push(t);
        console.log('[Yap++ AlwaysTrust] auto-confirmed:', norm(btn.textContent));
      } catch (e) {
        outer.removeAttribute(HIDE_ATTR);
        console.error('[Yap++ AlwaysTrust]', e);
      }
    },

    start() {
      if (this.observer) return;
      var self = this;
      injectCss();
      this.observer = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) self.handle(added[j]);
        }
      });
      this.observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
      if (this.observer) { this.observer.disconnect(); this.observer = null; }
      this.timers.forEach(clearTimeout);
      this.timers = [];
      Array.prototype.slice.call(document.querySelectorAll('[' + HIDE_ATTR + ']')).forEach(function (el) { el.removeAttribute(HIDE_ATTR); });
      var css = document.getElementById(CSS_ID);
      if (css) css.remove();
    }
  };

  window.YapPlus = window.YapPlus || {};
  window.YapPlus.alwaystrust = alwaystrust;

  try {
    window.PluginHost.register(alwaystrust);
  } catch (e) {
  }
})();