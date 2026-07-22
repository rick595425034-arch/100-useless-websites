import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(await readFile(path.join(root, "catalog.json"), "utf8"));
const readme = await readFile(path.join(root, "README.md"), "utf8");

test("catalog has consecutive ids and an accurate progress count", () => {
  assert.equal(catalog.challenge.target, 100);
  assert.equal(catalog.challenge.current, catalog.projects.length);
  assert.deepEqual(
    catalog.projects.map(({ id }) => id),
    catalog.projects.map((_, index) => index + 1)
  );
  assert.equal(new Set(catalog.projects.map(({ slug }) => slug)).size, catalog.projects.length);
  assert.equal(new Set(catalog.projects.map(({ path }) => path)).size, catalog.projects.length);
});

test("every catalog project is standalone and listed in the README", async () => {
  for (const project of catalog.projects) {
    const prefix = String(project.id).padStart(3, "0");
    assert.equal(project.path, `projects/${prefix}-${project.slug}`);
    await access(path.join(root, project.path, "README.md"));
    const packageJson = JSON.parse(
      await readFile(path.join(root, project.path, "package.json"), "utf8")
    );
    assert.equal(typeof packageJson.scripts?.test, "string");
    assert.match(readme, new RegExp(project.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(readme, new RegExp(project.title));
  }
});

test("snapshots contain no nested repositories or generated artifacts", async () => {
  const forbiddenNames = new Set([
    ".git",
    "node_modules",
    "release",
    "dist",
    ".next",
    ".vinext",
    ".wrangler"
  ]);
  const forbiddenExtensions = new Set([".dmg", ".node", ".pem", ".key"]);

  function assertIgnored(filePath) {
    const relativePath = path.relative(root, filePath);
    const result = spawnSync("git", ["check-ignore", "--quiet", relativePath], {
      cwd: root
    });
    assert.equal(result.status, 0, `generated artifact is not ignored: ${relativePath}`);
  }

  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (forbiddenNames.has(entry.name) || forbiddenExtensions.has(path.extname(entry.name))) {
        assertIgnored(entryPath);
        continue;
      }
      if (entry.isDirectory()) await inspect(entryPath);
    }
  }

  await inspect(path.join(root, "projects"));
});
