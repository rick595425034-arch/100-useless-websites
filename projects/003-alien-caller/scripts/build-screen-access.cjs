const { execFileSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const includeDirectory = [
  "/opt/homebrew/include/node",
  "/usr/local/include/node"
].find((candidate) => existsSync(path.join(candidate, "node_api.h")));

if (!includeDirectory) {
  throw new Error("Cannot find node_api.h. Set up Node.js development headers before packaging.");
}

execFileSync("xcrun", [
  "clang",
  "-bundle",
  "-undefined", "dynamic_lookup",
  "-std=c11",
  "-arch", process.arch === "x64" ? "x86_64" : "arm64",
  "-mmacosx-version-min=10.15",
  `-I${includeDirectory}`,
  "-DNAPI_VERSION=8",
  "-DNODE_GYP_MODULE_NAME=screen_access",
  "-framework", "CoreGraphics",
  "-framework", "CoreFoundation",
  "-framework", "ImageIO",
  path.join(root, "electron", "screen-access.c"),
  "-o", path.join(root, "electron", "screen-access.node")
], { stdio: "inherit" });
