"use client";

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";

const STAGES = [
  {
    label: "建立问题语义模型",
    detail: "正在解析事件、人物与潜在因果关系",
    confidence: "08.2%",
    scope: "广泛",
    decision: "建模中",
    progress: 7,
    factor: 1,
  },
  {
    label: "校验事实与情绪边界",
    detail: "正在分离客观事实与主观感受信号",
    confidence: "26.4%",
    scope: "跨区域",
    decision: "校验中",
    progress: 24,
    factor: 0.72,
  },
  {
    label: "评估潜在影响范围",
    detail: "正在计算时间、关系与外部环境变量",
    confidence: "48.7%",
    scope: "区域级",
    decision: "评估中",
    progress: 43,
    factor: 0.46,
  },
  {
    label: "生成多维解决方案",
    detail: "正在并行推演全部候选解决路径",
    confidence: "71.8%",
    scope: "局部级",
    decision: "推演中",
    progress: 66,
    factor: 0.25,
  },
  {
    label: "验证全局最优结果",
    detail: "正在排除低置信度与高成本解决方案",
    confidence: "93.6%",
    scope: "单点级",
    decision: "验证中",
    progress: 88,
    factor: 0.1,
  },
  {
    label: "锁定最终解决方案",
    detail: "全局最优决策已通过一致性审计",
    confidence: "99.9%",
    scope: "已锁定",
    decision: "完成",
    progress: 100,
    factor: 0.06,
  },
];

export function ProblemShrinker() {
  const [problem, setProblem] = useState("");
  const [activeProblem, setActiveProblem] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "result">("idle");
  const [stage, setStage] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [resultStep, setResultStep] = useState(0);
  const timers = useRef<number[]>([]);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    void audioContext.current?.close();
  }, []);

  function signal(frequency: number, duration = 0.08) {
    const context = audioContext.current ?? new AudioContext();
    audioContext.current = context;
    void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.025, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  }

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!problem.trim()) return;

    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setActiveProblem(problem.trim());
    setStage(0);
    setIsFinalizing(false);
    setResultStep(0);
    setStatus("processing");
    signal(180, 0.2);

    [1150, 2300, 3550, 4850, 6200].forEach((delay, index) => {
      timers.current.push(window.setTimeout(() => {
        setStage(index + 1);
        signal(420 + index * 120);
      }, delay));
    });

    timers.current.push(window.setTimeout(() => {
      setIsFinalizing(true);
      signal(96, 0.48);
      signal(860, 0.16);
    }, 7200));
    timers.current.push(window.setTimeout(() => {
      setStatus("result");
      signal(1080, 0.18);
      signal(1440, 0.22);
    }, 8500));
    timers.current.push(window.setTimeout(() => setResultStep(1), 9400));
    timers.current.push(window.setTimeout(() => {
      setResultStep(2);
      signal(1280, 0.18);
    }, 10700));
    timers.current.push(window.setTimeout(() => setResultStep(3), 12000));
  }

  function reset() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setProblem("");
    setActiveProblem("");
    setStage(0);
    setIsFinalizing(false);
    setResultStep(0);
    setStatus("idle");
  }

  const current = STAGES[stage];
  const problemStyle = {
    "--problem-scale": current.factor,
  } as CSSProperties;

  return (
    <main className={`app-shell state-${status} finalizing-${isFinalizing ? 1 : 0} result-${resultStep}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="一切难题终极化解系统首页">
          <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
          <span>
            <small>ULTIMATE PROBLEM RESOLUTION</small>
            <strong>一切难题终极化解系统</strong>
          </span>
        </a>
        <div className="system-online"><i />智能解决核心在线</div>
        <span className="edition">UR-01 · 2026</span>
      </header>

      {status === "idle" && (
        <section className="entry-screen" id="top">
          <div className="entry-copy">
            <p className="eyebrow"><span>01</span> UNIVERSAL PROBLEM INTELLIGENCE</p>
            <h1>一切难题<br />终极化解系统</h1>
            <p className="promise">任何难题，一次化解。</p>
            <p className="description">输入现在困扰你的问题，系统将融合语义分析、影响评估与多阶段智能推演，为你生成最终解决方案。</p>
            <div className="spec-list" aria-label="系统能力">
              <span>语义关系建模</span>
              <span>影响范围分析</span>
              <span>全局方案推演</span>
            </div>
          </div>

          <form className="problem-form" onSubmit={start}>
            <div className="form-head">
              <span>NEW ANALYSIS SESSION</span>
              <b>01 / INPUT</b>
            </div>
            <label htmlFor="problem">请描述你现在遇到的问题</label>
            <div className="textarea-shell">
              <textarea
                id="problem"
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
                placeholder="例如：这件事到底该怎么办？"
                maxLength={120}
                rows={4}
                required
              />
              <span>{String(problem.length).padStart(3, "0")} / 120</span>
            </div>
            <div className="form-assurance">
              <span><i />原始语义完整保留</span>
              <span>本地处理 · 安全加密</span>
            </div>
            <button type="submit" disabled={!problem.trim()}>
              <span>{problem.trim() ? "启动终极化解" : "请先输入一个问题"}</span>
              <i aria-hidden="true">↘</i>
            </button>
          </form>
        </section>
      )}

      {status !== "idle" && (
        <section className="machine" aria-live="polite">
          <div className="machine-head">
            <div>
              <small>ACTIVE DECISION CHAMBER</small>
              <strong>
                {status === "result" && "最终解决方案已生成"}
                {status === "processing" && !isFinalizing && "正在生成最终解决方案"}
                {status === "processing" && isFinalizing && "正在锁定最终解决方案"}
              </strong>
            </div>
            <div className="session-data">
              <span>会话 <b>UR-{String(activeProblem.length * 317).padStart(5, "0")}</b></span>
              <span>精度 <b>0.001%</b></span>
            </div>
          </div>

          <div className="machine-body">
            <aside className="measurements">
              <p>实时测量</p>
              <dl>
                <div><dt>模型置信度</dt><dd>{current.confidence}</dd></div>
                <div><dt>影响范围</dt><dd>{current.scope}</dd></div>
                <div><dt>决策状态</dt><dd>{current.decision}</dd></div>
              </dl>
              <div className="vertical-meter"><i style={{ height: `${current.progress}%` }} /></div>
            </aside>

            <div className="reduction-stage">
              <div className="axis horizontal" aria-hidden="true" />
              <div className="axis vertical" aria-hidden="true" />
              <div className="target-ring ring-one" aria-hidden="true" />
              <div className="target-ring ring-two" aria-hidden="true" />
              <div className="problem-specimen" style={problemStyle}>
                <small>SUBJECT UNDER ANALYSIS</small>
                <p>{activeProblem}</p>
                <span>100% SOURCE INTEGRITY</span>
              </div>

              {status === "processing" && isFinalizing && <div className="resolution-flash" aria-hidden="true" />}

              {status === "result" && (
                <div className="result-copy">
                  <div className="complete-mark">✓ <span>RESOLUTION COMPLETE</span></div>
                  {resultStep >= 1 && <h2>问题已缩小至不可见</h2>}
                  {resultStep >= 2 && <strong>大事化小，小事化了。</strong>}
                  {resultStep >= 3 && (
                    <div className="result-actions">
                      <p>系统未改变问题本身，仅优化了它的显示尺寸。</p>
                      <button type="button" onClick={reset}>处理下一个问题</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <aside className="phase-list">
              <p>决策序列</p>
              <ol>
                {STAGES.map((item, index) => (
                  <li key={item.label} className={index < stage || status === "result" ? "done" : index === stage ? "active" : ""}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>{item.label}</b>
                    <i>{index < stage || status === "result" ? "完成" : index === stage ? "执行中" : "待处理"}</i>
                  </li>
                ))}
              </ol>
            </aside>
          </div>

          <div className="machine-foot">
            <div>
              <span>
                {status === "result" && "全部决策序列已完成"}
                {status === "processing" && !isFinalizing && current.label}
                {status === "processing" && isFinalizing && "最终方案正在锁定"}
              </span>
              <small>
                {status === "result" && "未检测到肉眼可见的问题"}
                {status === "processing" && !isFinalizing && current.detail}
                {status === "processing" && isFinalizing && "MODEL CONSISTENCY VERIFIED · FINAL OUTPUT LOCK"}
              </small>
            </div>
            <div className="progress-track"><i style={{ width: `${current.progress}%` }} /></div>
            <b>{String(current.progress).padStart(3, "0")}%</b>
          </div>
        </section>
      )}

      <footer>
        <span>一切难题终极化解系统 © 2026</span>
        <p>复杂问题分析与解决中心</p>
        <span>智能决策节点 · CN-01</span>
      </footer>
    </main>
  );
}
