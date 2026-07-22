import { readFile } from "node:fs/promises";

const catalog = JSON.parse(
  await readFile(new URL("../catalog.json", import.meta.url), "utf8")
);

process.stdout.write(`matrix=${JSON.stringify(catalog.projects.map(({ path }) => path))}`);
