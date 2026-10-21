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

import { parseGitDiff, toSideBySide, countChanges, type SideBySideRow, type Hunk } from "./diff.js";
import {
  GitError,
  listRepos,
  branches,
  log,
  commitDetail,
  fileDiff,
  DIFF_CHAR_CAP,
} from "./git.js";
import { renderPage } from "./page.js";

export interface ServerOptions {
  root: string;
  host: string;
  port: number;
}

interface RepoEntry {
  id: string;
  path: string;
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
};

export async function startServer(opts: ServerOptions): Promise<{ server: http.Server; url: string }> {
  const root = path.resolve(opts.root);
  const rootStat = await fs.stat(root);
  if (!rootStat.isDirectory()) throw new Error(`not a directory: ${root}`);

  let pageHtml: string | null = null;

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

      // ---- page ----
      if (req.method === "GET" && (p === "/" || p === "/index.html")) {
        pageHtml ??= renderPage();
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", ...SECURITY_HEADERS });
        res.end(pageHtml);
        return;
      }

      // ---- API ----
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

      json(res, 404, { error: "not found" });
    } catch (e) {
      fail(res, e);
    }
  });

  // Try the requested port, then walk upward until one is free.
  let port = opts.port;
  await new Promise<void>((resolve, reject) => {
    const onError = (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && port < opts.port + 20) {
        port += 1;
        server.listen(port, opts.host);
      } else {
        reject(err);
      }
    };
    server.once("error", onError);
    server.listen(port, opts.host, () => {
      server.removeListener("error", onError);
      resolve();
    });
  });

  return { server, url: `http://${opts.host}:${port}` };
}
