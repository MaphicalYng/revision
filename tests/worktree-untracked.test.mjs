import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { workDiffText, workStatus } from "../dist/git.js";

const exec = promisify(execFile);

async function git(repo, ...args) {
  await exec("git", ["-C", repo, ...args]);
}

test("nested untracked files are enumerated individually and produce diffs", async (t) => {
  const repo = await mkdtemp(path.join(tmpdir(), "revision-untracked-tree-"));
  t.after(() => rm(repo, { recursive: true, force: true }));
  await git(repo, "init", "--quiet");
  await writeFile(path.join(repo, "tracked.txt"), "old\n");
  await git(repo, "add", "tracked.txt");
  await git(repo, "-c", "user.name=Test User", "-c", "user.email=test@example.com", "commit", "--quiet", "-m", "Initial");
  await writeFile(path.join(repo, "tracked.txt"), "new\n");
  await mkdir(path.join(repo, ".pi", "tasks"), { recursive: true });
  await writeFile(path.join(repo, ".pi", "tasks", "item.json"), '{"task":1}\n');
  await writeFile(path.join(repo, ".pi", "notes.txt"), "untracked note\n");

  const status = await workStatus(repo);
  assert.equal(status.hasHead, true);
  assert.deepEqual(
    status.files.map((file) => ({ path: file.path, untracked: file.untracked })),
    [
      { path: "tracked.txt", untracked: false },
      { path: ".pi/notes.txt", untracked: true },
      { path: ".pi/tasks/item.json", untracked: true },
    ],
  );
  assert.ok(!status.files.some((file) => file.path === ".pi/"));

  const untrackedDiff = await workDiffText(repo, ".pi/tasks/item.json", true, status.hasHead);
  assert.match(untrackedDiff, /new file mode/);
  assert.match(untrackedDiff, /\+\{"task":1\}/);

  const trackedDiff = await workDiffText(repo, "tracked.txt", false, status.hasHead);
  assert.match(trackedDiff, /-old/);
  assert.match(trackedDiff, /\+new/);
});
