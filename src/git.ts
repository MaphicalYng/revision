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
  opts: { maxBuffer?: number; okCodes?: number[] } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      ["-C", repo, ...args],
      { env: GIT_ENV, maxBuffer: opts.maxBuffer ?? 32 * 1024 * 1024, timeout: 20_000 },
      (err, stdout, stderr) => {
        if (err) {
          const code = (err as NodeJS.ErrnoException & { code?: number }).code ?? -1;
          // e.g. `git diff --no-index` exits 1 when the inputs differ — a success for us.
          if (opts.okCodes && opts.okCodes.includes(code)) {
            resolve(stdout);
            return;
          }
          const tail = (stderr || String(err)).trim().split("\n").slice(-3).join(" ");
          reject(new GitError(tail || "git command failed", code));
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

/** Branch + last commit of a repo; metadata is decorative, so failures fall back to nulls. */
async function repoMeta(dir: string): Promise<{ branch: string | null; lastCommit: RepoInfo["lastCommit"] }> {
  let branch: string | null = null;
  let lastCommit: RepoInfo["lastCommit"] = null;
  try {
    branch = (await git(dir, ["rev-parse", "--abbrev-ref", "HEAD"])).trim();
    if (branch === "HEAD") branch = null; // detached
    const out = await git(dir, ["log", "-1", "--pretty=format:%H%x1f%an%x1f%aI%x1f%s"]);
    if (out.trim()) {
      const [sha, author, date, subject] = out.split("\x1f");
      lastCommit = { sha, author, date, subject };
    }
  } catch {
    // Unborn HEAD / corrupt repo: still list it, just without metadata.
  }
  return { branch, lastCommit };
}

/**
 * Discover git repos: `root` itself when it is a repo, plus every repo one
 * level below it (worktrees and submodules included). Cached briefly by the
 * caller; name collisions get a numeric suffix, and the total is capped.
 */
export async function listRepos(root: string): Promise<RepoInfo[]> {
  const found: RepoInfo[] = [];
  const seen = new Map<string, number>();

  const add = async (dir: string, name: string): Promise<void> => {
    let id = name;
    const n = seen.get(name);
    if (n !== undefined) {
      seen.set(name, n + 1);
      id = `${name}-${n + 1}`;
    } else {
      seen.set(name, 1);
    }
    found.push({ id, name, path: dir, ...(await repoMeta(dir)) });
  };

  // Pointing at the repo itself (e.g. `revision ~/code/app`) serves that repo.
  if (await isGitRepo(root)) {
    const resolved = path.resolve(root);
    await add(root, path.basename(resolved) || path.parse(resolved).root);
  }

  if (found.length >= 100) return found;
  const entries = await fs.readdir(root, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

  for (const name of dirs) {
    if (found.length >= 100) break;
    const full = path.join(root, name);
    if (!(await isGitRepo(full))) continue;
    await add(full, name);
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
  // NOTE: branch --format uses ref-filter syntax, which does NOT support %xNN
  // escapes (unlike log --pretty=format:) — they are emitted literally and end
  // up glued to branch names. %(HEAD) is always exactly one char ("*" for the
  // checked-out branch, space otherwise), so parse from the right instead of
  // splitting on a separator that never materializes.
  const parse = (line: string): { name: string; current: boolean } => ({
    name: line.slice(0, -2),
    current: line.endsWith("*"),
  });
  const out = await git(repo, ["branch", "--list", "--format=%(refname:short) %(HEAD)"]);
  const locals: BranchInfo[] = out
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const { name, current } = parse(l);
      return { name, current, remote: false };
    });
  let remotes: BranchInfo[] = [];
  try {
    const rout = await git(repo, ["branch", "-r", "--list", "--format=%(refname:short) %(HEAD)"]);
    remotes = rout
      .split("\n")
      .filter((l) => l && !l.includes("->")) // skip origin/HEAD symref
      .map((l) => {
        const { name } = parse(l);
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
  additions: number | null;
  deletions: number | null;
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
      files.push({ path: newP, oldPath: oldP, status: "renamed", binary: false, additions: null, deletions: null });
    } else {
      const p = tokens[++i];
      const status: CommitFile["status"] =
        statusCode === "A" ? "added" : statusCode === "D" ? "deleted" : "modified";
      files.push({ path: p, oldPath: null, status, binary: false, additions: null, deletions: null });
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

  // Per-file +/- counts and binary flags from numstat on the same diff range.
  try {
    const bArgs = diffBase
      ? ["diff", "--numstat", "-M", diffBase, fullSha]
      : ["show", "--root", "--numstat", "--format=", fullSha];
    const bOut = await git(repo, bArgs);
    const statMap = new Map<string, { a: number | null; d: number | null; binary: boolean }>();
    for (const line of bOut.split("\n")) {
      if (!line) continue;
      const parts = line.split("\t");
      if (parts.length < 3) continue;
      const a = parts[0] === "-" ? null : parseInt(parts[0], 10);
      const d = parts[1] === "-" ? null : parseInt(parts[1], 10);
      let p = parts.slice(2).join("\t");
      const rm = /^(.*) => (.*)$/.exec(p); // numstat (non-z) renders renames as "old => new"
      if (rm) p = rm[2];
      statMap.set(p, { a, d, binary: a === null || d === null });
    }
    for (const f of files) {
      const e = statMap.get(f.path);
      if (e) {
        f.binary = e.binary;
        f.additions = e.binary ? null : e.a;
        f.deletions = e.binary ? null : e.d;
      }
    }
  } catch {
    /* per-file stats are decorative */
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

/** File-content cap for the context-expansion feature: blobs above this are
 * reported as tooLarge instead of being shipped to the frontend. */
export const CONTENT_CHAR_CAP = 1_000_000;

/** Full text of a blob at `rev:path`; distinguishes "absent" from "too large". */
export async function blobAtRev(
  repo: string,
  rev: string,
  filePath: string,
): Promise<{ text: string | null; tooLarge: boolean }> {
  const spec = `${rev}:${filePath}`;
  try {
    const size = parseInt((await git(repo, ["cat-file", "-s", spec])).trim(), 10);
    if (!Number.isFinite(size) || size > CONTENT_CHAR_CAP) return { text: null, tooLarge: true };
    const text = await git(repo, ["cat-file", "-p", spec], { maxBuffer: CONTENT_CHAR_CAP + 1024 });
    return { text, tooLarge: false };
  } catch {
    return { text: null, tooLarge: false }; // not present at this revision
  }
}

/** Full text of a working-tree file; null when absent, tooLarge when over the cap. */
export async function workFileText(repo: string, filePath: string): Promise<{ text: string | null; tooLarge: boolean }> {
  try {
    const full = path.join(repo, filePath);
    const st = await fs.stat(full);
    if (!st.isFile() || st.size > CONTENT_CHAR_CAP) return { text: null, tooLarge: st.isFile() };
    return { text: await fs.readFile(full, "utf8"), tooLarge: false };
  } catch {
    return { text: null, tooLarge: false };
  }
}

/** Raw unified diff for one file in a commit. */
export async function fileDiff(repo: string, sha: string, diffBase: string | null, filePath: string): Promise<string> {
  const args = diffBase
    ? ["diff", diffBase, sha, "--", filePath]
    : ["show", "--root", "--format=", "--patch", sha, "--", filePath];
  return git(repo, args, { maxBuffer: DIFF_CHAR_CAP + 1024 });
}

// ---------------------------------------------------- working tree ---

export interface WorkFile {
  path: string;
  oldPath: string | null;
  /** two-letter porcelain code, e.g. "M " (staged), " M" (unstaged), "MM", "??" */
  code: string;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
  binary: boolean;
  additions: number | null;
  deletions: number | null;
}

export async function hasHead(repo: string): Promise<boolean> {
  try {
    await git(repo, ["rev-parse", "--verify", "--quiet", "HEAD"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Working tree status: staged + unstaged + untracked, rename-aware.
 * adds/dels/binary come from `git diff HEAD --numstat` (staged-only on
 * unborn branches); untracked files are not in numstat, so their counts
 * stay null and they get an all-additions diff on demand instead.
 */
export async function workStatus(repo: string): Promise<{ hasHead: boolean; files: WorkFile[] }> {
  const head = await hasHead(repo);
  const out = await git(repo, ["status", "--porcelain=v1", "-z", "-M", "--untracked-files=normal"]);
  const tok = out.split("\0").filter((t) => t.length > 0);
  const files: WorkFile[] = [];
  for (let i = 0; i < tok.length; i++) {
    const code = tok[i].slice(0, 2);
    const p = tok[i].slice(3);
    let oldPath: string | null = null;
    if (code[0] === "R" || code[0] === "C") {
      oldPath = tok[i + 1] ?? null; // with -z the ORIGINAL path follows the new one
      i++;
    }
    const untracked = code === "??";
    files.push({
      path: p,
      oldPath,
      code,
      staged: !untracked && code[0] !== " ",
      unstaged: !untracked && code[1] !== " ",
      untracked,
      binary: false,
      additions: null,
      deletions: null,
    });
  }
  try {
    const nsArgs = head
      ? ["diff", "HEAD", "--numstat", "-M", "--"]
      : ["diff", "--cached", "--numstat", "-M", "--"];
    const ns = await git(repo, nsArgs);
    const byPath = new Map<string, { a: number | null; d: number | null; binary: boolean }>();
    for (const line of ns.split("\n")) {
      if (!line) continue;
      const parts = line.split("\t");
      if (parts.length < 3) continue;
      const a = parts[0] === "-" ? null : parseInt(parts[0], 10);
      const d = parts[1] === "-" ? null : parseInt(parts[1], 10);
      let p = parts.slice(2).join("\t");
      const m = p.match(/^(.*) => (.*)$/); // non-z numstat renders renames as "old => new"
      if (m) p = m[2];
      byPath.set(p, { a, d, binary: a === null || d === null });
    }
    for (const f of files) {
      const e = byPath.get(f.path);
      if (e) {
        f.additions = e.a;
        f.deletions = e.d;
        f.binary = e.binary;
      }
    }
  } catch {
    /* numstat is best-effort */
  }
  return { hasHead: head, files };
}

/**
 * Raw unified diff for one working-tree file, vs HEAD (staged+unstaged combined).
 * A rename needs BOTH paths in the pathspec — restricting to the new path makes
 * git treat it as a pure addition (rename detection has nothing to pair with).
 */
export async function workDiffText(repo: string, file: string, untracked: boolean, head: boolean, oldPath?: string | null): Promise<string> {
  if (untracked) {
    // /dev/null vs file — git emits a standard "new file" patch; exit 1 just means "differences".
    return git(repo, ["diff", "--no-index", "--", "/dev/null", file], { okCodes: [0, 1] });
  }
  const paths = oldPath ? [oldPath, file] : [file];
  if (head) return git(repo, ["diff", "HEAD", "-M", "--", ...paths]);
  return git(repo, ["diff", "--cached", "-M", "--", ...paths]);
}
