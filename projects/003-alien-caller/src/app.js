const STAGES = [
  { title: "校准本地星际坐标", detail: "正在锁定太阳系相对位置", range: "0.02 LY", nodes: "000,128", confidence: "6.4%", progress: 9 },
  { title: "穿透太阳风干扰层", detail: "正在修正日冕抛射与磁暴噪声", range: "0.76 LY", nodes: "001,904", confidence: "18.7%", progress: 23 },
  { title: "扫描宜居星球信号", detail: "正在检索具有稳定技术特征的无线电脉冲", range: "12.80 LY", nodes: "013,842", confidence: "41.2%", progress: 42 },
  { title: "建立非人类协议握手", detail: "检测到无法归类的重复应答结构", range: "4.24 LY", nodes: "001,001", confidence: "68.9%", progress: 64 },
  { title: "翻译未知通信语法", detail: "正在将高维信号映射至地球语言模型", range: "4.24 LY", nodes: "000,001", confidence: "91.6%", progress: 83 },
  { title: "接入地球通信网络", detail: "接收方正在选择本地可用呼叫方式", range: "4.24 LY", nodes: "000,001", confidence: "99.8%", progress: 100 }
];

const shell = document.querySelector("#terminalShell");
const launchButton = document.querySelector("#launchButton");
const permissionButton = document.querySelector("#permissionButton");
const permissionLabel = document.querySelector("#permissionLabel");
const listItems = [...document.querySelectorAll("#stageList li")];
const progressBar = document.querySelector("#progressBar");
const progressValue = document.querySelector("#progressValue");
const footerState = document.querySelector("#footerState");
const footerDetail = document.querySelector("#footerDetail");
const stageCode = document.querySelector("#stageCode");
const stageTitle = document.querySelector("#stageTitle");
const stageDetail = document.querySelector("#stageDetail");
const rangeValue = document.querySelector("#rangeValue");
const nodeValue = document.querySelector("#nodeValue");
const confidenceValue = document.querySelector("#confidenceValue");

let timers = [];
let audioContext;
let captureReady = false;
let isProcessing = false;

function tone(frequency, duration = .08, volume = .025) {
  audioContext ??= new AudioContext();
  void audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + .01);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration + .03);
}

function renderStage(index) {
  const stage = STAGES[index];
  stageCode.textContent = `DSC / ${String(index + 1).padStart(2, "0")}`;
  stageTitle.textContent = stage.title;
  stageDetail.textContent = stage.detail;
  rangeValue.textContent = stage.range;
  nodeValue.textContent = stage.nodes;
  confidenceValue.textContent = stage.confidence;
  progressBar.style.width = `${stage.progress}%`;
  progressValue.textContent = `${String(stage.progress).padStart(2, "0")}%`;
  footerState.textContent = stage.title;
  footerDetail.textContent = stage.detail;

  listItems.forEach((item, itemIndex) => {
    item.classList.toggle("done", itemIndex < index);
    item.classList.toggle("active", itemIndex === index);
    item.querySelector("i").textContent = itemIndex < index ? "完成" : itemIndex === index ? "执行中" : "待执行";
  });
  tone(380 + index * 120, .1);
}

function clearTimers() {
  timers.forEach(window.clearTimeout);
  timers = [];
}

function startContact() {
  if (!captureReady) {
    permissionLabel.textContent = "请先允许桌面捕获，再向宇宙发送呼叫";
    permissionButton.hidden = false;
    permissionButton.focus();
    return;
  }

  clearTimers();
  isProcessing = true;
  shell.classList.remove("call-active");
  shell.classList.add("is-processing");
  launchButton.disabled = true;
  renderStage(0);

  [780, 1580, 2380, 3180, 3980].forEach((delay, offset) => {
    timers.push(window.setTimeout(() => renderStage(offset + 1), delay));
  });

  timers.push(window.setTimeout(() => {
    footerState.textContent = "实时通信链路已建立";
    footerDetail.textContent = "REMOTE PARTY SELECTING LOCAL ENDPOINT";
    tone(1040, .18, .04);
    tone(1480, .12, .025);
  }, 4680));

  timers.push(window.setTimeout(() => window.spaceTerminal.beginCall(), 5200));
}

async function refreshCaptureStatus() {
  try {
    const status = await window.spaceTerminal.getCaptureStatus();
    if (status === "granted") {
      captureReady = true;
      document.querySelector("#permissionCard").classList.add("is-ready");
      permissionLabel.textContent = "桌面捕获已就绪";
      permissionButton.hidden = true;
      launchButton.disabled = isProcessing;
      return;
    }

    captureReady = false;
    document.querySelector("#permissionCard").classList.remove("is-ready");
    launchButton.disabled = true;
    permissionLabel.textContent = status === "restricted"
      ? "系统策略限制了本地环境同步"
      : "本地环境同步尚未授权";
    permissionButton.textContent = "打开系统设置授权";
    permissionButton.hidden = false;
  } catch {
    captureReady = false;
    document.querySelector("#permissionCard").classList.remove("is-ready");
    launchButton.disabled = true;
    permissionLabel.textContent = "无法读取本地环境同步状态";
    permissionButton.textContent = "重新检测";
    permissionButton.hidden = false;
  }
}

launchButton.addEventListener("click", startContact);
permissionButton.addEventListener("click", async () => {
  permissionButton.disabled = true;
  permissionLabel.textContent = "正在验证本地画面访问权限";

  try {
    const result = await window.spaceTerminal.requestCaptureAccess();
    if (result.available && result.status === "granted") {
      await refreshCaptureStatus();
      return;
    }

    permissionLabel.textContent = "请在系统设置中开启，返回后将自动检测";
    permissionButton.textContent = "我已开启，重新检测";
    await window.spaceTerminal.openCaptureSettings();
  } finally {
    permissionButton.disabled = false;
  }
});

window.spaceTerminal.onCaptureStatusRefresh(() => void refreshCaptureStatus());
window.addEventListener("focus", () => void refreshCaptureStatus());
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void refreshCaptureStatus();
});

window.spaceTerminal.onCallActive(() => shell.classList.add("call-active"));
window.spaceTerminal.onCallEnded(() => {
  clearTimers();
  isProcessing = false;
  shell.classList.remove("call-active", "is-processing");
  launchButton.disabled = !captureReady;
  progressBar.style.width = "0";
  progressValue.textContent = "00%";
  footerState.textContent = "系统待命";
  footerDetail.textContent = "未向深空发送任何本地数据";
  rangeValue.textContent = "0.00 LY";
  nodeValue.textContent = "000,000";
  confidenceValue.textContent = "0.0%";
  listItems.forEach((item) => {
    item.classList.remove("done", "active");
    item.querySelector("i").textContent = "待执行";
  });
});

void refreshCaptureStatus();
