/**
 * Parser for `git diff` output (unified diff as produced by
 * `git diff A B -- path` / `git show --patch`).
 *
 * The parser is deliberately tolerant: anything it does not recognize is
 * skipped rather than thrown, so the frontend always gets the best partial
 * view instead of a 500.
 */

export interface DiffLine {
  type: "ctx" | "del" | "add";
  text: string;
}

export interface Hunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export type FileStatus = "added" | "modified" | "deleted" | "renamed";

export interface FileDiff {
  /** Path on the old side; null when the file was added. */
  oldPath: string | null;
  /** Path on the new side; null when the file was deleted. */
  newPath: string | null;
  status: FileStatus;
  binary: boolean;
  hunks: Hunk[];
}

/** One row of the side-by-side view after pairing del/add lines. */
export interface SideBySideRow {
  oldNo: number | null;
  newNo: number | null;
  oldText: string | null;
  newText: string | null;
  /** True when this row pairs a deletion with an addition (word-diff target). */
  paired: boolean;
}

const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/** Undo git's C-style quoting of paths in diff headers ("a/b c" -> b c, with the a/ prefix stripped by callers). */
function unquotePath(raw: string): string {
  if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
    const inner = raw.slice(1, -1);
    return inner.replace(/\\(\\|"|\n|\t|\r|\b|\f|\v)/g, (_m, ch: string) => {
      switch (ch) {
        case "n": return "\n";
        case "t": return "\t";
        case "r": return "\r";
        case "b": return "\b";
        case "f": return "\f";
        case "v": return "\v";
        default: return ch;
      }
    });
  }
  return raw;
}

function stripPrefix(p: string): string {
  return p.startsWith("a/") || p.startsWith("b/") ? p.slice(2) : p;
}

/** Extract the path from a `--- a/path` / `+++ b/path` header line; "/dev/null" -> null. */
function headerPath(line: string): string | null {
  const rest = line.slice(4).trimStart();
  if (rest === "/dev/null") return null;
  return stripPrefix(unquotePath(rest));
}

export function parseGitDiff(raw: string): FileDiff[] {
  const files: FileDiff[] = [];
  // Split into per-file chunks on the `diff --git` marker.
  const chunks = raw.split(/^diff --git /m).slice(1);

  for (const chunk of chunks) {
    const file: FileDiff = {
      oldPath: null,
      newPath: null,
      status: "modified",
      binary: false,
      hunks: [],
    };
    let pendingOld: string | null = null;
    let pendingNew: string | null = null;

    const lines = chunk.split("\n");
    // The first line of the chunk is the tail of `diff --git a/x b/y` ("a/x b/y").
    let i = 0;
    const gitLine = lines[0] ?? "";
    const gitMatch = /^(?:"([^"]+)"|(\S+)) (?:"([^"]+)"|(\S+))$/.exec(gitLine);
    if (gitMatch) {
      file.oldPath = stripPrefix(unquotePath(gitMatch[1] ?? gitMatch[2] ?? ""));
      file.newPath = stripPrefix(unquotePath(gitMatch[3] ?? gitMatch[4] ?? ""));
    }

    for (i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("--- ")) {
        pendingOld = headerPath(line);
      } else if (line.startsWith("+++ ")) {
        pendingNew = headerPath(line);
      } else if (line.startsWith("new file mode")) {
        file.status = "added";
      } else if (line.startsWith("deleted file mode")) {
        file.status = "deleted";
      } else if (line.startsWith("rename from ")) {
        file.status = "renamed";
        pendingOld = unquotePath(line.slice("rename from ".length));
      } else if (line.startsWith("rename to ")) {
        pendingNew = unquotePath(line.slice("rename to ".length));
      } else if (line.startsWith("Binary files ") || line.startsWith("GIT binary patch")) {
        file.binary = true;
      } else if (line.startsWith("@@")) {
        break; // enter hunk-parsing mode
      }
    }

    if (pendingOld !== null) file.oldPath = pendingOld;
    if (pendingNew !== null) file.newPath = pendingNew;
    if (file.status === "modified" && file.oldPath && file.newPath && file.oldPath !== file.newPath) {
      file.status = "renamed";
    }

    // Parse hunks.
    let cur: Hunk | null = null;
    for (; i < lines.length; i++) {
      const line = lines[i];
      const m = HUNK_RE.exec(line);
      if (m) {
        cur = {
          oldStart: parseInt(m[1], 10),
          oldCount: m[2] ? parseInt(m[2], 10) : 1,
          newStart: parseInt(m[3], 10),
          newCount: m[4] ? parseInt(m[4], 10) : 1,
          lines: [],
        };
        file.hunks.push(cur);
        continue;
      }
      if (!cur) continue;
      if (line.startsWith("\\")) {
        // "\ No newline at end of file" — mark the previous line.
        const prev = cur.lines[cur.lines.length - 1];
        if (prev) prev.text += "\n\\ No newline at end of file";
        continue;
      }
      const prefix = line[0];
      const text = line.slice(1);
      if (prefix === " ") cur.lines.push({ type: "ctx", text });
      else if (prefix === "-") cur.lines.push({ type: "del", text });
      else if (prefix === "+") cur.lines.push({ type: "add", text });
      // Anything else (e.g. stray metadata) is ignored.
    }

    files.push(file);
  }

  return files;
}

/**
 * Pair deletion/addition lines within each hunk into side-by-side rows.
 * Context rows carry both line numbers; a buffered run of deletions pairs
 * row-by-row with the following additions; leftovers render unpaired with an
 * empty opposite side, which keeps old and new line numbers aligned.
 */
export function toSideBySide(hunks: Hunk[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  for (const h of hunks) {
    let o = h.oldStart;
    let n = h.newStart;
    // Buffered deletions keep their original old-side line numbers.
    const delBuf: { text: string; no: number }[] = [];

    const flush = () => {
      for (const d of delBuf) rows.push({ oldNo: d.no, newNo: null, oldText: d.text, newText: null, paired: false });
      delBuf.length = 0;
    };

    for (const l of h.lines) {
      if (l.type === "ctx") {
        flush();
        rows.push({ oldNo: o++, newNo: n++, oldText: l.text, newText: l.text, paired: false });
      } else if (l.type === "del") {
        delBuf.push({ text: l.text, no: o++ });
      } else {
        const d = delBuf.length > 0 ? delBuf.shift()! : null;
        if (d) {
          rows.push({ oldNo: d.no, newNo: n++, oldText: d.text, newText: l.text, paired: true });
        } else {
          rows.push({ oldNo: null, newNo: n++, oldText: null, newText: l.text, paired: false });
        }
      }
    }
    flush();
  }
  return rows;
}

/** Add/delete totals across all hunks of a file. */
export function countChanges(hunks: Hunk[]): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const h of hunks) {
    for (const l of h.lines) {
      if (l.type === "add") additions++;
      else if (l.type === "del") deletions++;
    }
  }
  return { additions, deletions };
}

/**
 * Split two paired lines into common-prefix / changed-middle / common-suffix
 * token spans so the frontend can highlight just the changed tokens.
 * Conservative: only the middle spans get highlighted, never misaligns.
 */
export function wordSpans(
  a: string,
  b: string,
): { aPre: string; aMid: string; aSuf: string; bPre: string; bMid: string; bSuf: string } | null {
  const TOK = /[A-Za-z0-9_]+|\s+|[^\sA-Za-z0-9_]/g;
  const ta = a.match(TOK);
  const tb = b.match(TOK);
  if (!ta || !tb) return null;
  let pre = 0;
  while (pre < ta.length && pre < tb.length && ta[pre] === tb[pre]) pre++;
  let suf = 0;
  while (suf < ta.length - pre && suf < tb.length - pre && ta[ta.length - 1 - suf] === tb[tb.length - 1 - suf]) suf++;
  if (pre === ta.length && pre === tb.length) return null; // identical
  const aPre = ta.slice(0, pre).join("");
  const bPre = tb.slice(0, pre).join("");
  const aSuf = ta.slice(ta.length - suf).join("");
  const bSuf = tb.slice(tb.length - suf).join("");
  const aMid = ta.slice(pre, ta.length - suf).join("");
  const bMid = tb.slice(pre, tb.length - suf).join("");
  if (aMid === bMid) return null; // tokenized equal (e.g. whitespace-only diff at token level)
  return { aPre, aMid, aSuf, bPre, bMid, bSuf };
}
