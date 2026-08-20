#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const command = process.argv[2] ?? "show";
const value = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
if (command === "show")
  console.log(`CODEXSUN File Manager version ${value.version}`);
else if (command === "bump") await import("./version-bump.mjs");
else throw new Error("Use show or bump.");
