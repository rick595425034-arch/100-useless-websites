const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { signAsync } = require("@electron/osx-sign");

function findLocalSigningIdentity() {
  if (process.env.CSC_NAME) return process.env.CSC_NAME;
  const identities = execFileSync("/usr/bin/security", [
    "find-identity",
    "-v",
    "-p",
    "codesigning"
  ], { encoding: "utf8" });
  const match = identities.match(/"((?:Developer ID Application|Apple Development):[^"]+)"/);
  if (!match) {
    throw new Error("A macOS code-signing identity is required to build the preview DMG.");
  }
  return match[1];
}

module.exports = async function applyStableLocalIdentity(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(context.appOutDir, appName);
  const identity = findLocalSigningIdentity();

  await signAsync({
    app: appPath,
    identity,
    identityValidation: false,
    preAutoEntitlements: false,
    strictVerify: false,
    optionsForFile: () => ({
      hardenedRuntime: false,
      timestamp: "none"
    })
  });

  execFileSync("/usr/bin/codesign", [
    "--verify",
    "--deep",
    "--strict",
    appPath
  ], { stdio: "inherit" });
};
