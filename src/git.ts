/**
 * Thin, safe wrappers around the `git` CLI. Every call goes through
 * execFile with an argument array (never a shell string), so repo paths and
 * revisions cannot inject commands. GIT_OPTIONAL_LOCKS=0 keeps read-only
 * commands from touching the index lock.
 */

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

export class GitError extends Error {
  constructor(
    message: string,
    readonly code: number,
  ) {
    super(message);
    this.name = "GitError";
  }
}

const GIT_ENV = { ...process.env, GIT_OPTIONAL_LOCKS: "0" };

function git(
  repo: string,
  args: string[],
  opts: { maxBuffer?: number } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      ["-C", repo, ...args],
      { env: GIT_ENV, maxBuffer: opts.maxBuffer ?? 32 * 1024 * 1024, timeout: 20_000 },
      (err, stdout, stderr) => {
        if (err) {
          const tail = (stderr || String(err)).trim().split("\n").slice(-3).join(" ");
          reject(new GitError(tail || "git command failed", (err as NodeJS.ErrnoException & { code?: number }).code ?? 1));
          return;
        }
        resolve(stdout);
      },
    );
  });
}

// ---------------------------------------------------------------- repos ---

export interface RepoInfo {
  id: string;
  name: string;
  path: string;
  branch: string | null;
  lastCommit: { sha: string; subject: string; author: string; date: string } | null;
}

/** True when `dir` looks like a git work tree (`.git` may be a dir or a worktree file). */
async function isGitRepo(dir: string): Promise<boolean> {
  try {
    const st = await fs.stat(path.join(dir, ".git"));
    return st.isDirectory() || st.isFile();
  } catch {
    return false;
  }
}

/** Discover git repos one level below `root`. Cached briefly; collisions get a numeric suffix. */
export async function listRepos(root: string): Promise<RepoInfo[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const found: RepoInfo[] = [];
  const seen = new Map<string, number>();

  for (const name of dirs) {
    const full = path.join(root, name);
    if (!(await isGitRepo(full))) continue;
    let id = name;
    const n = seen.get(name);
    if (n !== undefined) {
      seen.set(name, n + 1);
      id = `${name}-${n + 1}`;
    } else {
      seen.set(name, 1);
    }

    let branch: string | null = null;
    let lastCommit: RepoInfo["lastCommit"] = null;
    try {
      branch = (await git(full, ["rev-parse", "--abbrev-ref", "HEAD"])).trim();
      if (branch === "HEAD") branch = null; // detached
      const out = await git(full, ["log", "-1", "--pretty=format:%H%x1f%an%x1f%aI%x1f%s"]);
      if (out.trim()) {
        const [sha, author, date, subject] = out.split("\x1f");
        lastCommit = { sha, author, date, subject };
      }
    } catch {
      // Unborn HEAD / corrupt repo: still list it, just without metadata.
    }
    found.push({ id, name, path: full, branch, lastCommit });
    if (found.length >= 100) break;
  }
  return found;
}

// ------------------------------------------------------------- branches ---

export interface BranchInfo {
  name: string;
  current: boolean;
  remote: boolean;
}

export async function branches(repo: string): Promise<BranchInfo[]> {
  const out = await git(repo, ["branch", "--list", "--format=%(refname:short)%x1f%(HEAD)"]);
  const locals: BranchInfo[] = out
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [name, head] = l.split("\x1f");
      return { name, current: head === "*", remote: false };
    });
  let remotes: BranchInfo[] = [];
  try {
    const rout = await git(repo, ["branch", "-r", "--list", "--format=%(refname:short)%x1f%(HEAD)"]);
    remotes = rout
      .split("\n")
      .filter((l) => l && !l.includes("-\u003e")) // skip origin/HEAD symref
      .map((l) => {
        const [name] = l.split("\x1f");
        return { name, current: false, remote: true };
      });
  } catch {
    /* no remotes */
  }
  return [...locals, ...remotes];
}

// ------------------------------------------------------------------ log ---

export interface CommitSummary {
  sha: string;
  shortSha: string;
  author: string;
  date: string;
  subject: string;
  parents: number;
}

const LOG_FMT = "--pretty=format:%H%x1f%h%x1f%an%x1f%aI%x1f%P%x1f%s";
const LOG_PAGE = 100;

export async function log(repo: string, branch: string, skip: number): Promise<{ commits: CommitSummary[]; hasMore: boolean }> {
  const out = await git(repo, ["log", branch, LOG_FMT, "-n", String(LOG_PAGE + 1), "--skip", String(skip)]);
  const lines = out.split("\n").filter(Boolean);
  const hasMore = lines.length > LOG_PAGE;
  const commits = lines.slice(0, LOG_PAGE).map((l) => {
    const [sha, shortSha, author, date, parents, subject] = l.split("\x1f");
    return { sha, shortSha, author, date, subject, parents: parents ? parents.split(" ").length : 0 };
  });
  return { commits, hasMore };
}

// --------------------------------------------------------------- commit ---

export interface CommitFile {
  path: string;
  oldPath: string | null;
  status: "added" | "modified" | "deleted" | "renamed";
  binary: boolean;
}

export interface CommitDetail {
  sha: string;
  shortSha: string;
  subject: string;
  body: string;
  author: string;
  email: string;
  date: string;
  parents: string[];
  files: CommitFile[];
  additions: number | null;
  deletions: number | null;
  filesChanged: number | null;
  isMerge: boolean;
  diffBase: string | null; // parent the diff is computed against (null = root commit)
}

export async function commitDetail(repo: string, sha: string): Promise<CommitDetail> {
  const meta = await git(repo, ["show", "-s", "--format=%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%P%x1f%s%x1f%b", sha]);
  const [fullSha, shortSha, author, email, date, parentsRaw, subject, body = ""] = meta.replace(/\n$/, "").split("\x1f");
  const parents = parentsRaw ? parentsRaw.trim().split(" ") : [];
  const diffBase = parents.length > 0 ? parents[0] : null;

  // File list (name-status -z handles spaces and renames robustly).
  const args = diffBase
    ? ["diff-tree", "-r", "-M", "--no-commit-id", "--name-status", "-z", diffBase, fullSha]
    : ["diff-tree", "--root", "-r", "-M", "--no-commit-id", "--name-status", "-z", fullSha];
  const raw = await git(repo, args);
  const tokens = raw.split("\0").filter((t) => t.length > 0);
  const files: CommitFile[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const head = tokens[i];
    const statusCode = head[0];
    if (statusCode === "R" || statusCode === "C") {
      const oldP = tokens[++i];
      const newP = tokens[++i];
      files.push({ path: newP, oldPath: oldP, status: "renamed", binary: false });
    } else {
      const p = tokens[++i];
      const status: CommitFile["status"] =
        statusCode === "A" ? "added" : statusCode === "D" ? "deleted" : "modified";
      files.push({ path: p, oldPath: null, status, binary: false });
    }
  }

  // Aggregate +/- from shortstat of the same diff range.
  let additions: number | null = null;
  let deletions: number | null = null;
  let filesChanged: number | null = null;
  try {
    const statArgs = diffBase
      ? ["diff", "--shortstat", "-M", diffBase, fullSha]
      : ["show", "--root", "--shortstat", "--format=", fullSha];
    const stat = await git(repo, statArgs);
    const m = /(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/.exec(stat);
    if (m) {
      filesChanged = parseInt(m[1], 10);
      additions = m[2] ? parseInt(m[2], 10) : 0;
      deletions = m[3] ? parseInt(m[3], 10) : 0;
    }
  } catch {
    /* stats are decorative */
  }

  // Binary detection: ask diff-tree for the binary flag via numstat-like output.
  try {
    const bArgs = diffBase
      ? ["diff", "--numstat", "-M", diffBase, fullSha]
      : ["show", "--root", "--numstat", "--format=", fullSha];
    const bOut = await git(repo, bArgs);
    const binSet = new Set(
      bOut
        .split("\n")
        .filter((l) => l.startsWith("-\t-\t"))
        .map((l) => {
          // numstat rename form: "-\t-\told => new" or plain path
          const p = l.slice(4);
          const rm = /^(.*) => (.*)$/.exec(p);
          return rm ? rm[2] : p;
        }),
    );
    for (const f of files) if (binSet.has(f.path)) f.binary = true;
  } catch {
    /* binary flags are decorative */
  }

  return {
    sha: fullSha,
    shortSha,
    subject,
    body,
    author,
    email,
    date,
    parents,
    files,
    additions,
    deletions,
    filesChanged,
    isMerge: parents.length > 1,
    diffBase,
  };
}

/** Diff cap: above this the raw diff is rejected and the UI shows a notice. */
export const DIFF_CHAR_CAP = 1_500_000;

/** Raw unified diff for one file in a commit. */
export async function fileDiff(repo: string, sha: string, diffBase: string | null, filePath: string): Promise<string> {
  const args = diffBase
    ? ["diff", diffBase, sha, "--", filePath]
    : ["show", "--root", "--format=", "--patch", sha, "--", filePath];
  return git(repo, args, { maxBuffer: DIFF_CHAR_CAP + 1024 });
}
