/**
 * The single-page UI: one self-contained HTML document with inline CSS and JS.
 * No build step, no static assets — the server renders this string as-is.
 * Visual reference: Linear / GitHub — hairline
 * borders, one cool accent, and diff rows that read like paper tape.
 */

import { HLJS_SRC } from "./hljs.js";
import { BUILD_INFO } from "./build-info.js";

/* Tab icon: brand glyph as a theme-adaptive SVG (accent stroke follows the OS
   light/dark setting), PNG screenshot of the same glyph as fallback for browsers
   without SVG favicon support (Safari < 26). */
const FAVICON_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%230969da' stroke-width='1.8' stroke-linecap='round'%3E%3Cstyle%3E@media (prefers-color-scheme: dark) { svg { stroke: %235b9dff } }%3C/style%3E%3Ccircle cx='4.5' cy='3.5' r='1.8'/%3E%3Ccircle cx='4.5' cy='12.5' r='1.8'/%3E%3Ccircle cx='11.5' cy='8' r='1.8'/%3E%3Cpath d='M4.5 5.3v5.4M6 4.2l3.2 2.8M6 11.8l3.2-2.8'/%3E%3C/svg%3E";
const FAVICON_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAGnUlEQVR4nOxbfWhbVRQ/56VpXoQJcxP9ww/qmkQ3kc2xjTG3CdNNqpv7w4koiLTQNu2G3/iH+Jf+NRSF2aW1MgfOIRTUKVMZBZ0f+1C0G1i2JGXDDxwqijJYXtrmHc9NmjZN8+67ufl62v1o2uTec89757z7cc6vJwbMcxgwzzHvHdAEmmjuSi5FgDsNw14KgDfkWuknm4xRMujz8b3hM/AfAEKZMKPJjQj0Gr9d7iJ6igCfsGKho+BhqDtgVzJgTtp9CNgBZYAIBiw/Pg57QmnwINQcwMYHJ+0vWXwV6IDgm5QfN3jRCUqboDlJ+7SNF0BYndPhPbjOgOZofLsP8H2oAmyb7k0PRD4GD0E+A3aQzyB8GaoENIQuKnvjrSWkDjCvTqxFhCUyGbG++Vff1OtbmShbfou/M7kaPAR5HEDQJuu2AaLp/nB/YVugO77TQNzjNMbno7YJgJPgEUhnABKGJd3vpWOzjRdI90deJ4DDknER8BCkDiCgayWdsqd4gjgA4J/cC3Lvc+PwGvAQXEJhzDj1cJTn7DwbHuINr1APUG6Q5yBfAgi/OffR7aXazZ5kB7tmWQldWfv5dQk8BPkSIDgt6XvA35lYM7cD2p3GCCfwa5PZldgAHoH0TBYGNvnghEwmY9NpRPybLeeQARbwr+WocNIT4aNWf+htaDDkt8qBkLkoGXeKBcTGVmxsqTYnsOgLViz8EjQQ8khwCDM20jOlusR6LmVodq0rbnYs+qIZjb8JDYTSszKjiXdY8OHCNpIMLmcWTOkatszgNnj1+hTUGWq3+dh5M2hOHGPpFfkmFQfkjz4lZxCMcMq8hVPmP0p114qBUn9O7WcXmM34CW9467KXZivRwbJC57DYcf6zmEVDbpfgcOlHmmzanB5cksi31ZqBKi8zyxEjvWzgTr7bFpkDGGN8Q33pTGsfBMZ4AtGnLL7W7RLssH9Y7z2pJhipBwOlmZoSBrqShwwDtpbqtQE/TMdC989q3PFDc3Bx8wHxDty0c0rBf37mm2sFHZTBQGnS4pwmGXDBuZfm9g3dOp6KhR+0CXaDm3ZOKoXxqqdJCQXKDJT+/wVIj9jg9Pk528ZeFdnckarnBXFqBbribW5y+g7gZAA0kR4I7WUu4T5W4H7soeYqBTUGqjYzAN33FuYSDmfAWM96/pIK0pzPVWWgtP8zVA1MxFq/80UTq9ioI07hduEEqAUDVZslQOqZP+cC5yzfFWt4yLFZKoiKQ+qaMFAVLIEq0ht91/1pxSLr+IRI5lkk8ehnLX8XBsqxx4WBqmAGgP7u5IT8lp/VPNu/UgaqgofR0D1gGr2/LDIzlz7iJz5NwtIUjZb3shMDBTmZleCMC5K+xp0CeXCmeRMbf7I4TEaYHaZmGaju5Iri8f6e+Cp21HYn/RxWO7JaAg2dAf7o2EqkzBG+y6ucZPKzQGwJPqDjRjTex9vvxWwfM1Ack/aixOGTgMMggb4DKjwFAtHkNgT7XdYTlAoWrINciIxPFXx2G3pmIrbke5lM3UNhAU6kegygQ6wgqHAh0AWPfFZkJjKZuofCgWhit2GIKM4dudNQz8889qCINt3k9JcAwULnOYgL5zSVmw7b9CvH8i2gAw6XmRNoVxHVrhHiI3u5CyM0w9DsSl5ZNiGSzowWMlCq4GsftdL2Vth380UVee0aIWVKzKYDvNBW87iw2yXmUGIFDBSPb5GPLWCg3sAJUIR2jZCM+c07gMq6CJxKkbEF+lt/L6ERza7kejCInY83FnWe4yxpvzUQ/gI0oE+Lyxzwf6LFdWqEKBvIqnmAl9Kg1R/phAahohohp3hH2Xig5xtpvID0GMzWCBE61ggJQ5nfGwW0BasjvCH4/6UqDmDhRzgFPggNRuU1QgOhYobmLDsh4qxSnPGwWXfTqjaqXiPEz/4VpwFT5TKfecV4garXCPGaHrRLFFbQ1NnITjXBQ3DJBfRqhNjOoekCKZrZLKtPIVUO6R6gUyOU7RMMDRa1zHyWMjT1RtVrhILdY+sqYWjqDekMyNgw3OSDkiUsgoUR9UO+aPwrfjvCHvExQ3Abnw13yKa6G0NTb1RUI1QuBEPD2eEyN5KintCuEdKBCkNTb7gyQuOxyAeCXYEKwTreUmFo6g0lSsxK+TtEDQ/oQjA0TRgFD0KNE9zfYqXG7Y2cuX0NZUIwNDz2Lq9+aUqdFGWKyfIbm9ikpzmwOe8mLhgaG/BJKxO6W5WeagS0a4RqxdDUG16MTuuKy1+ehnmOfwEAAP//r+WQmQAAAAZJREFUAwB6ad4TbuNydgAAAABJRU5ErkJggg==";

export function renderPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<script>try{var d=document.documentElement;d.setAttribute("data-theme",localStorage.getItem("revision-theme")==="dark"?"dark":"light");d.classList.toggle("side-collapsed",localStorage.getItem("revision-side")==="collapsed")}catch(e){document.documentElement.setAttribute("data-theme","light")}</script>
<title>revision</title>
<link rel="icon" type="image/svg+xml" href="${FAVICON_SVG}">
<link rel="icon" href="${FAVICON_PNG}">
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
  <div class="connection" id="connectionStatus" data-state="checking" role="status" aria-live="polite" aria-atomic="true" title="Connecting to server"><span class="connection-dot" aria-hidden="true"></span><span id="connectionText">Connecting</span></div>
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
<footer class="version" aria-label="Build information">Built <time datetime="${BUILD_INFO.buildDate}">${BUILD_INFO.buildDate.slice(0, 10)}</time><span aria-hidden="true">·</span><code title="${BUILD_INFO.commitId}">${BUILD_INFO.commitId.slice(0, 12)}</code></footer>
<div class="toast" id="toast" role="status"></div>
<script>${HLJS_SRC}</script>
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
  --sel: rgba(9, 105, 218, 0.16);   /* selected row: always on, one step above hover */
  --add-bg: rgba(26, 127, 55, 0.10);
  --add-num: #1a7f37;
  --del-bg: rgba(207, 34, 46, 0.10);
  --del-num: #cf222e;
  --add-word: rgba(26, 127, 55, 0.30);
  --del-word: rgba(207, 34, 46, 0.26);
  --scrollbar: #cfd6de;
  /* syntax highlighting tokens (GitHub Light palette) */
  --hl-comment: #6e7781;
  --hl-keyword: #cf222e;
  --hl-string: #0a3069;
  --hl-number: #0550ae;
  --hl-func: #6639ba;
  --hl-type: #953800;
  --hl-name: #116329;
  --hl-attr: #0550ae;
  --hl-symbol: #0550ae;
  --hl-meta: #6e7781;
  /* theme-independent */
  --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --top-h: 52px;

  /* ---------- motion ---------- */
  /* strong ease-out: built-in easings are too weak for deliberate UI motion */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --dur-fast: 120ms;   /* press feedback, exits */
  --dur-base: 160ms;   /* entrances, carets */
  --dur-slow: 200ms;   /* toasts */
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
  --sel: rgba(91, 157, 255, 0.20);   /* selected row: always on, one step above hover */
  --add-bg: rgba(63, 185, 80, 0.10);
  --add-num: #56d364;
  --del-bg: rgba(248, 81, 73, 0.10);
  --del-num: #ff7b72;
  --add-word: rgba(63, 185, 80, 0.32);
  --del-word: rgba(248, 81, 73, 0.32);
  --scrollbar: #262c38;
  --hl-comment: #8b949e;
  --hl-keyword: #ff7b72;
  --hl-string: #a5d6ff;
  --hl-number: #79c0ff;
  --hl-func: #d2a8ff;
  --hl-type: #ffa657;
  --hl-name: #7ee787;
  --hl-attr: #79c0ff;
  --hl-symbol: #79c0ff;
  --hl-meta: #8b949e;
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
.dd-caret { color: var(--text-3); flex: none; transition: transform var(--dur-fast) var(--ease-out); }
.dd.open .dd-caret { transform: rotate(180deg); transition-duration: var(--dur-base); }
.dd-menu[hidden] { display: none; pointer-events: none; opacity: 0; transform: scale(0.96); }
.dd-menu {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 40;
  min-width: 100%; width: max-content; max-width: 360px;
  background: var(--panel-2); border: 1px solid var(--border); border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28); padding: 6px;
  display: flex; flex-direction: column;
  /* grows out of the trigger's corner, not out of its own centre */
  transform-origin: top left;
  opacity: 1;
  transform: scale(1);
  /* exit is the base state: 120ms, allow-discrete keeps it painted while display flips */
  transition:
    opacity var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out),
    display var(--dur-fast) allow-discrete;
}
/* enter: 160ms, and the caret tracks it instead of finishing early */
.dd-menu:not([hidden]) { transition-duration: var(--dur-base); }
@starting-style {
  .dd-menu:not([hidden]) { opacity: 0; transform: scale(0.96); }
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
/* selected row keeps a block of its own, so hovering elsewhere never unmakes it */
.dd-item.on { background: var(--sel); box-shadow: inset 2px 0 0 var(--accent); color: var(--text); }
.dd-sub { margin-left: auto; padding-left: 16px; color: var(--text-3); font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
.dd-empty { padding: 12px; color: var(--text-3); font-size: 12px; text-align: center; }
.sp { flex: 1; }
.connection { display: flex; align-items: center; gap: 7px; flex: none; color: var(--text-2); font-size: 12px; white-space: nowrap; }
.connection-dot { width: 7px; height: 7px; flex: none; border-radius: 50%; background: var(--text-3); }
.connection[data-state="online"] .connection-dot { background: var(--add-num); }
.connection[data-state="offline"] .connection-dot { background: var(--del-num); }
.ibtn {
  display: grid; place-items: center;
  width: 32px; height: 32px;
  background: var(--panel-2); color: var(--text-2);
  border: 1px solid var(--border); border-radius: 8px; cursor: pointer;
}
.ibtn:hover { color: var(--text); border-color: var(--border-hover); }
.ibtn.on { color: var(--accent); border-color: var(--accent); }
html.desktop .desktop-open-folder { flex: none; white-space: nowrap; }
html.desktop .empty .desktop-open-folder { margin-top: 12px; }

/* ---------- layout ---------- */
html.desktop { --revision-side-width: 320px; --revision-ftree-width: 264px; }
.pane-resizer { display: none; }
.body { flex: 1; display: flex; min-height: 0; }
.version {
  height: 26px; flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 6px;
  padding: 0 14px; background: var(--panel); border-top: 1px solid var(--border);
  color: var(--text-3); font-size: 11px;
}
.version code { color: var(--text-2); font: 11px var(--mono); }
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
.commit.on { background: var(--sel); box-shadow: inset 2px 0 0 var(--accent); }
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
.d-head { flex: none; overflow-y: auto; }
.d-head.sized .d-body { max-height: none; }
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
.ftree-body { flex: 1; min-height: 0; overflow: auto; }
.t-row {
  display: flex; align-items: center; gap: 7px;
  text-align: left; background: transparent; color: var(--text-2);
  border: 0; border-radius: 7px; padding: 4px 8px; cursor: pointer;
  font: 500 12.5px var(--sans); white-space: nowrap; width: max-content; min-width: 100%;
}
.t-row:hover { background: var(--panel-2); color: var(--text); }
.t-file.on { background: var(--accent-dim); color: var(--text); box-shadow: inset 2px 0 0 var(--accent); }
.t-dir { color: var(--text); font-weight: 600; }
.tw { display: grid; place-items: center; width: 12px; flex: none; color: var(--text-3); }
.tw svg { display: block; }
.t-dir.open .tw { transform: rotate(90deg); }
.t-name { flex: none; }
.t-cnt { margin-left: auto; padding-left: 14px; font: 500 11px var(--mono); color: var(--text-3); flex: none; }
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
.code.new.r-add:not(.hl) { color: var(--add-num); }
.no-o.r-del, .code.old.r-del { background: var(--del-bg); }
.code.old.r-del:not(.hl) { color: var(--del-num); }
.code.old.r-pair { background: var(--del-bg); }
.code.old.r-pair:not(.hl) { color: var(--del-num); }
.code.new.r-pair { background: var(--add-bg); }
.code.new.r-pair:not(.hl) { color: var(--add-num); }
.code.r-gap { color: var(--text-3); font-style: italic; }
/* collapsed context regions (file head/tail and inter-hunk gaps) */
.gapbar {
  grid-column: 1 / -1;
  display: flex; align-items: center; gap: 8px;
  padding: 2px 12px;
  font: 11px/20px var(--mono); color: var(--text-3);
  background: var(--panel-2);
  border-top: 1px solid var(--border-soft);
  position: sticky; left: 0;
  user-select: none;
}
.gapbar:hover { color: var(--text-2); }
.gapbar .gap-info { flex: none; white-space: nowrap; }
.gapbar .gap-btn {
  font: 10.5px/16px var(--mono); color: var(--text-2);
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 5px; padding: 1px 8px; cursor: pointer;
}
.gapbar .gap-btn:hover { color: var(--text); background: var(--panel-3); }
.gapbar .gap-btn:disabled { opacity: 0.45; cursor: default; }

/* ---------- press feedback ---------- */
.dd-btn, .ibtn, .gapbar .gap-btn, .chip.sha-chip { transition: transform var(--dur-fast) var(--ease-out); }
.dd-btn:active, .ibtn:active, .gapbar .gap-btn:active, .chip.sha-chip:active { transform: scale(0.97); }
mark.w-del { background: var(--del-word); color: inherit; border-radius: 3px; padding: 0 1px; }
mark.w-add { background: var(--add-word); color: inherit; border-radius: 3px; padding: 0 1px; }

/* ---------- syntax highlighting (highlight.js tokens, GitHub palette) ---------- */
.code .hljs-comment, .code .hljs-quote { color: var(--hl-comment); font-style: italic; }
.code .hljs-keyword, .code .hljs-selector-tag { color: var(--hl-keyword); }
.code .hljs-string, .code .hljs-regexp, .code .hljs-doctag { color: var(--hl-string); }
.code .hljs-number, .code .hljs-literal { color: var(--hl-number); }
.code .hljs-title, .code .hljs-title.function_, .code .hljs-section { color: var(--hl-func); }
.code .hljs-title.class_, .code .hljs-title.interface_, .code .hljs-type, .code .hljs-built_in { color: var(--hl-type); }
.code .hljs-name { color: var(--hl-name); }
.code .hljs-attr, .code .hljs-attribute, .code .hljs-variable, .code .hljs-template-variable,
.code .hljs-selector-attr, .code .hljs-selector-class, .code .hljs-selector-id { color: var(--hl-attr); }
.code .hljs-symbol, .code .hljs-bullet, .code .hljs-link { color: var(--hl-symbol); }
.code .hljs-meta, .code .hljs-selector-pseudo { color: var(--hl-meta); }
.code .hljs-emphasis { font-style: italic; }
.code .hljs-strong { font-weight: 700; }
.code .hljs-underline { text-decoration: underline; }
.diff-empty { padding: 40px 20px; text-align: center; color: var(--text-3); font: 13px var(--sans); }
.diff-empty code { font: 12px var(--mono); background: var(--panel-3); padding: 2px 8px; border-radius: 5px; }
.binary-note { padding: 30px 20px; text-align: center; color: var(--text-3); }

/* ---------- toast ---------- */
.toast {
  position: fixed; left: 50%; bottom: 38px; transform: translateX(-50%) translateY(8px);
  background: var(--panel-3); color: var(--text);
  border: 1px solid var(--border); border-radius: 9px;
  padding: 9px 16px; font-size: 13px;
  opacity: 0; pointer-events: none;
  transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out);
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

@media (min-width:901px) {
  html.desktop .side { width: var(--revision-side-width); border-right: 0; }
  html.desktop .ftree { width: var(--revision-ftree-width); }
  html.desktop .diffbox { border-left: 0; }
  html.desktop .pane-resizer.is-vertical {
    display: block; position: relative; flex: 0 0 5px; width: 5px;
    cursor: col-resize; touch-action: none; user-select: none; z-index: 2;
  }
  html.desktop .pane-resizer.is-vertical::before {
    content: ""; position: absolute; top: 0; bottom: 0; left: 2px; width: 1px;
    background: var(--border);
  }
  html.desktop .pane-resizer.is-vertical:hover::before,
  html.desktop .pane-resizer.is-vertical.dragging::before,
  html.desktop .pane-resizer.is-vertical:focus-visible::before { background: var(--accent); }
  html.desktop .pane-resizer.is-vertical:focus-visible { outline: 2px solid var(--accent); outline-offset: -1px; }
  html.desktop.side-collapsed #sideResizer { display: none; }

  /* The split between the commit message and the diff view. Negative margins
     keep the header-to-diff gap at its original 16px. */
  .pane-resizer.is-horizontal {
    display: block; position: relative; flex: 0 0 9px; height: 9px;
    margin: -12px 0 3px;
    cursor: row-resize; touch-action: none; user-select: none; z-index: 2;
  }
  .pane-resizer.is-horizontal::before {
    content: ""; position: absolute; top: 4px; left: 0; right: 0; height: 1px;
    background: var(--border);
  }
  .pane-resizer.is-horizontal:hover::before,
  .pane-resizer.is-horizontal.dragging::before,
  .pane-resizer.is-horizontal:focus-visible::before { background: var(--accent); }
  .pane-resizer.is-horizontal:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: 3px; }
}

@media (max-width: 700px) {
  .top { gap: 6px; padding: 0 8px; }
  .brand { margin-right: 0; }
  .brand span { display: none; }
  .dd-btn { max-width: 140px; }
  .connection { gap: 5px; font-size: 11px; }
}

@keyframes ctx-in { from { opacity: 0; } }
.ctx-in { animation: ctx-in var(--dur-fast) var(--ease-out) both; }

@keyframes spin { to { transform: rotate(360deg); } }
.ibtn.spin svg { animation: spin 400ms linear 1 both; }
@keyframes pulse { 50% { opacity: 0.55; } }
/* .dd-btn has no icon of its own — its only svg IS the caret, whose rotate is
   state, not progress. Fade the trigger instead of fighting that transform. */
.dd-btn.spin { animation: pulse 400ms var(--ease-out) 1 both; }

@keyframes pop-in { from { opacity: 0; transform: scale(0.9); } }
.empty .big.pop { animation: pop-in 220ms var(--ease-out) both; }

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  /* rotation still encodes state; remove the time, keep the end angle */
  .dd-caret, .tw { transition: none; }
  /* dropdown: keep the fade (it is what makes it feel anchored), drop the scale */
  .dd-menu { transition: opacity var(--dur-fast) linear, display var(--dur-fast) allow-discrete; transform: none; }
  .dd-menu:not([hidden]) { transition-duration: var(--dur-fast); }
  .dd-menu[hidden] { transform: none; }
  @starting-style {
    .dd-menu:not([hidden]) { opacity: 0; transform: none; }
  }
  /* toast: keep the fade, drop the 8px slide and the centring transform stays as the rest state */
  .toast { transition: opacity var(--dur-slow) linear; transform: translateX(-50%); }
  .toast.show { transform: translateX(-50%); }
  /* press feedback: keep the click, drop the squeeze */
  .dd-btn:active, .ibtn:active, .gapbar .gap-btn:active, .chip.sha-chip:active { transform: none; }
  /* newly revealed context rows: appear instantly */
  .ctx-in { animation: none; }
  .empty .big.pop { animation: none; }
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
var desktop = window.revisionDesktop || null;
var PANE = {
  side: { key: "revision-side-width", prop: "--revision-side-width", min: 240, max: 420, def: 320 },
  ftree: { key: "revision-ftree-width", prop: "--revision-ftree-width", min: 200, max: 380, def: 264 }
};
var paneWidths = {};
var HEAD = { min: 88, splitMin: 160 };

function openDesktopFolder() {
  if (!desktop) return;
  Promise.resolve().then(function () { return desktop.openFolder(); }).catch(function (e) {
    toast(e && e.message ? e.message : "Unable to open folder");
  });
}
function showNoRepositories() {
  if (!desktop) {
    mainEmpty("⎇", "No git repositories", 'No git repos found in the target directory. Start the server pointing at a repository itself (<code class="k">revision /path/to/repo</code>) or at the directory that contains them (<code class="k">revision /path/to/parent</code>).');
    return;
  }
  mainEmpty("⎇", "No git repositories",
    'Open a Git repository, or a folder whose direct subfolders are Git repositories.' +
    '<br><button type="button" id="emptyOpenFolder" class="dd-btn desktop-open-folder">Open Folder…</button>');
  $("emptyOpenFolder").onclick = openDesktopFolder;
}
function refreshCurrent() {
  return state.repo
    ? openRepo(state.repo, state.branch, state.commit ? state.commit.sha : null)
    : boot();
}
function clampWidth(cfg, value) {
  return Math.min(cfg.max, Math.max(cfg.min, Math.round(value)));
}
function readWidth(cfg) {
  try {
    var raw = localStorage.getItem(cfg.key);
    if (raw == null || raw.trim() === "") return cfg.def;
    var value = Number(raw);
    if (!Number.isFinite(value)) return cfg.def;
    return clampWidth(cfg, value);
  } catch (e) { return cfg.def; }
}
function saveWidth(kind) {
  try { localStorage.setItem(PANE[kind].key, String(paneWidths[kind])); }
  catch (e) { /* storage unavailable; retain the in-memory width */ }
}
function applyWidth(kind, value, persist) {
  var cfg = PANE[kind];
  var width = clampWidth(cfg, value);
  paneWidths[kind] = width;
  document.documentElement.style.setProperty(cfg.prop, width + "px");
  var separator = $(kind === "side" ? "sideResizer" : "ftreeResizer");
  if (separator) separator.setAttribute("aria-valuenow", String(width));
  if (persist) saveWidth(kind);
}
function initPaneWidths() {
  applyWidth("side", readWidth(PANE.side), false);
  applyWidth("ftree", readWidth(PANE.ftree), false);
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
  onPick: function (v) { state.branch = v; spinWhile($("branchDdBtn"), loadCommits(0, null)); loadWork(); }
});

var state = {
  repos: [], repo: null, branches: [], branch: null,
  commits: [], hasMore: false, loading: false,
  commit: null, pendingSha: null, files: [], fileSel: null, fileCache: {}, filter: "",
  work: null, view: "commit", treeOpen: {}, fileQuery: "",
  fileContent: {}, ctxExp: {}, diffMeta: {}
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
var connectionState = "";
var connectionTimer = null;
var connectionChecking = false;
function setConnectionState(next) {
  if (connectionState === next) return;
  connectionState = next;
  var labels = { checking: "Connecting", online: "Connected", offline: "Disconnected" };
  var titles = { checking: "Connecting to server", online: "Server connected", offline: "Server disconnected" };
  var el = $("connectionStatus");
  el.setAttribute("data-state", next);
  el.title = titles[next];
  $("connectionText").textContent = labels[next];
}
async function checkConnection() {
  if (connectionChecking) return;
  connectionChecking = true;
  try { await api("/api/health"); } catch (e) { /* api() updates the connection state */ }
  finally {
    connectionChecking = false;
    clearTimeout(connectionTimer);
    connectionTimer = setTimeout(checkConnection, 10000);
  }
}
function startConnectionMonitor() {
  window.addEventListener("online", function () {
    clearTimeout(connectionTimer);
    setConnectionState("checking");
    checkConnection();
  });
  window.addEventListener("offline", function () {
    clearTimeout(connectionTimer);
    setConnectionState("offline");
  });
  setConnectionState("checking");
  checkConnection();
}
async function api(path) {
  var headers = { "Accept": "application/json" };
  if (TOKEN) headers["Authorization"] = "Bearer " + TOKEN;
  var r;
  try { r = await fetch(path, { headers: headers }); }
  catch (e) { setConnectionState("offline"); throw e; }
  setConnectionState("online");
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
    showNoRepositories();
    return;
  }
  var h = readHash();
  var start = state.repos.find(function (r) { return r.id === h.r; }) || state.repos[0];
  repoDd.setValue(start.id, start.name);
  await openRepo(start.id, h.b || null, h.c || null);
}

async function openRepo(id, branchWanted, commitWanted) {
  commitSeq++;
  state.repo = id; state.fileCache = {}; state.fileContent = {}; state.ctxExp = {}; state.diffMeta = {}; state.commits = []; state.commit = null; state.fileSel = null; state.work = null; state.view = "commit"; state.treeOpen = {};
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
  if (skip === 0) { state.commits = []; state.pendingSha = null; list.innerHTML = '<div class="diff-empty">Loading…</div>'; }
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
      if (target) await selectCommit(target);
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
    /* match subject, author, short SHA, and the full 40-char SHA (any prefix length) */
    return !q || (c.subject + " " + c.author + " " + c.shortSha + " " + c.sha).toLowerCase().indexOf(q) >= 0;
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

var commitSeq = 0;

async function selectCommit(sha) {
  if (!sha) return;
  var seq = ++commitSeq;
  state.pendingSha = sha;
  var detail;
  try {
    detail = await api("/api/repo/" + encodeURIComponent(state.repo) + "/commit/" + encodeURIComponent(sha));
  } catch (e) {
    if (seq !== commitSeq) return;          /* a newer selection already won */
    state.commit = null; state.files = []; state.fileSel = null; state.pendingSha = null;
    renderCommits();
    mainEmpty("⚠️", "Failed to load commit", esc(e.message));
    return;
  }
  if (seq !== commitSeq) return;            /* a newer selection already won */
  state.view = "commit";
  state.commit = detail;
  state.files = detail.files;
  state.fileSel = detail.files.length ? detail.files[0].path : null;
  state.fileCache = {}; state.fileContent = {}; state.ctxExp = {}; state.diffMeta = {}; state.treeOpen = {}; state.fileQuery = "";
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
  commitSeq++;
  state.pendingSha = null;
  state.view = "work";
  state.commit = null; state.fileCache = {}; state.fileContent = {}; state.ctxExp = {}; state.diffMeta = {}; state.files = []; state.fileSel = null; state.treeOpen = {}; state.fileQuery = "";
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
  if (!files.length) {
    mainEmpty("&#10003;", "No uncommitted changes", "The working tree is clean.");
    /* the only moment in this UI that is allowed to be a small delight */
    var glyph = document.querySelector(".empty .big");
    if (glyph) glyph.classList.add("pop");
    return;
  }
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
  installFileTreeResizer();
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
  installFileTreeResizer();
  installHeadResizer();
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
      /* collapse a chain of single-subdirectory, file-less dirs into one row: a/b/c */
      var label = name;
      while (Object.keys(dn.dirs).length === 1 && dn.files.length === 0) {
        var sub = Object.keys(dn.dirs)[0];
        label += "/" + sub;
        dn = dn.dirs[sub];
      }
      var open = dn.path in state.treeOpen ? !!state.treeOpen[dn.path] : !!chain[dn.path];
      out += '<button class="t-row t-dir' + (open ? " open" : "") + '" data-dir="' + esc(dn.path) + '" title="' + esc(label) + '" style="padding-left:' + (8 + depth * 14) + 'px">' +
        '<span class="tw"><svg viewBox="0 0 8 8" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5l3.5 2.5L2 6.5"/></svg></span>' +
        '<span class="t-name">' + esc(label) + "</span>" + (dn.known ? cntHtml({ a: dn.adds, d: dn.dels }) : "") + "</button>";
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
  bindGapDelegation();
  var d = state.commit;
  var f = state.files.find(function (x) { return x.path === state.fileSel; });
  if (!f) { box.innerHTML = '<div class="diff-empty">No file selected.</div>'; return; }

  var exp = state.ctxExp[f.path];
  var wholeOn = !!(exp && exp.whole);
  var corners = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 2h-3a1 1 0 0 0-1 1v3M13.5 6.5v-3a1 1 0 0 0-1-1h-3M2 9.5v3a1 1 0 0 0 1 1h3M9.5 14h3a1 1 0 0 0 1-1v-3"/></svg>';
  var pathLabel = f.status === "renamed" ? esc(f.oldPath) + " → " + esc(f.path) : esc(f.path);
  var head = '<div class="diffpath"><span class="full">' + pathLabel + '</span>' +
    '<button class="ibtn" id="copyPath" title="copy path" aria-label="copy path"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M11 5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5.5A1.5 1.5 0 0 0 4 11h1"/></svg></button>' +
    '<button class="ibtn' + (wholeOn ? " on" : "") + '" id="wholeBtn" style="margin-left:4px" title="' + (wholeOn ? "collapse back to the diff" : "expand to the whole file") +
    '" aria-label="toggle whole file view">' + corners + "</button></div>";

  var cached = state.fileCache[f.path];
  if (cached && cached.hunks) {
    box.innerHTML = head + diffHtml(cached, f);
    bindDiffButtons(f);
    ensureContent(f);
    return;
  }

  if (f.binary) {
    box.innerHTML = head + '<div class="binary-note">Binary file — diff not shown.</div>';
    return;
  }

  /* keep the previous diff on screen while the next one loads:
     the swap below repaints it in one frame, so there is no blank flash */
  if (!box.querySelector(".diff-scroll")) box.innerHTML = head + '<div class="diff-empty">Loading diff…</div>';
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
  box.innerHTML = head + diffHtml(data, f);
  bindDiffButtons(f);
  ensureContent(f);
}

function bindDiffButtons(f) {
  var b = $("copyPath");
  if (b) b.onclick = function () { copyText(f.path, "Path copied"); };
  var w = $("wholeBtn");
  if (w) w.onclick = function () { toggleWhole(f); };
}

/* Lazy background fetch of the full file on both diff sides; powers the
   collapsed-context bars. Re-renders once when it arrives so bars/labels
   that need line counts (file tail) appear. */
async function ensureContent(f) {
  var cur = state.fileContent[f.path];
  if (cur !== undefined) return; /* object (ok or failed) or "loading" */
  state.fileContent[f.path] = "loading";
  try {
    var url = state.view === "work"
      ? "/api/repo/" + encodeURIComponent(state.repo) + "/work/file?file=" + encodeURIComponent(f.path)
      : "/api/repo/" + encodeURIComponent(state.repo) + "/commit/" + encodeURIComponent(state.commit.sha) + "/file?file=" + encodeURIComponent(f.path);
    var d = await api(url);
    if (state.fileSel !== f.path) return;
    if (d.tooLarge) {
      state.fileContent[f.path] = { ok: false, old: null, new: null };
    } else {
      state.fileContent[f.path] = {
        ok: d.old !== null || d.new !== null,
        old: d.old === null ? null : splitLines(d.old),
        new: d.new === null ? null : splitLines(d.new)
      };
    }
  } catch (e) {
    state.fileContent[f.path] = { ok: false, old: null, new: null };
  }
  if (state.fileSel === f.path && state.fileCache[f.path] && state.fileCache[f.path].hunks) renderDiff();
}

/* Delegated gap-bar clicks: one listener survives innerHTML re-renders. */
function bindGapDelegation() {
  var box = $("diffbox");
  if (!box || box._gapBound) return;
  box._gapBound = true;
  box.addEventListener("click", function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var btn = t.closest(".gap-btn");
    if (!btn) return;
    var bar = btn.parentNode;
    var f = state.files.find(function (x) { return x.path === state.fileSel; });
    if (!f || !bar || !bar.getAttribute) return;
    expandGapFromBar(f, bar, btn.getAttribute("data-act"));
  });
}

function curGapState(f, gi) {
  var exp = state.ctxExp[f.path] || (state.ctxExp[f.path] = { gaps: {}, whole: false });
  var st = exp.gaps[gi] || (exp.gaps[gi] = { u: 0, l: 0 });
  return { exp: exp, st: st };
}

/* Reveal relative slice [a, b) of gap g next to the bar (surgical DOM
   insert — no re-render, scroll position stays). */
function insertGapRows(bar, g, a, b, where) {
  if (b <= a) return;
  var tmp = document.createElement("div");
  tmp.innerHTML = gapRowsHtml(g, a, b, true);
  var nodes = Array.prototype.slice.call(tmp.children);
  var ref = where === "before" ? bar : bar.nextSibling;
  for (var i = 0; i < nodes.length; i++) {
    /* the one thing on this screen that appears without warning */
    nodes[i].classList.add("ctx-in");
    bar.parentNode.insertBefore(nodes[i], ref);
  }
}

function expandGapFromBar(f, bar, act) {
  var fd = state.fileCache[f.path];
  var content = state.fileContent[f.path];
  if (!fd || !content || !content.ok) { toast("file content not loaded yet"); ensureContent(f); return; }
  var gaps = gapList(fd, content);
  var g = gaps[+bar.getAttribute("data-gap")];
  if (!g) { bar.parentNode.removeChild(bar); return; }
  var cs = curGapState(f, g.idx), st = cs.st;
  var rem = g.size - st.u - st.l;
  if (rem <= 0) { bar.parentNode.removeChild(bar); return; }
  renderCtx = { content: content, meta: state.diffMeta[f.path] };
  if (act === "all") {
    insertGapRows(bar, g, st.u, g.size - st.l, "before");
    st.u = g.size; st.l = 0;
  } else if (g.pos === "mid") {
    var s = Math.min(CTX_STEP / 2, Math.ceil(rem / 2)), t = Math.min(CTX_STEP / 2, rem - s);
    if (s > 0) { insertGapRows(bar, g, st.u, st.u + s, "before"); st.u += s; }
    if (t > 0) { insertGapRows(bar, g, g.size - st.l - t, g.size - st.l, "after"); st.l += t; }
  } else if (g.pos === "top") {
    var n1 = Math.min(CTX_STEP, rem);
    insertGapRows(bar, g, g.size - st.l - n1, g.size - st.l, "after");
    st.l += n1;
  } else { /* bottom gap grows downward from the last hunk */
    var n2 = Math.min(CTX_STEP, rem);
    insertGapRows(bar, g, st.u, st.u + n2, "before");
    st.u += n2;
  }
  rem = g.size - st.u - st.l;
  if (rem <= 0) { bar.parentNode.removeChild(bar); return; }
  bar.setAttribute("data-u", st.u);
  bar.setAttribute("data-l", st.l);
  var info = bar.querySelector(".gap-info");
  if (info) info.textContent = gapArrow(g) + " " + rem + gapWhere(g);
  var more = bar.querySelector('.gap-btn[data-act="more"]');
  if (more) more.textContent = moreLabel(g, rem);
}

/* Whole-file toggle: reveal every remaining hidden region (or collapse
   back to the plain diff, which re-renders from scratch). */
function toggleWhole(f) {
  var exp = state.ctxExp[f.path];
  if (exp && exp.whole) {
    state.ctxExp[f.path] = null;
    state.diffMeta[f.path] = null; /* fresh highlight budget */
    renderDiff();
    return;
  }
  var fd = state.fileCache[f.path];
  var content = state.fileContent[f.path];
  if (!fd || !fd.hunks || !fd.hunks.length) return;
  if (!content || !content.ok) { toast("file content not available for this file"); ensureContent(f); return; }
  var cs = curGapState(f, 0); /* ensure container exists */
  cs.exp.whole = true;
  renderCtx = { content: content, meta: state.diffMeta[f.path] };
  var gaps = gapList(fd, content);
  for (var i = 0; i < gaps.length; i++) {
    var g = gaps[i];
    var bar = document.querySelector('.gapbar[data-gap="' + g.idx + '"]');
    if (!bar) continue;
    var st = cs.exp.gaps[g.idx] || { u: 0, l: 0 };
    insertGapRows(bar, g, st.u, g.size - st.l, "before");
    cs.exp.gaps[g.idx] = { u: g.size, l: 0 };
    bar.parentNode.removeChild(bar);
  }
  var w = $("wholeBtn");
  if (w) { w.title = "collapse back to the diff"; w.classList.add("on"); }
}

function diffHtml(fd, f) {
  if (fd.tooLarge) {
    return '<div class="diff-empty">This diff is too large to render (' + Math.round(fd.bytes / 1024) + " KB). Try:\n" +
      "<code>git diff " + esc(fd.base || "") + " " + esc(fd.sha || "") + " -- " + esc(fd.file || "") + "</code></div>";
  }
  if (!fd.hunks || !fd.hunks.length) {
    if (fd.binary) return '<div class="binary-note">Binary file — diff not shown.</div>';
    return '<div class="diff-empty">No content changes (pure rename, mode change, or empty file).</div>';
  }
  /* Render meta is frozen per file on first render: expansions keep the same
     highlighting decision, and the highlight budget only shrinks. */
  var meta = state.diffMeta[f.path];
  if (!meta) {
    var lang0 = langForFile(f.path);
    var rowTotal = 0;
    fd.hunks.forEach(function (h) { rowTotal += h.rows.length; });
    var hl0 = !!lang0 && rowTotal <= HL_ROW_CAP;
    meta = { lang: lang0, hlOn: hl0, hlBudget: hl0 ? HL_ROW_CAP - rowTotal : 0 };
    state.diffMeta[f.path] = meta;
  }
  var content = state.fileContent[f.path];
  var contentOk = content && content.ok;
  renderCtx = { content: contentOk ? content : null, meta: meta };
  var gaps = contentOk ? gapList(fd, content) : [];
  var exp = state.ctxExp[f.path] || null;
  var html = ['<div class="diff">'];
  var gi = 0;
  fd.hunks.forEach(function (h) {
    /* gaps arrive in document order: optional file-head gap before the first
       hunk, then one gap after each hunk (between hunks, or file tail) */
    if (gi < gaps.length && gaps[gi].pos === "top") { html.push(gapHtml(gaps[gi], exp)); gi++; }
    html.push('<div class="hunk-head">@@ -' + h.oldStart + "," + h.oldCount + " +" + h.newStart + "," + h.newCount + " @@</div>");
    h.rows.forEach(function (r) { html.push(diffRowHtml(r, meta.lang, meta.hlOn)); });
    if (gi < gaps.length) { html.push(gapHtml(gaps[gi], exp)); gi++; }
  });
  html.push("</div>");
  return '<div class="diff-scroll">' + html.join("") + "</div>";
}

/* One side-by-side row (4 grid cells), shared by hunk rows and synthesized
   context rows from collapsed regions. */
function diffRowHtml(r, lang, hlOn) {
  var cls = r.paired ? "r-pair" : r.oldText === null ? "r-add" : r.newText === null ? "r-del" : "r-ctx";
  if (r.oldText === null && r.newText === null) cls = "r-gap";
  var hlc = hlOn ? " hl" : "";
  var oldCell, newCell;
  var o = splitTail(r.oldText), n = splitTail(r.newText);
  if (r.paired && r.oldText !== r.newText) {
    var sp = wordSpans(o[0], n[0]);
    if (sp) {
      if (hlOn) {
        /* highlight the whole line first, then wrap just the changed
           range — re-lexing segments separately would mis-color tokens
           that span a boundary (strings, comments) */
        oldCell = wrapRange(hlLine(o[0], lang), sp.aPre.length, sp.aPre.length + sp.aMid.length, "w-del") + esc(o[1]);
        newCell = wrapRange(hlLine(n[0], lang), sp.bPre.length, sp.bPre.length + sp.bMid.length, "w-add") + esc(n[1]);
      } else {
        oldCell = esc(sp.aPre) + '<mark class="w-del">' + esc(sp.aMid) + "</mark>" + esc(sp.aSuf) + esc(o[1]);
        newCell = esc(sp.bPre) + '<mark class="w-add">' + esc(sp.bMid) + "</mark>" + esc(sp.bSuf) + esc(n[1]);
      }
    } else {
      oldCell = cellHtml(o, lang, hlOn); newCell = cellHtml(n, lang, hlOn);
    }
  } else {
    oldCell = cellHtml(o, lang, hlOn); newCell = cellHtml(n, lang, hlOn);
  }
  return '<div class="no no-o ' + cls + '">' + (r.oldNo == null ? "" : r.oldNo) + "</div>" +
    '<div class="code old ' + cls + hlc + '">' + oldCell + "</div>" +
    '<div class="no no-n ' + cls + '">' + (r.newNo == null ? "" : r.newNo) + "</div>" +
    '<div class="code new ' + cls + hlc + '">' + newCell + "</div>";
}

/* ------------------------------------------------ collapsed context ----
   The diff only carries hunks; the space between them (file head, gaps
   between hunks, file tail) is reconstructed from the full file contents
   fetched via the .../file endpoints. Each hidden region becomes a slim
   bar: "+20" reveals twenty more lines toward the visible diff (middle
   gaps grow 10 lines at both edges), "all" reveals the whole region. */
var CTX_STEP = 20;
var renderCtx = null; /* {content, meta} valid while rendering a diff */

function splitLines(t) {
  var a = t.split("\n");
  if (a.length && a[a.length - 1] === "") a.pop(); /* trailing newline phantom */
  return a;
}

/* Hidden regions of this diff, in document order. o0/n0 are the first
   hidden old/new line numbers; src says which side indexes the text
   (identical on both sides for context). Bottom gap needs content. */
function gapList(fd, content) {
  var hs = fd.hunks, out = [];
  if (!hs.length) return out;
  var first = hs[0];
  var topN = Math.min(first.oldStart - 1, first.newStart - 1);
  if (topN > 0) out.push({ idx: out.length, size: topN, o0: 1, n0: 1, pos: "top", src: "old" });
  for (var i = 1; i < hs.length; i++) {
    var p = hs[i - 1], c = hs[i];
    var o0 = p.oldStart + p.oldCount;
    var n0 = p.newStart + p.newCount;
    var sz = Math.min(c.oldStart - o0, c.newStart - n0); /* both sides equal for context */
    if (sz > 0) out.push({ idx: out.length, size: sz, o0: o0, n0: n0, pos: "mid", src: "old" });
  }
  if (content && content.new && content.new.length) {
    var L = hs[hs.length - 1];
    var oF = L.oldStart + L.oldCount, nF = L.newStart + L.newCount;
    var szB = content.new.length - nF + 1;
    if (content.old && content.old.length) szB = Math.min(szB, content.old.length - oF + 1);
    if (szB > 0) out.push({ idx: out.length, size: szB, o0: oF, n0: nF, pos: "bot", src: "new" });
  }
  return out;
}

function gapRowsHtml(g, a, b, consume) {
  var meta = renderCtx.meta, c = renderCtx.content, out = [];
  for (var k = a; k < b; k++) {
    var hlRow = false;
    if (meta.hlOn) {
      hlRow = meta.hlBudget > 0;
      if (consume && hlRow) meta.hlBudget--;
    }
    var oldNo = g.o0 + k, newNo = g.n0 + k;
    var text = (g.src === "old" ? c.old : c.new)[g.src === "old" ? oldNo - 1 : newNo - 1];
    if (text === undefined) text = "";
    out.push(diffRowHtml({ oldNo: oldNo, newNo: newNo, oldText: text, newText: text, paired: false }, meta.lang, hlRow));
  }
  return out.join("");
}

function gapArrow(g) { return g.pos === "top" ? "↑" : g.pos === "bot" ? "↓" : "↕"; }
function gapWhere(g) { return g.pos === "top" ? " lines above" : g.pos === "bot" ? " lines below" : " lines between"; }
function moreLabel(g, rem) {
  if (g.pos === "mid") {
    var s = Math.min(CTX_STEP / 2, Math.ceil(rem / 2)), t = Math.min(CTX_STEP / 2, rem - s);
    return "+" + (s + t);
  }
  return "+" + Math.min(CTX_STEP, rem);
}
function gapBarHtml(g, st) {
  var rem = g.size - st.u - st.l;
  return '<div class="gapbar" data-gap="' + g.idx + '" data-u="' + st.u + '" data-l="' + st.l + '">' +
    '<span class="gap-info">' + gapArrow(g) + " " + rem + gapWhere(g) + "</span>" +
    '<button class="gap-btn" data-act="more" title="reveal more lines">' + moreLabel(g, rem) + "</button>" +
    '<button class="gap-btn" data-act="all" title="reveal this whole region">all</button></div>';
}
function gapHtml(g, exp) {
  var st = (exp && exp.gaps && exp.gaps[g.idx]) || { u: 0, l: 0 };
  if (exp && exp.whole) st = { u: g.size, l: 0 };
  st = { u: Math.min(st.u || 0, g.size), l: Math.min(st.l || 0, g.size) };
  if (st.u + st.l > g.size) st = { u: g.size, l: 0 };
  var out = [];
  if (st.u > 0) out.push(gapRowsHtml(g, 0, st.u, false));
  if (st.u + st.l < g.size) out.push(gapBarHtml(g, st));
  if (st.l > 0) out.push(gapRowsHtml(g, g.size - st.l, g.size, false));
  return out.join("");
}

/* Split off the parser-appended "\ No newline at end of file" tail (joined by a real \n):
   the code part gets highlighted, the note renders verbatim on a second line. */
function splitTail(text) {
  if (text === null) return null;
  var i = text.indexOf("\n");
  return i < 0 ? [text, ""] : [text.slice(0, i), text.slice(i)];
}
function cellHtml(parts, lang, hlOn) {
  if (parts === null) return "";
  return hlOn ? hlLine(parts[0], lang) + esc(parts[1]) : esc(parts[0] + parts[1]);
}

/* Wrap the plain-text range [start, end) of an already-escaped highlighted
   line in a <mark>, so word-level marks overlay syntax colors instead of
   replacing them. Boundaries fall on tokenizer token edges and escaped
   entities count as one character, so scanning text runs char-by-char
   (tags pass through untouched) lands exactly. */
function wrapRange(h, start, end, kind) {
  if (end <= start) return h;
  var out = [], pos = 0, open = false;
  var re = /(<[^>]+>)|([^<]+)/g, m;
  while ((m = re.exec(h)) !== null) {
    if (m[1]) { out.push(m[1]); continue; }
    var txt = m[2], i = 0;
    while (i < txt.length) {
      var semi = txt[i] === "&" ? txt.indexOf(";", i) : -1;
      var hlen = semi > i ? semi - i + 1 : 1;
      if (!open && pos === start) { out.push('<mark class="' + kind + '">'); open = true; }
      out.push(txt.slice(i, i + hlen));
      i += hlen;
      pos++;
      if (open && pos === end) { out.push("</mark>"); open = false; }
    }
  }
  if (open) out.push("</mark>");
  return out.join("");
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

/* ---------------- syntax highlighting ----------------
   highlight.js (vendored above as window.hljs, see src/hljs.ts) does the
   lexing. Language comes from the file extension; unknown extensions stay
   plain. Each line is highlighted on its own so rows stay independent of
   each other, and results are memoized because context rows repeat on both
   sides of the view. */
var HL_ROW_CAP = 5000; /* beyond this, skip highlighting to keep rendering fast */
var hlAvailable = typeof hljs !== "undefined" && !!hljs && typeof hljs.highlight === "function";
var HL_CACHE_MAX = 20000;
var hlCache = new Map();

var LANG_BY_EXT = {
  sh: "bash", bash: "bash", zsh: "bash", ksh: "bash",
  c: "c", h: "c",
  cc: "cpp", cpp: "cpp", cxx: "cpp", hh: "cpp", hpp: "cpp", hxx: "cpp",
  cs: "csharp", css: "css", scss: "scss", less: "less",
  diff: "diff", patch: "diff",
  go: "go", graphql: "graphql", gql: "graphql",
  ini: "ini", cfg: "ini", conf: "ini", toml: "ini", env: "ini",
  java: "java",
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  json: "json", jsonc: "json", json5: "json",
  kt: "kotlin", kts: "kotlin",
  lua: "lua",
  mak: "makefile", mk: "makefile",
  md: "markdown", markdown: "markdown",
  m: "objectivec", mm: "objectivec",
  pl: "perl", pm: "perl",
  php: "php", phtml: "php",
  py: "python", pyi: "python", pyw: "python",
  r: "r", rb: "ruby", rs: "rust",
  sql: "sql", swift: "swift",
  ts: "typescript", tsx: "typescript", mts: "typescript", cts: "typescript",
  vb: "vbnet",
  wat: "wasm", wast: "wasm",
  html: "xml", htm: "xml", xml: "xml", svg: "xml", vue: "xml", xhtml: "xml",
  yml: "yaml", yaml: "yaml"
};

function langForFile(path) {
  if (!hlAvailable) return null;
  var base = basename(path).toLowerCase();
  if (base === "makefile" || base === "gnumakefile") return "makefile";
  if (base === "dockerfile") return "bash"; /* closest bundled grammar */
  var dot = base.lastIndexOf(".");
  if (dot < 0) return null;
  var lang = LANG_BY_EXT[base.slice(dot + 1)];
  return lang && hljs.getLanguage(lang) ? lang : null;
}

function hlLine(text, lang) {
  var key = lang + "\0" + text;
  var hit = hlCache.get(key);
  if (hit != null) return hit;
  var html;
  try {
    html = hljs.highlight(text, { language: lang, ignoreIllegals: true }).value;
  } catch (e) {
    html = esc(text);
  }
  if (hlCache.size >= HL_CACHE_MAX) hlCache.clear();
  hlCache.set(key, html);
  return html;
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

/* A local request can finish in 3ms; without a floor the icon would twitch instead of turn. */
function spinWhile(btn, p) {
  if (!btn) return;
  var started = Date.now();
  btn.classList.add("spin");
  function stop() {
    var wait = Math.max(0, 400 - (Date.now() - started));
    setTimeout(function () { btn.classList.remove("spin"); }, wait);
  }
  p.then(stop, stop);
}

function createPaneResizer(kind, id, label) {
  var cfg = PANE[kind];
  var el = document.createElement("div");
  el.id = id;
  el.className = "pane-resizer is-vertical";
  el.setAttribute("role", "separator");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-orientation", "vertical");
  el.setAttribute("aria-label", label);
  el.setAttribute("aria-valuemin", String(cfg.min));
  el.setAttribute("aria-valuemax", String(cfg.max));
  el.setAttribute("aria-valuenow", String(paneWidths[kind]));

  var pointerId = null, startX = 0, startWidth = 0;
  el.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    e.preventDefault();
    el.focus();
    pointerId = e.pointerId;
    startX = e.clientX;
    startWidth = paneWidths[kind];
    el.setPointerCapture(pointerId);
    el.classList.add("dragging");
  });
  el.addEventListener("pointermove", function (e) {
    if (e.pointerId !== pointerId) return;
    applyWidth(kind, startWidth + (e.clientX - startX), false);
  });
  function finish(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    el.classList.remove("dragging");
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    saveWidth(kind);
  }
  el.addEventListener("pointerup", finish);
  el.addEventListener("pointercancel", finish);
  el.addEventListener("lostpointercapture", function () {
    pointerId = null;
    el.classList.remove("dragging");
  });
  el.addEventListener("dblclick", function () { applyWidth(kind, cfg.def, true); });
  el.addEventListener("keydown", function (e) {
    var delta = e.key === "ArrowLeft" ? -10 : e.key === "ArrowRight" ? 10 : 0;
    if (!delta) return;
    e.preventDefault();
    applyWidth(kind, paneWidths[kind] + delta, true);
  });
  return el;
}

function installFileTreeResizer() {
  if (!desktop || $("ftreeResizer")) return;
  var tree = $("ftree");
  if (!tree || !$("diffbox")) return;
  tree.insertAdjacentElement("afterend",
    createPaneResizer("ftree", "ftreeResizer", "Resize file tree"));
}

function headBounds(head) {
  var detail = head.parentElement;
  var max = Math.max(HEAD.min + 40, (detail ? detail.clientHeight : 0) - HEAD.splitMin - 52);
  return { min: HEAD.min, max: Math.max(HEAD.min, max) };
}
function syncHeadResizer(head) {
  var separator = $("headResizer");
  if (!separator) return;
  var bounds = headBounds(head);
  separator.setAttribute("aria-valuemin", String(bounds.min));
  separator.setAttribute("aria-valuemax", String(bounds.max));
  separator.setAttribute("aria-valuenow", String(Math.round(head.getBoundingClientRect().height)));
}
function applyHeadHeight(head, value) {
  var bounds = headBounds(head);
  var height = Math.round(Math.min(bounds.max, Math.max(bounds.min, value)));
  head.style.height = height + "px";
  head.classList.add("sized");
  syncHeadResizer(head);
}
function resetHeadHeight(head) {
  head.style.height = "";
  head.classList.remove("sized");
  syncHeadResizer(head);
}
function createHeadResizer(head) {
  var el = document.createElement("div");
  el.id = "headResizer";
  el.className = "pane-resizer is-horizontal";
  el.setAttribute("role", "separator");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-orientation", "horizontal");
  el.setAttribute("aria-label", "Resize commit message");

  var pointerId = null, startY = 0, startHeight = 0;
  el.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    e.preventDefault();
    el.focus();
    pointerId = e.pointerId;
    startY = e.clientY;
    startHeight = head.getBoundingClientRect().height;
    el.setPointerCapture(pointerId);
    el.classList.add("dragging");
  });
  el.addEventListener("pointermove", function (e) {
    if (e.pointerId !== pointerId) return;
    applyHeadHeight(head, startHeight + (e.clientY - startY));
  });
  function finish(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    el.classList.remove("dragging");
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  }
  el.addEventListener("pointerup", finish);
  el.addEventListener("pointercancel", finish);
  el.addEventListener("lostpointercapture", function () {
    pointerId = null;
    el.classList.remove("dragging");
  });
  el.addEventListener("dblclick", function () { resetHeadHeight(head); });
  el.addEventListener("keydown", function (e) {
    var delta = e.key === "ArrowUp" ? -10 : e.key === "ArrowDown" ? 10 : 0;
    if (!delta) return;
    e.preventDefault();
    applyHeadHeight(head, head.getBoundingClientRect().height + delta);
  });
  return el;
}
function installHeadResizer() {
  var detail = document.querySelector("#main .detail");
  var head = detail && detail.querySelector(".d-head");
  if (!head || $("headResizer")) return;
  if (window.matchMedia("(min-width: 901px)").matches) head.style.maxHeight = headBounds(head).max + "px";
  head.insertAdjacentElement("afterend", createHeadResizer(head));
  syncHeadResizer(head);
}

function reclampHeadHeight() {
  var head = document.querySelector("#main .d-head");
  if (!head) return;
  if (!window.matchMedia("(min-width: 901px)").matches) {
    head.style.maxHeight = "";
    if (head.classList.contains("sized")) {
      head.style.height = "";
      head.classList.remove("sized");
    }
    syncHeadResizer(head);
    return;
  }
  head.style.maxHeight = headBounds(head).max + "px";
  if (head.classList.contains("sized")) applyHeadHeight(head, head.getBoundingClientRect().height);
  else syncHeadResizer(head);
}

function focusCommitFilter() {
  if (document.documentElement.classList.contains("side-collapsed")) toggleSide();
  var input = $("filter");
  input.focus();
  input.select();
}
function focusFileFilter() {
  var input = $("fileFilter");
  if (!input || !input.getClientRects().length) return;
  input.focus();
}
function bindDesktop() {
  if (!desktop) return;
  document.documentElement.classList.add("desktop");
  initPaneWidths();

  var openButton = document.createElement("button");
  openButton.type = "button";
  openButton.id = "desktopOpenFolder";
  openButton.className = "dd-btn desktop-open-folder";
  openButton.textContent = "Open Folder…";
  openButton.onclick = openDesktopFolder;
  $("connectionStatus").insertAdjacentElement("beforebegin", openButton);

  var side = document.querySelector(".side");
  side.insertAdjacentElement("afterend",
    createPaneResizer("side", "sideResizer", "Resize commit list"));
  installFileTreeResizer();

  var offCommand = desktop.onCommand(function (command) {
    switch (command) {
      case "refresh":
        spinWhile($("refreshBtn"), refreshCurrent());
        break;
      case "toggle-sidebar":
        toggleSide();
        break;
      case "filter-commits":
        focusCommitFilter();
        break;
      case "filter-files":
        focusFileFilter();
        break;
      default:
        return;
    }
  });
  window.addEventListener("pagehide", function () { offCommand(); }, { once: true });
}

function bindChrome() {
  applyTheme(document.documentElement.getAttribute("data-theme") || "light");
  $("themeBtn").onclick = toggleTheme;
  $("collapseSide").onclick = toggleSide;
  $("expandSide").onclick = toggleSide;
  $("main").addEventListener("input", function (e) {
    if (e.target && e.target.id === "fileFilter") { state.fileQuery = e.target.value; renderTree(); }
  });
  $("refreshBtn").onclick = function () { spinWhile(this, refreshCurrent()); };
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
    var curSha = state.pendingSha || (state.commit && state.commit.sha);
    var idx = state.commits.findIndex(function (c) { return c.sha === curSha; });
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
  window.addEventListener("resize", reclampHeadHeight);
  bindDesktop();
}
function scrollCommitIntoView(sha) {
  var el = document.querySelector('.commit[data-sha="' + sha + '"]');
  if (el) el.scrollIntoView({ block: "nearest" });
}

startConnectionMonitor();
bindChrome();
boot();
`;
