#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const run = (args, quiet = false) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: quiet ? "pipe" : "inherit",
  })?.trim() ?? "";
const ask = (question, fallback) =>
  new Promise((done) => {
    const reader = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    reader.question(`${question} [${fallback}]: `, (answer) => {
      reader.close();
      done(answer.trim() || fallback);
    });
  });
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const message = await ask(
  "Commit message",
  `#${pkg.version.split(".").at(-1)} - File Manager update`,
);
const confirmation = await ask(
  "Continue with pull, commit, and push? y/N",
  "n",
);
if (!/^y(es)?$/iu.test(confirmation)) throw new Error("Cancelled.");
run(["fetch", "origin", "--prune"]);
run(["pull", "--rebase", "--autostash"]);
run(["add", "-A"]);
if (run(["diff", "--cached", "--name-only"], true))
  run(["commit", "-m", message]);
run(["push"]);
