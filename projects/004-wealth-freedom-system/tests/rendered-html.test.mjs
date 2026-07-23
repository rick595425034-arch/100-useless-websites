import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the serious wealth terminal without spoiling the ending", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>财富自由实现系统 · AUREUS<\/title>/);
  assert.match(html, /本次计划注入本金/);
  assert.match(html, /启动财富自由计划/);
  assert.match(html, /当前已到账资产/);
  assert.match(html, /资产最优配置/);
  assert.doesNotMatch(html, /释放您的资产/);
  assert.doesNotMatch(html, /您的财富.*已获得自由/s);
  assert.doesNotMatch(html, /钱去了它真正想去的地方/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("the performance includes settlement, liquidity, compounding, and the final escape", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("app/WealthFreedomTerminal.tsx", projectRoot), "utf8"),
    readFile(new URL("app/globals.css", projectRoot), "utf8"),
  ]);

  for (const beat of [
    "正在验证资金接收账户",
    "正在接入 12 条清算通道",
    "资金已到账",
    "正在创建流动资金链",
    "12 个流动节点正在闭合",
    "无限钱生钱闭环已建立",
    "正在执行真正的财富自由",
    "资产正在自主离场",
    "您的财富",
    "已获得自由",
    "钱去了它真正想去的地方。",
    "重新拥有一次",
  ]) {
    assert.match(source, new RegExp(beat));
  }

  for (const phase of ["deposit", "credited", "flow", "compound", "freedom", "escape", "result"]) {
    assert.match(source, new RegExp(`setPhase\\(\"${phase}\"\\)`));
  }

  assert.match(source, /<canvas className="wealth-fx"/);
  assert.match(source, /TOTAL ASSET CERTIFICATE/);
  assert.match(source, /ALL PROFITS CONSOLIDATED/);
  assert.match(source, /formattedBalance\.length >= 17/);
  assert.match(source, /formattedBalance\.length >= 13/);
  assert.match(source, /setDisplayAmount\(safeAmount\)[\s\S]{0,100}setPhase\("flow"\)/);
  assert.match(source, /animateBalance\(safeAmount, safeAmount \* 888\.88, 2500\)/);
  assert.doesNotMatch(source, /animateBalance\(safeAmount, safeAmount \* 12\.8/);
  assert.match(css, /\.liquidity-loop/);
  assert.match(css, /\.wing-right \{ left: calc\(100% - 8px\)/);
  assert.match(css, /\.wing-left \{ right: calc\(100% - 8px\)/);
  assert.match(css, /@keyframes wingUnfoldRight/);
  assert.match(css, /@keyframes escapeRoute/);
  assert.match(css, /@keyframes featherFarewell/);
  assert.match(css, /\.main-stage::before/);
  assert.match(css, /\.main-stage::after/);
  assert.match(css, /\.balance-heading strong\.very-long-balance/);
  assert.match(css, /\.reset-action \{[^}]*margin: 0/);
  assert.match(css, /\.sequence-item strong \{[^}]*font-size: 15px/);
  assert.match(css, /\.status-line strong \{[^}]*font-size: 15px/);
  assert.doesNotMatch(css, /\.chain(?:\s|\{|\.)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("the gag remains simulated and does not touch personal or financial data", async () => {
  const source = await readFile(new URL("app/WealthFreedomTerminal.tsx", projectRoot), "utf8");
  assert.doesNotMatch(source, /fetch\(|WebSocket|localStorage|sessionStorage|navigator\.mediaDevices|FileSystem|electron/i);
});

test("the desktop release is a self-contained macOS application", async () => {
  const [packageJson, desktopPackageJson, desktopMain, desktopRenderer, css] = await Promise.all([
    readFile(new URL("package.json", projectRoot), "utf8"),
    readFile(new URL("desktop-app/package.json", projectRoot), "utf8"),
    readFile(new URL("desktop-app/main.cjs", projectRoot), "utf8"),
    readFile(new URL("desktop/renderer.tsx", projectRoot), "utf8"),
    readFile(new URL("app/globals.css", projectRoot), "utf8"),
  ]);

  assert.match(packageJson, /"desktop:dist"/);
  assert.match(desktopPackageJson, /WEALTH-FREEDOM-SYSTEM/);
  assert.match(desktopPackageJson, /"productName": "财富自由实现系统"/);
  assert.match(desktopPackageJson, /"identity": "-"/);
  assert.match(desktopMain, /width:\s*1180/);
  assert.match(desktopMain, /height:\s*760/);
  assert.match(desktopMain, /loadFile\(path\.join\(__dirname, "site\/index\.html"\)\)/);
  assert.match(desktopRenderer, /<WealthFreedomTerminal \/>/);
  assert.match(css, /\.desktop-shell \.app-window/);
  assert.match(css, /-webkit-app-region: drag/);
});

test("the Aliyun release has a dedicated static web entry", async () => {
  const [packageJson, webRenderer, webConfig] = await Promise.all([
    readFile(new URL("package.json", projectRoot), "utf8"),
    readFile(new URL("web-static/renderer.tsx", projectRoot), "utf8"),
    readFile(new URL("web-static/vite.config.ts", projectRoot), "utf8"),
  ]);

  assert.match(packageJson, /"web:build"/);
  assert.match(webRenderer, /<WealthFreedomTerminal \/>/);
  assert.doesNotMatch(webRenderer, /desktop-shell/);
  assert.match(webConfig, /web-dist/);
});
