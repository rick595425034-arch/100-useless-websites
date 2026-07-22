"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";

type Place = {
  name: string;
  aliases: string[];
  longitude: number;
  latitude: number;
};

type Route = {
  origin: Place;
  destination: Place;
  distance: number;
};

const PLACES: Place[] = [
  { name: "北京", aliases: ["beijing", "北京市"], longitude: 116.4074, latitude: 39.9042 },
  { name: "上海", aliases: ["shanghai", "上海市"], longitude: 121.4737, latitude: 31.2304 },
  { name: "深圳", aliases: ["shenzhen", "深圳市"], longitude: 114.0579, latitude: 22.5431 },
  { name: "广州", aliases: ["guangzhou", "广州市"], longitude: 113.2644, latitude: 23.1291 },
  { name: "成都", aliases: ["chengdu", "成都市"], longitude: 104.0665, latitude: 30.5723 },
  { name: "杭州", aliases: ["hangzhou", "杭州市"], longitude: 120.1551, latitude: 30.2741 },
  { name: "重庆", aliases: ["chongqing", "重庆市"], longitude: 106.5516, latitude: 29.563 },
  { name: "武汉", aliases: ["wuhan", "武汉市"], longitude: 114.3054, latitude: 30.5931 },
  { name: "西安", aliases: ["xian", "xi'an", "西安市"], longitude: 108.9398, latitude: 34.3416 },
  { name: "长沙", aliases: ["changsha", "长沙市"], longitude: 112.9388, latitude: 28.2282 },
  { name: "厦门", aliases: ["xiamen", "厦门市"], longitude: 118.0894, latitude: 24.4798 },
  { name: "三亚", aliases: ["sanya", "三亚市"], longitude: 109.5119, latitude: 18.2528 },
  { name: "拉萨", aliases: ["lhasa", "拉萨市"], longitude: 91.1322, latitude: 29.66 },
  { name: "乌鲁木齐", aliases: ["urumqi", "乌鲁木齐市"], longitude: 87.6168, latitude: 43.8256 },
  { name: "香港", aliases: ["hongkong", "hong kong"], longitude: 114.1694, latitude: 22.3193 },
  { name: "台北", aliases: ["taipei", "台北市"], longitude: 121.5654, latitude: 25.033 },
  { name: "东京", aliases: ["tokyo"], longitude: 139.6917, latitude: 35.6895 },
  { name: "首尔", aliases: ["seoul"], longitude: 126.978, latitude: 37.5665 },
  { name: "新加坡", aliases: ["singapore"], longitude: 103.8198, latitude: 1.3521 },
  { name: "曼谷", aliases: ["bangkok"], longitude: 100.5018, latitude: 13.7563 },
  { name: "迪拜", aliases: ["dubai"], longitude: 55.2708, latitude: 25.2048 },
  { name: "伦敦", aliases: ["london"], longitude: -0.1276, latitude: 51.5072 },
  { name: "巴黎", aliases: ["paris"], longitude: 2.3522, latitude: 48.8566 },
  { name: "纽约", aliases: ["newyork", "new york", "nyc"], longitude: -74.006, latitude: 40.7128 },
  { name: "洛杉矶", aliases: ["losangeles", "los angeles", "la"], longitude: -118.2437, latitude: 34.0522 },
  { name: "旧金山", aliases: ["sanfrancisco", "san francisco"], longitude: -122.4194, latitude: 37.7749 },
  { name: "温哥华", aliases: ["vancouver"], longitude: -123.1207, latitude: 49.2827 },
  { name: "悉尼", aliases: ["sydney"], longitude: 151.2093, latitude: -33.8688 },
  { name: "莫斯科", aliases: ["moscow"], longitude: 37.6173, latitude: 55.7558 },
  { name: "开罗", aliases: ["cairo"], longitude: 31.2357, latitude: 30.0444 },
  { name: "开普敦", aliases: ["capetown", "cape town"], longitude: 18.4241, latitude: -33.9249 },
  { name: "里约热内卢", aliases: ["rio", "rio de janeiro"], longitude: -43.1729, latitude: -22.9068 },
  { name: "雷克雅未克", aliases: ["reykjavik"], longitude: -21.9426, latitude: 64.1466 },
];

const STAGES = [
  { label: "初始化 WGS84 全球坐标基准", detail: "EPSG:4326 REFERENCE INITIALIZATION", progress: 12 },
  { label: "生成海陆空候选路径", detail: "CANDIDATE GRAPH GENERATION", progress: 29 },
  { label: "应用地形、边界与通行约束", detail: "TERRAIN AND BOUNDARY CONSTRAINTS", progress: 47 },
  { label: "验证方向变化与转向成本", detail: "DIRECTION CHANGE COST ANALYSIS", progress: 66 },
  { label: "检测绕行与路径冗余", detail: "DETOUR AND REDUNDANCY AUDIT", progress: 84 },
  { label: "锁定全局最优方案", detail: "GLOBAL OPTIMUM LOCK", progress: 99 },
];

const COMPUTE_STATS = [
  { label: "CONNECTED NODES", values: ["064 / 218", "142 / 218", "218 / 218", "218 / 218", "218 / 218", "218 / 218"] },
  { label: "CANDIDATE SETS", values: ["14", "11", "8", "5", "3", "1"] },
  { label: "CONSTRAINTS", values: ["00 / 64", "11 / 64", "38 / 64", "52 / 64", "63 / 64", "64 / 64"] },
  { label: "SOLVER CONFIDENCE", values: ["12.2%", "31.8%", "54.6%", "72.4%", "91.7%", "99.9%"] },
];

const VISIBLE_CANDIDATES = [14, 11, 8, 5, 3, 1];

const mapFeature = feature(
  world as never,
  (world as unknown as { objects: { countries: never } }).objects.countries,
);

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function placeFromText(value: string, salt: number): Place {
  const normalized = normalize(value);
  const known = PLACES.find((place) =>
    [place.name, ...place.aliases].some((alias) => normalize(alias) === normalized),
  );

  if (known) return known;

  let hash = salt;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return {
    name: value.trim() || "未命名地点",
    aliases: [],
    longitude: (hash % 30000) / 100 - 150,
    latitude: ((Math.floor(hash / 30000) % 12000) / 100) - 55,
  };
}

function haversine(origin: Place, destination: Place) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(destination.latitude - origin.latitude);
  const deltaLongitude = toRadians(destination.longitude - origin.longitude);
  const latitude1 = toRadians(origin.latitude);
  const latitude2 = toRadians(destination.latitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(4)}°${value >= 0 ? positive : negative}`;
}

export function ShortestRouteLab() {
  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [status, setStatus] = useState<"idle" | "calculating" | "result">("idle");
  const [stage, setStage] = useState(0);
  const [route, setRoute] = useState<Route>(() => {
    const origin = placeFromText("北京", 17);
    const destination = placeFromText("纽约", 29);
    return { origin, destination, distance: haversine(origin, destination) };
  });
  const [calculationId, setCalculationId] = useState(0);
  const [resultStep, setResultStep] = useState(0);
  const [turnProbe, setTurnProbe] = useState("—");
  const [detourProbe, setDetourProbe] = useState({ value: "—", unit: "" });
  const timers = useRef<number[]>([]);
  const audioContext = useRef<AudioContext | null>(null);

  const projection = useMemo(
    () => geoNaturalEarth1().scale(215).translate([600, 305]),
    [],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const countriesPath = useMemo(() => path(mapFeature) ?? "", [path]);
  const graticulePath = useMemo(() => path(geoGraticule10()) ?? "", [path]);

  const originPoint = projection([route.origin.longitude, route.origin.latitude]) ?? [0, 0];
  const destinationPoint = projection([
    route.destination.longitude,
    route.destination.latitude,
  ]) ?? [0, 0];

  const candidateRoutes = useMemo(() => {
    const [startX, startY] = originPoint;
    const [endX, endY] = destinationPoint;
    const direction = endX >= startX ? 1 : -1;
    return Array.from({ length: 14 }, (_, index) => {
      const spread = (index - 6.5) * 19;
      const variation = ((index * 37) % 90) - 45;
      const controlX1 = startX + (endX - startX) * 0.32 + direction * variation;
      const controlX2 = startX + (endX - startX) * 0.68 - direction * variation;
      const controlY1 = startY + spread - 70 - (index % 3) * 24;
      const controlY2 = endY + spread + 70 + (index % 4) * 18;
      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    });
  }, [originPoint, destinationPoint]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      void audioContext.current?.close();
    };
  }, []);

  function playSignal(frequency: number, duration = 0.1, delay = 0) {
    const context = audioContext.current ?? new AudioContext();
    audioContext.current = context;
    void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.06, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.035, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!originText.trim() || !destinationText.trim()) return;

    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    const origin = placeFromText(originText, 17);
    const destination = placeFromText(destinationText, 29);
    setRoute({ origin, destination, distance: haversine(origin, destination) });
    setCalculationId((value) => value + 1);
    setStage(0);
    setResultStep(0);
    setTurnProbe("—");
    setDetourProbe({ value: "—", unit: "" });
    setStatus("calculating");
    playSignal(164, 0.28);
    playSignal(328, 0.18, 0.08);

    [1150, 2300, 3500, 4700, 5900].forEach((delay, index) => {
      timers.current.push(window.setTimeout(() => {
        setStage(index + 1);
        playSignal(520 + index * 145, 0.1);
      }, delay));
    });
    timers.current.push(window.setTimeout(() => {
      setStatus("result");
      playSignal(880, 0.16);
      playSignal(1320, 0.2, 0.12);
    }, 7200));

    const reveal = (delay: number, callback: () => void) => {
      timers.current.push(window.setTimeout(callback, delay));
    };

    reveal(7700, () => { setResultStep(1); playSignal(640, 0.08); });
    reveal(8300, () => { setResultStep(2); setTurnProbe("…"); });
    reveal(9100, () => { setTurnProbe("0"); playSignal(940, 0.11); });
    reveal(9600, () => { setResultStep(3); setDetourProbe({ value: "…", unit: "" }); });
    reveal(10400, () => { setDetourProbe({ value: "0", unit: "m" }); playSignal(1040, 0.11); });
    reveal(11200, () => { setResultStep(4); playSignal(720, 0.1); playSignal(1080, 0.12, 0.1); });
    reveal(12100, () => { setResultStep(5); playSignal(820, 0.1); });
    reveal(13500, () => { setResultStep(6); playSignal(1280, 0.15); });
    reveal(14800, () => { setResultStep(7); playSignal(520, 0.12); });
    reveal(16000, () => setResultStep(8));
  }

  function swapPlaces() {
    setOriginText(destinationText);
    setDestinationText(originText);
    setStatus("idle");
  }

  const activeStage = STAGES[stage];
  const showRoute = status === "result" && resultStep >= 4;
  const visibleCandidateCount = VISIBLE_CANDIDATES[stage];

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="世界最短路线首页">
          <span className="brand-mark" aria-hidden="true"><i /><i /></span>
          <span>
            <strong>AETHER / PATH</strong>
            <small>全球路径决策系统</small>
          </span>
        </a>
        <div className="system-status">
          <span className="status-dot" />
          GLOBAL ROUTING GRID ONLINE
        </div>
        <div className="edition">CN-GEOM 01 · 2026</div>
      </header>

      {status === "idle" && (
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span>01</span> GLOBAL ROUTE INTELLIGENCE</p>
            <h1>全球路径<br />决策系统</h1>
            <p className="lede">
              融合全球交通网络、地形约束与动态环境数据，
              对每一次出发执行全域最优路径推演。
            </p>
            <div className="intro-specs">
              <span>218 GLOBAL NODES</span>
              <span>WGS84 GEOSPATIAL CORE</span>
              <span>LIVE CONSTRAINT MODEL</span>
            </div>
          </div>

          <form className="route-form" onSubmit={calculate}>
            <div className="form-heading">
              <small>NEW ROUTE ANALYSIS</small>
              <strong>创建一次全域路径推演</strong>
            </div>
            <div className="field-block">
              <label htmlFor="origin"><span>ORIGIN</span> 出发地</label>
              <div className="input-row">
                <b>A</b>
                <input
                  id="origin"
                  list="place-list"
                  value={originText}
                  onChange={(event) => setOriginText(event.target.value)}
                  placeholder="选择或输入出发地"
                  autoComplete="off"
                  required
                />
                <span className="locate-cross" aria-hidden="true" />
              </div>
            </div>
            <button className="swap-button" type="button" onClick={swapPlaces} aria-label="交换出发地和目的地">
              <span>⇅</span>
            </button>
            <div className="field-block">
              <label htmlFor="destination"><span>DESTINATION</span> 目的地</label>
              <div className="input-row">
                <b>B</b>
                <input
                  id="destination"
                  list="place-list"
                  value={destinationText}
                  onChange={(event) => setDestinationText(event.target.value)}
                  placeholder="选择或输入目的地"
                  autoComplete="off"
                  required
                />
                <span className="locate-cross" aria-hidden="true" />
              </div>
            </div>
            <datalist id="place-list">
              {PLACES.map((place) => <option key={place.name} value={place.name} />)}
            </datalist>
            <button className="calculate-button" type="submit" disabled={!originText.trim() || !destinationText.trim()}>
              <span>{originText.trim() && destinationText.trim() ? "启动最优路线计算" : "请先选择出发地和目的地"}</span>
              <i aria-hidden="true">→</i>
            </button>
          </form>
        </section>
      )}

      {status !== "idle" && (
        <section className={`workspace status-${status} reveal-${resultStep}`} aria-live="polite">
          <div className="map-header">
            <div>
              <span>LIVE GEOSPATIAL MODEL</span>
              <strong>{status === "calculating" ? "正在执行全域路径推演" : "最优路径决策结果"}</strong>
            </div>
            <div className="map-readouts">
              <span>PROJECTION <b>NATURAL EARTH</b></span>
              <span>PRECISION <b>±0.0000</b></span>
              <span>ZOOM <b>1.00×</b></span>
            </div>
          </div>

          <div className="map-stage">
            <div className="map-grid" />
            <svg className="world-map" viewBox="0 0 1200 610" role="img" aria-label={`${route.origin.name}到${route.destination.name}的全球路线图`}>
              <path className="graticule" d={graticulePath} />
              <path className="countries" d={countriesPath} />
              {status === "calculating" && (
                <g className="candidate-routes" key={calculationId}>
                  {candidateRoutes.slice(0, visibleCandidateCount).map((candidatePath, index) => (
                    <path
                      key={candidatePath}
                      d={candidatePath}
                      style={{ animationDelay: `${index * -0.17}s` }}
                    />
                  ))}
                </g>
              )}
              <g className="map-point origin-point" transform={`translate(${originPoint[0]} ${originPoint[1]})`}>
                <circle className="point-ring" r="13" />
                <circle className="point-core" r="3.5" />
                <line x1="-20" y1="0" x2="-8" y2="0" />
                <line x1="8" y1="0" x2="20" y2="0" />
                <line x1="0" y1="-20" x2="0" y2="-8" />
                <line x1="0" y1="8" x2="0" y2="20" />
                <text x="0" y="-30">{route.origin.name}</text>
              </g>
              <g className="map-point destination-point" transform={`translate(${destinationPoint[0]} ${destinationPoint[1]})`}>
                <circle className="point-ring" r="13" />
                <circle className="point-core" r="3.5" />
                <line x1="-20" y1="0" x2="-8" y2="0" />
                <line x1="8" y1="0" x2="20" y2="0" />
                <line x1="0" y1="-20" x2="0" y2="-8" />
                <line x1="0" y1="8" x2="0" y2="20" />
                <text x="0" y="-30">{route.destination.name}</text>
              </g>
              {showRoute && (
                <g className="direct-route" key={calculationId}>
                  <line className="route-glow" x1={originPoint[0]} y1={originPoint[1]} x2={destinationPoint[0]} y2={destinationPoint[1]} />
                  <line className="route-line" x1={originPoint[0]} y1={originPoint[1]} x2={destinationPoint[0]} y2={destinationPoint[1]} pathLength="1" />
                  <circle className="route-probe" r="5">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path={`M ${originPoint[0]} ${originPoint[1]} L ${destinationPoint[0]} ${destinationPoint[1]}`} />
                  </circle>
                </g>
              )}
            </svg>

            {status === "calculating" && (
              <div className="calculating-panel">
                <div className="compute-scanline" aria-hidden="true" />
                <div className="compute-topline">
                  <span>AETHER ROUTE ENGINE / GLOBAL SOLVER</span>
                  <span>SECURE SESSION · CN-01 · WGS84</span>
                </div>
                <div className="compute-center">
                  <div className="calculation-orbit" aria-hidden="true">
                    <span /><i /><b /><em /><u />
                    <output className="orbit-output">
                      <strong>{COMPUTE_STATS[1].values[stage]}</strong>
                      <small>ROUTE SETS</small>
                    </output>
                  </div>
                  <div className="compute-copy">
                    <small>SOLVING GLOBAL OPTIMUM</small>
                    <strong>{activeStage.label}</strong>
                    <p>{activeStage.detail}</p>
                  </div>
                  <ol className="stage-ledger">
                    {STAGES.map((item, index) => (
                      <li key={item.detail} className={index < stage ? "is-complete" : index === stage ? "is-running" : ""}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <p>{item.label}</p>
                        <b>{index < stage ? "VERIFIED" : index === stage ? "RUNNING" : "QUEUED"}</b>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="telemetry-grid">
                  {COMPUTE_STATS.map((stat) => (
                    <div key={stat.label}>
                      <small>{stat.label}</small>
                      <strong>{stat.values[stage]}</strong>
                      <i aria-hidden="true"><span style={{ width: `${Math.min(100, activeStage.progress + 4)}%` }} /></i>
                    </div>
                  ))}
                </div>
                <div className="compute-progress">
                  <div className="progress-track"><i style={{ width: `${activeStage.progress}%` }} /></div>
                  <div className="progress-meta"><span>CALCULATION {String(stage + 1).padStart(2, "0")}/06 · NO LOCAL APPROXIMATION</span><b>{activeStage.progress}.000%</b></div>
                </div>
              </div>
            )}

            {status === "result" && resultStep < 4 && (
              <aside className="result-panel">
                <div className={`result-stamp ${detourProbe.value === "0" ? "is-verified" : ""}`}>
                  <span>{detourProbe.value === "0" ? "AUDIT COMPLETE" : "FINAL AUDIT"}</span>
                  <b>{detourProbe.value === "0" ? "✓" : "…"}</b>
                </div>
                <p className="result-kicker">ROUTE PARAMETER AUDIT · {String(Math.min(resultStep, 3)).padStart(2, "0")}/03</p>
                <h2>最终路线审计</h2>
                <div className="metric-grid">
                  <div className={`metric-card ${resultStep >= 1 ? "is-active is-locked" : ""}`}>
                    <small>路径总长度 <span>{resultStep >= 1 ? "LOCKED" : "PENDING"}</span></small>
                    <strong>{resultStep >= 1 ? route.distance.toLocaleString() : "—"}<i> km</i></strong>
                  </div>
                  <div className={`metric-card ${resultStep >= 2 ? "is-active" : ""} ${turnProbe === "0" ? "is-locked" : "is-processing"}`}>
                    <small>需要转弯 <span>{turnProbe === "0" ? "LOCKED" : resultStep >= 2 ? "VERIFYING" : "QUEUED"}</span></small>
                    <strong>{turnProbe}<i> 次</i></strong>
                  </div>
                  <div className={`metric-card ${resultStep >= 3 ? "is-active" : ""} ${detourProbe.value === "0" ? "is-locked" : "is-processing"}`}>
                    <small>路线绕行 <span>{detourProbe.value === "0" ? "LOCKED" : resultStep >= 3 ? "VERIFYING" : "QUEUED"}</span></small>
                    <strong>{detourProbe.value}<i> {detourProbe.unit}</i></strong>
                  </div>
                </div>
                <div className="audit-status-line">
                  <span aria-hidden="true" />
                  {resultStep < 1 && "正在校验路径总长度"}
                  {resultStep === 1 && "正在验证方向变化与转向成本"}
                  {resultStep === 2 && turnProbe !== "0" && "正在验证方向变化与转向成本"}
                  {resultStep === 2 && turnProbe === "0" && "正在检测额外绕行与路径冗余"}
                  {resultStep === 3 && detourProbe.value !== "0" && "正在检测额外绕行与路径冗余"}
                  {resultStep === 3 && detourProbe.value === "0" && "全部参数已锁定，正在生成导航指令"}
                </div>
              </aside>
            )}

            {status === "result" && resultStep >= 4 && (
              <div className="final-route-reveal">
                <div className="route-lock-badge result-beat">
                  <small>FINAL ROUTE LOCKED</small>
                  <strong>唯一最优方案</strong>
                </div>
                {resultStep >= 5 && (
                  <div className="final-directive result-beat">
                    <small>NAVIGATION INSTRUCTION</small>
                    <strong>面向{route.destination.name}，然后一直直走。</strong>
                  </div>
                )}
                {resultStep >= 6 && (
                  <div className="final-eta result-beat">
                    <span>预计到达</span>
                    <strong>取决于你走多快</strong>
                  </div>
                )}
                {resultStep >= 7 && (
                  <div className="final-disclaimer result-beat">
                    <span aria-hidden="true">!</span>
                    <p>如遇海洋、山脉、国界或前方墙壁，请保持方向。<strong>几何学不为现实条件负责。</strong></p>
                  </div>
                )}
                {resultStep >= 8 && (
                  <button className="restart-button route-restart result-beat" type="button" onClick={() => setStatus("idle")}>重新规划路线</button>
                )}
              </div>
            )}

            <div className="coordinate origin-coordinate">
              <span>A / {route.origin.name}</span>
              {formatCoordinate(route.origin.latitude, "N", "S")} · {formatCoordinate(route.origin.longitude, "E", "W")}
            </div>
            <div className="coordinate destination-coordinate">
              <span>B / {route.destination.name}</span>
              {formatCoordinate(route.destination.latitude, "N", "S")} · {formatCoordinate(route.destination.longitude, "E", "W")}
            </div>
          </div>
        </section>
      )}

      <footer className="footer">
        <span>AETHER / PATH © 2026</span>
        <p>GLOBAL NAVIGATION INTELLIGENCE · SECURE COMPUTE NODE CN-01</p>
        <span>MULTIMODAL ROUTE ENGINE</span>
      </footer>
    </main>
  );
}
