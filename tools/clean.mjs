#!/usr/bin/env node
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
for (const entry of ["dist", "coverage"]) {
  const path = resolve(root, entry);
  if (existsSync(path)) rmSync(path, { recursive: true, force: true });
}
console.log("File Manager build artifacts cleaned.");
