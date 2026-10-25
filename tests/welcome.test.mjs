import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

import { renderWelcomePage } from "../dist/desktop/welcome.js";

const html = renderWelcomePage();
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);

test("welcome page offers a folder picker and stays self-contained", () => {
  assert.match(html, /Welcome to revision/);
  assert.match(html, /<button class="open" id="openFolder"/);
  assert.match(html, /desktop\.openFolder\(\)/);
  assert.match(html, /File → Open Recent/);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)=/i);
  assert.match(html, /data-theme/);
});

test("all welcome inline JavaScript parses", () => {
  assert.ok(scripts.length >= 2);
  scripts.forEach((source, index) => {
    assert.doesNotThrow(() => new vm.Script(source, { filename: `welcome-inline-${index}.js` }));
  });
});
