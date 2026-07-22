import { readFile } from "node:fs/promises";

const catalog = JSON.parse(
  await readFile(new URL("../catalog.json", import.meta.url), "utf8")
);

for (const project of catalog.projects) {
  const id = String(project.id).padStart(3, "0");
  console.log(`${id}  ${project.title}  ${project.path}`);
}
