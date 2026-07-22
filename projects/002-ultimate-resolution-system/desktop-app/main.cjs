/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const { app, BrowserWindow, Menu, shell } = require("electron");

app.setName("一切难题终极化解系统");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 840,
    minHeight: 600,
    show: false,
    backgroundColor: "#ecebe5",
    title: "一切难题终极化解系统",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 18, y: 22 },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file:")) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  void mainWindow.loadFile(path.join(__dirname, "site/index.html"));
}

const menu = Menu.buildFromTemplate([
  {
    label: "一切难题终极化解系统",
    submenu: [
      { role: "about" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  { label: "编辑", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
  { label: "显示", submenu: [{ role: "reload" }, { role: "togglefullscreen" }] },
  { label: "窗口", submenu: [{ role: "minimize" }, { role: "zoom" }, { role: "front" }] },
]);

Menu.setApplicationMenu(menu);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
