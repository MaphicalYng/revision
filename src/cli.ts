#!/usr/bin/env node
/**
 * revision — browse git repos in a directory: branches, commit history,
 * and side-by-side diffs with aligned line numbers.
 *
 * Usage:
 *   revision [dir]            serve repos under `dir` (default: cwd)
 *     -p, --port <n>          port to listen on (default 4777, walks up if busy)
 *     --host <ip>             bind address (default 127.0.0.1; LAN: 0.0.0.0)
 *     --no-open               do not open the browser
 *     -v, --version           print version
 *     -h, --help              show help
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";

import { startServer } from "./server.js";

interface CliOptions {
  dir: string;
  host: string;
  port: number;
  open: boolean;
}

const DEFAULTS: CliOptions = { dir: ".", host: "127.0.0.1", port: 4777, open: true };

function version(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function usage(): string {
  return `revision ${version()} — web UI for local git repos

Usage
  revision [dir] [options]

Options
  -p, --port <n>     port (default ${DEFAULTS.port}; walks up to +20 if busy)
  --host <ip>        bind address (default ${DEFAULTS.host}; use 0.0.0.0 for LAN)
  --no-open          skip opening the browser
  -v, --version      print version
  -h, --help         show this help

Examples
  revision                     # serve repos under the current directory
  revision ~/code --port 8080  # serve repos under ~/code on :8080
`;
}

export function parseArgs(argv: string[]): CliOptions & { help?: boolean } {
  const out: CliOptions & { help?: boolean } = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "-h":
      case "--help":
        out.help = true;
        break;
      case "-v":
      case "--version":
        console.log(version());
        process.exit(0);
        break;
      case "--no-open":
        out.open = false;
        break;
      case "-p":
      case "--port": {
        const n = parseInt(argv[++i] ?? "", 10);
        if (!Number.isInteger(n) || n < 1 || n > 65535) fail(`invalid port: ${argv[i]}`);
        out.port = n;
        break;
      }
      case "--host":
        out.host = argv[++i] ?? fail("missing value for --host");
        break;
      default:
        if (a.startsWith("-")) fail(`unknown option: ${a}`);
        if (out.dir !== ".") fail(`unexpected extra argument: ${a}`);
        out.dir = a;
        break;
    }
  }
  return out;
}

function fail(msg: string): never {
  console.error(`revision: ${msg}`);
  console.error('try "revision --help"');
  process.exit(2);
}

function openBrowser(url: string): void {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    const child = execFile(cmd, args, { timeout: 5000 }, () => {});
    child.unref?.();
  } catch {
    /* opening the browser is best-effort */
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(usage());
    return;
  }

  const root = path.resolve(process.cwd(), opts.dir);
  try {
    const { url } = await startServer({ root, host: opts.host, port: opts.port });
    const display = path.relative(process.cwd(), root) || ".";
    console.log(`revision ${version()}`);
    console.log(`  serving : ${display}`);
    console.log(`  listen  : ${url}`);
    if (opts.open) openBrowser(url);
  } catch (e) {
    console.error(`revision: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

await main();
