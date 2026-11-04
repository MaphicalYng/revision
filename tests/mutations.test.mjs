import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { startServer } from "../dist/server.js";

const exec = promisify(execFile);

async function git(repo, ...args) {
  const { stdout } = await exec("git", ["-C", repo, ...args]);
  return stdout;
}

async function commit(repo, message) {
  await git(repo, "-c", "user.name=Test User", "-c", "user.email=test@example.com", "commit", "--quiet", "-m", message);
}

async function serve(t, root) {
  const result = await startServer({ root, host: "127.0.0.1", port: 0, token: null });
  t.after(async () => {
    result.server.closeIdleConnections();
    result.server.closeAllConnections();
    if (!result.server.listening) return;
    await new Promise((resolve, reject) => {
      result.server.close((error) => (error ? reject(error) : resolve()));
    });
  });
  return result.url;
}

test("pull updates checked-out and non-checked-out local branches", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "revision-pull-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const remote = path.join(root, "remote.git");
  const seed = path.join(root, "seed");
  const repo = path.join(root, "repo");
  await git(root, "init", "--bare", "--quiet", "--initial-branch=main", remote);
  await mkdir(seed);
  await git(seed, "init", "--quiet", "--initial-branch=main");
  await writeFile(path.join(seed, "tracked.txt"), "initial\n");
  await git(seed, "add", "tracked.txt");
  await commit(seed, "Initial");
  await git(seed, "remote", "add", "origin", remote);
  await git(seed, "push", "--quiet", "-u", "origin", "main");
  await git(root, "clone", "--quiet", remote, repo);

  await writeFile(path.join(seed, "remote.txt"), "from remote\n");
  await git(seed, "add", "remote.txt");
  await commit(seed, "Remote update");
  await git(seed, "push", "--quiet");
  const url = await serve(t, root);

  const response = await fetch(`${url}/api/repo/repo/pull?branch=main`, { method: "POST" });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, branch: "main" });
  assert.equal(await readFile(path.join(repo, "remote.txt"), "utf8"), "from remote\n");

  await git(repo, "checkout", "--quiet", "-b", "other");
  await git(repo, "push", "--quiet", "-u", "origin", "other");
  await git(repo, "checkout", "--quiet", "main");
  await git(seed, "fetch", "--quiet", "origin");
  await git(seed, "checkout", "--quiet", "-b", "other", "origin/other");
  await writeFile(path.join(seed, "other.txt"), "other branch update\n");
  await git(seed, "add", "other.txt");
  await commit(seed, "Other branch update");
  await git(seed, "push", "--quiet");
  const expectedOther = (await git(seed, "rev-parse", "HEAD")).trim();

  const other = await fetch(`${url}/api/repo/repo/pull?branch=other`, { method: "POST" });
  assert.equal(other.status, 200);
  assert.deepEqual(await other.json(), { ok: true, branch: "other" });
  assert.equal((await git(repo, "rev-parse", "other")).trim(), expectedOther);
  assert.equal((await git(repo, "branch", "--show-current")).trim(), "main");
  await assert.rejects(readFile(path.join(repo, "other.txt"), "utf8"));

  await git(repo, "checkout", "--quiet", "other");
  await writeFile(path.join(repo, "local.txt"), "local only\n");
  await git(repo, "add", "local.txt");
  await commit(repo, "Local divergence");
  await git(repo, "checkout", "--quiet", "main");
  const divergedOther = (await git(repo, "rev-parse", "other")).trim();
  await writeFile(path.join(seed, "remote-again.txt"), "remote again\n");
  await git(seed, "add", "remote-again.txt");
  await commit(seed, "Remote divergence");
  await git(seed, "push", "--quiet");

  const nonFastForward = await fetch(`${url}/api/repo/repo/pull?branch=other`, { method: "POST" });
  assert.equal(nonFastForward.status, 502);
  assert.equal((await git(repo, "rev-parse", "other")).trim(), divergedOther);

  await git(repo, "branch", "without-upstream");
  const withoutUpstream = await fetch(`${url}/api/repo/repo/pull?branch=without-upstream`, { method: "POST" });
  assert.equal(withoutUpstream.status, 502);
  assert.match((await withoutUpstream.json()).error, /no upstream configured/);

  const remoteBranch = await fetch(`${url}/api/repo/repo/pull?branch=${encodeURIComponent("origin/main")}`, { method: "POST" });
  assert.equal(remoteBranch.status, 502);
  assert.match((await remoteBranch.json()).error, /not a local branch/);
});

test("delete removes only an existing untracked file", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "revision-delete-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo");
  await mkdir(repo);
  await git(repo, "init", "--quiet", "--initial-branch=main");
  await writeFile(path.join(repo, "tracked.txt"), "tracked\n");
  await git(repo, "add", "tracked.txt");
  await commit(repo, "Initial");
  await writeFile(path.join(repo, "tracked.txt"), "modified\n");
  await mkdir(path.join(repo, "notes"));
  await writeFile(path.join(repo, "notes", "scratch.txt"), "temporary\n");
  const url = await serve(t, root);

  const tracked = await fetch(`${url}/api/repo/repo/work/untracked?file=tracked.txt`, { method: "DELETE" });
  assert.equal(tracked.status, 400);
  assert.match((await tracked.json()).error, /not an untracked file/);
  assert.equal(await readFile(path.join(repo, "tracked.txt"), "utf8"), "modified\n");

  const response = await fetch(`${url}/api/repo/repo/work/untracked?file=${encodeURIComponent("notes/scratch.txt")}`, { method: "DELETE" });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, file: "notes/scratch.txt" });
  await assert.rejects(readFile(path.join(repo, "notes", "scratch.txt"), "utf8"));
  assert.equal(await readFile(path.join(repo, "tracked.txt"), "utf8"), "modified\n");

  const missing = await fetch(`${url}/api/repo/repo/work/untracked?file=${encodeURIComponent("notes/scratch.txt")}`, { method: "DELETE" });
  assert.equal(missing.status, 404);
});

test("add stages untracked files and directories, and commit excludes remaining untracked files", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "revision-add-commit-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo");
  await mkdir(repo);
  await git(repo, "init", "--quiet", "--initial-branch=main");
  await git(repo, "config", "user.name", "Test User");
  await git(repo, "config", "user.email", "test@example.com");
  await mkdir(path.join(repo, "mixed"));
  await writeFile(path.join(repo, "tracked.txt"), "tracked\n");
  await writeFile(path.join(repo, "mixed", "tracked.txt"), "tracked\n");
  await git(repo, "add", "tracked.txt", "mixed/tracked.txt");
  await commit(repo, "Initial");

  await writeFile(path.join(repo, "tracked.txt"), "modified\n");
  await writeFile(path.join(repo, "mixed", "tracked.txt"), "modified\n");
  await writeFile(path.join(repo, "mixed", "new.txt"), "new\n");
  await writeFile(path.join(repo, "scratch.txt"), "scratch\n");
  await mkdir(path.join(repo, "notes", "nested"), { recursive: true });
  await writeFile(path.join(repo, "notes", "a.txt"), "a\n");
  await writeFile(path.join(repo, "notes", "nested", "b.txt"), "b\n");
  await writeFile(path.join(repo, "left-alone.txt"), "untracked\n");
  const url = await serve(t, root);

  const tracked = await fetch(`${url}/api/repo/repo/work/untracked?file=tracked.txt`, { method: "POST" });
  assert.equal(tracked.status, 400);
  assert.match((await tracked.json()).error, /not an untracked file/);
  const mixed = await fetch(`${url}/api/repo/repo/work/untracked?file=mixed`, { method: "POST" });
  assert.equal(mixed.status, 400);
  assert.match((await mixed.json()).error, /directory contains tracked changes/);

  const fileAdd = await fetch(`${url}/api/repo/repo/work/untracked?file=scratch.txt`, { method: "POST" });
  assert.equal(fileAdd.status, 200);
  const directoryAdd = await fetch(`${url}/api/repo/repo/work/untracked?file=notes`, { method: "POST" });
  assert.equal(directoryAdd.status, 200);
  const staged = (await git(repo, "diff", "--cached", "--name-only")).trim().split("\n").sort();
  assert.deepEqual(staged, ["notes/a.txt", "notes/nested/b.txt", "scratch.txt"]);

  const trackedUndo = await fetch(`${url}/api/repo/repo/work/added?file=tracked.txt`, { method: "DELETE" });
  assert.equal(trackedUndo.status, 400);
  assert.match((await trackedUndo.json()).error, /not a newly added file/);
  const mixedUndo = await fetch(`${url}/api/repo/repo/work/added?file=mixed`, { method: "DELETE" });
  assert.equal(mixedUndo.status, 400);
  assert.match((await mixedUndo.json()).error, /not newly added/);

  const directoryUndo = await fetch(`${url}/api/repo/repo/work/added?file=notes`, { method: "DELETE" });
  assert.equal(directoryUndo.status, 200);
  assert.deepEqual((await git(repo, "diff", "--cached", "--name-only")).trim().split("\n"), ["scratch.txt"]);
  const fileUndo = await fetch(`${url}/api/repo/repo/work/added?file=scratch.txt`, { method: "DELETE" });
  assert.equal(fileUndo.status, 200);
  assert.equal((await git(repo, "diff", "--cached", "--name-only")).trim(), "");
  assert.equal(await readFile(path.join(repo, "scratch.txt"), "utf8"), "scratch\n");
  assert.equal(await readFile(path.join(repo, "notes", "nested", "b.txt"), "utf8"), "b\n");
  const undone = await (await fetch(`${url}/api/repo/repo/work`)).json();
  const undonePaths = undone.files.filter((file) => file.path === "scratch.txt" || file.path.startsWith("notes/"));
  assert.equal(undonePaths.length, 3);
  assert.ok(undonePaths.every((file) => file.untracked));

  await fetch(`${url}/api/repo/repo/work/untracked?file=scratch.txt`, { method: "POST" });
  await fetch(`${url}/api/repo/repo/work/untracked?file=notes`, { method: "POST" });
  const restaged = (await git(repo, "diff", "--cached", "--name-only")).trim().split("\n").sort();
  assert.deepEqual(restaged, ["notes/a.txt", "notes/nested/b.txt", "scratch.txt"]);

  const before = (await git(repo, "rev-parse", "HEAD")).trim();
  const emptyMessage = await fetch(`${url}/api/repo/repo/work/commit`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "   " }),
  });
  assert.equal(emptyMessage.status, 400);
  assert.equal((await git(repo, "rev-parse", "HEAD")).trim(), before);

  const committed = await fetch(`${url}/api/repo/repo/work/commit`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "Work update\n\nCommit body" }),
  });
  assert.equal(committed.status, 200);
  assert.deepEqual(await committed.json(), { ok: true });
  assert.match(await git(repo, "log", "-1", "--format=%B"), /Work update\n\nCommit body/);
  const committedFiles = (await git(repo, "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD")).trim().split("\n").sort();
  assert.deepEqual(committedFiles, ["mixed/tracked.txt", "notes/a.txt", "notes/nested/b.txt", "scratch.txt", "tracked.txt"]);
  assert.equal(await readFile(path.join(repo, "left-alone.txt"), "utf8"), "untracked\n");
  const remaining = await (await fetch(`${url}/api/repo/repo/work`)).json();
  assert.deepEqual(remaining.files.map((file) => file.path), ["left-alone.txt", "mixed/new.txt"]);
  assert.ok(remaining.files.every((file) => file.untracked));

  const nothingTracked = await fetch(`${url}/api/repo/repo/work/commit`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "No-op" }),
  });
  assert.equal(nothingTracked.status, 400);
  assert.match((await nothingTracked.json()).error, /no tracked changes/);
});
