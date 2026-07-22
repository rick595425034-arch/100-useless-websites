const card = document.querySelector("#callCard");
const rejectButton = document.querySelector("#rejectButton");
const acceptButton = document.querySelector("#acceptButton");
const hangupButton = document.querySelector("#hangupButton");
const connectedActions = document.querySelector("#connectedActions");
const callerName = document.querySelector("#callerName");
const callStatus = document.querySelector("#callStatus");
const protocol = document.querySelector("#protocol");

let context;
let ringTimer;

function beep(frequency, duration, volume = .035) {
  context ??= new AudioContext();
  void context.resume();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + .02);
  gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration + .03);
}

function ring() {
  beep(740, .3);
  window.setTimeout(() => beep(930, .34), 330);
}

function stopRing() {
  window.clearInterval(ringTimer);
  ringTimer = undefined;
}

rejectButton.addEventListener("click", () => {
  stopRing();
  beep(120, .42, .06);
  rejectButton.disabled = true;
  acceptButton.disabled = true;
  callStatus.textContent = "正在交由大模型处理拒接理由…";
  protocol.textContent = "HANDOFF TO COURTESY ENGINE";
  window.spaceTerminal.rejectCall();
});

acceptButton.addEventListener("click", () => {
  stopRing();
  card.classList.add("connected");
  connectedActions.hidden = false;
  callerName.textContent = "翻译通道连接中";
  callStatus.textContent = "正在将未知语音转换为普通话";
  protocol.textContent = "LIVE TRANSLATION / BUFFERING";
  beep(640, .18);
  window.setTimeout(() => {
    callerName.textContent = "未知星际联系人";
    callStatus.textContent = "不好意思，打错星球了。";
    protocol.textContent = "REMOTE PARTY DISCONNECTED";
    const utterance = new SpeechSynthesisUtterance("不好意思，打错星球了");
    utterance.lang = "zh-CN";
    utterance.pitch = .45;
    utterance.rate = .76;
    speechSynthesis.speak(utterance);
  }, 1800);
});

hangupButton.addEventListener("click", () => window.spaceTerminal.dismissCall());

ring();
ringTimer = window.setInterval(ring, 1800);
