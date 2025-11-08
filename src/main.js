const { app, BrowserWindow, Tray, Menu, shell } = require("electron");
const path = require("path");
const expressApp = require("../app.js"); // Import the Express app
const express = require("express");
const AutoLaunch = require('auto-launch');

const settings = require("electron-settings");
const appServer = express();

const PORT = 3000;

let server;
let tray = null;
let mainWindow;
const isDev = require("electron-is-dev");




const electronAppAutoLauncher = new AutoLaunch({
    name: 'dlab-app', // Replace 'YourAppName' with the name of your app.
    path: app.getPath('exe'),
});

// Check if auto-launch is enabled and enable it if not
electronAppAutoLauncher.isEnabled()
.then(function(isEnabled){
    if(isEnabled) return;
    electronAppAutoLauncher.enable();
})
.catch(function(err){
    // Handle error
    console.error('Auto-launch setup failed:', err);
});











const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });

  if (!isDev) {
    // Additional server setup for non-dev mode could go here
  } else {
    require("../app.js");
    require("../routes/index.js");
  }

  appServer.use(express.static(path.join(__dirname, "..", "build")));
  appServer.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "build", "index.html"));
  });
  appServer.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 712,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });
    Menu.setApplicationMenu(null);

    mainWindow.loadURL(`http://localhost:${PORT}`);
    mainWindow.on("close", (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
      }
      return false;
    });
  }

  function createDesktopShortcut() {
    const source = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "build"
    );
    const destination = path.join(app.getPath("desktop"), "D-Lab Shortcut.lnk");

    const targetPath = path.join(source, "D-Lab.exe");

    shell.writeShortcutLink(destination, "create", {
      target: targetPath,
      appUserModelId: "com.yourappid",
      icon: path.join(source, "logoexe.ico"),
    });

    settings.set("shortcutCreated", true);
  }

  app.whenReady().then(() => {
    createWindow();

    if (!settings.get("shortcutCreated")) {
      createDesktopShortcut();
    }

    const logoTrayPath = isDev
      ? path.join(__dirname, "..", "logotray.png")
      : path.join(process.resourcesPath, "app.asar.unpacked", "logotray.png");

    tray = new Tray(logoTrayPath);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show App",
        click: () => {
          mainWindow.show();
        },
      },
      {
        label: "Quit",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip("D-Lab");
    tray.setContextMenu(contextMenu);
    tray.on("double-click", () => {
      mainWindow.show();
    });
  });

  app.on("window-all-closed", function () {
    if (server) server.kill();
    if (process.platform !== "darwin") app.quit();
  });
}
