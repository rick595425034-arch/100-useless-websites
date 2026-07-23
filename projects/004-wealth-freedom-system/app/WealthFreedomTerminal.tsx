"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Phase = "idle" | "deposit" | "credited" | "flow" | "compound" | "freedom" | "escape" | "result";

const steps = [
  { code: "SETTLEMENT", label: "完成资金入账清算" },
  { code: "LIQUIDITY", label: "创建流动资金链" },
  { code: "COMPOUND", label: "启动无限增值循环" },
  { code: "LIBERATION", label: "执行真正财富自由" },
] as const;

const flowNodes = Array.from({ length: 12 }, (_, index) => index);
const sparks = Array.from({ length: 28 }, (_, index) => index);

function formatMoney(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, value));
}

function formatCertificateMoney(value: number) {
  const rounded = Math.max(0, Math.round(value));
  if (rounded >= 1_000_000_000) return `¥${(rounded / 1_000_000_000).toFixed(2)}B`;
  return `¥${new Intl.NumberFormat("en-US").format(rounded)}`;
}

function phaseStep(phase: Phase) {
  if (phase === "deposit" || phase === "credited") return 0;
  if (phase === "flow") return 1;
  if (phase === "compound") return 2;
  if (phase === "freedom" || phase === "escape") return 3;
  if (phase === "result") return 4;
  return -1;
}

function WealthFxCanvas({ phase }: { phase: Phase }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    const startedAt = performance.now();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const hash = (value: number) => {
      const result = Math.sin(value * 91.731) * 43758.5453;
      return result - Math.floor(result);
    };

    const glowDot = (x: number, y: number, radius: number, alpha: number) => {
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius * 5);
      gradient.addColorStop(0, `rgba(255, 239, 186, ${alpha})`);
      gradient.addColorStop(0.25, `rgba(229, 199, 122, ${alpha * 0.55})`);
      gradient.addColorStop(1, "rgba(229, 199, 122, 0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius * 5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = `rgba(255, 244, 207, ${Math.min(1, alpha * 1.6)})`;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    };

    const draw = (now: number) => {
      const elapsed = now - startedAt;
      const cx = width / 2;
      const cy = height / 2;
      context.clearRect(0, 0, width, height);

      if (phase === "deposit" || phase === "credited") {
        for (let index = 0; index < 44; index += 1) {
          const offset = index / 44;
          const progress = (elapsed * 0.00042 + offset) % 1;
          const eased = 1 - Math.pow(1 - progress, 2.4);
          const angle = hash(index + 4) * Math.PI * 2;
          const startRadiusX = width * (0.46 + hash(index + 30) * 0.18);
          const startRadiusY = height * (0.42 + hash(index + 80) * 0.2);
          const sway = Math.sin(progress * Math.PI) * (hash(index + 9) - 0.5) * 70;
          const x = cx + Math.cos(angle) * startRadiusX * (1 - eased) + Math.sin(angle) * sway;
          const y = cy + Math.sin(angle) * startRadiusY * (1 - eased) - Math.cos(angle) * sway;
          const alpha = Math.sin(progress * Math.PI) * 0.8;
          context.strokeStyle = `rgba(214, 185, 111, ${alpha * 0.14})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x + (cx - x) * 0.08, y + (cy - y) * 0.08);
          context.stroke();
          glowDot(x, y, 1.2 + hash(index) * 1.3, alpha);
        }
      }

      if (["flow", "compound", "freedom"].includes(phase)) {
        const energy = phase === "compound" ? 1 : 0.68;
        const speed = phase === "compound" ? 1.9 : phase === "freedom" ? 1.2 : 0.72;
        [0, 1, 2].forEach((ring) => {
          const radiusX = 132 + ring * 48;
          const radiusY = 62 + ring * 23;
          context.save();
          context.translate(cx, cy);
          context.rotate((ring - 1) * 0.11);
          context.strokeStyle = `rgba(222, 197, 132, ${0.12 + ring * 0.025})`;
          context.lineWidth = 1;
          context.beginPath();
          context.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
          context.stroke();

          for (let packet = 0; packet < 6 + ring * 2; packet += 1) {
            const direction = ring % 2 === 0 ? 1 : -1;
            const angle = direction * elapsed * (0.0007 + ring * 0.00013) * speed + packet * (Math.PI * 2 / (6 + ring * 2));
            const x = Math.cos(angle) * radiusX;
            const y = Math.sin(angle) * radiusY;
            glowDot(x, y, 1.2 + ring * 0.35, energy * 0.9);
          }
          context.restore();
        });
      }

      if (phase === "freedom" || phase === "escape") {
        const age = Math.min(1, elapsed / 1300);
        for (let index = 0; index < 46; index += 1) {
          const angle = hash(index + 110) * Math.PI * 2;
          const speed = 70 + hash(index + 210) * 210;
          const distance = speed * age;
          const x = cx + Math.cos(angle) * distance;
          const y = cy + Math.sin(angle) * distance * 0.62;
          glowDot(x, y, 0.9 + hash(index) * 1.8, (1 - age) * 0.8);
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [phase]);

  return <canvas className="wealth-fx" ref={canvasRef} aria-hidden="true" />;
}

export function WealthFreedomTerminal() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [amountInput, setAmountInput] = useState("10000");
  const [principal, setPrincipal] = useState(10000);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [depositBeat, setDepositBeat] = useState(0);
  const [systemTime, setSystemTime] = useState(0);
  const timers = useRef<number[]>([]);
  const balanceFrame = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const currentStep = phaseStep(phase);
  const growthMultiple = principal > 0 ? Math.max(1, displayAmount / principal) : 1;
  const wealthTotal = principal * 888.88;
  const consolidatedCertificate = phase === "compound" || phase === "freedom" || phase === "escape";
  const certificateAmount = phase === "idle"
    ? Number(amountInput.replace(/[^\d.]/g, "")) || 0
    : phase === "compound"
      ? Math.max(principal, displayAmount)
      : phase === "freedom" || phase === "escape"
        ? wealthTotal
        : principal;
  const formattedBalance = formatMoney(displayAmount);
  const balanceSizeClass = formattedBalance.length >= 17
    ? "very-long-balance"
    : formattedBalance.length >= 13
      ? "long-balance"
      : "";
  const progress = useMemo(() => {
    const values: Record<Phase, number> = {
      idle: 0,
      deposit: 6 + depositBeat * 6,
      credited: 28,
      flow: 53,
      compound: 76,
      freedom: 89,
      escape: 96,
      result: 100,
    };
    return values[phase];
  }, [depositBeat, phase]);

  useEffect(() => {
    const timer = window.setInterval(() => setSystemTime((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      if (balanceFrame.current !== null) cancelAnimationFrame(balanceFrame.current);
    };
  }, []);

  function getAudioContext() {
    const context = audioContext.current ?? new AudioContext();
    audioContext.current = context;
    return context;
  }

  function tone(frequency: number, duration = 0.1, volume = 0.025, endFrequency?: number) {
    try {
      const context = getAudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + duration);
      gain.gain.setValueAtTime(volume, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch {
      // Audio is decorative; the performance remains complete without it.
    }
  }

  function noiseBurst(duration = 0.32, volume = 0.018) {
    try {
      const context = getAudioContext();
      const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      filter.type = "lowpass";
      filter.frequency.value = 1600;
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start();
    } catch {
      // Audio is decorative.
    }
  }

  function schedule(delay: number, callback: () => void) {
    timers.current.push(window.setTimeout(callback, delay));
  }

  function animateBalance(from: number, to: number, duration: number) {
    if (balanceFrame.current !== null) cancelAnimationFrame(balanceFrame.current);
    const startedAt = performance.now();

    const tick = (now: number) => {
      const rawProgress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - rawProgress, 3);
      setDisplayAmount(from + (to - from) * eased);
      if (rawProgress < 1) balanceFrame.current = requestAnimationFrame(tick);
    };

    balanceFrame.current = requestAnimationFrame(tick);
  }

  function beginLiberation() {
    const parsed = Number(amountInput.replace(/[^\d.]/g, ""));
    const safeAmount = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 99999999) : 100;

    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    if (balanceFrame.current !== null) cancelAnimationFrame(balanceFrame.current);

    setPrincipal(safeAmount);
    setDisplayAmount(0);
    setDepositBeat(0);
    setPhase("deposit");
    tone(220, 0.45, 0.025, 420);
    animateBalance(0, safeAmount, 2500);

    schedule(720, () => {
      setDepositBeat(1);
      tone(380, 0.08, 0.022);
    });
    schedule(1450, () => {
      setDepositBeat(2);
      tone(470, 0.08, 0.024);
    });
    schedule(2150, () => {
      setDepositBeat(3);
      tone(580, 0.11, 0.026);
    });

    schedule(2800, () => {
      setDisplayAmount(safeAmount);
      setPhase("credited");
      tone(620, 0.12, 0.035);
      schedule(150, () => tone(820, 0.26, 0.026));
    });

    schedule(4200, () => {
      setDisplayAmount(safeAmount);
      setPhase("flow");
      tone(260, 0.7, 0.02, 680);
    });

    schedule(6500, () => {
      setDisplayAmount(safeAmount);
      setPhase("compound");
      tone(520, 0.18, 0.03);
      schedule(120, () => tone(760, 0.36, 0.024, 1120));
      animateBalance(safeAmount, safeAmount * 888.88, 2500);
    });

    schedule(9100, () => {
      setDisplayAmount(safeAmount * 888.88);
      setPhase("freedom");
      noiseBurst(0.42, 0.02);
      tone(360, 0.85, 0.027, 980);
    });

    schedule(10450, () => {
      setPhase("escape");
      noiseBurst(0.6, 0.024);
      tone(920, 0.48, 0.03, 1500);
      animateBalance(safeAmount * 888.88, 0, 2550);
    });

    schedule(13400, () => {
      setDisplayAmount(0);
      setPhase("result");
      tone(520, 0.14, 0.032);
      schedule(170, () => tone(660, 0.28, 0.028));
    });
  }

  function reset() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    if (balanceFrame.current !== null) cancelAnimationFrame(balanceFrame.current);
    setDisplayAmount(0);
    setDepositBeat(0);
    setPhase("idle");
  }

  const depositMessages = ["正在验证资金接收账户", "正在接入 12 条清算通道", "正在完成跨区域资金确认", "正在写入最终到账余额"];
  const statusCopy: Record<Phase, string> = {
    idle: "财富引擎待命",
    deposit: depositMessages[depositBeat],
    credited: "资金已到账",
    flow: "正在创建流动资金链",
    compound: "无限钱生钱闭环已建立",
    freedom: "正在执行真正的财富自由",
    escape: "资产正在自主离场",
    result: "财富自由化已完成",
  };

  const balanceLabel: Record<Phase, string> = {
    idle: "当前已到账资产",
    deposit: "正在清算入账",
    credited: "资金确认到账",
    flow: "流动资金总额",
    compound: "流动资金总额",
    freedom: "可自由支配资产",
    escape: "资产正在离场",
    result: "当前受管资产",
  };

  return (
    <main className={`terminal phase-${phase}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="app-window" aria-live="polite">
        <header className="titlebar">
          <div className="window-controls" aria-hidden="true"><span /><span /><span /></div>
          <div className="brand-lockup">
            <span className="brand-mark">A</span>
            <div><strong>AUREUS</strong><small>WEALTH AUTONOMY LAB</small></div>
          </div>
          <div className="network-state"><span /> 全球资产网络在线</div>
        </header>

        <div className="workspace">
          <aside className="side-panel left-panel">
            <p className="eyebrow">SYSTEM OVERVIEW</p>
            <h1>财富自由<br />实现系统</h1>
            <p className="intro">接收、增值并完成您的资产最优配置。全程由全球流动性网络自动执行。</p>

            <div className="data-block">
              <span>清算通道</span>
              <strong>{phase === "idle" ? "—" : "12 / 12"}</strong>
              <small>{phase === "idle" ? "WAITING FOR CAPITAL" : "ALL CHANNELS CONFIRMED"}</small>
            </div>
            <div className="data-block">
              <span>实时增值倍数</span>
              <strong>{phase === "compound" || phase === "freedom" || phase === "escape" ? "×∞" : `×${growthMultiple.toFixed(2)}`}</strong>
              <small>COMPOUND LIQUIDITY LOOP</small>
            </div>
            <div className="data-block compact-data">
              <span>系统运行</span>
              <strong>{String(937 + systemTime).padStart(4, "0")}<i> 天</i></strong>
            </div>
          </aside>

          <section className="main-stage">
            <div className="balance-heading">
              <span>{balanceLabel[phase]}</span>
              <strong className={balanceSizeClass}>¥ {formattedBalance}</strong>
            </div>

            <div className="vault" aria-label="财富增值与自由化处理区域">
              <WealthFxCanvas phase={phase} />
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <div className="radar-sweep" />

              <div className="settlement-gates" aria-hidden="true">
                {Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--gate": index } as React.CSSProperties} />)}
              </div>

              <div className="liquidity-loop" aria-hidden="true">
                <div className="liquid-ring liquid-ring-one" />
                <div className="liquid-ring liquid-ring-two" />
                {flowNodes.map((node) => <i key={node} style={{ "--node": node } as React.CSSProperties}><b>¥</b></i>)}
              </div>

              <div className="infinity-core" aria-hidden="true"><strong>∞</strong><span>SELF-SUSTAINING LIQUIDITY</span></div>

              <div className={`asset-core ${phase === "escape" ? "is-escaping" : ""} ${phase === "result" ? "is-gone" : ""}`}>
                <div className="escape-trails" aria-hidden="true"><i /><i /><i /></div>
                <div className="flight-visual">
                  <div className="wing wing-left" aria-hidden="true"><span />{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</div>
                  <div className="wing wing-right" aria-hidden="true"><span />{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</div>
                  <div className="banknote">
                    <span className="note-shine" />
                    <span className="note-emblem">A</span>
                    <div className="note-copy">
                      <small>{phase === "idle" ? "PENDING CAPITAL CERTIFICATE" : phase === "deposit" ? "SETTLEMENT IN PROGRESS" : consolidatedCertificate ? "TOTAL ASSET CERTIFICATE" : "LIQUID ASSET CERTIFICATE"}</small>
                      <strong className={certificateAmount >= 1_000_000 ? "long-note-amount" : ""}>{formatCertificateMoney(certificateAmount)}</strong>
                      <span>{phase === "idle" ? "AWAITING SETTLEMENT" : phase === "deposit" ? "VERIFYING CAPITAL" : consolidatedCertificate ? "ALL PROFITS CONSOLIDATED" : "FULLY SETTLED CAPITAL"}</span>
                    </div>
                    <span className="note-seal">{phase === "idle" ? "待入账" : phase === "deposit" ? "清算中" : consolidatedCertificate ? "总资产" : "已到账"}</span>
                  </div>
                </div>
              </div>

              <span className="farewell-feather" aria-hidden="true" />

              <div className="freedom-particles" aria-hidden="true">
                {sparks.map((spark) => <i key={spark} style={{ "--particle": spark } as React.CSSProperties} />)}
              </div>

              {phase === "credited" && (
                <div className="credited-card">
                  <span>✓</span>
                  <div><small>SETTLEMENT CONFIRMED</small><strong>资金已到账</strong><b>¥ {formatMoney(principal)}</b></div>
                </div>
              )}

              {phase === "flow" && (
                <div className="compound-banner flow-banner"><small>CAPITAL ROUTING IN PROGRESS</small><strong>12 个流动节点正在闭合</strong></div>
              )}

              {phase === "compound" && (
                <div className="compound-banner"><small>LIQUIDITY LOOP ONLINE</small><strong>无限钱生钱闭环已建立</strong></div>
              )}

              {phase === "result" && (
                <div className="result-copy">
                  <span className="result-check">✓</span>
                  <p>真正的财富自由已实现</p>
                  <h2>您的财富<br />已获得自由</h2>
                  <strong>钱去了它真正想去的地方。</strong>
                </div>
              )}
            </div>

            <div className="status-line">
              <span className="status-dot" />
              <strong>{statusCopy[phase]}</strong>
              {phase !== "idle" && <i>{progress}%</i>}
            </div>

            {phase === "idle" ? (
              <div className="action-row">
                <label className="amount-field">
                  <span>本次计划注入本金</span>
                  <div><b>¥</b><input value={amountInput} inputMode="decimal" aria-label="本次计划注入本金金额" onChange={(event) => setAmountInput(event.target.value)} /></div>
                </label>
                <button className="primary-action" onClick={beginLiberation}><span>启动财富自由计划</span><i>→</i></button>
              </div>
            ) : phase === "result" ? (
              <button className="reset-action" onClick={reset}>重新拥有一次</button>
            ) : (
              <div className="processing-bar"><i style={{ width: `${progress}%` }} /></div>
            )}
          </section>

          <aside className="side-panel right-panel">
            <p className="eyebrow">WEALTH SEQUENCE</p>
            <div className="sequence-list">
              {steps.map((step, index) => {
                const complete = currentStep > index;
                const active = currentStep === index;
                return (
                  <div className={`sequence-item ${complete ? "complete" : ""} ${active ? "active" : ""}`} key={step.code}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{step.label}</strong><small>{complete ? "已完成" : active ? "处理中" : step.code}</small></div>
                    <i>{complete ? "✓" : ""}</i>
                  </div>
                );
              })}
            </div>

            <div className="freedom-meter">
              <div><span>系统完成度</span><strong>{progress}%</strong></div>
              <div className="meter-track"><i style={{ width: `${progress}%` }} /></div>
              <small>{phase === "result" ? "ASSET LOCATION: UNAVAILABLE" : "AUTONOMOUS WEALTH ENGINE"}</small>
            </div>
          </aside>
        </div>

        <footer className="terminal-footer">
          <span>AUREUS LIQUIDITY ENGINE · QL-9</span>
          <span>INFINITE COMPOUND PROTOCOL</span>
          <span>CN / SHANGHAI NODE</span>
        </footer>
      </section>
    </main>
  );
}
