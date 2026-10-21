/**
 * The single-page UI: one self-contained HTML document with inline CSS and JS.
 * No build step, no static assets — the server renders this string as-is.
 * Visual reference: Linear / GitHub — hairline
 * borders, one cool accent, and diff rows that read like paper tape.
 */

export function renderPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<script>try{var d=document.documentElement;d.setAttribute("data-theme",localStorage.getItem("revision-theme")==="dark"?"dark":"light");d.classList.toggle("side-collapsed",localStorage.getItem("revision-side")==="collapsed")}catch(e){document.documentElement.setAttribute("data-theme","light")}</script>
<title>revision</title>
<style>${CSS}</style>
</head>
<body>
<header class="top">
  <div class="brand"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="4.5" cy="3.5" r="1.8"/><circle cx="4.5" cy="12.5" r="1.8"/><circle cx="11.5" cy="8" r="1.8"/><path d="M4.5 5.3v5.4M6 4.2l3.2 2.8M6 11.8l3.2-2.8"/></svg><span>revision</span></div>
  <div class="dd" id="repoDd">
    <button class="dd-btn" id="repoDdBtn" aria-haspopup="listbox" aria-expanded="false"><span class="dd-text">Repository</span><svg class="dd-caret" viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg></button>
    <div class="dd-menu" id="repoDdMenu" hidden>
      <input class="dd-search" id="repoDdSearch" type="search" placeholder="Filter repositories" autocomplete="off" spellcheck="false">
      <div class="dd-list" id="repoDdList" role="listbox"></div>
    </div>
  </div>
  <div class="dd" id="branchDd">
    <button class="dd-btn" id="branchDdBtn" aria-haspopup="listbox" aria-expanded="false"><span class="dd-text">Branch</span><svg class="dd-caret" viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg></button>
    <div class="dd-menu" id="branchDdMenu" hidden>
      <input class="dd-search" id="branchDdSearch" type="search" placeholder="Filter branches" autocomplete="off" spellcheck="false">
      <div class="dd-list" id="branchDdList" role="listbox"></div>
    </div>
  </div>
  <div class="sp"></div>
  <button id="themeBtn" class="ibtn" title="Toggle theme" aria-label="toggle theme"></button>
  <button id="refreshBtn" class="ibtn" title="Refresh" aria-label="refresh"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3"/></svg></button>
</header>
<div class="body">
  <aside class="side">
    <div class="side-head">
      <div class="side-head-row"><span id="sideTitle">Commits</span><button class="ibtn sm" id="collapseSide" title="Hide commit list" aria-label="hide commit list"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 3.5L5 8l4.5 4.5"/></svg></button></div>
      <input id="filter" type="search" placeholder="Filter loaded commits" autocomplete="off" spellcheck="false">
    </div>
    <div id="commitList" class="commits"></div>
    <button id="moreBtn" class="more" hidden>Load more</button>
  </aside>
  <div class="rail" id="rail">
    <button class="ibtn" id="expandSide" title="Show commit list" aria-label="show commit list"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 3.5L11 8l-4.5 4.5"/></svg></button>
    <span class="rail-label">Commits</span>
  </div>
  <main class="main" id="main"></main>
</div>
<div class="toast" id="toast" role="status"></div>
<script>${JS}</script>
</body>
</html>`;
}

const CSS = `
:root {
  /* light theme (default). Palette follows GitHub Light. */
  --bg: #ffffff;
  --panel: #f6f8fa;
  --panel-2: #eceff3;
  --panel-3: #e2e7ed;
  --border: #d1d9e0;
  --border-soft: #e5e9ef;
  --border-hover: #b9c2cc;
  --text: #1f2328;
  --text-2: #59636e;
  --text-3: #8b949e;
  --accent: #0969da;
  --accent-dim: rgba(9, 105, 218, 0.10);
  --add-bg: rgba(26, 127, 55, 0.10);
  --add-num: #1a7f37;
  --del-bg: rgba(207, 34, 46, 0.10);
  --del-num: #cf222e;
  --add-word: rgba(26, 127, 55, 0.30);
  --del-word: rgba(207, 34, 46, 0.26);
  --scrollbar: #cfd6de;
}

[data-theme="dark"] {
  --bg: #0c0e12;
  --panel: #12151b;
  --panel-2: #161a21;
  --panel-3: #1b2029;
  --border: #232833;
  --border-soft: #1b202a;
  --border-hover: #2e3542;
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
  --scrollbar: #262c38;
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
::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 6px; border: 2px solid var(--bg); }
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
/* ---------- custom dropdown ---------- */
.dd { position: relative; }
.dd-btn {
  display: inline-flex; align-items: center; gap: 7px;
  height: 30px; padding: 0 10px; max-width: 220px;
  background: var(--panel-2); color: var(--text);
  border: 1px solid var(--border); border-radius: 8px;
  font: 500 12.5px var(--sans); cursor: pointer;
}
.dd-btn:hover { border-color: var(--border-hover); }
.dd-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.dd-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dd-caret { color: var(--text-3); flex: none; transition: transform 0.15s ease; }
.dd.open .dd-caret { transform: rotate(180deg); }
.dd-menu[hidden] { display: none; }
.dd-menu {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 40;
  min-width: 100%; width: max-content; max-width: 360px;
  background: var(--panel-2); border: 1px solid var(--border); border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28); padding: 6px;
  display: flex; flex-direction: column;
}
.dd-search {
  height: 28px; padding: 0 9px; margin-bottom: 4px; flex: none;
  background: var(--bg); border: 1px solid var(--border); border-radius: 7px;
  color: var(--text); font: 500 12.5px var(--sans); outline: none;
}
.dd-search:focus { border-color: var(--accent); }
.dd-list { max-height: 300px; overflow-y: auto; }
.dd-head { padding: 7px 9px 2px; font: 700 10px var(--sans); text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-3); }
.dd-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 6px 9px; border: 0; background: transparent; color: var(--text-2);
  border-radius: 7px; cursor: pointer; font: 500 12.5px var(--sans);
  text-align: left; white-space: nowrap;
}
.dd-item:hover, .dd-item.hi { background: var(--accent-dim); color: var(--text); }
.dd-item.on { box-shadow: inset 2px 0 0 var(--accent); color: var(--text); }
.dd-sub { margin-left: auto; padding-left: 16px; color: var(--text-3); font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
.dd-empty { padding: 12px; color: var(--text-3); font-size: 12px; text-align: center; }
.sp { flex: 1; }
.ibtn {
  display: grid; place-items: center;
  width: 32px; height: 32px;
  background: var(--panel-2); color: var(--text-2);
  border: 1px solid var(--border); border-radius: 8px; cursor: pointer;
}
.ibtn:hover { color: var(--text); border-color: var(--border-hover); }

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
.side-head-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.side-head-row span { margin-bottom: 0; }
.ibtn.sm { width: 24px; height: 24px; border-radius: 6px; }
.rail { display: none; width: 42px; flex: none; flex-direction: column; align-items: center; gap: 10px; padding: 10px 0; background: var(--panel); border-right: 1px solid var(--border); }
html.side-collapsed .rail { display: flex; }
html.side-collapsed .side { display: none; }
.rail-label { writing-mode: vertical-rl; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-3); }
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
.main { flex: 1; min-width: 0; overflow: hidden; background: var(--bg); display: flex; flex-direction: column; }
.empty { flex: 1; min-height: 0; display: grid; place-items: center; color: var(--text-3); text-align: center; padding: 40px; }
.empty .big { font-size: 46px; margin-bottom: 14px; opacity: 0.5; }
.empty h2 { font-size: 15px; color: var(--text-2); margin-bottom: 6px; }
.empty p { font-size: 13px; max-width: 420px; line-height: 1.6; }
code.k { font: 12px var(--mono); background: var(--panel-3); border: 1px solid var(--border); border-radius: 5px; padding: 1px 6px; color: var(--text-2); }

.detail { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 18px; }
.d-head { margin-bottom: 16px; }
.d-subject { font-size: 20px; font-weight: 650; line-height: 1.3; word-break: break-word; }
.d-head { flex: none; }
.d-body { margin-top: 10px; max-height: 26vh; overflow-y: auto; color: var(--text-2); font-size: 13px; white-space: pre-wrap; word-break: break-word; border-left: 2px solid var(--border); padding-left: 12px; }
.d-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 12px; font-size: 12.5px; color: var(--text-2); }
.avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--panel-3); color: var(--accent); display: grid; place-items: center; font: 700 10px var(--sans); flex: none; }
.chip { display: inline-flex; align-items: center; gap: 5px; background: var(--panel-2); border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; font: 500 12px var(--sans); color: var(--text-2); }
.chip b { font-weight: 650; color: var(--text); }
.chip.add b { color: var(--add-num); }
.chip.del b { color: var(--del-num); }
.chip.sha-chip { font-family: var(--mono); font-size: 11.5px; cursor: pointer; }
.chip.sha-chip:hover { border-color: var(--border-hover); color: var(--text); }
.merge-note { margin-top: 10px; font-size: 12px; color: #d29922; background: rgba(210, 153, 34, 0.08); border: 1px solid rgba(210, 153, 34, 0.25); border-radius: 8px; padding: 7px 11px; display: inline-block; }

/* ---------- file tree ---------- */
.d-split { flex: 1; min-height: 0; display: flex; }
.ftree {
  width: 264px; flex: none; min-height: 0;
  display: flex; flex-direction: column;
  background: var(--panel);
  border: 1px solid var(--border); border-right: 0;
  border-radius: 10px 0 0 10px;
  padding: 6px;
}
.ftree-search {
  flex: none; height: 28px; padding: 0 8px; margin-bottom: 6px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 7px;
  color: var(--text); font: 500 12px var(--sans); outline: none;
}
.ftree-search:focus { border-color: var(--accent); }
.ftree-body { flex: 1; min-height: 0; overflow-y: auto; }
.t-row {
  display: flex; align-items: center; gap: 7px; width: 100%;
  text-align: left; background: transparent; color: var(--text-2);
  border: 0; border-radius: 7px; padding: 4px 8px; cursor: pointer;
  font: 500 12.5px var(--sans); white-space: nowrap; min-width: 0;
}
.t-row:hover { background: var(--panel-2); color: var(--text); }
.t-file.on { background: var(--accent-dim); color: var(--text); box-shadow: inset 2px 0 0 var(--accent); }
.t-dir { color: var(--text); font-weight: 600; }
.tw { display: grid; place-items: center; width: 12px; flex: none; color: var(--text-3); transition: transform 0.12s ease; }
.tw svg { display: block; }
.t-dir.open .tw { transform: rotate(90deg); }
.t-name { overflow: hidden; text-overflow: ellipsis; flex: 1 1 auto; }
.t-cnt { margin-left: auto; font: 500 11px var(--mono); color: var(--text-3); flex: none; }
.t-cnt .ca { color: var(--add-num); }
.t-cnt .cd { color: var(--del-num); }
.st { font: 700 10px var(--mono); width: 15px; height: 15px; border-radius: 4px; display: inline-grid; place-items: center; flex: none; }
.st.A { color: var(--add-num); background: var(--add-bg); }
.st.M { color: var(--accent); background: var(--accent-dim); }
.st.D { color: var(--del-num); background: var(--del-bg); }
.st.R { color: #d2a8ff; background: rgba(210, 168, 255, 0.12); }
.st.U { color: var(--text-3); background: var(--panel-3); }

/* ---------- diff ---------- */
.diffbox {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 0 10px 10px 0;
  overflow: hidden;
}
.diffpath { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); font: 500 12.5px var(--mono); color: var(--text-2); }
.diffpath .full { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.diffpath .ibtn { width: 26px; height: 26px; margin-left: auto; flex: none; }
.diffpath { flex: none; }
.diff-scroll { flex: 1; min-height: 0; overflow: auto; font: 12.5px/20px var(--mono); }
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
  .main { overflow-y: auto; }
  .detail { display: block; padding: 16px 14px 40px; }
  .diffbox { display: block; }
  .diff-scroll { max-height: none; }
  .code { min-width: 38ch; }
  .d-split { flex-direction: column; }
  .ftree { width: 100%; max-height: 220px; border-right: 1px solid var(--border); border-bottom: 0; border-radius: 10px 10px 0 0; }
  .diffbox { border-radius: 0 0 10px 10px; }
  html.side-collapsed .side { display: flex; }
  html.side-collapsed .rail { display: none; }
}
`;

const JS = String.raw`
"use strict";
var $ = function (id) { return document.getElementById(id); };
var ICON_SUN = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3.2"/><path d="M8 1.6v1.7M8 12.7v1.7M1.6 8h1.7M12.7 8h1.7M3.5 3.5l1.2 1.2M11.3 11.3l1.2 1.2M12.5 3.5l-1.2 1.2M4.7 11.3l-1.2 1.2"/></svg>';
var ICON_MOON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z"/></svg>';
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("revision-theme", t); } catch (e) { /* storage unavailable */ }
  var btn = $("themeBtn");
  if (btn) btn.innerHTML = t === "dark" ? ICON_SUN : ICON_MOON;
  btn.title = t === "dark" ? "Switch to light theme" : "Switch to dark theme";
}
function toggleTheme() {
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
}
function toggleSide() {
  var c = !document.documentElement.classList.contains("side-collapsed");
  document.documentElement.classList.toggle("side-collapsed", c);
  try { localStorage.setItem("revision-side", c ? "collapsed" : "open"); } catch (e) { /* storage unavailable */ }
}
/* Access token: the server prints a URL of the form /?token=<secret> at startup.
   The page keeps it in the query string and forwards it as a Bearer header on
   every API call, so it never needs to live in sessionStorage or a cookie. */
var TOKEN = new URLSearchParams(location.search).get("token") || "";
/* ---------------- custom dropdown ---------------- */
var ddClosers = [];
function closeAllDd() { ddClosers.forEach(function (fn) { fn(); }); }

function createDropdown(rootId, opts) {
  var root = $(rootId);
  var btn = root.querySelector(".dd-btn");
  var menu = root.querySelector(".dd-menu");
  var search = root.querySelector(".dd-search");
  var list = root.querySelector(".dd-list");
  var text = root.querySelector(".dd-text");
  var items = [], filtered = [], hi = -1, current = null;

  function scrollHi() {
    var el = list.querySelector(".dd-item.hi");
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }
  function renderList() {
    if (!filtered.length) { list.innerHTML = '<div class="dd-empty">No matches</div>'; return; }
    var lastGroup = null;
    list.innerHTML = filtered.map(function (it, i) {
      var head = "";
      if (it.group && it.group !== lastGroup) { head = '<div class="dd-head">' + esc(it.group) + "</div>"; lastGroup = it.group; }
      var cls = "dd-item" + (current != null && it.value === current ? " on" : "") + (i === hi ? " hi" : "");
      var sub = it.sub ? '<span class="dd-sub">' + esc(it.sub) + "</span>" : "";
      return head + '<button type="button" class="' + cls + '" data-i="' + i + '" role="option">' + esc(it.label) + sub + "</button>";
    }).join("");
  }
  function applyFilter() {
    var q = search.value.trim().toLowerCase();
    filtered = !q ? items.slice() : items.filter(function (it) {
      return it.label.toLowerCase().indexOf(q) >= 0 || (it.sub || "").toLowerCase().indexOf(q) >= 0 || (it.group || "").toLowerCase().indexOf(q) >= 0;
    });
    hi = -1;
    if (current != null) {
      for (var i = 0; i < filtered.length; i++) { if (filtered[i].value === current) { hi = i; break; } }
    }
    if (hi < 0) hi = filtered.length ? 0 : -1;
    renderList();
  }
  function openMenu() {
    closeAllDd();
    menu.hidden = false;
    root.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    search.value = "";
    applyFilter();
    scrollHi();
    setTimeout(function () { search.focus(); }, 0);
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    root.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }
  function pick(it) {
    if (!it) return;
    current = it.value;
    text.textContent = it.label;
    closeMenu();
    if (opts.onPick) opts.onPick(it.value, it);
  }
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (menu.hidden) openMenu(); else closeMenu();
  });
  btn.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeMenu(); e.preventDefault(); }
    else if (menu.hidden && (e.key === "ArrowDown" || e.key === "Enter")) { openMenu(); e.preventDefault(); }
  });
  search.addEventListener("input", applyFilter);
  search.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { hi = Math.min(hi + 1, filtered.length - 1); renderList(); scrollHi(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { hi = Math.max(hi - 1, 0); renderList(); scrollHi(); e.preventDefault(); }
    else if (e.key === "Enter") { pick(filtered[hi]); e.preventDefault(); }
    else if (e.key === "Escape") { closeMenu(); btn.focus(); e.preventDefault(); }
  });
  list.addEventListener("click", function (e) {
    var b = e.target.closest(".dd-item");
    if (!b) return;
    pick(filtered[parseInt(b.getAttribute("data-i"), 10)]);
  });
  list.addEventListener("mousemove", function (e) {
    var b = e.target.closest(".dd-item");
    if (!b) return;
    var i = parseInt(b.getAttribute("data-i"), 10);
    if (i !== hi) { hi = i; renderList(); }
  });
  document.addEventListener("click", function (e) {
    if (!root.contains(e.target)) closeMenu();
  });
  ddClosers.push(closeMenu);
  return {
    setItems: function (arr) { items = arr.slice(); },
    setValue: function (v, labelText) { current = v; text.textContent = labelText != null ? labelText : v; },
    getValue: function () { return current; },
    close: closeMenu
  };
}

var repoDd = createDropdown("repoDd", {
  onPick: function (v) { openRepo(v, null, null); }
});
var branchDd = createDropdown("branchDd", {
  onPick: function (v) { state.branch = v; loadCommits(0, null); loadWork(); }
});

var state = {
  repos: [], repo: null, branches: [], branch: null,
  commits: [], hasMore: false, loading: false,
  commit: null, files: [], fileSel: null, fileCache: {}, filter: "",
  work: null, view: "commit", treeOpen: {}, fileQuery: ""
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
  repoDd.setItems(state.repos.map(function (r) { return { value: r.id, label: r.name, sub: r.path }; }));
  if (!state.repos.length) {
    repoDd.setValue("", "(no repos)");
    mainEmpty("⎇", "No git repositories", 'No git repos found in the target directory. Start the server pointing at the directory that contains them: <code class="k">revision /path/to/parent</code>.');
    return;
  }
  var h = readHash();
  var start = state.repos.find(function (r) { return r.id === h.r; }) || state.repos[0];
  repoDd.setValue(start.id, start.name);
  await openRepo(start.id, h.b || null, h.c || null);
}

async function openRepo(id, branchWanted, commitWanted) {
  state.repo = id; state.fileCache = {}; state.commits = []; state.commit = null; state.fileSel = null; state.work = null; state.view = "commit"; state.treeOpen = {};
  writeHash();
  try {
    var b = await api("/api/repo/" + encodeURIComponent(id) + "/branches");
    state.branches = b.branches;
  } catch (e) { toast(e.message); state.branches = []; }
  var locals = state.branches.filter(function (x) { return !x.remote; });
  var remotes = state.branches.filter(function (x) { return x.remote; });
  var bitems = [];
  locals.forEach(function (x) { bitems.push({ value: x.name, label: x.name, group: "Local" }); });
  remotes.forEach(function (x) { bitems.push({ value: x.name, label: x.name, group: "Remote" }); });
  branchDd.setItems(bitems);
  var pick = branchWanted && state.branches.some(function (x) { return x.name === branchWanted; })
    ? branchWanted
    : (locals.find(function (x) { return x.current; }) || locals[0] || state.branches[0] || {}).name;
  state.branch = pick || null;
  branchDd.setValue(pick || "", pick || "(no branches)");
  await loadCommits(0, commitWanted);
  loadWork();
}

async function loadCommits(skip, commitWanted) {
  if (state.loading) return; state.loading = true;
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
  var workRow = "";
  if (!q && state.work && state.work.files && state.work.files.length) {
    var won = state.view === "work" ? " on" : "";
    var wn = state.work.files.length;
    workRow = '<button class="commit work' + won + '" data-work="1"><div class="c-subject">Working tree</div>' +
      '<div class="c-meta"><span class="c-sha">&#9679;</span><span class="c-author">' + wn + " uncommitted file" + (wn === 1 ? "" : "s") + "</span></div></button>";
  }
  var items = state.commits.filter(function (c) {
    return !q || (c.subject + " " + c.author + " " + c.shortSha).toLowerCase().indexOf(q) >= 0;
  });
  $("commitList").innerHTML = workRow + items.map(function (c) {
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
  state.view = "commit";
  state.commit = null; state.files = []; state.fileSel = null; state.fileCache = {}; state.treeOpen = {}; state.fileQuery = "";
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

async function loadWork() {
  state.work = null;
  if (!state.repo) return;
  try {
    state.work = await api("/api/repo/" + encodeURIComponent(state.repo) + "/work");
  } catch (e) {
    state.work = null;
  }
  renderCommits();
}

async function selectWork() {
  if (!state.repo) return;
  state.view = "work";
  state.commit = null; state.fileCache = {}; state.files = []; state.fileSel = null; state.treeOpen = {}; state.fileQuery = "";
  renderCommits();
  try {
    if (!state.work) state.work = await api("/api/repo/" + encodeURIComponent(state.repo) + "/work");
  } catch (e) {
    mainEmpty("&#9888;&#65039;", "Failed to load working tree status", esc(e.message));
    return;
  }
  var files = (state.work.files || []).map(function (f) {
    var st = "modified";
    if (f.untracked) st = "untracked";
    else if (f.code.indexOf("D") !== -1) st = "deleted";
    else if (f.code.indexOf("R") !== -1 || f.code.indexOf("C") !== -1) st = "renamed";
    else if (f.code.indexOf("A") !== -1) st = "added";
    return { path: f.path, oldPath: f.oldPath || undefined, status: st, binary: f.binary, additions: f.additions, deletions: f.deletions };
  });
  if (!files.length) { mainEmpty("&#10003;", "No uncommitted changes", "The working tree is clean."); return; }
  state.files = files;
  state.fileSel = files[0].path;
  renderWorkDetail();
  renderCommits();
}

function renderWorkDetail() {
  var adds = 0, dels = 0, hasNums = false;
  (state.work.files || []).forEach(function (f) {
    if (f.additions != null) { adds += f.additions; hasNums = true; }
    if (f.deletions != null) { dels += f.deletions; hasNums = true; }
  });
  var chips = '<span class="chip"><b>' + state.work.files.length + "</b> files</span>";
  if (hasNums) chips += '<span class="chip add">+<b>' + adds + '</b></span><span class="chip del">&#8722;<b>' + dels + "</b></span>";
  $("main").innerHTML =
    '<div class="detail">' +
    '<div class="d-head">' +
    '<h1 class="d-subject">Uncommitted changes</h1>' +
    '<div class="d-meta">' +
    '<span class="avatar" title="working tree">WT</span>' +
    "<span><b>working tree</b> &middot; vs HEAD &middot; " + esc(state.repo) + (state.branch ? " (" + esc(state.branch) + ")" : "") + "</span>" +
    chips + "</div>" +
    '<div class="merge-note">Staged and unstaged changes are shown combined, against HEAD. Untracked files appear as all-new lines.</div></div>' +
    '<div class="d-split">' +
    '<div class="ftree" id="ftree">' +
    '<input id="fileFilter" class="ftree-search" type="search" placeholder="Filter files" autocomplete="off" spellcheck="false">' +
    '<div class="ftree-body" id="ftreeBody"></div>' +
    "</div>" +
    '<div class="diffbox" id="diffbox"></div>' +
    "</div>" +
    "</div>";
  renderTree();
  renderDiff();
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
    '<div class="d-split">' +
    '<div class="ftree" id="ftree">' +
    '<input id="fileFilter" class="ftree-search" type="search" placeholder="Filter files" autocomplete="off" spellcheck="false">' +
    '<div class="ftree-body" id="ftreeBody"></div>' +
    "</div>" +
    '<div class="diffbox" id="diffbox"></div>' +
    "</div>" +
    "</div>";
  $("shaChip").onclick = function () { copyText(d.sha, "Commit SHA copied"); };
  renderTree();
  renderDiff();
}

function fileCounts(f) {
  if (typeof f.additions === "number" && typeof f.deletions === "number") return { a: f.additions, d: f.deletions };
  var cached = state.fileCache[f.path];
  if (cached && cached.counts) return { a: cached.counts.additions, d: cached.counts.deletions };
  return null;
}

function renderTree() {
  var el = $("ftreeBody");
  if (!el) return;
  if (!state.files.length) { el.innerHTML = '<div class="diff-empty">No files changed.</div>'; return; }

  /* filter mode: flattened full-path list of matches */
  var q = (state.fileQuery || "").trim().toLowerCase();
  if (q) {
    var matches = state.files.filter(function (f) { return f.path.toLowerCase().indexOf(q) >= 0; });
    el.innerHTML = matches.length ? matches.map(function (f) {
      var c = fileCounts(f);
      var on = f.path === state.fileSel ? " on" : "";
      var tip = f.status === "renamed" ? f.oldPath + " → " + f.path : f.path;
      return '<button class="t-row t-file' + on + '" data-path="' + esc(f.path) + '" title="' + esc(tip) + '">' +
        '<span class="st ' + badge(f) + '">' + badge(f) + '</span><span class="t-name">' + esc(f.path) + "</span>" + (c ? cntHtml(c) : "") + "</button>";
    }).join("") : '<div class="diff-empty">No files match.</div>';
    Array.prototype.forEach.call(el.querySelectorAll(".t-file"), function (b) {
      b.onclick = function () { state.fileSel = b.getAttribute("data-path"); renderTree(); renderDiff(); };
    });
    return;
  }

  var root = { dirs: {}, files: [], path: "" };
  state.files.forEach(function (f) {
    var parts = f.path.split("/");
    var node = root;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!node.dirs[parts[i]]) node.dirs[parts[i]] = { dirs: {}, files: [], path: parts.slice(0, i + 1).join("/") };
      node = node.dirs[parts[i]];
    }
    node.files.push(f);
  });

  /* auto-open the directory chain leading to the selected file; everything else starts collapsed */
  var chain = {};
  if (state.fileSel) {
    var sp = state.fileSel.split("/");
    for (var i = 1; i < sp.length; i++) chain[sp.slice(0, i).join("/")] = true;
  }

  function agg(n) {
    var a = 0, d = 0, known = false;
    n.files.forEach(function (f) {
      var c = fileCounts(f);
      if (c) { a += c.a; d += c.d; known = true; }
    });
    Object.keys(n.dirs).forEach(function (k) {
      var r = agg(n.dirs[k]);
      a += r.a; d += r.d; known = known || r.known;
    });
    n.adds = a; n.dels = d; n.known = known;
    return { a: a, d: d, known: known };
  }
  agg(root);

  function badge(f) {
    return f.status === "added" ? "A" : f.status === "deleted" ? "D" : f.status === "renamed" ? "R" : f.status === "untracked" ? "U" : "M";
  }
  function cntHtml(c) {
    return '<span class="t-cnt"><span class="ca">+' + c.a + '</span> <span class="cd">−' + c.d + "</span></span>";
  }
  function html(n, depth) {
    var out = "";
    Object.keys(n.dirs).sort().forEach(function (name) {
      var dn = n.dirs[name];
      var open = dn.path in state.treeOpen ? !!state.treeOpen[dn.path] : !!chain[dn.path];
      out += '<button class="t-row t-dir' + (open ? " open" : "") + '" data-dir="' + esc(dn.path) + '" style="padding-left:' + (8 + depth * 14) + 'px">' +
        '<span class="tw"><svg viewBox="0 0 8 8" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5l3.5 2.5L2 6.5"/></svg></span>' +
        '<span class="t-name">' + esc(name) + "</span>" + (dn.known ? cntHtml({ a: dn.adds, d: dn.dels }) : "") + "</button>";
      if (open) out += html(dn, depth + 1);
    });
    n.files.slice().sort(function (a, b) { return a.path < b.path ? -1 : a.path > b.path ? 1 : 0; }).forEach(function (f) {
      var c = fileCounts(f);
      var on = f.path === state.fileSel ? " on" : "";
      var tip = f.status === "renamed" ? f.oldPath + " → " + f.path : f.path;
      out += '<button class="t-row t-file' + on + '" data-path="' + esc(f.path) + '" title="' + esc(tip) + '" style="padding-left:' + (8 + depth * 14) + 'px">' +
        '<span class="st ' + badge(f) + '">' + badge(f) + '</span><span class="t-name">' + esc(basename(f.path)) + "</span>" + (c ? cntHtml(c) : "") + "</button>";
    });
    return out;
  }
  el.innerHTML = html(root, 0);

  Array.prototype.forEach.call(el.querySelectorAll(".t-dir"), function (b) {
    b.onclick = function () {
      var path = b.getAttribute("data-dir");
      var cur = path in state.treeOpen ? !!state.treeOpen[path] : !!chain[path];
      state.treeOpen[path] = !cur;
      renderTree();
    };
  });
  Array.prototype.forEach.call(el.querySelectorAll(".t-file"), function (b) {
    b.onclick = function () {
      state.fileSel = b.getAttribute("data-path");
      renderTree(); renderDiff();
    };
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
    var url = state.view === "work"
      ? "/api/repo/" + encodeURIComponent(state.repo) + "/work/diff?file=" + encodeURIComponent(f.path)
      : "/api/repo/" + encodeURIComponent(state.repo) + "/commit/" + encodeURIComponent(d.sha) + "/diff?file=" + encodeURIComponent(f.path);
    data = await api(url);
  } catch (e) {
    box.innerHTML = head + '<div class="diff-empty">Failed to load diff: ' + esc(e.message) + "</div>";
    return;
  }
  if (state.fileSel !== f.path) return; // user switched while loading
  state.fileCache[f.path] = data;
  renderTree();
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
    return '<div class="diff-empty">No content changes (pure rename, mode change, or empty file).</div>';
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
  applyTheme(document.documentElement.getAttribute("data-theme") || "light");
  $("themeBtn").onclick = toggleTheme;
  $("collapseSide").onclick = toggleSide;
  $("expandSide").onclick = toggleSide;
  $("main").addEventListener("input", function (e) {
    if (e.target && e.target.id === "fileFilter") { state.fileQuery = e.target.value; renderTree(); }
  });
  $("refreshBtn").onclick = function () {
    if (state.repo) openRepo(state.repo, state.branch, state.commit ? state.commit.sha : null);
    else boot();
  };
  $("filter").oninput = function () { state.filter = this.value; renderCommits(); };
  $("moreBtn").onclick = function () { loadCommits(state.commits.length, null); };
  $("commitList").onclick = function (e) {
    var btn = e.target.closest(".commit");
    if (!btn) return;
    if (btn.getAttribute("data-work")) selectWork();
    else selectCommit(btn.getAttribute("data-sha"));
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
      if (r) { repoDd.setValue(r.id, r.name); openRepo(r.id, h.b, h.c); }
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
