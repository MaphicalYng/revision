import test from "node:test";
import assert from "node:assert/strict";

import { ensureExecutablePath } from "../dist/desktop/env.js";

test("desktop PATH keeps existing entries and appends macOS tool locations once", () => {
  const env = { PATH: "/custom/bin" };
  ensureExecutablePath(env, "darwin");
  const entries = env.PATH.split(":");
  assert.equal(entries[0], "/custom/bin");
  assert.ok(entries.includes("/usr/bin"));
  assert.ok(entries.includes("/opt/homebrew/bin"));
  assert.equal(entries.filter((entry) => entry === "/usr/bin").length, 1);

  ensureExecutablePath(env, "darwin");
  assert.equal(env.PATH.split(":").filter((entry) => entry === "/usr/bin").length, 1);
});

test("desktop PATH is rebuilt when the GUI environment supplies none", () => {
  const env = {};
  ensureExecutablePath(env, "darwin");
  const entries = env.PATH.split(":");
  assert.ok(entries.includes("/usr/bin"));
  assert.ok(entries.includes("/bin"));
});

test("desktop PATH includes Linux system and snap locations", () => {
  const env = {};
  ensureExecutablePath(env, "linux");
  const entries = env.PATH.split(":");
  assert.ok(entries.includes("/usr/bin"));
  assert.ok(entries.includes("/snap/bin"));
});
