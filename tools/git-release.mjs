#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const run = (args, quiet = false) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: quiet ? "pipe" : "inherit",
  })?.trim() ?? "";
if (run(["status", "--short"], true))
  throw new Error("Release requires a clean worktree.");
const version = JSON.parse(
  readFileSync(resolve(root, "package.json"), "utf8"),
).version;
const tag = `v-${version}`;
const changelog = readFileSync(
  resolve(root, "assist/documentation/CHANGELOG.md"),
  "utf8",
);
if (!changelog.includes(`Release tag: ${tag}`))
  throw new Error(`Changelog release tag must be ${tag}.`);
if (run(["tag", "--list", tag], true))
  throw new Error(`${tag} already exists.`);
run(["tag", "-a", tag, "-m", `Release ${tag}`]);
run(["push", "origin", "main"]);
run(["push", "origin", tag]);
