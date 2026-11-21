# Yaplay

Run Yaplay on the same computer, then enable **Yaplay** in Yap++'s plugins menu. The connection is disabled by default.

Under **Yap++ Settings → Yaplay**, set the local port to match Yaplay (default: `8080`). The status shows whether Yap++ is waiting for Yapin, waiting for Yaplay, or connected. Join a voice call to show its participants, avatars, colors, speaking activity, and microphone state in the overlay. Yaplay's mute, deafen, and leave controls use Yapin's own voice actions and respect its permissions.

Notification forwarding is separately opt-in. It forwards titles and bodies of notifications created through the page's Notification constructor, not message history. It does not intercept service-worker notifications. Appearance and positioning remain configured in Yaplay.

The Electron main process connects only to `ws://127.0.0.1:<port>`. The bridge accepts calls only from the main frame of the Yapin webview, validates state and controls, and never sends authentication tokens or audio. The local Yaplay protocol has no pairing or authentication; enable it only with a trusted local receiver.

Disabling the plugin, navigating away, or closing the client clears the roster and closes the connection. Unresponsive sessions expire after five seconds. Reconnecting replays the current call state, not old notifications. Changing calls or ports discards pending controls.

Voice-store discovery depends on Yapin's internal Turbopack modules. If Yapin changes its store, the status reports the error rather than keeping a stale roster. This integration requires the updated Electron host as well as the plugin; pasting the plugin alone into an older client is insufficient.
