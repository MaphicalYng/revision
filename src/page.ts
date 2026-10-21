/**
 * The single-page UI: one self-contained HTML document with inline CSS and JS.
 * No build step, no static assets — the server renders this string as-is.
 * Visual reference: Linear / GitHub Dark — near-black warm background, hairline
 * borders, one cool accent, and diff rows that read like paper tape.
 */

export function renderPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>revision</title>
<style>${CSS}</style>
</head>
<body>
<header class="top">
  <div class="brand"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="4.5" cy="3.5" r="1.8"/><circle cx="4.5" cy="12.5" r="1.8"/><circle cx="11.5" cy="8" r="1.8"/><path d="M4.5 5.3v5.4M6 4.2l3.2 2.8M6 11.8l3.2-2.8"/></svg><span>revision</span></div>
  <select id="repoSel" class="sel" aria-label="repository"></select>
  <select id="branchSel" class="sel" aria-label="branch"></select>
  <div class="sp"></div>
  <button id="refreshBtn" class="ibtn" title="Refresh" aria-label="refresh"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3"/></svg></button>
</header>
<div class="body">
  <aside class="side">
    <div class="side-head">
      <span id="sideTitle">Commits</span>
      <input id="filter" type="search" placeholder="Filter loaded commits" autocomplete="off" spellcheck="false">
    </div>
    <div id="commitList" class="commits"></div>
    <button id="moreBtn" class="more" hidden>Load more</button>
  </aside>
  <main class="main" id="main"></main>
</div>
<div class="toast" id="toast" role="status"></div>
<script>${JS}</script>
</body>
</html>`;
}

const CSS = `
:root {
  --bg: #0c0e12;
  --panel: #12151b;
  --panel-2: #161a21;
  --panel-3: #1b2029;
  --border: #232833;
  --border-soft: #1b202a;
  --text: #e6e9ef;
  --text-2: #9aa3b2;
  --text-3: #5d6472;
  --accent: #5b9dff;
  --accent-dim: rgba(91, 157, 255, 0.14);
  --add-bg: rgba(63, 185, 80, 0.10);
  --add-num: #56d364;
  --del-bg: rgba(248, 81, 73, 0.10);
  --del-num: #ff7b72;
  --add-word: rgba(63, 185, 80, 0.32);
  --del-word: rgba(248, 81, 73, 0.32);
  --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --top-h: 52px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  background: var(--bg); color: var(--text);
  font: 14px/1.5 var(--sans);
  display: flex; flex-direction: column;
  overflow: hidden;
}
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: #262c38; border-radius: 6px; border: 2px solid var(--bg); }
::-webkit-scrollbar-track { background: transparent; }

/* ---------- top bar ---------- */
.top {
  height: var(--top-h); flex: none;
  display: flex; align-items: center; gap: 10px;
  padding: 0 14px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: center; gap: 8px; font-weight: 650; letter-spacing: 0.2px; color: var(--text); margin-right: 6px; }
.brand svg { color: var(--accent); }
.sel {
  appearance: none; -webkit-appearance: none;
  background: var(--panel-2) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239aa3b2' fill='none' stroke-width='1.5'/%3E%3C/svg%3E") no-repeat right 9px center;
  color: var(--text);
  border: 1px solid var(--border); border-radius: 8px;
  padding: 7px 30px 7px 11px;
  font: 500 13px var(--sans);
  max-width: 260px; cursor: pointer;
}
.sel:hover { border-color: #2e3542; }
.sel:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.sp { flex: 1; }
.ibtn {
  display: grid; place-items: center;
  width: 32px; height: 32px;
  background: var(--panel-2); color: var(--text-2);
  border: 1px solid var(--border); border-radius: 8px; cursor: pointer;
}
.ibtn:hover { color: var(--text); border-color: #2e3542; }

/* ---------- layout ---------- */
.body { flex: 1; display: flex; min-height: 0; }
.side {
  width: 320px; flex: none;
  display: flex; flex-direction: column;
  background: var(--panel);
  border-right: 1px solid var(--border);
  min-height: 0;
}
.side-head { padding: 12px 12px 8px; border-bottom: 1px solid var(--border-soft); }
.side-head span { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-3); margin-bottom: 8px; }
#filter {
  width: 100%;
  background: var(--panel-2); color: var(--text);
  border: 1px solid var(--border); border-radius: 8px;
  padding: 7px 10px; font: 400 13px var(--sans);
}
#filter:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; }
#filter::placeholder { color: var(--text-3); }
.commits { flex: 1; overflow-y: auto; padding: 6px; }
.commit {
  display: block; width: 100%; text-align: left;
  background: transparent; color: var(--text);
  border: 0; border-radius: 8px;
  padding: 9px 10px; cursor: pointer;
  font: inherit;
}
.commit:hover { background: var(--panel-2); }
.commit.on { background: var(--accent-dim); box-shadow: inset 2px 0 0 var(--accent); }
.c-subject { font-weight: 550; font-size: 13px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
.c-meta { display: flex; align-items: center; gap: 6px; margin-top: 5px; font-size: 12px; color: var(--text-2); min-width: 0; }
.c-sha { font: 600 11px var(--mono); color: var(--accent); background: var(--accent-dim); border-radius: 4px; padding: 1px 5px; flex: none; }
.c-author, .c-time { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c-time { margin-left: auto; flex: none; }
.c-parents { font-size: 11px; color: var(--text-3); }
.more {
  margin: 8px 12px 12px; padding: 8px;
  background: var(--panel-2); color: var(--text-2);
  border: 1px solid var(--border); border-radius: 8px;
  font: 500 12.5px var(--sans); cursor: pointer;
}
.more:hover { color: var(--text); }
.more[disabled] { opacity: 0.5; cursor: default; }

/* ---------- main pane ---------- */
.main { flex: 1; min-width: 0; overflow-y: auto; background: var(--bg); }
.empty { height: 100%; display: grid; place-items: center; color: var(--text-3); text-align: center; padding: 40px; }
.empty .big { font-size: 46px; margin-bottom: 14px; opacity: 0.5; }
.empty h2 { font-size: 15px; color: var(--text-2); margin-bottom: 6px; }
.empty p { font-size: 13px; max-width: 420px; line-height: 1.6; }
code.k { font: 12px var(--mono); background: var(--panel-3); border: 1px solid var(--border); border-radius: 5px; padding: 1px 6px; color: var(--text-2); }

.detail { padding: 22px 26px 60px; max-width: 1500px; }
.d-head { margin-bottom: 16px; }
.d-subject { font-size: 20px; font-weight: 650; line-height: 1.3; word-break: break-word; }
.d-body { margin-top: 10px; color: var(--text-2); font-size: 13px; white-space: pre-wrap; word-break: break-word; border-left: 2px solid var(--border); padding-left: 12px; }
.d-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 12px; font-size: 12.5px; color: var(--text-2); }
.avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--panel-3); color: var(--accent); display: grid; place-items: center; font: 700 10px var(--sans); flex: none; }
.chip { display: inline-flex; align-items: center; gap: 5px; background: var(--panel-2); border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; font: 500 12px var(--sans); color: var(--text-2); }
.chip b { font-weight: 650; color: var(--text); }
.chip.add b { color: var(--add-num); }
.chip.del b { color: var(--del-num); }
.chip.sha-chip { font-family: var(--mono); font-size: 11.5px; cursor: pointer; }
.chip.sha-chip:hover { border-color: #2e3542; color: var(--text); }
.merge-note { margin-top: 10px; font-size: 12px; color: #d29922; background: rgba(210, 153, 34, 0.08); border: 1px solid rgba(210, 153, 34, 0.25); border-radius: 8px; padding: 7px 11px; display: inline-block; }

/* ---------- file tabs ---------- */
.ftabs {
  display: flex; gap: 4px; overflow-x: auto;
  padding: 6px; margin: 14px 0 0;
  background: var(--panel);
  border: 1px solid var(--border); border-bottom: 0;
  border-radius: 10px 10px 0 0;
}
.ftab {
  display: inline-flex; align-items: center; gap: 7px;
  background: transparent; color: var(--text-2);
  border: 0; border-radius: 7px;
  padding: 6px 10px; cursor: pointer;
  font: 500 12.5px var(--sans);
  white-space: nowrap; max-width: 300px;
}
.ftab:hover { background: var(--panel-2); color: var(--text); }
.ftab.on { background: var(--panel-3); color: var(--text); box-shadow: inset 0 0 0 1px var(--border); }
.ftab .st { font: 700 10px var(--mono); width: 15px; height: 15px; border-radius: 4px; display: grid; place-items: center; flex: none; }
.st.A { color: var(--add-num); background: var(--add-bg); }
.st.M { color: var(--accent); background: var(--accent-dim); }
.st.D { color: var(--del-num); background: var(--del-bg); }
.st.R { color: #d2a8ff; background: rgba(210, 168, 255, 0.12); }
.ftab .fp { overflow: hidden; text-overflow: ellipsis; direction: rtl; }
.ftab .cnt { font: 500 11px var(--mono); color: var(--text-3); }

/* ---------- diff ---------- */
.diffbox {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 0 0 10px 10px;
  overflow: hidden;
}
.diffpath { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); font: 500 12.5px var(--mono); color: var(--text-2); }
.diffpath .full { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.diffpath .ibtn { width: 26px; height: 26px; margin-left: auto; flex: none; }
.diff-scroll { overflow: auto; max-height: calc(100vh - 330px); min-height: 200px; font: 12.5px/20px var(--mono); }
.diff { display: grid; grid-template-columns: 46px minmax(0, max-content) 46px minmax(0, max-content); width: max-content; min-width: 100%; }
.hunk-head { grid-column: 1 / -1; background: var(--panel-2); color: var(--text-3); padding: 3px 12px; font-size: 11px; border-top: 1px solid var(--border-soft); border-bottom: 1px solid var(--border-soft); position: sticky; left: 0; }
.no, .code { padding: 0 10px; white-space: pre; }
.no { color: var(--text-3); text-align: right; user-select: none; background: var(--panel); position: sticky; z-index: 1; padding-top: 1px; padding-bottom: 1px; }
.no-o { left: 0; }
.no-n { left: 46px; box-shadow: 1px 0 0 var(--border-soft); }
.no-o { box-shadow: 1px 0 0 var(--border-soft); }
.code { min-width: 46ch; border-left: 1px solid var(--border-soft); }
.code.old { background: var(--bg); }
.code.new { background: var(--bg); }
.code.r-ctx { color: var(--text); }
.no-n.r-add, .code.new.r-add { background: var(--add-bg); }
.code.new.r-add { color: var(--add-num); }
.no-o.r-del, .code.old.r-del { background: var(--del-bg); }
.code.old.r-del { color: var(--del-num); }
.code.old.r-pair { background: var(--del-bg); color: var(--del-num); }
.code.new.r-pair { background: var(--add-bg); color: var(--add-num); }
.code.r-gap { color: var(--text-3); font-style: italic; }
mark.w-del { background: var(--del-word); color: inherit; border-radius: 3px; padding: 0 1px; }
mark.w-add { background: var(--add-word); color: inherit; border-radius: 3px; padding: 0 1px; }
.diff-empty { padding: 40px 20px; text-align: center; color: var(--text-3); font: 13px var(--sans); }
.diff-empty code { font: 12px var(--mono); background: var(--panel-3); padding: 2px 8px; border-radius: 5px; }
.binary-note { padding: 30px 20px; text-align: center; color: var(--text-3); }

/* ---------- toast ---------- */
.toast {
  position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%) translateY(8px);
  background: var(--panel-3); color: var(--text);
  border: 1px solid var(--border); border-radius: 9px;
  padding: 9px 16px; font-size: 13px;
  opacity: 0; pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  box-shadow: 0 8px 24px rgba(0,0,0,0.45);
  max-width: 80vw;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ---------- responsive ---------- */
@media (max-width: 900px) {
  .body { flex-direction: column; }
  .side { width: 100%; height: 240px; border-right: 0; border-bottom: 1px solid var(--border); }
  .detail { padding: 16px 14px 40px; }
  .diff-scroll { max-height: none; }
  .code { min-width: 38ch; }
}
`;

const JS = String.raw`
"use strict";
var $ = function (id) { return document.getElementById(id); };
/* Access token: the server prints a URL of the form /?token=<secret> at startup.
   The page keeps it in the query string and forwards it as a Bearer header on
   every API call, so it never needs to live in sessionStorage or a cookie. */
var TOKEN = new URLSearchParams(location.search).get("token") || "";
var state = {
  repos: [], repo: null, branches: [], branch: null,
  commits: [], hasMore: false, loading: false,
  commit: null, files: [], fileSel: null, fileCache: {}, filter: ""
};

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function toast(msg) {
  var t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2600);
}
async function api(path) {
  var headers = { "Accept": "application/json" };
  if (TOKEN) headers["Authorization"] = "Bearer " + TOKEN;
  var r = await fetch(path, { headers: headers });
  var body = null;
  try { body = await r.json(); } catch (e) { /* non-json */ }
  if (r.status === 401) {
    mainEmpty("🔒", "Unauthorized", 'This revision server requires a token. Reopen it via the URL printed in the terminal (it contains <code class="k">?token=...</code>), or start it with <code class="k">--token &lt;secret&gt;</code>.');
    throw new Error("unauthorized");
  }
  if (!r.ok) throw new Error((body && body.error) || ("HTTP " + r.status));
  return body;
}
function relTime(iso) {
  var t = new Date(iso).getTime(); if (isNaN(t)) return "";
  var d = Date.now() - t;
  var m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  var h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  var dd = Math.floor(h / 24); if (dd < 30) return dd + "d ago";
  var mo = Math.floor(dd / 30); if (mo < 12) return mo + "mo ago";
  return Math.floor(mo / 12) + "y ago";
}
function fullTime(iso) {
  var t = new Date(iso); return isNaN(t.getTime()) ? iso : t.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function initials(name) { return (name || "?").trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join(""); }
function basename(p) { var i = p.lastIndexOf("/"); return i < 0 ? p : p.slice(i + 1); }
function dirname(p) { var i = p.lastIndexOf("/"); return i < 0 ? "" : p.slice(0, i + 1); }

/* URL hash: #r=<repo>&b=<branch>&c=<sha> */
function readHash() {
  var out = {}; location.hash.replace(/^#/, "").split("&").forEach(function (kv) {
    var p = kv.split("="); if (p[0]) out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || "");
  });
  return out;
}
function writeHash() {
  var h = "#r=" + encodeURIComponent(state.repo || "");
  if (state.branch) h += "&b=" + encodeURIComponent(state.branch);
  if (state.commit) h += "&c=" + encodeURIComponent(state.commit.sha);
  if (location.hash !== h) history.replaceState(null, "", h);
}

/* ---------------- boot ---------------- */
async function boot() {
  bindChrome();
  try {
    var data = await api("/api/repos");
    state.repos = data.repos;
  } catch (e) {
    if (e.message !== "unauthorized") mainEmpty("⚠️", "Failed to scan repositories", esc(e.message));
    return;
  }
  var sel = $("repoSel");
  sel.innerHTML = state.repos.length
    ? state.repos.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name) + "</option>"; }).join("")
    : '<option value="">(no repos found)</option>';
  if (!state.repos.length) {
    mainEmpty("⎇", "No git repositories", 'No git repos found in the target directory. Start the server pointing at the directory that contains them: <code class="k">revision /path/to/parent</code>.');
    return;
  }
  var h = readHash();
  var start = state.repos.find(function (r) { return r.id === h.r; }) || state.repos[0];
  sel.value = start.id;
  await openRepo(start.id, h.b || null, h.c || null);
}

async function openRepo(id, branchWanted, commitWanted) {
  state.repo = id; state.fileCache = {}; state.commits = []; state.commit = null; state.fileSel = null;
  writeHash();
  try {
    var b = await api("/api/repo/" + encodeURIComponent(id) + "/branches");
    state.branches = b.branches;
  } catch (e) { toast(e.message); state.branches = []; }
  var bs = $("branchSel");
  var locals = state.branches.filter(function (x) { return !x.remote; });
  var remotes = state.branches.filter(function (x) { return x.remote; });
  var html = "";
  if (locals.length) html += '<optgroup label="Local">' + locals.map(o).join("") + "</optgroup>";
  if (remotes.length) html += '<optgroup label="Remote">' + remotes.map(o).join("") + "</optgroup>";
  bs.innerHTML = html || '<option value="">(no branches)</option>';
  function o(x) { return '<option value="' + esc(x.name) + '"' + (x.current ? " selected" : "") + ">" + esc(x.name) + "</option>"; }
  var pick = branchWanted && state.branches.some(function (x) { return x.name === branchWanted; })
    ? branchWanted
    : (locals.find(function (x) { return x.current; }) || locals[0] || state.branches[0] || {}).name;
  bs.value = pick || "";
  await loadCommits(0, commitWanted);
}

async function loadCommits(skip, commitWanted) {
  if (state.loading) return; state.loading = true;
  state.branch = $("branchSel").value || null;
  writeHash();
  var list = $("commitList");
  if (skip === 0) { state.commits = []; list.innerHTML = '<div class="diff-empty">Loading…</div>'; }
  $("moreBtn").hidden = true;
  try {
    var data = await api("/api/repo/" + encodeURIComponent(state.repo) + "/log?branch=" + encodeURIComponent(state.branch || "HEAD") + "&skip=" + skip);
    if (skip === 0) state.commits = []; else removeGhost();
    state.commits = state.commits.concat(data.commits);
    state.hasMore = data.hasMore;
    renderCommits();
    if (skip === 0) {
      var target = commitWanted && data.commits.some(function (c) { return c.sha === commitWanted; })
        ? commitWanted : (data.commits[0] ? data.commits[0].sha : null);
      if (target) selectCommit(target);
      else mainEmpty("∅", "No commits on this branch", "This branch has no commits yet.");
    }
  } catch (e) {
    list.innerHTML = '<div class="diff-empty">' + esc(e.message) + "</div>";
  } finally {
    state.loading = false;
    $("moreBtn").hidden = !state.hasMore;
  }
}
function removeGhost() { /* placeholder for future skeleton rows */ }

function renderCommits() {
  var q = state.filter.trim().toLowerCase();
  var items = state.commits.filter(function (c) {
    return !q || (c.subject + " " + c.author + " " + c.shortSha).toLowerCase().indexOf(q) >= 0;
  });
  $("commitList").innerHTML = items.map(function (c) {
    var on = state.commit && state.commit.sha === c.sha ? " on" : "";
    var mp = c.parents > 1 ? ' <span class="c-parents" title="merge commit">·merge</span>' : "";
    return '<button class="commit' + on + '" data-sha="' + esc(c.sha) + '">' +
      '<div class="c-subject">' + esc(c.subject) + "</div>" +
      '<div class="c-meta"><span class="c-sha">' + esc(c.shortSha) + "</span>" +
      '<span class="c-author">' + esc(c.author) + "</span>" + mp +
      '<span class="c-time">' + esc(relTime(c.date)) + "</span></div></button>";
  }).join("") || '<div class="diff-empty">No commits match.</div>';
}

async function selectCommit(sha) {
  if (!sha) return;
  state.commit = null; state.files = []; state.fileSel = null;
  renderCommits();
  var main = $("main");
  main.innerHTML = '<div class="empty"><div><div class="big">…</div><p>Loading commit…</p></div></div>';
  var detail;
  try {
    detail = await api("/api/repo/" + encodeURIComponent(state.repo) + "/commit/" + encodeURIComponent(sha));
  } catch (e) {
    mainEmpty("⚠️", "Failed to load commit", esc(e.message));
    return;
  }
  state.commit = detail;
  state.files = detail.files;
  state.fileSel = detail.files.length ? detail.files[0].path : null;
  writeHash();
  renderDetail();
  renderCommits();
}

function renderDetail() {
  var d = state.commit;
  if (!d) return;
  var chips = "";
  if (d.filesChanged != null) chips += '<span class="chip"><b>' + d.filesChanged + "</b> files</span>";
  if (d.additions != null) chips += '<span class="chip add">+<b>' + d.additions + "</b></span>";
  if (d.deletions != null) chips += '<span class="chip del">−<b>' + d.deletions + "</b></span>";
  var mergeNote = d.isMerge ? '<div class="merge-note">Merge commit — diff is shown against the first parent.</div>' : "";
  $("main").innerHTML =
    '<div class="detail">' +
    '<div class="d-head">' +
    '<h1 class="d-subject">' + esc(d.subject) + "</h1>" +
    (d.body ? '<div class="d-body">' + esc(d.body) + "</div>" : "") +
    '<div class="d-meta">' +
    '<span class="avatar" title="' + esc(d.author) + '">' + esc(initials(d.author)) + "</span>" +
    "<span><b>" + esc(d.author) + "</b> · " + esc(fullTime(d.date)) + "</span>" +
    '<span class="chip sha-chip" id="shaChip" title="click to copy">' + esc(d.shortSha) + "</span>" +
    chips + "</div>" + mergeNote + "</div>" +
    '<div class="ftabs" id="ftabs"></div>' +
    '<div class="diffbox" id="diffbox"></div>' +
    "</div>";
  $("shaChip").onclick = function () { copyText(d.sha, "Commit SHA copied"); };
  renderTabs();
  renderDiff();
}

function renderTabs() {
  var el = $("ftabs");
  if (!el) return;
  var d = state.commit;
  el.innerHTML = state.files.map(function (f) {
    var on = f.path === state.fileSel ? " on" : "";
    var st = f.status === "added" ? "A" : f.status === "deleted" ? "D" : f.status === "renamed" ? "R" : "M";
    var label = f.status === "renamed" ? basename(f.oldPath) + " → " + basename(f.path) : basename(f.path);
    var cnt = "";
    var cached = state.fileCache[f.path];
    if (cached && cached.counts) cnt = '<span class="cnt">+' + cached.counts.additions + " −" + cached.counts.deletions + "</span>";
    var tip = f.status === "renamed" ? f.oldPath + " → " + f.path : f.path;
    return '<button class="ftab' + on + '" data-path="' + esc(f.path) + '" title="' + esc(tip) + '">' +
      '<span class="st ' + st + '">' + st + '</span><span class="fp">' + esc(label) + "</span>" + cnt + "</button>";
  }).join("") || '<div class="diff-empty">No files changed.</div>';
  Array.prototype.forEach.call(el.querySelectorAll(".ftab"), function (b) {
    b.onclick = function () { state.fileSel = b.getAttribute("data-path"); renderTabs(); renderDiff(); };
  });
}

async function renderDiff() {
  var box = $("diffbox");
  if (!box) return;
  var d = state.commit;
  var f = state.files.find(function (x) { return x.path === state.fileSel; });
  if (!f) { box.innerHTML = '<div class="diff-empty">No file selected.</div>'; return; }

  var pathLabel = f.status === "renamed" ? esc(f.oldPath) + " → " + esc(f.path) : esc(f.path);
  var head = '<div class="diffpath"><span class="full">' + pathLabel + '</span>' +
    '<button class="ibtn" id="copyPath" title="copy path" aria-label="copy path"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M11 5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5.5A1.5 1.5 0 0 0 4 11h1"/></svg></button></div>';

  var cached = state.fileCache[f.path];
  if (cached && cached.hunks) {
    box.innerHTML = head + diffHtml(cached);
    bindDiffButtons(f);
    return;
  }

  if (f.binary) {
    box.innerHTML = head + '<div class="binary-note">Binary file — diff not shown.</div>';
    return;
  }

  box.innerHTML = head + '<div class="diff-empty">Loading diff…</div>';
  var data;
  try {
    var url = "/api/repo/" + encodeURIComponent(state.repo) + "/commit/" + encodeURIComponent(d.sha) + "/diff?file=" + encodeURIComponent(f.path);
    data = await api(url);
  } catch (e) {
    box.innerHTML = head + '<div class="diff-empty">Failed to load diff: ' + esc(e.message) + "</div>";
    return;
  }
  if (state.fileSel !== f.path) return; // user switched while loading
  state.fileCache[f.path] = data;
  renderTabs();
  box.innerHTML = head + diffHtml(data);
  bindDiffButtons(f);
}

function bindDiffButtons(f) {
  var b = $("copyPath");
  if (b) b.onclick = function () { copyText(f.path, "Path copied"); };
}

function diffHtml(fd) {
  if (fd.tooLarge) {
    return '<div class="diff-empty">This diff is too large to render (' + Math.round(fd.bytes / 1024) + " KB). Try:\n" +
      "<code>git diff " + esc(fd.base || "") + " " + esc(fd.sha || "") + " -- " + esc(fd.file || "") + "</code></div>";
  }
  if (!fd.hunks || !fd.hunks.length) {
    if (fd.binary) return '<div class="binary-note">Binary file — diff not shown.</div>';
    return '<div class="diff-empty">No textual changes (mode change only, or empty file).</div>';
  }
  var html = ['<div class="diff">'];
  fd.hunks.forEach(function (h) {
    html.push('<div class="hunk-head">@@ -' + h.oldStart + "," + h.oldCount + " +" + h.newStart + "," + h.newCount + " @@</div>");
    h.rows.forEach(function (r) {
      var cls = r.paired ? "r-pair" : r.oldText === null ? "r-add" : r.newText === null ? "r-del" : "r-ctx";
      if (r.oldText === null && r.newText === null) cls = "r-gap";
      var oldCell, newCell;
      if (r.paired && r.oldText !== r.newText) {
        var sp = wordSpans(r.oldText, r.newText);
        if (sp) {
          oldCell = esc(sp.aPre) + "<mark class=\"w-del\">" + esc(sp.aMid) + "</mark>" + esc(sp.aSuf);
          newCell = esc(sp.bPre) + "<mark class=\"w-add\">" + esc(sp.bMid) + "</mark>" + esc(sp.bSuf);
        } else {
          oldCell = esc(r.oldText); newCell = esc(r.newText);
        }
      } else {
        oldCell = r.oldText === null ? "" : esc(r.oldText);
        newCell = r.newText === null ? "" : esc(r.newText);
      }
      html.push('<div class="no no-o ' + cls + '">' + (r.oldNo == null ? "" : r.oldNo) + "</div>");
      html.push('<div class="code old ' + cls + '">' + oldCell + "</div>");
      html.push('<div class="no no-n ' + cls + '">' + (r.newNo == null ? "" : r.newNo) + "</div>");
      html.push('<div class="code new ' + cls + '">' + newCell + "</div>");
    });
  });
  html.push("</div>");
  return '<div class="diff-scroll">' + html.join("") + "</div>";
}

/* Token-based common prefix/suffix split for word-level highlighting. */
var TOK_RE = /[A-Za-z0-9_]+|\s+|[^\sA-Za-z0-9_]/g;
function wordSpans(a, b) {
  var ta = a.match(TOK_RE), tb = b.match(TOK_RE);
  if (!ta || !tb) return null;
  var pre = 0;
  while (pre < ta.length && pre < tb.length && ta[pre] === tb[pre]) pre++;
  var suf = 0;
  while (suf < ta.length - pre && suf < tb.length - pre && ta[ta.length - 1 - suf] === tb[tb.length - 1 - suf]) suf++;
  var aMid = ta.slice(pre, ta.length - suf).join("");
  var bMid = tb.slice(pre, tb.length - suf).join("");
  if (aMid === bMid) return null;
  return {
    aPre: ta.slice(0, pre).join(""), aMid: aMid, aSuf: ta.slice(ta.length - suf).join(""),
    bPre: tb.slice(0, pre).join(""), bMid: bMid, bSuf: tb.slice(tb.length - suf).join("")
  };
}

function copyText(text, msg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast(msg); }, function () { fallbackCopy(text, msg); });
  } else fallbackCopy(text, msg);
}
function fallbackCopy(text, msg) {
  var ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); toast(msg); } catch (e) { toast("Copy failed"); }
  document.body.removeChild(ta);
}

function mainEmpty(big, title, bodyHtml) {
  $("main").innerHTML = '<div class="empty"><div><div class="big">' + big + "</div><h2>" + esc(title) + "</h2><p>" + bodyHtml + "</p></div></div>";
}

function bindChrome() {
  $("repoSel").onchange = function () { openRepo(this.value, null, null); };
  $("branchSel").onchange = function () { loadCommits(0, null); };
  $("refreshBtn").onclick = function () {
    if (state.repo) openRepo(state.repo, state.branch, state.commit ? state.commit.sha : null);
    else boot();
  };
  $("filter").oninput = function () { state.filter = this.value; renderCommits(); };
  $("moreBtn").onclick = function () { loadCommits(state.commits.length, null); };
  $("commitList").onclick = function (e) {
    var btn = e.target.closest(".commit");
    if (btn) selectCommit(btn.getAttribute("data-sha"));
  };
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var idx = state.commits.findIndex(function (c) { return state.commit && c.sha === state.commit.sha; });
    if (e.key === "j" || e.key === "k") {
      var next = e.key === "j" ? idx + 1 : idx - 1;
      if (next < 0) next = 0;
      if (next >= state.commits.length) {
        if (state.hasMore && !state.loading) loadCommits(state.commits.length, null);
        next = state.commits.length - 1;
      }
      var c = state.commits[next];
      if (c) { selectCommit(c.sha); scrollCommitIntoView(c.sha); e.preventDefault(); }
    }
  });
  window.addEventListener("hashchange", function () {
    var h = readHash();
    if (h.r && h.r !== state.repo) {
      var r = state.repos.find(function (x) { return x.id === h.r; });
      if (r) { $("repoSel").value = r.id; openRepo(r.id, h.b, h.c); }
    } else if (h.c && (!state.commit || h.c !== state.commit.sha)) {
      if (state.commits.some(function (c) { return c.sha === h.c; })) selectCommit(h.c);
    }
  });
}
function scrollCommitIntoView(sha) {
  var el = document.querySelector('.commit[data-sha="' + sha + '"]');
  if (el) el.scrollIntoView({ block: "nearest" });
}

boot();
`;
