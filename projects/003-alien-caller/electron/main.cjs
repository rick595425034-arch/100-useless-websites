const path = require("node:path");
const {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  Menu,
  screen,
  shell,
  systemPreferences
} = require("electron");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.setName("深空文明呼叫终端");

let mainWindow;
let callWindow;
let takeoverWindow;
let nativeScreenAccess;
let pendingTakeoverCapture;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const page = (name) => path.join(__dirname, "..", "src", name);

function getNativeScreenAccess() {
  if (process.platform !== "darwin") return null;
  if (nativeScreenAccess !== undefined) return nativeScreenAccess;

  const modulePath = app.isPackaged
    ? path.join(process.resourcesPath, "screen-access.node")
    : path.join(__dirname, "screen-access.node");
  try {
    nativeScreenAccess = require(modulePath);
  } catch (error) {
    console.error("Native screen access helper unavailable:", error);
    nativeScreenAccess = null;
  }
  return nativeScreenAccess;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 640,
    minWidth: 820,
    minHeight: 580,
    show: false,
    title: "深空文明呼叫终端",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: "#05090b",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(page("index.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("focus", () => {
    mainWindow?.webContents.send("capture-status-refresh");
  });
  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
}

function createCallWindow() {
  if (callWindow && !callWindow.isDestroyed()) {
    callWindow.focus();
    return;
  }

  callWindow = new BrowserWindow({
    width: 390,
    height: 580,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  callWindow.setAlwaysOnTop(true, "floating");
  callWindow.loadFile(page("call.html"));
  callWindow.once("ready-to-show", () => {
    callWindow.show();
    callWindow.focus();
    mainWindow?.webContents.send("call-active");
  });
  callWindow.on("closed", () => {
    callWindow = undefined;
  });
}

async function capturePrimaryDisplay() {
  try {
    const display = screen.getPrimaryDisplay();
    const retinaScale = Math.max(1, display.scaleFactor || 1);
    const captureScale = Math.min(
      retinaScale,
      3840 / display.size.width,
      2160 / display.size.height
    );
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: {
        width: Math.max(1920, Math.round(display.size.width * captureScale)),
        height: Math.max(1080, Math.round(display.size.height * captureScale))
      }
    });
    const source = sources.find((item) => String(item.display_id) === String(display.id)) ?? sources[0];
    if (!source || source.thumbnail.isEmpty()) return null;
    const png = source.thumbnail.toPNG();
    const size = source.thumbnail.getSize();
    return {
      bytes: png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength),
      mimeType: "image/png",
      pixelWidth: size.width,
      pixelHeight: size.height
    };
  } catch (error) {
    console.error("Desktop capture unavailable:", error);
    return null;
  }
}

async function captureOpenAppIcons() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: { width: 1, height: 1 },
      fetchWindowIcons: true
    });
    const seen = new Set();
    const icons = [];

    for (const source of sources) {
      if (["深空文明呼叫终端", "微信语音通话", "远程视觉层"].includes(source.name)) continue;
      if (!source.appIcon || source.appIcon.isEmpty()) continue;
      const dataUrl = source.appIcon
        .resize({ width: 96, height: 96, quality: "best" })
        .toDataURL();
      if (!dataUrl || seen.has(dataUrl)) continue;
      seen.add(dataUrl);
      icons.push({ name: source.name, dataUrl });
      if (icons.length === 8) break;
    }

    return icons;
  } catch (error) {
    console.error("Application icon capture unavailable:", error);
    return [];
  }
}

function captureBelowTakeoverWindow() {
  if (!takeoverWindow || takeoverWindow.isDestroyed()) return null;
  const nativeAccess = getNativeScreenAccess();
  if (!nativeAccess?.captureBelowWindow) return null;

  try {
    const display = screen.getPrimaryDisplay();
    const sourceId = takeoverWindow.getMediaSourceId();
    const windowId = Number.parseInt(String(sourceId).split(":")[1], 10);
    if (!Number.isFinite(windowId)) return null;

    const png = nativeAccess.captureBelowWindow(
      windowId,
      display.bounds.x,
      display.bounds.y,
      display.bounds.width,
      display.bounds.height
    );
    if (!png?.length) return null;
    return {
      bytes: png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength),
      mimeType: "image/png"
    };
  } catch (error) {
    console.error("Seamless desktop capture unavailable:", error);
    return null;
  }
}

function restoreDesktop() {
  pendingTakeoverCapture = undefined;
  if (takeoverWindow && !takeoverWindow.isDestroyed()) takeoverWindow.close();
  takeoverWindow = undefined;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("call-ended");
  } else {
    createMainWindow();
  }
}

function createTakeoverWindow(snapshot, appIcons) {
  const display = screen.getPrimaryDisplay();
  const overscan = 8;
  const takeoverBounds = {
    x: display.bounds.x - overscan,
    y: display.bounds.y - overscan,
    width: display.bounds.width + overscan * 2,
    height: display.bounds.height + overscan * 2
  };
  takeoverWindow = new BrowserWindow({
    ...takeoverBounds,
    show: false,
    frame: false,
    transparent: false,
    roundedCorners: false,
    backgroundColor: "#000000",
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    enableLargerThanScreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  takeoverWindow.setAlwaysOnTop(true, "screen-saver", 1);
  takeoverWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  takeoverWindow.loadFile(page("takeover.html"));
  takeoverWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "Escape" || (input.meta && input.key.toLowerCase() === "q")) {
      event.preventDefault();
      restoreDesktop();
    }
  });
  takeoverWindow.webContents.once("did-finish-load", () => {
    takeoverWindow.webContents.send("takeover-init", {
      snapshot,
      appIcons,
      width: display.size.width,
      height: display.size.height
    });
  });
  takeoverWindow.on("closed", () => {
    takeoverWindow = undefined;
  });
}

ipcMain.on("begin-call", createCallWindow);

ipcMain.on("dismiss-call", () => {
  if (callWindow && !callWindow.isDestroyed()) callWindow.close();
  mainWindow?.webContents.send("call-ended");
});

ipcMain.on("reject-call", () => {
  if (takeoverWindow && !takeoverWindow.isDestroyed()) return;
  pendingTakeoverCapture = { appIcons: captureOpenAppIcons() };
  createTakeoverWindow(null, []);
});

ipcMain.on("restore-desktop", restoreDesktop);

ipcMain.on("takeover-render-ready", async (event) => {
  if (!takeoverWindow || takeoverWindow.isDestroyed()) return;
  if (event.sender !== takeoverWindow.webContents) return;
  takeoverWindow.show();
  takeoverWindow.focus();

  const capture = pendingTakeoverCapture;
  pendingTakeoverCapture = undefined;
  if (!capture) return;

  await wait(34);
  if (callWindow && !callWindow.isDestroyed()) callWindow.hide();
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
  await wait(80);

  const snapshot = captureBelowTakeoverWindow();
  const appIcons = await capture.appIcons;
  if (callWindow && !callWindow.isDestroyed()) callWindow.close();
  if (!takeoverWindow || takeoverWindow.isDestroyed()) return;
  takeoverWindow.webContents.send("takeover-background", { snapshot, appIcons });
});

ipcMain.handle("get-capture-status", () => {
  if (process.platform !== "darwin") return "granted";
  return systemPreferences.getMediaAccessStatus("screen");
});

ipcMain.handle("verify-capture-access", async () => {
  const snapshot = await capturePrimaryDisplay();
  const status = process.platform === "darwin"
    ? systemPreferences.getMediaAccessStatus("screen")
    : "granted";
  return { status, available: Boolean(snapshot) };
});

ipcMain.handle("request-capture-access", async () => {
  if (process.platform === "darwin" && systemPreferences.getMediaAccessStatus("screen") !== "granted") {
    getNativeScreenAccess()?.request();
    await wait(350);
  }

  const status = process.platform === "darwin"
    ? systemPreferences.getMediaAccessStatus("screen")
    : "granted";
  const snapshot = status === "granted" ? await capturePrimaryDisplay() : null;
  return { status, available: Boolean(snapshot) };
});

ipcMain.handle("open-capture-settings", () => shell.openExternal(
  "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
));

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([{
    label: "深空文明呼叫终端",
    submenu: [{ label: "退出深空文明呼叫终端", accelerator: "Command+Q", click: () => app.quit() }]
  }]));
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
