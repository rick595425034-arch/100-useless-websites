import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

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

test("server-renders the serious problem reduction entry without spoiling the result", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>一切难题终极化解系统 — 任何难题，一次化解<\/title>/i);
  assert.match(html, /一切难题(?:<br\/?>)?终极化解系统/);
  assert.match(html, /请描述你现在遇到的问题/);
  assert.match(html, /启动终极化解|请先输入一个问题/);
  assert.match(html, /placeholder="例如：这件事到底该怎么办？"/);
  assert.doesNotMatch(html, /问题已缩小至不可见/);
  assert.doesNotMatch(html, /系统未改变问题本身/);
  assert.doesNotMatch(html, /缩小|压缩|问题体积/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("keeps input, reduction and result as distinct timed states", async () => {
  const [component, css, packageJson, desktopMain] = await Promise.all([
    readFile(new URL("../app/ProblemShrinker.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../desktop-app/main.cjs", import.meta.url), "utf8"),
  ]);

  assert.match(component, /useState<"idle" \| "processing" \| "result">/);
  assert.match(component, /status === "idle"/);
  assert.match(component, /status === "processing"/);
  assert.match(component, /status === "result"/);
  assert.match(component, /factor: 1/);
  assert.match(component, /factor: 0\.06/);
  assert.match(component, /const \[isFinalizing, setIsFinalizing\] = useState\(false\)/);
  assert.doesNotMatch(component, /检测到问题仍然存在/);
  assert.doesNotMatch(component, /终极化解协议已启动/);
  assert.doesNotMatch(component, /FINAL OVERRIDE AUTHORIZED/);
  assert.match(component, /setStatus\("result"\)/);
  assert.match(component, /问题已缩小至不可见/);
  assert.match(component, /大事化小，小事化了/);
  assert.match(component, /系统未改变问题本身，仅优化了它的显示尺寸/);
  assert.match(css, /transform:\s*scale\(var\(--problem-scale\)\)/);
  assert.match(css, /@keyframes terminal-collapse/);
  assert.match(css, /overflow:\s*hidden/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packageJson, /"desktop:dist"/);
  assert.match(packageJson, /ULTIMATE-RESOLUTION-SYSTEM/);
  assert.match(desktopMain, /width:\s*960/);
  assert.match(desktopMain, /height:\s*640/);

  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
