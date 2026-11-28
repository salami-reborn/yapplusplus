// GITHUB WORKFLOWS BOT, FUCK YOUUUUUU. ACTUALLY LIKE GENUINELY FUCK YOU.
(function() {
    const A = window.YapPlusAssets || {};

    if (!window.__ypBadgeTooltipSetup) {
        window.__ypBadgeTooltipSetup = true;
        const tip = document.createElement('div');
        tip.id = 'yp-badge-tooltip';
        tip.style.cssText = 'position:fixed;pointer-events:none;z-index:999999;background:#1e1f22;border:1px solid #333;color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;max-width:240px;white-space:normal;opacity:0;transition:opacity 0.15s;';
        document.body.appendChild(tip);
        let tt = null;
        document.addEventListener('mouseover', (e) => {
            const b = e.target.closest('.yp-staff-badge, .yp-helper-badge, [class*="yp-ftx-"]');
            if (b && b.closest('.pv2, .profile-card')) {
                const d = b.getAttribute('data-desc');
                if (d) {
                    clearTimeout(tt);
                    tip.textContent = d;
                    const r = b.getBoundingClientRect();
                    tip.style.left = (r.left + r.width / 2 - tip.offsetWidth / 2) + 'px';
                    tip.style.top = (r.top - 42) + 'px';
                    tip.style.opacity = '1';
                }
            }
        });
        document.addEventListener('mouseout', (e) => {
            const b = e.target.closest('.yp-staff-badge, .yp-helper-badge, [class*="yp-ftx-"]');
            if (b && b.closest('.pv2, .profile-card')) {
                tt = setTimeout(() => { tip.style.opacity = '0'; }, 120);
            }
        });
    }

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
                document.querySelectorAll('.pv2, .profile-card').forEach(card => {
                    const av = card.querySelector('.pv-avatar img[src*="/avatars/"]')
                        || card.querySelector('.profile-card-avatar img[src*="/avatars/"]')
                        || Array.from(card.querySelectorAll('img[src*="/avatars/"]')).find(img => !img.closest('.pc2-mutual-row, .pc2-mutuals, .badge-row'));
                    if (!av) return;
                    const m2 = av.src.match(/\/avatars\/([0-9a-f-]+)\//i);
                    if (!m2) return;
                    const uid = m2[1].toLowerCase();
                    const entry = B.m[uid];
                    const host = card.querySelector('.pv-chips') || card.querySelector('.badge-row')?.parentNode;
                    if (!host) return;

                    const wanted = [];
                    if (typeof staffbadge < 'u') {
                        if (staffbadge.BADGE_SRC && staffbadge.isBadged(uid)) wanted.push({
                            key: 'staff', cls: 'yp-staff-badge', src: staffbadge.BADGE_SRC,
                            title: 'Yap++ Contributor. Legend.', alt: 'Yap++',
                        });
                        if (staffbadge.HELPER_BADGE_SRC && staffbadge.isHelper(uid)) wanted.push({
                            key: 'helper', cls: 'yp-helper-badge yp-extra-badge', src: staffbadge.HELPER_BADGE_SRC,
                            title: 'Yap++ helper. Legend.', alt: 'Helper',
                        });
                    }
                    if (entry) wanted.push({
                        key: 'ftx', cls: 'yp-ftx-' + uid.slice(0, 8), src: entry.s,
                        title: entry.t || '', alt: 'Badge',
                    });

                    let rows = Array.from(host.querySelectorAll(':scope > .badge-row'));
                    if (!rows.length) {
                        if (!wanted.length) {
                            const own = host.querySelector(':scope > .badge-row.yp-ftx-row');
                            if (own) own.remove();
                            return;
                        }
                        const own = document.createElement('span');
                        own.className = 'badge-row yp-ftx-row';
                        host.appendChild(own);
                        rows = [own];
                    }

                    rows.forEach(row => {
                        const keep = new Set();
                        wanted.forEach(w => {
                            let el = row.querySelector(':scope > .' + w.cls.split(' ')[0]);
                            if (!el) {
                                el = new Image();
                                el.className = w.cls;
                                el.alt = w.alt;
                                el.draggable = !1;
                                if (w.key === 'ftx') el.style = 'width:17px;height:17px;vertical-align:-3px;margin-left:4px;';
                                row.appendChild(el);
                            }
                            keep.add(el);
                            if (el.getAttribute('src') !== w.src) el.src = w.src;
                            if (el.getAttribute('data-desc') !== w.title) { el.setAttribute('data-desc', w.title); el.removeAttribute('title'); }
                        });
                        row.querySelectorAll(':scope > .yp-staff-badge, :scope > .yp-helper-badge, :scope > [class*="yp-ftx-"]').forEach(el => {
                            if (!keep.has(el)) el.remove();
                        });
                        if (!wanted.length && row.classList.contains('yp-ftx-row') && !row.children.length) row.remove();
                    });
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
        BADGED: ['c5ccf056-9c36-4367-9d27-69c92424c7fe,', '77ae11af', '1720334f', 'c5ccf056-9c36-4367-9d27-69c92424c7fe', 'c5ccf056', 'da302abc', 'baebe68c-8944-4738-aa41-40d67a018c62', 'c00c8a06-ec79-42ca-9b79-bfa3139a0d25', 'e96e12b4-2bac-4d4e-8914-cdb7404abf9d', '13aa6b8b-f756-4dcb-b791-f6086ad1806e', 'f1e42d68-12a0-43b0-956d-ed5b9f8fb9f2', '3d32bc29-8de7-4085-a8c9-22b3acf285f1', '2401d1d0-467c-40a8-888d-9f7526414690', 'e2647b1f-e7fc-4c68-a630-00cfa1439d49', '9c2208e6-f8b4-44db-ac91-89a012ffb0a8', '6d6d3554-f789-4f81-8aea-baed4af5dc89', '165de22a-53d6-43ed-8cb2-502f915f98e9', '4426cda0-4337-41a6-9fe9-ef95933b3b2c', '4426cda0-4337-41a6-9fe9-ef95933b3b2c', '398f5f6b-fb76-4975-b268-e2c67b7ac9ab', '47e02943-a5ed-437d-8edb-241c7d85f2c6', 'bf476a2f-eb97-4c44-bba2-5bad8e2186d4', '6dcac643-07bc-4908-972e-30e227554333'],
        BADGE_SRC: A.staff || '',
        HELPER_BADGED: ['c5ccf056-9c36-4367-9d27-69c92424c7fe', '1b2d9bda-4afc-466c-b661-3399b0ee7f7b', '3d32bc29-8de7-4085-a8c9-22b3acf285f1', '48eb0fcb-21ca-4171-899c-ca1ca29d9ee4', '2401d1d0-467c-40a8-888d-9f7526414690', 'e2647b1f-e7fc-4c68-a630-00cfa1439d49', 'da302abc-7fa0-4f7a-9f3f-536d6eadfc71', '6d6d3554-f789-4f81-8aea-baed4af5dc89', '13aa6b8b-f756-4dcb-b791-f6086ad1806e', '165de22a-53d6-43ed-8cb2-502f915f98e9', '4426cda0-4337-41a6-9fe9-ef95933b3b2c', '398f5f6b-fb76-4975-b268-e2c67b7ac9ab', '47e02943-a5ed-437d-8edb-241c7d85f2c6', 'bf476a2f-eb97-4c44-bba2-5bad8e2186d4', '6dcac643-07bc-4908-972e-30e227554333'],
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
            fanumtaxxbadge('c5ccf056-9c36-4367-9d27-69c92424c7fe', `1/2 Owners/Operators of yap!!`, A.yppIcon || '');
            fanumtaxxbadge('da302abc-7fa0-4f7a-9f3f-536d6eadfc71', `1/2 Owners/Operators of yap!!`, A.yppIcon || '');
            fanumtaxxbadge('bf476a2f-eb97-4c44-bba2-5bad8e2186d4', `Lead Dev of Yap++! Also made yapmod!`, A.yppIcon || '');
            fanumtaxxbadge('6dcac643-07bc-4908-972e-30e227554333', `♡ Nyu`, A.gothheart || '');
            fanumtaxxbadge('58c8e188-2370-449c-aaa7-79e8c80888cd', `Welcomes people!`, A.yppIcon || '');
            fanumtaxxbadge('58c8e188-2370-449c-aaa7-79e8c80888cd', `Welcomes people!`, A.yppIcon || '');
            fanumtaxxbadge('13aa6b8b-f756-4dcb-b791-f6086ad1806e', `My alt. If this is online then I'm either testing a plugin/idk`, A.yppIcon || '');
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
