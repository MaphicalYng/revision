/**
 * HTTP server: one HTML page + a small JSON API.
 * Same-origin fetches only; no CORS headers are emitted. Repo ids come from
 * the discovery scan (never from raw filesystem paths) and every git
 * argument is passed as an array element, so the API surface cannot be used
 * to run arbitrary commands or read outside the scanned root.
 */

import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";

import { parseGitDiff, toSideBySide, countChanges, type SideBySideRow, type Hunk } from "./diff.js";
import {
  GitError,
  listRepos,
  branches,
  log,
  commitDetail,
  fileDiff,
  workStatus,
  workDiffText,
  workFileText,
  blobAtRev,
  DIFF_CHAR_CAP,
} from "./git.js";
import { renderPage } from "./page.js";

export interface ServerOptions {
  root: string;
  host: string;
  port: number;
  /** Access token; null disables authentication (loopback-only setups). */
  token: string | null;
}

interface RepoEntry {
  id: string;
  path: string;
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'self'; " +
    "connect-src 'self'; " +
    "img-src 'self' data:; " +
    "object-src 'none'; " +
    "base-uri 'none'; " +
    "style-src 'unsafe-inline'; " +
    "script-src 'unsafe-inline'",
};

export async function startServer(opts: ServerOptions): Promise<{ server: http.Server; url: string }> {
  const root = path.resolve(opts.root);
  const rootStat = await fs.stat(root);
  if (!rootStat.isDirectory()) throw new Error(`not a directory: ${root}`);

  let pageHtml: string | null = null;

  const authorized = (req: http.IncomingMessage, url: URL): boolean => {
    if (!opts.token) return true;
    const h = req.headers.authorization;
    const presented = h && h.startsWith("Bearer ") ? h.slice(7) : (url.searchParams.get("token") ?? "");
    const a = Buffer.from(presented);
    const b = Buffer.from(opts.token);
    return a.length === b.length && timingSafeEqual(a, b);
  };

  const unauthorized = (res: http.ServerResponse, isApi: boolean): void => {
    if (isApi) {
      res.writeHead(401, { "Content-Type": "application/json; charset=utf-8", "WWW-Authenticate": "Bearer", ...SECURITY_HEADERS });
      res.end(JSON.stringify({ error: "unauthorized: pass the token via ?token= or Authorization: Bearer" }));
    } else {
      res.writeHead(401, { "Content-Type": "text/html; charset=utf-8", "WWW-Authenticate": "Bearer", ...SECURITY_HEADERS });
      res.end('<!DOCTYPE html><html><head><meta charset="utf-8"><title>revision — unauthorized</title><style>body{font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#f6f8fa;color:#1f2328}p{color:#59636e;font-size:13px}code{background:#eceff3;padding:1px 6px;border-radius:5px}@media (prefers-color-scheme:dark){body{background:#0c0e12;color:#e6e9ef}p{color:#9aa3b2}code{background:#1b2029}}</style></head><body><div style="text-align:center"><h1 style="font-size:18px">401 — token required</h1><p>Start the server with <code>--token &lt;secret&gt;</code>, or reopen the URL printed in the terminal (it includes the token).</p></div></body></html>');
    }
  };

  // Repo cache: rescan at most once per 3s.
  let repoCache: { at: number; repos: RepoEntry[] } = { at: 0, repos: [] };
  async function repos(): Promise<RepoEntry[]> {
    const now = Date.now();
    if (now - repoCache.at < 3000) return repoCache.repos;
    const found = await listRepos(root);
    repoCache = { at: now, repos: found.map((r) => ({ id: r.id, path: r.path })) };
    return repoCache.repos;
  }

  function json(res: http.ServerResponse, status: number, body: unknown): void {
    const payload = JSON.stringify(body);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS });
    res.end(payload);
  }

  function fail(res: http.ServerResponse, err: unknown): void {
    if (err instanceof GitError) {
      json(res, 502, { error: `git: ${err.message}` });
    } else if (err instanceof HttpError) {
      json(res, err.status, { error: err.message });
    } else {
      json(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
  }

  class HttpError extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  }

  async function repoPath(res: http.ServerResponse, id: string): Promise<string | null> {
    const all = await repos();
    const hit = all.find((r) => r.id === id);
    if (!hit) {
      json(res, 404, { error: `unknown repo: ${id}` });
      return null;
    }
    return hit.path;
  }

  /** Validate a git object name: hex-ish, reasonable length, no option smuggling. */
  function safeRev(rev: string): string {
    if (!/^[0-9a-f]{4,64}$/i.test(rev)) throw new HttpError(`invalid revision: ${rev}`, 400);
    return rev;
  }

  /** Validate a repo-relative file path. */
  function safeFile(p: string): string {
    if (!p || p.length > 4096) throw new HttpError("invalid file path", 400);
    if (p.includes("\0") || path.isAbsolute(p)) throw new HttpError("invalid file path", 400);
    const norm = path.posix.normalize(p.replace(/\\/g, "/"));
    if (norm.split("/").some((seg) => seg === "..")) throw new HttpError("invalid file path", 400);
    return p;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const p = url.pathname;
      const m = (re: RegExp) => re.exec(p);
      const isApi = p.startsWith("/api/");

      if (!authorized(req, url)) {
        unauthorized(res, isApi);
        return;
      }

      // ---- page ----
      if (req.method === "GET" && (p === "/" || p === "/index.html")) {
        pageHtml ??= renderPage();
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", ...SECURITY_HEADERS });
        res.end(pageHtml);
        return;
      }

      // ---- API ----
      if (req.method === "GET" && p === "/api/health") {
        json(res, 200, { ok: true });
        return;
      }

      if (req.method === "GET" && p === "/api/repos") {
        const found = await listRepos(root); // fresh scan for accurate metadata
        json(res, 200, { repos: found });
        return;
      }

      let g = m(/^\/api\/repo\/([^/]+)\/branches$/);
      if (req.method === "GET" && g) {
        const rp = await repoPath(res, decodeURIComponent(g[1]));
        if (!rp) return;
        json(res, 200, { branches: await branches(rp) });
        return;
      }

      g = m(/^\/api\/repo\/([^/]+)\/log$/);
      if (req.method === "GET" && g) {
        const rp = await repoPath(res, decodeURIComponent(g[1]));
        if (!rp) return;
        const branch = url.searchParams.get("branch") || "HEAD";
        if (branch.length > 300) throw new HttpError("invalid branch", 400);
        const skip = Math.max(0, parseInt(url.searchParams.get("skip") ?? "0", 10) || 0);
        json(res, 200, await log(rp, branch, skip));
        return;
      }

      g = m(/^\/api\/repo\/([^/]+)\/commit\/([0-9a-f]+)$/i);
      if (req.method === "GET" && g) {
        const rp = await repoPath(res, decodeURIComponent(g[1]));
        if (!rp) return;
        json(res, 200, await commitDetail(rp, safeRev(g[2])));
        return;
      }

      g = m(/^\/api\/repo\/([^/]+)\/work$/);
      if (req.method === "GET" && g) {
        const rp = await repoPath(res, decodeURIComponent(g[1]));
        if (!rp) return;
        json(res, 200, await workStatus(rp));
        return;
      }
      g = m(/^\/api\/repo\/([^/]+)\/work\/diff$/);
      if (req.method === "GET" && g) {
        const rp = await repoPath(res, decodeURIComponent(g[1]));
        if (!rp) return;
        const file = safeFile(url.searchParams.get("file") ?? "");
        const st = await workStatus(rp);
        const meta = st.files.find((f) => f.path === file);
        if (!meta) throw new HttpError(`file not among working tree changes: ${file}`, 404);
        if (meta.binary) {
          json(res, 200, { file, binary: true, tooLarge: false, bytes: 0, counts: null, hunks: [] });
          return;
        }
        let raw: string;
        try {
          raw = await workDiffText(rp, file, meta.untracked, st.hasHead, meta.oldPath);
        } catch (e) {
          raw = "";
          if (!(e instanceof GitError)) throw e;
        }
        if (raw.length > DIFF_CHAR_CAP) {
          json(res, 200, { file, binary: false, tooLarge: true, bytes: raw.length, counts: null, hunks: [] });
          return;
        }
        const parsed = parseGitDiff(raw);
        const fd = parsed.find((x) => (x.newPath ?? x.oldPath) === file) ?? parsed[0];
        const hunks = fd ? fd.hunks.map((h) => ({ ...h, rows: toSideBySide([h]) })) : [];
        json(res, 200, {
          file,
          binary: fd ? fd.binary : false,
          tooLarge: false,
          bytes: raw.length,
          counts: fd ? countChanges(fd.hunks) : { additions: 0, deletions: 0 },
          hunks,
        });
        return;
      }
      g = m(/^\/api\/repo\/([^/]+)\/work\/file$/);
      if (req.method === "GET" && g) {
        const rp = await repoPath(res, decodeURIComponent(g[1]));
        if (!rp) return;
        const file = safeFile(url.searchParams.get("file") ?? "");
        const st = await workStatus(rp);
        const meta = st.files.find((f) => f.path === file);
        if (!meta) throw new HttpError(`file not among working tree changes: ${file}`, 404);
        const none = { text: null, tooLarge: false } as { text: string | null; tooLarge: boolean };
        const oldSide = !st.hasHead || meta.untracked ? none : await blobAtRev(rp, "HEAD", meta.oldPath ?? file);
        let newSide = none;
        if (!meta.untracked && meta.code[1] !== "D") newSide = await workFileText(rp, file);
        json(res, 200, {
          file,
          old: oldSide.text,
          new: newSide.text,
          tooLarge: oldSide.tooLarge || newSide.tooLarge,
        });
        return;
      }
      g = m(/^\/api\/repo\/([^/]+)\/commit\/([0-9a-f]+)\/diff$/i);
      if (req.method === "GET" && g) {
        const rp = await repoPath(res, decodeURIComponent(g[1]));
        if (!rp) return;
        const sha = safeRev(g[2]);
        const file = safeFile(url.searchParams.get("file") ?? "");
        const detail = await commitDetail(rp, sha); // gives parents + base for this sha
        const meta = detail.files.find((f) => f.path === file);
        if (!meta) throw new HttpError(`file not in commit: ${file}`, 404);

        let raw: string;
        try {
          raw = await fileDiff(rp, sha, detail.diffBase, file);
        } catch (e) {
          // Most likely the diff exceeded maxBuffer — report as tooLarge below via empty result.
          raw = "";
          if (!(e instanceof GitError)) throw e;
        }
        if (raw.length > DIFF_CHAR_CAP) {
          json(res, 200, {
            file,
            sha,
            base: detail.diffBase,
            status: meta.status,
            binary: meta.binary,
            tooLarge: true,
            bytes: raw.length,
            counts: null,
            hunks: [],
          });
          return;
        }

        const parsed = parseGitDiff(raw);
        const fd = parsed.find((x) => (x.newPath ?? x.oldPath) === file) ?? parsed[0];
        const hunks: (Hunk & { rows: SideBySideRow[] })[] = fd
          ? fd.hunks.map((h) => ({ ...h, rows: toSideBySide([h]) }))
          : [];
        json(res, 200, {
          file,
          sha,
          base: detail.diffBase,
          status: meta.status,
          binary: meta.binary || (fd ? fd.binary : false),
          tooLarge: false,
          bytes: raw.length,
          counts: fd ? countChanges(fd.hunks) : { additions: 0, deletions: 0 },
          hunks,
        });
        return;
      }

      g = m(/^\/api\/repo\/([^/]+)\/commit\/([0-9a-f]+)\/file$/i);
      if (req.method === "GET" && g) {
        const rp = await repoPath(res, decodeURIComponent(g[1]));
        if (!rp) return;
        const sha = safeRev(g[2]);
        const file = safeFile(url.searchParams.get("file") ?? "");
        const detail = await commitDetail(rp, sha); // parents + base for this sha
        const meta = detail.files.find((f) => f.path === file);
        if (!meta) throw new HttpError(`file not in commit: ${file}`, 404);
        const none = { text: null, tooLarge: false } as { text: string | null; tooLarge: boolean };
        const oldSide = detail.diffBase && meta.status !== "added"
          ? await blobAtRev(rp, detail.diffBase, meta.oldPath ?? file)
          : none;
        const newSide = meta.status === "deleted" ? none : await blobAtRev(rp, sha, file);
        json(res, 200, {
          file,
          old: oldSide.text,
          new: newSide.text,
          tooLarge: oldSide.tooLarge || newSide.tooLarge,
        });
        return;
      }

      json(res, 404, { error: "not found" });
    } catch (e) {
      fail(res, e);
    }
  });

  // Fixed ports retain the CLI's bounded upward scan; port 0 is a single
  // OS-assigned listen attempt for isolated desktop sessions.
  async function listenOnce(port: number): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (): void => {
        server.removeListener("error", onError);
        server.removeListener("listening", onListening);
      };
      const onError = (error: Error): void => {
        cleanup();
        reject(error);
      };
      const onListening = (): void => {
        cleanup();
        resolve();
      };
      server.once("error", onError);
      server.once("listening", onListening);
      try {
        server.listen(port, opts.host);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }

  let candidate = opts.port;
  for (;;) {
    try {
      await listenOnce(candidate);
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      const canRetry = opts.port > 0 && code === "EADDRINUSE" && candidate < opts.port + 20;
      if (!canRetry) throw error;
      candidate += 1;
    }
  }

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("HTTP server has no TCP address after listening");
  }
  return { server, url: `http://${opts.host}:${address.port}` };
}
