(function () {
    if (window.yaplay) return;

    const yaplay = {
        id: 'bf476a2f-eb97-4c44-bba2-5bad8e2186d4',
        name: 'Yaplay',
        description: 'Show your call in Yaplay and use its mute, deafen and leave controls.',
        status: 'Disabled',
        connection: null,
        runtime: null,
        getPort() {
            return Number(localStorage.getItem('yapplus.yaplay.port') || 8080);
        },
        setPort(port) {
            if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Enter a port between 1 and 65535.');
            localStorage.setItem('yapplus.yaplay.port', String(port));
            if (this.connection) { this.stop(); this.start(); }
        },
        getNotifications() {
            return localStorage.getItem('yapplus.yaplay.notifications') === '1';
        },
        setNotifications(enabled) {
            localStorage.setItem('yapplus.yaplay.notifications', enabled ? '1' : '0');
            if (this.connection) { this.stop(); this.start(); }
        },
        setStatus(status) {
            this.status = status;
            const label = document.getElementById('ypp-yaplay-status');
            if (label) label.textContent = status;
        },
        getRuntime() {
            if (this.runtime) return this.runtime;
            const queue = window.TURBOPACK;
            if (!queue || Array.isArray(queue)) return Promise.reject(new Error('Waiting for Yapin to load.'));
            this.runtime = new Promise((resolve, reject) => {
                const id = 'yapplus-yaplay-' + crypto.randomUUID();
                const timeout = setTimeout(() => reject(new Error('Yapin module discovery timed out.')), 3000);
                try {
                    queue.push([id, id, runtime => { clearTimeout(timeout); resolve(runtime); }]);
                    Promise.resolve(queue.push([id, { otherChunks: [], runtimeModuleIds: [id] }])).catch(error => {
                        clearTimeout(timeout);
                        reject(error);
                    });
                } catch (error) { clearTimeout(timeout); reject(error); }
            }).catch(error => { this.runtime = null; throw error; });
            return this.runtime;
        },
        findStore(runtime) {
            for (const module of runtime.c.values()) {
                const value = module.exports;
                if (typeof value?.getState !== 'function' || typeof value.useStore?.subscribe !== 'function') continue;
                const state = value.getState();
                if (state && 'voice' in state && state.voiceMembers && state.speaking && state.profiles) return value;
            }
        },
        snapshot(store, runtime) {
            const state = store.getState();
            const voice = state.voice;
            if (!voice) return { in_call: false, members: [], muted: false, deafened: false };
            const media = [...runtime.c.values()].map(module => module.exports).find(value => typeof value?.publicUrl === 'function');
            const members = [...(state.voiceMembers[voice.channelId] || [])];
            if (state.userId && !members.some(member => member.userId === state.userId)) {
                members.push({ userId: state.userId, muted: voice.muted, deafened: voice.deafened });
            }
            return {
                in_call: true,
                muted: Boolean(voice.muted || voice.deafened),
                deafened: Boolean(voice.deafened),
                members: members.map(member => {
                    const self = member.userId === state.userId;
                    const profile = state.profiles[member.userId];
                    const avatar = (voice.serverId && state.serverLooks?.[voice.serverId]?.[member.userId]?.avatar_path) || profile?.avatar_path;
                    let avatarurl;
                    if (avatar && media) {
                        try {
                            const resolved = media.publicUrl('avatars', avatar);
                            if (typeof resolved === 'string' && resolved) {
                                const url = new URL(resolved, 'https://www.yapin.gg');
                                if (url.protocol === 'https:' && !url.username && !url.password && url.href.length <= 2048) avatarurl = url.href;
                            }
                        } catch (e) {}
                    }
                    const hex = store.nameColor?.(state, voice.serverId, member.userId) ?? profile?.accent_color ?? '';
                    const color = /^#[\da-f]{6}$/i.test(hex)
                        ? [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)] : [103, 80, 164];
                    const muted = Boolean(self ? voice.muted || voice.deafened : member.muted || member.deafened);
                    return {
                        id: member.userId,
                        name: (store.displayName?.(state, voice.serverId, member.userId) ?? profile?.display_name ?? profile?.username ?? 'Someone').slice(0, 128),
                        ...(avatarurl ? { avatar_url: avatarurl } : {}),
                        color,
                        speaking: Boolean(state.speaking[member.userId]) && !muted,
                        muted,
                        is_self: self
                    };
                })
            };
        },
        callKey(store) {
            const voice = store.getState().voice;
            return voice ? JSON.stringify([voice.serverId || '', voice.channelId]) : '';
        },
        async perform(runtime, store, action) {
            const voice = store.getState().voice;
            if (!voice) return;
            const api = [...runtime.c.values()].map(module => module.exports).find(value =>
                typeof value?.toggleMute === 'function' && typeof value.toggleDeafen === 'function' && typeof value.leaveVoice === 'function');
            if (!api) throw new Error('Yapin voice controls are unavailable.');
            if (action.type === 'set_mute' && typeof action.muted === 'boolean' && voice.muted !== action.muted) await api.toggleMute();
            else if (action.type === 'set_deafen' && typeof action.deafened === 'boolean' && voice.deafened !== action.deafened) await api.toggleDeafen();
            else if (action.type === 'leave_call') await api.leaveVoice();
        },
        start() {
            if (this.connection) return;
            const bridge = window.electronAPI;
            if (!bridge?.yaplayStart || !bridge.yaplayExchange || !bridge.yaplayStop) {
                this.setStatus('Update Yap++ to use Yaplay.');
                return;
            }
            const connection = {
                stopped: false, running: false, pending: true, session: '', store: null,
                notices: [], unsubscribe: null, timer: null, polls: 0, retry: 0,
                port: this.getPort(), call: '', revision: 0
            };
            this.connection = connection;
            this.setStatus('Starting…');
            const tick = async () => {
                if (connection.stopped || connection.running || Date.now() < connection.retry) return;
                connection.running = true;
                connection.pending = false;
                try {
                    const runtime = await this.getRuntime();
                    if (connection.stopped) return;
                    if (!connection.store) {
                        connection.store = this.findStore(runtime);
                        if (!connection.store) throw new Error('Waiting for Yapin’s voice store.');
                        connection.call = this.callKey(connection.store);
                        connection.unsubscribe = connection.store.useStore.subscribe(() => {
                            connection.pending = true;
                            const call = this.callKey(connection.store);
                            if (call !== connection.call) { connection.call = call; connection.revision++; }
                        });
                    }
                    if (!connection.session) {
                        connection.session = crypto.randomUUID();
                        await bridge.yaplayStart(connection.session, connection.port);
                        if (connection.stopped) { await bridge.yaplayStop(connection.session); return; }
                    }
                    const call = this.callKey(connection.store);
                    const revision = connection.revision;
                    const reply = await bridge.yaplayExchange(connection.session, this.snapshot(connection.store, runtime), connection.notices.splice(0), JSON.stringify([revision, call]));
                    if (connection.stopped) return;
                    this.setStatus(reply.connected ? 'Connected to Yaplay' : `Waiting for Yaplay on port ${connection.port}…`);
                    for (const action of reply.actions) {
                        if (connection.stopped || connection.revision !== revision || this.callKey(connection.store) !== call) break;
                        await this.perform(runtime, connection.store, action);
                    }
                } catch (error) {
                    if (!connection.stopped) {
                        this.setStatus(error.message || String(error));
                        const session = connection.session;
                        connection.session = '';
                        connection.retry = Date.now() + 2000;
                        if (session) void bridge.yaplayStop(session).catch(() => {});
                    }
                } finally { connection.running = false; }
            };
            connection.pagehide = () => this.stop();
            window.addEventListener('pagehide', connection.pagehide);
            if (this.getNotifications() && typeof window.Notification === 'function') {
                connection.notification = Object.getOwnPropertyDescriptor(window, 'Notification');
                connection.wrapper = new Proxy(window.Notification, {
                    construct(target, args, newTarget) {
                        const notification = Reflect.construct(target, args, newTarget);
                        if (!connection.stopped) {
                            connection.notices.push({ title: String(args[0] ?? '').slice(0, 128), body: String(args[1]?.body ?? '').slice(0, 1024) });
                            connection.notices = connection.notices.slice(-5);
                            connection.pending = true;
                        }
                        return notification;
                    }
                });
                try { window.Notification = connection.wrapper; } catch (e) {}
            }
            connection.timer = setInterval(() => {
                if (connection.pending || ++connection.polls >= 5) { connection.polls = 0; void tick(); }
            }, 50);
            void tick();
        },
        stop() {
            const connection = this.connection;
            this.connection = null;
            this.setStatus('Disabled');
            if (!connection) return;
            connection.stopped = true;
            clearInterval(connection.timer);
            connection.unsubscribe?.();
            window.removeEventListener('pagehide', connection.pagehide);
            if (connection.wrapper && window.Notification === connection.wrapper) {
                if (connection.notification) Object.defineProperty(window, 'Notification', connection.notification);
                else delete window.Notification;
            }
            connection.notices = [];
            if (connection.session) void window.electronAPI.yaplayStop(connection.session).catch(() => {});
        }
    };

    window.yaplay = yaplay;
    window.PluginHost.register(yaplay);
})();
