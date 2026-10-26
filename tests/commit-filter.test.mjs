import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { log } from "../dist/git.js";
import { startServer } from "../dist/server.js";

const exec = promisify(execFile);

async function git(repo, ...args) {
  await exec("git", ["-C", repo, ...args]);
}

async function closeServer(server) {
  server.closeIdleConnections();
  server.closeAllConnections();
  if (!server.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("server-side search covers full history and paginates matching commits", async (t) => {
  const repo = await mkdtemp(path.join(tmpdir(), "revision-full-history-search-"));
  t.after(() => rm(repo, { recursive: true, force: true }));
  await git(repo, "init", "--quiet");
  await git(
    repo,
    "-c", "user.name=Alice Example",
    "-c", "user.email=Alice.Dev@Example.com",
    "commit", "--quiet", "--allow-empty", "-m", "Root unique searchable subject",
  );
  for (let i = 0; i < 101; i += 1) {
    await git(
      repo,
      "-c", "user.name=Bob Example",
      "-c", "user.email=bob@example.org",
      "commit", "--quiet", "--allow-empty", "-m", `Later change ${i}`,
    );
  }

  const firstPage = await log(repo, "HEAD", 0);
  assert.equal(firstPage.commits.length, 100);
  assert.equal(firstPage.hasMore, true);
  const remainder = await log(repo, "HEAD", 100);
  const oldest = remainder.commits.find((commit) => commit.author === "Alice Example");
  assert.ok(oldest, "test fixture must place Alice beyond the first 100 commits");
  assert.equal(oldest.parents, 0);
  assert.match(oldest.sha, /^[0-9a-f]{40}$/);
  assert.match(oldest.shortSha, /^[0-9a-f]+$/);
  assert.ok(!Number.isNaN(Date.parse(oldest.date)));

  for (const query of ["ALICE EXAMPLE", "alice.dev@example.com", "unique searchable", oldest.sha.slice(0, 12)]) {
    const result = await log(repo, "HEAD", 0, query);
    assert.equal(result.hasMore, false, query);
    assert.deepEqual(result.commits.map((commit) => commit.sha), [oldest.sha], query);
  }
  assert.deepEqual((await log(repo, "HEAD", 0, "nobody@example.invalid")).commits, []);

  const matches = await log(repo, "HEAD", 0, "BOB EXAMPLE");
  assert.equal(matches.commits.length, 100);
  assert.equal(matches.hasMore, true);
  assert.ok(matches.commits.every((commit) => commit.author === "Bob Example"));
  const nextMatches = await log(repo, "HEAD", 100, "bob@example.org");
  assert.equal(nextMatches.commits.length, 1);
  assert.equal(nextMatches.hasMore, false);
  assert.equal(nextMatches.commits[0].author, "Bob Example");

  const { server, url } = await startServer({ root: repo, host: "127.0.0.1", port: 0, token: null });
  t.after(() => closeServer(server));
  const repoId = encodeURIComponent(path.basename(repo));
  const response = await fetch(`${url}/api/repo/${repoId}/log?branch=HEAD&skip=0&q=${encodeURIComponent("ALICE.DEV@EXAMPLE.COM")}`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.commits.map((commit) => commit.sha), [oldest.sha]);
  assert.equal(body.hasMore, false);

  const invalid = await fetch(`${url}/api/repo/${repoId}/log?branch=HEAD&skip=0&q=${"x".repeat(301)}`);
  assert.equal(invalid.status, 400);
});
