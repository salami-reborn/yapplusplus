<p align="center">
  <img src="assets/YAPPLUSPLUSUNFINISHEDBANNER.gif" alt="yapplusplusbanner" width="400" />
</p>

<h1 align="center">😼 Yap++ 😼</h1>

<p align="center">
  The cutest client modification for <a href="https://www.yapin.gg">Yappin'</a>.
</p>
<div align="center">

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/) ![GitHub last commit](https://img.shields.io/github/last-commit/salami-reborn/yapplusplus) ![GitHub repo size](https://img.shields.io/github/repo-size/salami-reborn/yapplusplus) ![GitHub top language](https://img.shields.io/github/languages/top/salami-reborn/yapplusplus)

[![Langandlibs](https://skillicons.dev/icons?i=ts,js,electron,windows,linux,androidstudio&perline=6)](https://skillicons.dev)
</div>

> [!WARNING]  
> Yap++ is **NOT** affiliated with Yappin/Yapper. Yap++ is a community-made client-side modification for the Yappin app.

<hr>

Yap++ is an open-source client modification for ~~Yapper~~ Yappin'.

You can contribute code to me via **DM'ing me directly via yapper** or discord. Keep in mind that I usually respond later on Discord. (Don't email me I never check my email)

I'm also looking for ways to make a team with Antic; but antic hates me..

> [!NOTE]  
> Windows smartscreen will display: "Are you sure you want to run this app?", This is because yap++ is not signed with a 300 dollar certificate. I will plan on signing it with other certificate options to minimize this. If you are on windows 11 25H2 then you can toggle SMART-APP-CONTROL in settings to be able to run yap++ if SAC won't let you.

## Download Yap++ in [Releases](https://github.com/salami-reborn/yapplusplus/releases)

## Publishing a release

In GitHub, open **Actions → Release desktop apps → Run workflow**. Select the branch
to release and enter a new Git tag such as `U007` or `v1.2.3`. You can also set a
release title or mark the release as a prerelease.

The optional app version sets the version embedded in all packages. It uses three
numeric components such as `1.2.3`. If left blank, a numeric tag supplies the app
version. Other tags use the version in `package.json`. The version is applied during
the build, and the tag points to the selected source commit.

GitHub publishes the release after all builds succeed. It includes macOS ZIPs
for Apple Silicon and Intel, a Linux x64 AppImage, and a Windows x64 installer.
The macOS builds use ad-hoc signing, and the Windows installer is unsigned.

## Contributing

Contributions are always welcome!
Please adhere to this project's `code of conduct`:

* **No** API-calls to anywhere except image-hosting services and yapper's own supabase.
* **No** Contributing raiding/spamming plugins.
* **No** Contributing any plugins that directly break the TOS of yappin'
* **No** Contributing plugins that directly or indirectly have the slightest chance of harming the user's computer.

If you break any of these rules while trying to contribute software to yap++, Then you will be permanently IP-banned from our servers
## Self- Building
If you want to contribute but first test out your plugin, Then you have to self-build the app.

```bash
  git clone https://github.com/salami-reborn/yapplusplus
  npm install
  npm run dev
```

`npm run dev` loads `plugins/`, `themes/` and `assets/` straight from the repo (and skips the GitHub sync of `badges.js`), so your local edits show up when you restart. `npm start` behaves like a normal release build and uses the downloaded `yapplus-hot` files.

You can also set `YAPPLUS_LOCAL=1` (or pass `--local`) when launching Electron yourself.

Common bugs & how to fix:
* Can't get other files like my customplugin because I updated:
 * `npm run clean` (make sure yap++ is closed or it wont run)
    
