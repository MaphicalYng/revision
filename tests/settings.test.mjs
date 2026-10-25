import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  clearRecentRoots,
  defaultDesktopSettings,
  loadDesktopSettings,
  normalizeDesktopSettings,
  recordRecentRoot,
  resolveWindowPlacement,
  saveDesktopSettings,
} from "../dist/desktop/settings.js";

async function temporaryDirectory(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "revision-settings-test-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test("missing and damaged settings fall back to fresh defaults", async (t) => {
  const directory = await temporaryDirectory(t);
  const filePath = path.join(directory, "settings.json");
  const expected = { version: 1, recentRoots: [] };
  assert.deepEqual(await loadDesktopSettings(filePath), expected);
  assert.notEqual(defaultDesktopSettings().recentRoots, defaultDesktopSettings().recentRoots);

  const damaged = ["", "{", "null", "[]", JSON.stringify({ version: 2, recentRoots: ["/x"] })];
  for (const source of damaged) {
    await fs.writeFile(filePath, source);
    assert.deepEqual(await loadDesktopSettings(filePath), expected);
  }
});

test("normalization whitelists fields and validates roots and window values", () => {
  const normalized = normalizeDesktopSettings({
    version: 1,
    lastRoot: 42,
    recentRoots: ["/a", "", null, "/b", "/a", ...Array.from({ length: 12 }, (_, i) => `/r${i}`)],
    token: "<your-token>",
    extra: true,
    window: {
      x: Number.POSITIVE_INFINITY,
      y: -20,
      width: 1200,
      height: 800,
      maximized: false,
      token: "<your-token>",
    },
  });
  assert.equal(normalized.lastRoot, undefined);
  assert.equal(normalized.recentRoots.length, 10);
  assert.deepEqual(normalized.recentRoots.slice(0, 3), ["/a", "/b", "/r0"]);
  assert.equal(new Set(normalized.recentRoots).size, 10);
  assert.deepEqual(normalized.window, { y: -20, width: 1200, height: 800, maximized: false });
  assert.equal("token" in normalized, false);
  assert.equal("extra" in normalized, false);

  for (const window of [
    { width: 0, height: 800, maximized: false },
    { width: 1200, height: 1.5, maximized: false },
    { width: 1200, height: 800, maximized: "yes" },
  ]) {
    assert.equal(normalizeDesktopSettings({ version: 1, recentRoots: [], window }).window, undefined);
  }
});

test("save round-trips normalized settings through a same-directory temporary file", async (t) => {
  const directory = await temporaryDirectory(t);
  const filePath = path.join(directory, "nested", "settings.json");
  const originalRename = fs.rename;
  let renameArguments;
  t.mock.method(fs, "rename", async (source, destination) => {
    renameArguments = { source, destination };
    return originalRename(source, destination);
  });

  await saveDesktopSettings(filePath, {
    version: 1,
    lastRoot: "/work",
    recentRoots: ["/work", "/work", "/other"],
    window: { x: 10, y: 20, width: 1200, height: 800, maximized: true },
    token: "<your-token>",
  });
  const expected = {
    version: 1,
    lastRoot: "/work",
    recentRoots: ["/work", "/other"],
    window: { x: 10, y: 20, width: 1200, height: 800, maximized: true },
  };
  assert.deepEqual(JSON.parse(await fs.readFile(filePath, "utf8")), expected);
  assert.deepEqual(await loadDesktopSettings(filePath), expected);
  assert(renameArguments);
  assert.equal(renameArguments.destination, filePath);
  assert.notEqual(renameArguments.source, filePath);
  assert.equal(path.dirname(renameArguments.source), path.dirname(filePath));
  assert.deepEqual(await fs.readdir(path.dirname(filePath)), ["settings.json"]);
});

test("a failed rename preserves the old file and removes the temporary file", async (t) => {
  const directory = await temporaryDirectory(t);
  const filePath = path.join(directory, "settings.json");
  const oldSettings = { version: 1, lastRoot: "/old", recentRoots: ["/old"] };
  await saveDesktopSettings(filePath, oldSettings);
  const oldBytes = await fs.readFile(filePath);
  const injected = new Error("injected rename failure");
  let temporaryPath;
  t.mock.method(fs, "rename", async (source) => {
    temporaryPath = source;
    throw injected;
  });

  await assert.rejects(
    saveDesktopSettings(filePath, { version: 1, lastRoot: "/new", recentRoots: ["/new"] }),
    injected,
  );
  assert.deepEqual(await fs.readFile(filePath), oldBytes);
  assert(temporaryPath);
  await assert.rejects(fs.stat(temporaryPath), { code: "ENOENT" });
  assert.deepEqual(await fs.readdir(directory), ["settings.json"]);
});

test("recent roots are deduplicated, capped, and updated immutably", () => {
  const settings = {
    version: 1,
    lastRoot: "/old",
    recentRoots: ["/a", "/b", "/a", ...Array.from({ length: 12 }, (_, i) => `/r${i}`)],
    window: { width: 1000, height: 700, maximized: false },
  };
  const snapshot = structuredClone(settings);
  const updated = recordRecentRoot(settings, "/b");
  assert.deepEqual(settings, snapshot);
  assert.equal(updated.lastRoot, "/b");
  assert.equal(updated.recentRoots[0], "/b");
  assert.equal(updated.recentRoots.filter((root) => root === "/b").length, 1);
  assert.equal(updated.recentRoots.length, 10);

  const cleared = clearRecentRoots(updated);
  assert.deepEqual(cleared.recentRoots, []);
  assert.equal(cleared.lastRoot, "/b");
  assert.deepEqual(cleared.window, settings.window);
});

test("window placement restores only rectangles fully inside a current work area", () => {
  const primary = { x: 0, y: 0, width: 1440, height: 900 };
  const left = { x: -1920, y: 0, width: 1920, height: 1080 };
  const saved = { x: 100, y: 50, width: 1000, height: 700, maximized: true };
  assert.deepEqual(resolveWindowPlacement(saved, [primary], { width: 1440, height: 900 }), {
    ...saved,
    center: false,
  });

  const negative = { ...saved, x: -1800, y: 100 };
  assert.deepEqual(resolveWindowPlacement(negative, [primary, left], { width: 1440, height: 900 }), {
    ...negative,
    center: false,
  });

  for (const [candidate, areas] of [
    [negative, [primary]],
    [{ ...saved, x: -1 }, [primary]],
    [{ ...saved, x: undefined }, [primary]],
    [saved, []],
  ]) {
    const resolved = resolveWindowPlacement(candidate, areas, { width: 1440, height: 900 });
    assert.equal(resolved.center, true);
    assert.equal(resolved.x, undefined);
    assert.equal(resolved.y, undefined);
    assert.equal(resolved.width, saved.width);
    assert.equal(resolved.height, saved.height);
    assert.equal(resolved.maximized, saved.maximized);
  }

  assert.deepEqual(resolveWindowPlacement(undefined, [primary], { width: 1440, height: 900 }), {
    width: 1440,
    height: 900,
    maximized: false,
    center: true,
  });
});
