const desktopBase = document.querySelector("#desktopBase");
const fallbackDesktop = document.querySelector("#fallbackDesktop");
const abductionObjects = document.querySelector("#abductionObjects");
const particleField = document.querySelector("#particleField");
const particleContext = particleField.getContext("2d");
const status = document.querySelector("#takeoverStatus");
const deliveryState = document.querySelector("#deliveryState");
const typingText = document.querySelector("#typingText");
const alienDraft = document.querySelector("#alienDraft");
const draftState = document.querySelector("#draftState");
const unlockCountdown = document.querySelector("#unlockCountdown");

const timers = [];
const SECONDS_PER_DAY = 24 * 60 * 60;
const SECONDS_PER_YEAR = 365 * SECONDS_PER_DAY;
const INITIAL_UNLOCK_SECONDS = (9999 * SECONDS_PER_YEAR) + (364 * SECONDS_PER_DAY) + (23 * 60 * 60) + (59 * 60) + 59;
let audioContext;
let activeSnapshot;
let activeSnapshotUrl;
let countdownTimer;
let particleFrame;
let particles = [];

function schedule(callback, delay) {
  timers.push(window.setTimeout(callback, delay));
}

function pulse(frequency, duration = .35, volume = .045) {
  audioContext ??= new AudioContext();
  void audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(18, frequency * .45), audioContext.currentTime + duration);
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + .04);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration + .03);
}

function cleanTone(frequency, delay = 0, duration = .16, volume = .025) {
  audioContext ??= new AudioContext();
  void audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const start = audioContext.currentTime + delay;
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + .02);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .02);
}

function startRumble() {
  audioContext ??= new AudioContext();
  void audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 37;
  filter.type = "lowpass";
  filter.frequency.value = 105;
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.026, audioContext.currentTime + 1.4);
  gain.gain.exponentialRampToValueAtTime(.045, audioContext.currentTime + 6.2);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + 10.4);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 10.5);
}

function seeded(index, salt = 1) {
  const value = Math.sin(index * 999.31 + salt * 77.17) * 43758.5453;
  return value - Math.floor(value);
}

function setStatus(title, detail) {
  status.querySelector("strong").textContent = title;
  status.querySelector("small").textContent = detail;
}

function formatUnlockCountdown(totalSeconds) {
  const years = Math.floor(totalSeconds / SECONDS_PER_YEAR);
  const afterYears = totalSeconds % SECONDS_PER_YEAR;
  const days = Math.floor(afterYears / SECONDS_PER_DAY);
  const afterDays = afterYears % SECONDS_PER_DAY;
  const hours = Math.floor(afterDays / 3600);
  const minutes = Math.floor((afterDays % 3600) / 60);
  const seconds = afterDays % 60;
  return `${years}年 ${String(days).padStart(3, "0")}天 ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startUnlockCountdown() {
  const startedAt = performance.now();
  const update = () => {
    const elapsedSeconds = Math.floor((performance.now() - startedAt) / 1000);
    unlockCountdown.textContent = formatUnlockCountdown(Math.max(0, INITIAL_UNLOCK_SECONDS - elapsedSeconds));
  };
  update();
  countdownTimer = window.setInterval(update, 200);
}

function createAbductionObjects(appIcons = []) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const iconSize = Math.round(Math.min(62, Math.max(48, height * .066)));
  const realIcons = appIcons.filter((icon) => icon?.dataUrl).slice(0, 8);
  const iconCount = realIcons.length || 7;
  const iconSpacing = iconSize * 1.18;
  const iconRowWidth = iconSize + (iconCount - 1) * iconSpacing;
  const iconStartX = (width - iconRowWidth) / 2;
  const iconY = height - iconSize - Math.max(13, height * .016);
  const appSpecs = Array.from({ length: iconCount }, (_, index) => ({
    type: "app",
    x: (iconStartX + index * iconSpacing) / width,
    y: iconY / height,
    size: iconSize,
    icon: realIcons[index]?.dataUrl,
    name: realIcons[index]?.name,
    snapshotCrop: realIcons.length === 0
  }));
  const specs = [
    { type: "window", x: .04, y: .12, w: .3, h: .23 },
    { type: "window", x: .63, y: .14, w: .31, h: .21 },
    { type: "window", x: .12, y: .5, w: .28, h: .25 },
    { type: "window", x: .57, y: .49, w: .34, h: .25 },
    ...appSpecs
  ];

  specs.forEach((spec, index) => {
    const object = document.createElement("i");
    let objectWidth;
    let objectHeight;
    if (spec.type === "window") {
      object.className = "abduction-object object-window";
      objectWidth = spec.w * width;
      objectHeight = spec.h * height;
      object.style.width = `${objectWidth}px`;
      object.style.height = `${objectHeight}px`;
      object.style.backgroundSize = `${width}px ${height}px`;
      object.style.backgroundPosition = `${-spec.x * width}px ${-spec.y * height}px`;
      object.dataset.source = "desktop-snapshot";
    } else {
      object.className = "abduction-object object-app";
      objectWidth = spec.size;
      objectHeight = spec.size;
      object.style.width = `${objectWidth}px`;
      object.style.height = `${objectHeight}px`;
      if (spec.icon) {
        object.style.backgroundImage = `url("${spec.icon}")`;
        object.dataset.source = "native-window-icon";
      } else if (spec.snapshotCrop) {
        object.classList.add("object-app-snapshot");
        object.style.backgroundImage = "var(--desktop-image)";
        object.style.backgroundSize = `${width}px ${height}px`;
        object.dataset.source = "desktop-dock-crop";
      }
      if (spec.name) object.title = spec.name;
    }

    const x = spec.x * width;
    const y = spec.y * height;
    const centerX = x + objectWidth / 2;
    const centerY = y + objectHeight / 2;
    const targetX = width * .5 - centerX;
    const targetY = height * .35 - centerY;
    const direction = centerX < width * .5 ? 1 : -1;
    const curl = direction * (90 + seeded(index, 5) * 210);
    const rotation = (seeded(index, 2) - .5) * 250;

    object.style.left = `${x}px`;
    object.style.top = `${y}px`;
    if (spec.snapshotCrop) object.style.backgroundPosition = `${-x}px ${-y}px`;
    object.style.setProperty("--tug-x", `${targetX * .025}px`);
    object.style.setProperty("--tug-y", `${-5 - seeded(index, 4) * 12}px`);
    object.style.setProperty("--arc-x", `${targetX * .42 + curl}px`);
    object.style.setProperty("--arc-y", `${targetY * .34 - 55 - seeded(index, 9) * 80}px`);
    object.style.setProperty("--near-x", `${targetX * .8 - curl * .18}px`);
    object.style.setProperty("--near-y", `${targetY * .82 - 28}px`);
    object.style.setProperty("--target-x", `${targetX}px`);
    object.style.setProperty("--target-y", `${targetY}px`);
    object.style.setProperty("--tilt", `${(seeded(index, 3) - .5) * 8}deg`);
    object.style.setProperty("--arc-rotation", `${rotation * .34}deg`);
    object.style.setProperty("--near-rotation", `${rotation * .72}deg`);
    object.style.setProperty("--rotation", `${rotation}deg`);
    const isAppIcon = spec.type === "app";
    object.style.setProperty("--delay", `${(isAppIcon ? .04 : .72) + seeded(index, 6) * (isAppIcon ? .42 : .48)}s`);
    object.style.setProperty("--duration", `${(isAppIcon ? 2.75 : 3.15) + seeded(index, 7) * .55}s`);
    abductionObjects.append(object);
  });
}

function typeAlienDraft(text, step = 115) {
  alienDraft.textContent = "";
  const characters = Array.from(text);
  characters.forEach((_, index) => {
    schedule(() => {
      alienDraft.textContent = characters.slice(0, index + 1).join("");
      if (index % 2 === 0) cleanTone(510 + index * 12, 0, .045, .006);
    }, index * step);
  });
}

function deleteAlienDraft(step = 85) {
  const characters = Array.from(alienDraft.textContent);
  characters.forEach((_, index) => {
    schedule(() => {
      alienDraft.textContent = characters.slice(0, characters.length - index - 1).join("");
      if (index % 2 === 0) cleanTone(310 - Math.min(index * 8, 90), 0, .04, .005);
    }, index * step);
  });
}

function prepareParticleField() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  particleField.width = Math.round(window.innerWidth * ratio);
  particleField.height = Math.round(window.innerHeight * ratio);
  particleContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  particles = Array.from({ length: 180 }, (_, index) => ({
    startX: seeded(index, 10) * window.innerWidth,
    startY: (.27 + seeded(index, 11) * .77) * window.innerHeight,
    targetX: window.innerWidth * .5 + (seeded(index, 12) - .5) * 32,
    targetY: window.innerHeight * .35 + (seeded(index, 13) - .5) * 14,
    delay: seeded(index, 14) * 1350,
    duration: 2100 + seeded(index, 15) * 1900,
    amplitude: 24 + seeded(index, 16) * 125,
    phase: seeded(index, 17) * Math.PI * 2,
    turns: 1.5 + seeded(index, 18) * 2.8,
    size: .7 + seeded(index, 19) * 2.8
  }));
}

function stopParticleVortex() {
  window.cancelAnimationFrame(particleFrame);
  particleFrame = undefined;
  particleContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function startParticleVortex() {
  stopParticleVortex();
  const startedAt = performance.now();
  const draw = (now) => {
    const elapsed = now - startedAt;
    particleContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((particle) => {
      const progress = Math.min(1, Math.max(0, (elapsed - particle.delay) / particle.duration));
      if (progress <= 0 || progress >= 1) return;
      const pull = progress ** 2.35;
      const orbit = Math.sin(particle.phase + progress * Math.PI * 2 * particle.turns);
      const sway = orbit * particle.amplitude * (1 - pull);
      const x = particle.startX + (particle.targetX - particle.startX) * pull + sway;
      const y = particle.startY + (particle.targetY - particle.startY) * pull - Math.abs(orbit) * 34 * (1 - pull);
      const alpha = Math.min(1, progress * 8) * (1 - progress) ** .28;
      const angle = Math.atan2(particle.targetY - y, particle.targetX - x);
      particleContext.save();
      particleContext.translate(x, y);
      particleContext.rotate(angle);
      particleContext.fillStyle = `rgba(157,255,229,${alpha * .82})`;
      particleContext.shadowColor = "rgba(117,255,214,.8)";
      particleContext.shadowBlur = 8;
      particleContext.fillRect(-particle.size * 4, -particle.size / 2, particle.size * 8, particle.size);
      particleContext.restore();
    });
    if (elapsed < 4300) particleFrame = window.requestAnimationFrame(draw);
  };
  particleFrame = window.requestAnimationFrame(draw);
}

function releaseSnapshot() {
  document.documentElement.style.removeProperty("--desktop-image");
  desktopBase.style.backgroundImage = "none";
  abductionObjects.replaceChildren();
  stopParticleVortex();
  if (activeSnapshotUrl) URL.revokeObjectURL(activeSnapshotUrl);
  activeSnapshotUrl = undefined;
  activeSnapshot = undefined;
}

function installDesktopBackground(payload = {}) {
  activeSnapshot = payload.snapshot;
  const hasSnapshot = Boolean(activeSnapshot?.bytes);
  let desktopImage = "radial-gradient(circle at 42vw 38vh, #37515e, #111c24 46%, #05090d)";

  if (activeSnapshotUrl) URL.revokeObjectURL(activeSnapshotUrl);
  activeSnapshotUrl = undefined;
  if (hasSnapshot) {
    const blob = new Blob([activeSnapshot.bytes], { type: activeSnapshot.mimeType || "image/png" });
    activeSnapshotUrl = URL.createObjectURL(blob);
    desktopImage = `url("${activeSnapshotUrl}")`;
  }
  document.documentElement.style.setProperty("--desktop-image", desktopImage);

  fallbackDesktop.style.display = hasSnapshot ? "none" : "block";
  document.body.classList.toggle("desktop-ready", hasSnapshot);
  abductionObjects.replaceChildren();
  if (hasSnapshot || payload.appIcons?.length) createAbductionObjects(payload.appIcons || []);
  payload.snapshot = undefined;
  activeSnapshot = undefined;
}

window.spaceTerminal.onTakeoverInit((payload) => {
  installDesktopBackground(payload);
  prepareParticleField();
  document.body.classList.add("reply-visible");
  setStatus("正在读取你的拒接理由", "原文：我现在不方便接听");
  cleanTone(720, 0, .14, .02);
  cleanTone(960, .1, .16, .017);
  window.spaceTerminal.takeoverRenderReady();

  schedule(() => {
    document.body.classList.add("translating");
    setStatus("大模型高情商翻译中", "正在重新组织表达");
    cleanTone(430, 0, .18, .016);
  }, 650);

  schedule(() => {
    document.body.classList.add("translation-ready");
    setStatus("翻译结果已生成", "贵文明暂未达到本用户的通话标准");
    cleanTone(560, 0, .12, .022);
    cleanTone(820, .1, .16, .018);
  }, 1900);

  schedule(() => {
    document.body.classList.add("reply-sent");
    deliveryState.textContent = "已发送至来电文明";
    setStatus("翻译结果已发送至来电文明", "已替你准确表达真实意思");
    cleanTone(720, 0, .12, .02);
    cleanTone(1040, .1, .2, .018);
  }, 2800);

  schedule(() => {
    document.body.classList.add("alien-typing");
    typingText.textContent = "对方正在输入……";
    draftState.textContent = "正在接收字符";
    setStatus("正在等待对方回复", "已检测到远端输入活动");
    cleanTone(430, 0, .18, .018);
  }, 3700);

  schedule(() => {
    typeAlienDraft("你们这个文明……");
  }, 4200);

  schedule(() => {
    document.body.classList.add("alien-deleting");
    typingText.textContent = "对方正在删除……";
    draftState.textContent = "远端正在撤回草稿";
    setStatus("对方正在删除输入内容", "检测到连续退格操作");
    deleteAlienDraft();
  }, 5500);

  schedule(() => {
    document.body.classList.remove("alien-deleting");
    typingText.textContent = "对方再次输入……";
    draftState.textContent = "正在接收新的字符";
    setStatus("对方改变了措辞", "远端文明正在重新组织语言");
  }, 6600);

  schedule(() => {
    typeAlienDraft("算了。");
  }, 7000);

  schedule(() => {
    document.body.classList.add("alien-deleting");
    typingText.textContent = "对方又删除了……";
    draftState.textContent = "草稿即将清空";
    deleteAlienDraft(140);
  }, 7700);

  schedule(() => {
    document.body.classList.add("alien-silent");
    typingText.textContent = "对方没有继续反驳";
    draftState.textContent = "草稿已清空 · 0 字符";
    setStatus("对方没有继续反驳", "当前通信状态：异常安静");
    pulse(46, .62, .045);
  }, 8500);

  schedule(() => {
    document.body.classList.add("arrival");
    setStatus("检测到未登记飞行器", "对方正在进入本地桌面空域");
    startRumble();
    cleanTone(880, 0, .14, .024);
    cleanTone(1320, .1, .18, .018);
  }, 10200);

  schedule(() => {
    document.body.classList.add("precision");
    setStatus("对方已抵达本地桌面", "正在改用实体方式处理意见");
    pulse(76, .54, .045);
  }, 12100);

  schedule(() => {
    document.body.classList.add("classified");
    setStatus("已锁定本地窗口与应用", "正在直接处理当前桌面内容");
    cleanTone(540, 0, .12, .025);
    cleanTone(690, .11, .12, .02);
    cleanTone(840, .22, .15, .018);
    pulse(31, 1.05, .075);
  }, 12600);

  schedule(() => {
    document.body.classList.add("collecting-assets", "abducting");
    setStatus("正在建立资料回收通道", "请放心，设备本体不在处理范围内");
    cleanTone(520, 0, .12, .024);
    cleanTone(660, .11, .12, .019);
    cleanTone(820, .22, .15, .017);
    startParticleVortex();
    pulse(112, .9, .065);
  }, 13200);

  schedule(() => {
    document.body.classList.add("is-black");
    pulse(29, .72, .045);
  }, 17250);

  schedule(releaseSnapshot, 17800);

  schedule(() => {
    document.body.classList.add("is-final");
    cleanTone(660, 0, .18, .02);
    cleanTone(990, .14, .28, .018);
  }, 18100);

  schedule(() => {
    document.body.classList.add("is-data-gone");
    cleanTone(510, 0, .18, .018);
  }, 19100);

  schedule(() => {
    document.body.classList.add("is-device-kept");
    cleanTone(760, 0, .2, .02);
  }, 20100);

  schedule(() => {
    document.body.classList.add("is-locked");
    startUnlockCountdown();
    cleanTone(220, 0, .22, .025);
    cleanTone(165, .18, .35, .022);
  }, 21100);

  schedule(() => {
    document.body.classList.add("is-comforted");
    cleanTone(660, 0, .15, .02);
    cleanTone(880, .12, .24, .018);
  }, 23100);
});

window.spaceTerminal.onTakeoverBackground((payload) => {
  installDesktopBackground(payload);
});

window.addEventListener("beforeunload", () => {
  timers.forEach(window.clearTimeout);
  window.clearInterval(countdownTimer);
  releaseSnapshot();
  void audioContext?.close();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") window.spaceTerminal.restoreDesktop();
});
