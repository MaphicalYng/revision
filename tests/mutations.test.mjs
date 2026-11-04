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
