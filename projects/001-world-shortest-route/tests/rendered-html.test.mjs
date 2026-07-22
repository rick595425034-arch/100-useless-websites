import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the serious route-planning entry screen without spoiling the gag", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>AETHER PATH — 全球最优路径系统<\/title>/i);
  assert.match(html, /全球路径(?:<br\/>|)决策系统/);
  assert.match(html, /创建一次全域路径推演/);
  assert.match(html, /placeholder="选择或输入出发地"/);
  assert.match(html, /placeholder="选择或输入目的地"/);
  assert.match(
    html,
    /<input(?=[^>]*\bid=["']origin["'])(?=[^>]*\bvalue=["']["'])[^>]*>/i,
  );
  assert.match(
    html,
    /<input(?=[^>]*\bid=["']destination["'])(?=[^>]*\bvalue=["']["'])[^>]*>/i,
  );
  assert.match(html, /请先选择出发地和目的地/);
  assert.doesNotMatch(html, /面向纽约，然后一直直走/);
  assert.doesNotMatch(html, /取决于你走多快/);
});

test("keeps input, calculation and result as distinct application states", async () => {
  const [component, css, desktopMain, packageJson] = await Promise.all([
    readFile(new URL("../app/ShortestRouteLab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../desktop-app/main.cjs", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(component, /useState<"idle" \| "calculating" \| "result">/);
  assert.match(component, /status === "idle"/);
  assert.match(component, /status === "calculating"/);
  assert.match(component, /status === "result"/);
  assert.match(component, /const \[resultStep, setResultStep\] = useState\(0\)/);
  assert.match(component, /setTurnProbe\("…"\)/);
  assert.match(component, /setTurnProbe\("0"\)/);
  assert.match(component, /setDetourProbe\(\{ value: "…", unit: "" \}\)/);
  assert.match(component, /setDetourProbe\(\{ value: "0", unit: "m" \}\)/);
  assert.match(component, /resultStep >= 4/);
  assert.match(component, /resultStep >= 5/);
  assert.match(component, /resultStep >= 6/);
  assert.match(component, /resultStep >= 7/);
  assert.match(component, /resultStep >= 8/);
  assert.match(component, /className="final-route-reveal"/);
  assert.doesNotMatch(component, /几何意义上/);
  assert.match(component, /面向\{route\.destination\.name\}，然后一直直走/);
  assert.match(component, /取决于你走多快/);
  assert.match(component, /如遇海洋、山脉、国界或前方墙壁，请保持方向/);
  assert.match(component, /几何学不为现实条件负责/);
  assert.match(css, /\.calculating-panel/);
  assert.match(css, /\.result-panel/);
  assert.match(desktopMain, /width:\s*960/);
  assert.match(desktopMain, /height:\s*640/);
  assert.match(packageJson, /"target":\s*\[\s*"dmg"/);
  assert.match(packageJson, /"icon":\s*"AETHER\.icns"/);
});
