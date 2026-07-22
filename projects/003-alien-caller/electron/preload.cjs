const { contextBridge, ipcRenderer } = require("electron");

let pendingTakeoverInit;
let takeoverInitCallback;

ipcRenderer.on("takeover-init", (_event, data) => {
  if (takeoverInitCallback) {
    const callback = takeoverInitCallback;
    takeoverInitCallback = undefined;
    callback(data);
    return;
  }
  pendingTakeoverInit = data;
});

contextBridge.exposeInMainWorld("spaceTerminal", {
  beginCall: () => ipcRenderer.send("begin-call"),
  rejectCall: () => ipcRenderer.send("reject-call"),
  dismissCall: () => ipcRenderer.send("dismiss-call"),
  restoreDesktop: () => ipcRenderer.send("restore-desktop"),
  getCaptureStatus: () => ipcRenderer.invoke("get-capture-status"),
  verifyCaptureAccess: () => ipcRenderer.invoke("verify-capture-access"),
  requestCaptureAccess: () => ipcRenderer.invoke("request-capture-access"),
  openCaptureSettings: () => ipcRenderer.invoke("open-capture-settings"),
  takeoverRenderReady: () => ipcRenderer.send("takeover-render-ready"),
  onCaptureStatusRefresh: (callback) => ipcRenderer.on("capture-status-refresh", callback),
  onCallActive: (callback) => ipcRenderer.on("call-active", callback),
  onCallEnded: (callback) => ipcRenderer.on("call-ended", callback),
  onTakeoverBackground: (callback) => ipcRenderer.on("takeover-background", (_event, data) => callback(data)),
  onTakeoverInit: (callback) => {
    if (pendingTakeoverInit) {
      const data = pendingTakeoverInit;
      pendingTakeoverInit = undefined;
      queueMicrotask(() => callback(data));
      return;
    }
    takeoverInitCallback = callback;
  }
});
