#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = ["package.json", "src/api/package.json", "src/web/package.json"];
const current = JSON.parse(
  readFileSync(resolve(root, "package.json"), "utf8"),
).version;
const parts = current.split(".").map(Number);
const mode = process.argv[2] ?? "patch";
if (mode === "major") parts.splice(0, 3, parts[0] + 1, 0, 0);
else if (mode === "minor") parts.splice(0, 3, parts[0], parts[1] + 1, 0);
else if (mode === "patch") parts[2] += 1;
else if (/^\d+\.\d+\.\d+$/u.test(mode))
  parts.splice(0, 3, ...mode.split(".").map(Number));
else throw new Error("Use patch, minor, major, or x.y.z.");
const next = parts.join(".");
for (const file of files) {
  const path = resolve(root, file);
  const value = JSON.parse(readFileSync(path, "utf8"));
  value.version = next;
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
const changelogPath = resolve(root, "assist/documentation/CHANGELOG.md");
let changelog = readFileSync(changelogPath, "utf8");
changelog = changelog
  .replace(/Current version: .*/u, `Current version: ${next}`)
  .replace(/Release tag: .*/u, `Release tag: v-${next}`)
  .replace(/Changelog label: .*/u, `Changelog label: v ${next}`);
writeFileSync(changelogPath, changelog);
console.log(`File Manager version: ${current} -> ${next}`);
