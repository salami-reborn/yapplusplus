const path = require("path");
const { MakerAppImage } = require("electron-forge-maker-appimage");
const { MakerNsis } = require("electron-forge-maker-nsis");

const windowsIcon = path.join(__dirname, "assets", "Icon.ico");
const linuxIcon = path.join(__dirname, "assets", "yppIcon.png");

class YapAppImageMaker extends MakerAppImage {
  getTarget(targetArch, config) {
    const target = super.getTarget(targetArch, config);
    // AppImage icons come from electron-builder's Linux config.
    target.config.linux = { icon: linuxIcon, category: "Network" };
    return target;
  }
}

module.exports = {
  packagerConfig: {
    name: 'Yap++',
    icon: path.join(__dirname, "assets", "Icon"),
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
      installerIcon: windowsIcon,
      uninstallerIcon: windowsIcon,
      include: path.resolve(__dirname, "installer", "installer.nsh")
    }),
    { name: "@electron-forge/maker-zip", platforms: ["darwin"] },
    new YapAppImageMaker(),
  ]
};
