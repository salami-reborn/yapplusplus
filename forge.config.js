const path = require("path");
const { MakerNsis } = require("electron-forge-maker-nsis");

// fuck you squirell

module.exports = {
  packagerConfig: {
    name: 'Yap++',
    icon: './assets/icon',
    asar: false,
    ignore: [
      /^\/\.git/,
      /^\/out/,
      /^\/build/,
      /^\/installer/,
      /^\/node_modules/,
      /^\/\.vscode/
    ].map(regex => (path) => regex.test(path) ? true : false),
  },
  rebuildConfig: {},
  makers: [
    new MakerNsis({
      oneClick: false,
      perMachine: false,
      allowToChangeInstallationDirectory: false,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: "Yap++",
      include: path.resolve(__dirname, "installer", "installer.nsh")
    }),
  ]
};