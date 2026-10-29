(function() {
    const A = window.YapPlusAssets || {};
    
    function fanumtaxxbadge(u, hover, src) {
        if (!u || !src) return;
        const id = u.toLowerCase(), B = window.__ftx = window.__ftx || {
            m: {}, 
            p() {
                const a = typeof staffbadge < 'u' && staffbadge.msgAuthor;
                if (!a) return;
                document.querySelectorAll('.msg[data-message-id]').forEach(e => {
                    const h = e.querySelector('.msg-head .msg-author')?.parentNode;
                    if (!h) return;
                    const mid = e.dataset.messageId;
                    for (const [k, v] of Object.entries(B.m)) {
                        const c = 'yp-ftx-' + k.slice(0, 8), x = h.querySelector(':scope>.' + c), me = a.get(mid) === k;
                        if (me && !x) {
                            const i = new Image();
                            i.className = c;
                            i.src = v.s;
                            i.title = v.t;
                            i.alt = 'Badge';
                            i.draggable = !1;
                            const o = h.querySelectorAll(':scope>.yp-staff-badge,:scope>.yp-helper-badge,:scope>.yp-extra-badge');
                            h.insertBefore(i, (o.length ? o[o.length - 1] : h.querySelector('.msg-author')).nextSibling);
                        } else if (!me && x) x.remove();
                        else if (me && (x.src !== v.s || x.title !== v.t)) {
                            x.src = v.s;
                            x.title = v.t;
                        }
                    }
                });
            }
        };
        
        if (B.m[id]) return B.m[id] = { s: src, t: hover || '' }, B.p();
        B.m[id] = { s: src, t: hover || '' };
        
        if (!document.getElementById('yp-ftx-css')) {
            const s = document.createElement('style');
            s.id = 'yp-ftx-css';
            s.textContent = '[class^=yp-ftx-]{height:16px;width:16px;margin-left:4px;vertical-align:-3px;align-self:center;object-fit:contain;user-select:none}';
            document.head.appendChild(s);
        }
        B.p();
        if (!B.t) B.t = setInterval(B.p, 1e3);
        if (!B.o) (B.o = new MutationObserver(B.p)).observe(document.documentElement, { childList: !0, subtree: !0 });
    }

    const staffbadge = {
        id: 'staffbadge',
        name: 'Staff Badge',
        description: 'A badge for yap++ contributors/staff/helpers/eventwinners.',
        BADGED: ['c5ccf056-9c36-4367-9d27-69c92424c7fe,', '77ae11af', '1720334f', 'c5ccf056-9c36-4367-9d27-69c92424c7fe', 'c5ccf056', 'da302abc', 'baebe68c-8944-4738-aa41-40d67a018c62', 'c00c8a06-ec79-42ca-9b79-bfa3139a0d25', 'e96e12b4-2bac-4d4e-8914-cdb7404abf9d', '13aa6b8b-f756-4dcb-b791-f6086ad1806e', 'f1e42d68-12a0-43b0-956d-ed5b9f8fb9f2', '3d32bc29-8de7-4085-a8c9-22b3acf285f1', '2401d1d0-467c-40a8-888d-9f7526414690', 'e2647b1f-e7fc-4c68-a630-00cfa1439d49'],
        BADGE_SRC: A.staff || '',
        HELPER_BADGED: ['c5ccf056-9c36-4367-9d27-69c92424c7fe', '1b2d9bda-4afc-466c-b661-3399b0ee7f7b', '3d32bc29-8de7-4085-a8c9-22b3acf285f1', '48eb0fcb-21ca-4171-899c-ca1ca29d9ee4', '2401d1d0-467c-40a8-888d-9f7526414690', 'e2647b1f-e7fc-4c68-a630-00cfa1439d49', 'da302abc-7fa0-4f7a-9f3f-536d6eadfc71'],
        HELPER_BADGE_SRC: A.helper || '',
        msgAuthor: new Map(),
        unresolvable: new Set(),
        observer: null,
        origFetch: null,
        origAddEventListener: null,
        origOnMessage: null,
        paintTimer: null,
        healTimer: null,
        healInterval: null,
        token: null,

        isBadged(authorId) {
            if (!authorId) return false;
            const a = String(authorId).toLowerCase();
            return this.BADGED.some(p => a.startsWith(p));
        },

        isHelper(authorId) {
            if (!authorId) return false;
            const a = String(authorId).toLowerCase();
            return this.HELPER_BADGED.some(p => a.startsWith(p.toLowerCase()));
        },

        remember(msgId, authorId) {
            if (msgId && authorId) this.msgAuthor.set(msgId, String(authorId).toLowerCase());
        },

        sniffToken(input, init) {
            try {
                let h = (init && init.headers) || (input && input.headers);
                if (!h) return;
                let auth = null;
                if (typeof Headers !== 'undefined' && h instanceof Headers) auth = h.get('authorization');
                else if (Array.isArray(h)) {
                    const f = h.find(x => String(x[0]).toLowerCase() === 'authorization');
                    auth = f && f[1];
                } else auth = h.authorization || h.Authorization;
                if (auth && auth.indexOf('Bearer ') === 0) this.token = auth.slice(7);
            } catch (e) {}
        },

        getToken() {
            if (this.token) return this.token;
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) {
                        try {
                            let v = JSON.parse(localStorage.getItem(k));
                            if (typeof v === 'string') v = JSON.parse(v);
                            const t = v && (v.access_token || (v.currentSession && v.currentSession.access_token));
                            if (t) {
                                this.token = t;
                                return t;
                            }
                        } catch (e) {}
                    }
                }
            } catch (e) {}
            return null;
        },

        start() {
            const self = this;

            fanumtaxxbadge('3d32bc29-8de7-4085-a8c9-22b3acf285f1', `VIM, The most goated text editor oat`, A.vim || '');
            fanumtaxxbadge('9c2208e6-f8b4-44db-ac91-89a012ffb0a8', `Potato Goddess`, A.potato || '');
            fanumtaxxbadge('f2c4c4c8-d455-4f75-864e-dcbfe04ec71d', `tuffestbadgever`, A.whitebox || '');
            fanumtaxxbadge('217ccb8c-3d7e-4720-a614-3788bf5dc3a9', `I feel so sigma!`, A.sigma || '');
            fanumtaxxbadge('d70e83db-e45d-47be-9f1b-0ca8ea1b42d7', `Certified chud basement dweller`, A.chud || '');
            fanumtaxxbadge('c5ccf056-9c36-4367-9d27-69c92424c7fe', `The owner of yap++, I made it`, A.yppIcon || '');
            fanumtaxxbadge('1e15f614-cb69-44a8-8684-b4cd0c0f5834', 'Yapin.js Developer', A.yapjsbadge || '');

            if (!this.origFetch) this.origFetch = window.fetch;
            const origFetch = this.origFetch;
            window.fetch = function(input, init) {
                self.sniffToken(input, init);
                const p = origFetch.call(this, input, init);
                try {
                    const url = typeof input === 'string' ? input : (input && input.url) || '';
                    if (url.indexOf('/rest/v1/messages') !== -1) {
                        p.then(res => {
                            if (!res.ok) return;
                            res.clone().json().then(rows => {
                                if (Array.isArray(rows)) rows.forEach(r => self.remember(r.id, r.author_id));
                                else if (rows && rows.id) self.remember(rows.id, rows.author_id);
                                self.schedulePaint();
                            }).catch(() => {});
                        }).catch(() => {});
                    }
                    if (url.indexOf('/rest/v1/profiles') !== -1) self.schedulePaint();
                } catch (e) {}
                return p;
            };

            this.handleWs = function(raw) {
                try {
                    const f = JSON.parse(raw);
                    const p = f && (f.payload || f);
                    const d = p && p.data;
                    const rec = p.record || (d && d.record);
                    const table = p.table || (d && d.table);
                    if (rec && rec.id && rec.author_id && (!table || table === 'messages')) {
                        self.remember(rec.id, rec.author_id);
                        self.schedulePaint();
                    }
                } catch (e) {}
            };

            if (!this.origAddEventListener) this.origAddEventListener = WebSocket.prototype.addEventListener;
            const origAddEL = this.origAddEventListener;
            WebSocket.prototype.addEventListener = function(type, listener, options) {
                if (type !== 'message') return origAddEL.call(this, type, listener, options);
                const wrapped = function(ev) {
                    self.handleWs(ev.data);
                    return listener.call(this, ev);
                };
                return origAddEL.call(this, type, wrapped, options);
            };

            const onmsgDesc = Object.getOwnPropertyDescriptor(WebSocket.prototype, 'onmessage');
            if (onmsgDesc && onmsgDesc.set && !this.origOnMessage) {
                this.origOnMessage = onmsgDesc;
                Object.defineProperty(WebSocket.prototype, 'onmessage', {
                    configurable: true,
                    get() { return onmsgDesc.get.call(this); },
                    set(fn) {
                        const wrapped = function(ev) {
                            self.handleWs(ev.data);
                            return fn.call(this, ev);
                        };
                        return onmsgDesc.set.call(this, wrapped);
                    },
                });
            }

            this.observer = new MutationObserver(() => self.schedulePaint());
            this.observer.observe(document.body, { childList: true, subtree: true });
            this.schedulePaint();
            this.backfill();
            this.healInterval = setInterval(() => self.heal(), 4000);
            console.log('[Libyapcore] [I]> staddfabdge rizzed');
        },

        async backfill() {
            try {
                const loc = (location.href.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0];
                if (!loc) return;
                const token = this.getToken();
                if (!token) return;
                const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZmt1cXpkZHd2dGRvanpnbWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2Mzk0ODgsImV4cCI6MjEwNzIxNTQ4OH0.kMZcUf8DgMrYFNGtMPW9SGja2m1cRdMq5WJv5XBNgCU';
                const res = await (this.origFetch || window.fetch)(
                    `https://api.yapper.website/rest/v1/messages?channel_id=eq.${loc}&select=id,author_id&order=created_at.desc&limit=200`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } }
                );
                if (res.ok) {
                    const rows = await res.json();
                    if (Array.isArray(rows)) rows.forEach(r => this.remember(r.id, r.author_id));
                    this.schedulePaint();
                }
            } catch (e) {}
        },

        async heal() {
            if (this.healing) return;
            const missing = [];
            document.querySelectorAll('.msg[data-message-id]').forEach(el => {
                const id = el.getAttribute('data-message-id');
                if (id && !this.msgAuthor.has(id) && !this.unresolvable.has(id)) missing.push(id);
            });
            if (!missing.length) return;
            const token = this.getToken();
            if (!token) return;
            this.healing = true;
            try {
                const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZmt1cXpkZHd2dGRvanpnbWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2Mzk0ODgsImV4cCI6MjEwNzIxNTQ4OH0.kMZcUf8DgMrYFNGtMPW9SGja2m1cRdMq5WJv5XBNgCU';
                const batch = missing.slice(0, 150);
                const res = await (this.origFetch || window.fetch)(
                    `https://api.yapper.website/rest/v1/messages?id=in.(${batch.join(',')})&select=id,author_id`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } }
                );
                if (res.ok) {
                    const rows = await res.json();
                    const found = new Set();
                    if (Array.isArray(rows)) rows.forEach(r => { this.remember(r.id, r.author_id);
                        found.add(r.id); });
                    batch.forEach(id => { if (!found.has(id)) this.unresolvable.add(id); });
                    this.schedulePaint();
                }
            } catch (e) {}
            this.healing = false;
        },

        stop() {
            if (this.origFetch) { window.fetch = this.origFetch;
                this.origFetch = null; }
            if (this.origAddEventListener) {
                WebSocket.prototype.addEventListener = this.origAddEventListener;
                this.origAddEventListener = null;
            }
            if (this.origOnMessage) {
                Object.defineProperty(WebSocket.prototype, 'onmessage', this.origOnMessage);
                this.origOnMessage = null;
            }
            if (this.observer) { this.observer.disconnect();
                this.observer = null; }
            clearInterval(this.healInterval);
            clearTimeout(this.paintTimer);
            document.querySelectorAll('.yp-staff-badge, .yp-helper-badge').forEach(el => el.remove());
            console.log('[Libyapcore] [I]> [StaffBadge] disarmed');
        },

        schedulePaint() {
            clearTimeout(this.paintTimer);
            this.paintTimer = setTimeout(() => this.paint(), 80);
        },

        injectCss() {
            if (document.getElementById('yp-staff-badge-css')) return;
            const css = document.createElement('style');
            css.id = 'yp-staff-badge-css';
            css.textContent = `
          .yp-staff-badge, .yp-helper-badge {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            margin-left: 6px;
            vertical-align: -3px;
            align-self: center;
            object-fit: cover;
            pointer-events: none;
            user-select: none;
          }
          .yp-staff-badge { box-shadow: 0 0 5px rgba(255, 0, 255, 0.99); }
          .yp-helper-badge { box-shadow: 0 0 5px rgba(215, 18, 255, 0.93); }
        `;
            (document.head || document.documentElement).appendChild(css);
        },

        paint() {
            this.injectCss();
            document.querySelectorAll('.msg[data-message-id]').forEach(el => {
                const mid = el.getAttribute('data-message-id');
                const author = this.msgAuthor.get(mid);
                const name = el.querySelector('.msg-head .msg-author');
                if (!name) return;
                const head = name.parentNode;

                const wantStaff = !!(author && this.isBadged(author));
                const wantHelper = !!(author && this.HELPER_BADGE_SRC && this.isHelper(author));

                let staffEl = head.querySelector(':scope > .yp-staff-badge');
                if (wantStaff) {
                    if (!(staffEl && staffEl.previousElementSibling === name)) {
                        if (staffEl) staffEl.remove();
                        staffEl = document.createElement('img');
                        staffEl.className = 'yp-staff-badge';
                        staffEl.src = this.BADGE_SRC;
                        staffEl.alt = 'Yap++';
                        staffEl.title = 'Yap++ Contributor. Legend.';
                        staffEl.draggable = false;
                        head.insertBefore(staffEl, name.nextSibling);
                    }
                } else if (staffEl) {
                    staffEl.remove();
                    staffEl = null;
                }

                let helperEl = head.querySelector(':scope > .yp-helper-badge');
                if (wantHelper) {
                    const anchor = staffEl || name;
                    if (!(helperEl && helperEl.previousElementSibling === anchor)) {
                        if (helperEl) helperEl.remove();
                        helperEl = document.createElement('img');
                        helperEl.className = 'yp-helper-badge yp-extra-badge';
                        helperEl.src = this.HELPER_BADGE_SRC;
                        helperEl.alt = 'Helper';
                        helperEl.title = 'Yap++ helper. Legend.';
                        helperEl.draggable = false;
                        head.insertBefore(helperEl, anchor.nextSibling);
                    }
                } else if (helperEl) {
                    helperEl.remove();
                }
            });
        },
    };

    try {
        staffbadge.start();
    } catch (e) {
        console.error("[Libyapcore] [E]> [StaffBadge]>", e);
    }

})();
