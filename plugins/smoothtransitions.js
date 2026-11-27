(function() {
    if (window.__ypSmoothTransitionsInstalled) return;
    window.__ypSmoothTransitionsInstalled = true;

    const smoothtransitions = {
        id: 'smoothtransitions',
        name: 'smooth transitions',
        description: `Want YOUR menus and dialogs to actually FEEL smooth? THIS PLUGIN SOLVES THAT! Everything pops in with SUCHHH COOOL ANIMATIONSS!! This also respects the reduce motion setting ofcourse!`,
        style: null,

        start() {
            this.style = document.createElement('style');
            this.style.id = 'yp-smooth-transitions';
            this.style.textContent = '@media (prefers-reduced-motion:no-preference){:root{--ym-t:180ms}@keyframes ymStIn{from{opacity:0;transform:translateY(8px)}}@keyframes ymStPop{from{opacity:0;transform:translateY(6px) scale(.97)}}@keyframes ymStSlideRight{from{opacity:0;transform:translateX(34px)}}@keyframes ymStFade{from{opacity:.25}}.ctx-menu,.emoji-picker,.profile-card,.mention-menu,.server-menu{animation:ymStPop var(--ym-t) cubic-bezier(.2,.8,.2,1)}.modal{animation:ymStSlideRight var(--ym-t) cubic-bezier(.2,.8,.2,1)}.channel-row,.chat-row,.rail-item,.people-row,.icon-btn,.btn,.msg-actions button,.ctx-menu button{transition:background-color var(--ym-t),color var(--ym-t),border-radius var(--ym-t),transform var(--ym-t)}.msg.ym-st-in{animation:ymStIn var(--ym-t) ease-out}.main.ym-st-switch{animation:ymStFade calc(var(--ym-t) * 1.4) ease-out}}';
            (document.head || document.documentElement).appendChild(this.style);
        },

        stop() {
            if (this.style) {
                this.style.remove();
                this.style = null;
            }
        },
    };

    window.PluginHost.register(smoothtransitions);
})();
