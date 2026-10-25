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
  assert.match(mainScript, /"aria-valuemin"/);
  assert.match(mainScript, /"aria-valuemax"/);
  assert.match(mainScript, /"aria-valuenow"/);
  assert.match(mainScript, /side:\s*\{[^\n]*min: 240, max: 420, def: 320/);
  assert.match(mainScript, /ftree:\s*\{[^\n]*min: 200, max: 380, def: 264/);
  assert.ok(mainScript.includes("revision-side-width"));
  assert.ok(mainScript.includes("revision-ftree-width"));
  assert.match(mainScript, /renderWorkDetail[\s\S]*?installFileTreeResizer\(\);/);
  assert.match(mainScript, /function renderDetail[\s\S]*?installFileTreeResizer\(\);/);
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

test("desktop layout rules preserve Web responsive behavior", () => {
  assert.match(html, /@media \(max-width: 900px\) \{[\s\S]*?\.body \{ flex-direction: column; \}/);
  assert.match(html, /\.side \{ width: 100%; height: 240px; border-right: 0; border-bottom: 1px solid var\(--border\); \}/);
  assert.match(html, /\.d-split \{ flex-direction: column; \}/);
  assert.match(html, /\.ftree \{ width: 100%; max-height: 220px;/);

  const desktopMedia = html.match(/@media \(min-width:901px\) \{([\s\S]*?)\n\}/);
  assert.ok(desktopMedia, "missing wide desktop media query");
  const rules = desktopMedia[1];
  assert.match(rules, /html\.desktop \.side \{ width: var\(--revision-side-width\); border-right: 0; \}/);
  assert.match(rules, /html\.desktop \.ftree \{ width: var\(--revision-ftree-width\); \}/);
  assert.match(rules, /html\.desktop \.pane-resizer \{[\s\S]*?flex: 0 0 5px; width: 5px;/);
  assert.match(rules, /html\.desktop \.pane-resizer::before \{[\s\S]*?left: 2px; width: 1px;/);
  assert.match(rules, /html\.desktop\.side-collapsed #sideResizer \{ display: none; \}/);
  assert.doesNotMatch(mainScript, /(?:side|ftree|tree)\.style\.width/);
});
