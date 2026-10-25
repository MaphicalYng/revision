import test from "node:test";
import assert from "node:assert/strict";

import { createMenuTemplate } from "../dist/desktop/menu.js";

function findItem(items, label) {
  for (const item of items) {
    if (item.label === label) return item;
    if (Array.isArray(item.submenu)) {
      const found = findItem(item.submenu, label);
      if (found) return found;
    }
  }
  return undefined;
}

function actions(overrides = {}) {
  return {
    openFolder() {},
    openRecent() {},
    clearRecent() {},
    command() {},
    ...overrides,
  };
}

test("menu adds the native app menu only on macOS", () => {
  const mac = createMenuTemplate("darwin", [], actions());
  const linux = createMenuTemplate("linux", [], actions());
  assert.equal(mac[0].role, "appMenu");
  assert.notEqual(linux[0].role, "appMenu");
  assert.equal(findItem(mac, "File").submenu.some((item) => item.role === "close"), true);
  assert.equal(findItem(linux, "File").submenu.some((item) => item.role === "quit"), true);
  assert.ok(mac.some((item) => item.role === "editMenu"));
});

test("menu shortcuts dispatch only fixed desktop commands", () => {
  const commands = [];
  let opened = 0;
  const template = createMenuTemplate("darwin", [], actions({
    openFolder() { opened += 1; },
    command(command) { commands.push(command); },
  }));
  const expectations = new Map([
    ["Refresh", ["CmdOrCtrl+R", "refresh"]],
    ["Toggle Commit List", ["CmdOrCtrl+B", "toggle-sidebar"]],
    ["Filter Commits", ["CmdOrCtrl+F", "filter-commits"]],
    ["Filter Changed Files", ["CmdOrCtrl+Shift+F", "filter-files"]],
  ]);
  for (const [label, [accelerator, command]] of expectations) {
    const item = findItem(template, label);
    assert.equal(item.accelerator, accelerator);
    assert.equal(item.role, undefined);
    item.click();
    assert.deepEqual(commands, [command]);
    commands.length = 0;
  }
  const open = findItem(template, "Open Folder…");
  assert.equal(open.accelerator, "CmdOrCtrl+O");
  open.click();
  assert.equal(opened, 1);
});

test("recent menu preserves order, caps entries at ten, and opens the selected root", () => {
  const roots = Array.from({ length: 12 }, (_, index) => `/tmp/root-${index}`);
  let selected;
  let cleared = 0;
  const template = createMenuTemplate("linux", roots, actions({
    openRecent(root) { selected = root; },
    clearRecent() { cleared += 1; },
  }));
  const submenu = findItem(template, "Open Recent").submenu;
  const entries = submenu.filter((item) => item.label?.startsWith("/tmp/root-"));
  assert.deepEqual(entries.map((item) => item.label), roots.slice(0, 10));
  entries[3].click();
  assert.equal(selected, roots[3]);
  const clear = findItem(template, "Clear Recent");
  assert.equal(clear.enabled, true);
  clear.click();
  assert.equal(cleared, 1);
});

test("empty recent menu has a disabled placeholder and disabled clear action", () => {
  const template = createMenuTemplate("darwin", [], actions());
  const submenu = findItem(template, "Open Recent").submenu;
  assert.equal(submenu[0].label, "No Recent Folders");
  assert.equal(submenu[0].enabled, false);
  assert.equal(findItem(template, "Clear Recent").enabled, false);
});
