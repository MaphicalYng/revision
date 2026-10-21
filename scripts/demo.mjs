#!/usr/bin/env node
/**
 * Create a demo directory with sample git repos under /tmp/revision-demo,
 * so you can poke at the UI without pointing it at real work:
 *
 *   node scripts/demo.mjs
 *   npx tsx src/cli.ts /tmp/revision-demo   (or: revision /tmp/revision-demo after build)
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = "/tmp/revision-demo";

function git(cwd, args) {
  execFileSync("git", args, { cwd, stdio: "ignore", env: { ...process.env, GIT_AUTHOR_DATE: "2026-10-01T10:00:00Z", GIT_COMMITTER_DATE: "2026-10-01T10:00:00Z" } });
}

function seed(dir) {
  git(dir, ["init", "-b", "main"]);
  git(dir, ["config", "user.name", "Demo Dev"]);
  git(dir, ["config", "user.email", "dev@example.com"]);
}

rmSync(ROOT, { recursive: true, force: true });
mkdirSync(ROOT, { recursive: true });

// ---- alpha: the full-featured repo --------------------------------------
{
  const dir = path.join(ROOT, "alpha");
  mkdirSync(dir);
  seed(dir);

  writeFileSync(path.join(dir, "README.md"), "# alpha\n\nA demo repo.\n");
  mkdirSync(path.join(dir, "src"));
  writeFileSync(path.join(dir, "src", "server.ts"), [
    "import http from 'node:http';",
    "",
    "const server = http.createServer((req, res) => {",
    "  res.writeHead(200, { 'Content-Type': 'text/plain' });",
    "  res.end('hello from alpha\\n');",
    "});",
    "",
    "server.listen(8080);",
    "",
  ].join("\n"));
  mkdirSync(path.join(dir, "docs"));
  writeFileSync(path.join(dir, "docs", "guide.md"), "# Guide\n\nSteps go here.\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "initial commit"]);

  // A rich second commit: modify + delete + add + a rename, with word-level changes.
  writeFileSync(path.join(dir, "src", "server.ts"), [
    "import http from 'node:http';",
    "import { readFileSync } from 'node:fs';",
    "",
    "const server = http.createServer((req, res) => {",
    "  const path = req.url ?? '/';",
    "  res.writeHead(200, { 'Content-Type': 'text/plain' });",
    "  res.end('hello from alpha v2\\n');",
    "});",
    "",
    "server.listen(8080);",
    "",
  ].join("\n"));
  writeFileSync(path.join(dir, "src", "util.ts"), "export function slug(s: string): string {\n  return s.toLowerCase().replace(/\\s+/g, '-');\n}\n");
  writeFileSync(path.join(dir, "docs", "guide.md"), "# Guide\n\nSteps go here.\n\n## Extra\n\nMore detail.\n");
  mkdirSync(path.join(dir, "assets"));
  // 1x1 transparent png (binary file)
  writeFileSync(path.join(dir, "assets", "pixel.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"));
  git(dir, ["mv", "docs/guide.md", "docs/manual.md"]);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "refactor server, add util + assets", "-m", "The handler now logs the request path, a shared slug helper lands in src/util.ts, and the docs pick up a manual rename."]);

  // A file with no trailing newline gets touched next.
  writeFileSync(path.join(dir, "src", "util.ts"), "export function slug(s: string): string {\n  return s.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');\n}");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "harden slug against stray characters"]);

  // Feature branch with its own commits.
  git(dir, ["checkout", "-b", "feature/login"]);
  writeFileSync(path.join(dir, "src", "auth.ts"), "export function login(user: string, pass: string): boolean {\n  return user.length > 0 && pass.length > 0;\n}\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "add login stub"]);
  writeFileSync(path.join(dir, "src", "auth.ts"), "export interface Credentials {\n  user: string;\n  pass: string;\n}\n\nexport function login(creds: Credentials): boolean {\n  return creds.user.length > 0 && creds.pass.length >= 8;\n}\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "credentials object + min password length"]);
  git(dir, ["checkout", "main"]);

  // Merge it back so history has a merge commit.
  git(dir, ["merge", "--no-ff", "feature/login", "-m", "merge feature/login into main"]);

  // Long-line + many-line file to exercise the diff renderer.
  writeFileSync(path.join(dir, "src", "big.ts"), Array.from({ length: 120 }, (_, i) => `export const line${i} = ${JSON.stringify("x".repeat((i * 7) % 200))}; // padding padding padding`).join("\n") + "\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "add generated big.ts"]);
  writeFileSync(path.join(dir, "src", "big.ts"), Array.from({ length: 120 }, (_, i) => (i % 9 === 0 ? `export const line${i} = ${JSON.stringify("y".repeat((i * 5) % 180))}; // changed padding` : `export const line${i} = ${JSON.stringify("x".repeat((i * 7) % 200))}; // padding padding padding`)).join("\n") + "\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "touch every ninth line of big.ts"]);
}

// ---- beta: small two-commit repo ----------------------------------------
{
  const dir = path.join(ROOT, "beta");
  mkdirSync(dir);
  seed(dir);
  writeFileSync(path.join(dir, "index.js"), "console.log('beta v1');\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "v1"]);
  writeFileSync(path.join(dir, "index.js"), "console.log('beta v2');\nconsole.log('done');\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "v2: log done"]);
}

// ---- not-a-repo: must be ignored by discovery -----------------------------
mkdirSync(path.join(ROOT, "not-a-repo"));
writeFileSync(path.join(ROOT, "not-a-repo", "x.txt"), "not a repo\n");

console.log(`demo repos ready under ${ROOT}`);
console.log("  alpha  — branches, merge commit, rename, binary, no-trailing-newline, long lines");
console.log("  beta   — two commits");
console.log("  not-a-repo — should NOT appear in the UI");
