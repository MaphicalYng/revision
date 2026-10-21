# revision

A zero-dependency web UI for browsing local git repositories: branches, commit history, and **side-by-side commit diffs with aligned line numbers** — old on the left, new on the right, every row numbered on both sides, with word-level highlights on changed tokens.

Visual reference: [Linear](https://linear.app)-style dark UI, [GitHub Dark](https://github.com)-style diff colors.

```
┌──────────────────────────────────────────────────────────────┐
│ ⎇ revision   [alpha ▾]  [main ▾]                      ⟳     │
├──────────────┬───────────────────────────────────────────────┤
│ Commits      │  refactor server, add util + assets           │
│  filter…     │  Demo Dev · Oct 1, 2026 · a1b2c3d · 5 files  │
│ ──────────── │ ┌ src/server.ts │A src/util.ts │R docs/… ┐    │
│ ● a1b2c3 v2… │ ├───────────────────────────────────────────┤ │
│ ○ 9f8e7d …   │ │  @@ -1,5 +1,6 @@                            │ │
│ ○ 3c4d5e …   │ │   1  import http…   │ 1  import http…       │ │
│ ○ 7a6b5c …   │ │   2                 │ 2  import { readFi…   │ │
│ ○ 1f2e3d …   │ │   3  const server…  │ 3  const server…      │ │
│ [Load more]  │ │   4    res.writ…    │ 4 -  res.end('hello…  │ │
│              │ │   5                 │ 5 +  res.end('hello…  │ │
│              │ │   6  });            │ 6  });                │ │
│              │ └───────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────┘
```

## Install

```bash
npm install -g revision
```

Or run straight away with npx (compiles on demand are not needed — the published package ships plain JS):

```bash
npx revision ~/code
```

## Usage

```bash
revision [dir]            # serve repos under `dir` (default: cwd)
  -p, --port <n>          # default 4777; walks up to +20 if the port is busy
  --host <ip>             # default 127.0.0.1; use 0.0.0.0 for LAN access
  --token <secret>        # access token (default: random token, printed at startup)
  --no-auth               # disable token authentication (loopback only!)
  --no-open               # do not open the browser
```

**Token authentication is on by default.** Every start generates a random token and prints a ready-to-use URL:

```
revision ~/code
  listen  : http://127.0.0.1:4777/?token=GgY9rM3xQ8wK2vZpL7sN4tRf
```

The page carries `?token=` in its URL and forwards it as an `Authorization: Bearer` header on every API call; API clients can pass either form. Without a valid token the server answers `401` for both the page and the API. Comparison is constant-time. Pass `--token <secret>` to choose your own (handy for bookmarks or multiple clients), or `--no-auth` only when the bind address is loopback / behind your own reverse-proxy auth.

Every immediate subdirectory of `dir` that contains a `.git` entry shows up in the repo picker. Click a commit on the left, switch files along the top, read the diff.

### Keyboard

| Key | Action |
| --- | --- |
| `j` / `k` | next / previous commit in the list |

## Features

- **Repo discovery** — one level deep, worktrees and submodules included (`*.git` file or dir), name collisions suffixed, 100-repo cap
- **Branches** — local branches with the current one preselected; remote branches under an optgroup
- **Commit history** — paged 100 at a time with "Load more", client-side filter box, merge-commit markers, relative timestamps
- **Commit detail** — full message body, author, exact date, copyable SHA, aggregate `files changed / +ins / −del` stats
- **File tabs** — `A`/`M`/`D`/`R` status chips, rename shown as `old → new`, per-file `+x −y` counts once loaded
- **Side-by-side diff** — the old file on the left, the new file on the right, each with its own line numbers; deletion/addition runs pair row-by-row so both columns stay aligned; unpaired leftovers render with an empty opposite cell
- **Word-level highlights** — paired changed lines are split into common-prefix / changed-middle / common-suffix token spans so only what actually changed lights up
- **Hunk headers** — `@@ -a,b +c,d @@` separators between change blocks
- **Binary & oversized files** — detected and shown as notices instead of hanging the page (diffs above ~1.5 MB are refused with a copy-pasteable `git diff` command)
- **Merge commits** — diff computed against the first parent, with a note in the header
- **Root commits** — handled via `git diff-tree --root` / `git show`
- **Hash routing** — `#r=<repo>&b=<branch>&c=<sha>` is synced as you navigate, so any view is a shareable/bookmarkable URL
- **Security** — token authentication on by default (random token per start, printed as a ready URL; `--token` to fix your own, `--no-auth` to opt out); constant-time comparison; repo ids come from a discovery scan, never raw paths; revisions validated as hex; file paths validated as repo-relative; all git calls go through `execFile` argument arrays (no shell); `GIT_OPTIONAL_LOCKS=0` keeps reads from touching the index lock; localhost binding by default

## Architecture

Zero runtime dependencies. Node >= 18, plain `node:http`, TypeScript compiled to `dist/`.

```
src/
  cli.ts      argument parsing, browser launch
  server.ts   http server, routing, input validation, JSON API
  git.ts      safe execFile wrappers around the git CLI
  diff.ts     unified-diff parser + side-by-side row pairing + word spans
  page.ts     the single-page UI (inline CSS/JS, no build step)
bin/
  revision.js  npm bin wrapper -> dist/cli.js
scripts/
  demo.mjs     generates sample repos under /tmp/revision-demo
```

Data flow:

```
page --GET /api/repos----------------> server --fs scan------------> repo list
page --GET /api/repo/:id/log?branch--> server --git log------------> commit rows
page --GET /api/repo/:id/commit/:sha-> server --git diff-tree/show-> file list + stats
page --GET .../diff?file=------------> server --git diff + parse---> { hunks: [{ rows }] }
page renders rows in a 4-column grid: [old #][old code][new #][new code]
```

Line-number alignment is a pairing problem, not a rendering problem: within each hunk, context rows carry both numbers, buffered deletions pair row-by-row with the following additions, and leftovers stay unpaired with an empty opposite cell. The result is two columns that always line up row for row.

## Development

```bash
npm install
npm run build          # tsc -> dist/
npm run demo           # create sample repos in /tmp/revision-demo
node bin/revision.js /tmp/revision-demo
```

## License

MIT
