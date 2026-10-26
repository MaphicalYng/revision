import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { renderPage } from "../dist/page.js";

const html = renderPage();
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
const mainScript = scripts.at(-1);
const staticBody = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

test("all inline JavaScript parses", () => {
  assert.ok(scripts.length >= 3, "expected initialization, syntax highlighter, and application scripts");
  scripts.forEach((source, index) => {
    assert.doesNotThrow(() => new vm.Script(source, { filename: `page-inline-${index}.js` }));
  });
});

test("desktop API, command whitelist, and resizer contracts are present", () => {
  assert.match(mainScript, /window\.revisionDesktop/);
  assert.match(mainScript, /desktop\.onCommand/);
  assert.match(mainScript, /desktop\.openFolder\(\)/);

  for (const command of ["refresh", "toggle-sidebar", "filter-commits", "filter-files"]) {
    assert.ok(mainScript.includes(`case "${command}":`), `missing explicit command case: ${command}`);
  }
  assert.match(mainScript, /default:\s*return;/, "unknown commands must be ignored");
  assert.doesNotMatch(mainScript, /location\.reload/);
  assert.doesNotMatch(mainScript, /userAgent|navigator\.userAgent/);

  assert.match(mainScript, /setPointerCapture/);
  assert.match(mainScript, /releasePointerCapture/);
  assert.match(mainScript, /lostpointercapture/);
  assert.match(mainScript, /"role", "separator"/);
  assert.match(mainScript, /"tabindex", "0"/);
  assert.match(mainScript, /"aria-orientation", "vertical"/);
  assert.match(mainScript, /"aria-orientation", "horizontal"/);
  assert.match(mainScript, /"aria-valuemin"/);
  assert.match(mainScript, /"aria-valuemax"/);
  assert.match(mainScript, /"aria-valuenow"/);
  assert.match(mainScript, /side:\s*\{[^\n]*min: 240, max: 420, def: 320/);
  assert.match(mainScript, /ftree:\s*\{[^\n]*min: 200, max: 380, def: 264/);
  assert.ok(mainScript.includes("revision-side-width"));
  assert.ok(mainScript.includes("revision-ftree-width"));
  assert.doesNotMatch(mainScript, /revision-head-height/);
  assert.match(mainScript, /id = "headResizer"/);
  assert.match(mainScript, /head\.insertAdjacentElement\("afterend", createHeadResizer\(head\)\)/);
  assert.match(mainScript, /renderWorkDetail[\s\S]*?installFileTreeResizer\(\);/);
  assert.match(mainScript, /function renderDetail[\s\S]*?installFileTreeResizer\(\);\s*installHeadResizer\(\);/);
});

test("Web initial DOM and empty-repository instructions stay unchanged", () => {
  for (const desktopOnly of ["desktopOpenFolder", "emptyOpenFolder", "sideResizer", "ftreeResizer", "Open Folder…"]) {
    assert.ok(!staticBody.includes(desktopOnly), `desktop-only markup leaked into static Web DOM: ${desktopOnly}`);
  }
  assert.match(staticBody, /<div class="sp"><\/div>\s*<div class="connection" id="connectionStatus"/);
  assert.match(staticBody, /<aside class="side">[\s\S]*?<\/aside>\s*<div class="rail" id="rail">[\s\S]*?<\/div>\s*<main class="main" id="main"><\/main>/);
  assert.ok(!staticBody.includes('class="d-split"'));

  assert.match(mainScript, /if \(!desktop\) \{\s*mainEmpty\("⎇", "No git repositories", 'No git repos found in the target directory\. Start the server pointing at a repository itself \(<code class="k">revision \/path\/to\/repo<\/code>\) or at the directory that contains them \(<code class="k">revision \/path\/to\/parent<\/code>\)\.'\);/);
  assert.ok(html.includes("revision-theme"));
  assert.ok(html.includes("revision-side"));
  assert.match(mainScript, /startConnectionMonitor\(\);\s*bindChrome\(\);\s*boot\(\);\s*$/);
  assert.doesNotMatch(mainScript, /async function boot\(\) \{\s*bindChrome\(\);/);
});

test("wide layout supports the commit resizer on Web and desktop", () => {
  assert.match(html, /@media \(max-width: 900px\) \{[\s\S]*?\.body \{ flex-direction: column; \}/);
  assert.match(html, /\.side \{ width: 100%; height: 240px; border-right: 0; border-bottom: 1px solid var\(--border\); \}/);
  assert.match(html, /\.d-split \{ flex-direction: column; \}/);
  assert.match(html, /\.ftree \{ width: 100%; max-height: 220px;/);

  const wideMedia = html.match(/@media \(min-width:901px\) \{([\s\S]*?)\n\}/);
  assert.ok(wideMedia, "missing wide layout media query");
  const rules = wideMedia[1];
  assert.match(rules, /^  \.side \{ width: var\(--revision-side-width\); border-right: 0; \}/m);
  assert.match(rules, /html\.desktop \.ftree \{ width: var\(--revision-ftree-width\); \}/);
  assert.match(rules, /^  \.pane-resizer\.is-vertical \{[\s\S]*?flex: 0 0 5px; width: 5px;/m);
  assert.match(rules, /^  \.pane-resizer\.is-vertical::before \{[\s\S]*?left: 2px; width: 1px;/m);
  assert.match(rules, /\.pane-resizer\.is-horizontal \{[\s\S]*?flex: 0 0 9px; height: 9px;/);
  assert.match(rules, /\.pane-resizer\.is-horizontal::before \{[\s\S]*?top: 4px; left: 0; right: 0; height: 1px;/);
  assert.match(rules, /html\.side-collapsed #sideResizer \{ display: none; \}/);
  assert.match(mainScript, /function bindChrome\(\) \{[\s\S]*?initPaneWidths\(\);[\s\S]*?createPaneResizer\("side", "sideResizer", "Resize commit list"\)/);
  assert.match(html, /:root \{ --revision-side-width: 320px; --revision-ftree-width: 264px; \}/);
  assert.match(html, /\.d-head \{ flex: none; overflow-y: auto; \}/);
  assert.match(html, /\.d-head\.sized \.d-body \{ max-height: none; \}/);
  assert.match(html, /\.d-body \{[^}]*max-height: 26vh; overflow-y: auto;/);
  assert.doesNotMatch(mainScript, /(?:side|ftree|tree)\.style\.width/);
});

test("commit search requests server-side pages and ignores stale responses", () => {
  assert.match(staticBody, /Search all commits: author, email, subject, SHA/);
  assert.match(mainScript, /"&q=" \+ encodeURIComponent\(query\)/);
  assert.ok(mainScript.includes("filterTimer = setTimeout(function () { loadCommits(0, null); }, 500);"));
  assert.match(mainScript, /var seq = \+\+logSeq;/);
  assert.match(mainScript, /if \(seq !== logSeq\) return;/);
  assert.match(mainScript, /if \(seq === logSeq\) \{\s*state\.loading = false;/);
  assert.doesNotMatch(mainScript, /function commitMatches\(/);
});

test("fully untracked directories carry the untracked badge", () => {
  assert.match(mainScript, /total\+\+;\s*if \(f\.status === "untracked"\) untracked\+\+/);
  assert.match(mainScript, /total \+= r\.total; untracked \+= r\.untracked;/);
  assert.match(mainScript, /n\.untracked = total > 0 && total === untracked/);
  assert.ok(mainScript.includes(`(dn.untracked ? '<span class="st U" title="Untracked directory">U</span>' : "")`));
});
