import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { once } from "node:events";
import http from "node:http";

import { startServer } from "../dist/server.js";

const CSP =
  "default-src 'self'; " +
  "connect-src 'self'; " +
  "img-src 'self' data:; " +
  "object-src 'none'; " +
  "base-uri 'none'; " +
  "style-src 'unsafe-inline'; " +
  "script-src 'unsafe-inline'";

async function temporaryRoot(t) {
  const root = await mkdtemp(path.join(tmpdir(), "revision-server-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function closeHttpServer(server) {
  server.closeIdleConnections();
  server.closeAllConnections();
  if (!server.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function start(t, options) {
  const result = await startServer({
    root: await temporaryRoot(t),
    host: "127.0.0.1",
    token: null,
    ...options,
  });
  t.after(() => closeHttpServer(result.server));
  return result;
}

async function closeNetServer(server) {
  if (!server.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function reserveAdjacentPorts() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const blocker = net.createServer();
    blocker.listen(0, "127.0.0.1");
    await once(blocker, "listening");
    const address = blocker.address();
    assert(address && typeof address !== "string");
    const port = address.port;
    if (port >= 65535) {
      await closeNetServer(blocker);
      continue;
    }

    const probe = net.createServer();
    try {
      probe.listen(port + 1, "127.0.0.1");
      await once(probe, "listening");
      await closeNetServer(probe);
      return { blocker, port };
    } catch (error) {
      if (error.code !== "EADDRINUSE") {
        await closeNetServer(blocker);
        throw error;
      }
      await closeNetServer(probe);
      await closeNetServer(blocker);
    }
  }
  throw new Error("could not reserve an adjacent pair of TCP ports");
}

test("port 0 returns the actual reachable TCP port and cleans listeners", async (t) => {
  const { server, url } = await start(t, { port: 0 });
  const address = server.address();
  assert(address && typeof address !== "string");
  assert(address.port > 0);
  assert.equal(url, `http://127.0.0.1:${address.port}`);
  assert(!url.endsWith(":0"));

  const response = await fetch(`${url}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(server.listenerCount("error"), 0);
  // Node itself installs setupConnectionsTracking on every HTTP server.
  assert.equal(server.listenerCount("listening"), http.createServer().listenerCount("listening"));
});

test("an occupied fixed port falls back to the next port", async (t) => {
  const { blocker, port } = await reserveAdjacentPorts();
  t.after(() => closeNetServer(blocker));

  const { server, url } = await start(t, { port });
  assert.equal(server.address().port, port + 1);
  assert.equal(url, `http://127.0.0.1:${port + 1}`);
  const response = await fetch(`${url}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(server.listenerCount("error"), 0);
  assert.equal(server.listenerCount("listening"), http.createServer().listenerCount("listening"));
});

test("HTML and API responses share the inline-compatible CSP", async (t) => {
  const { url } = await start(t, { port: 0 });

  const page = await fetch(`${url}/`);
  const html = await page.text();
  assert.equal(page.status, 200);
  assert.equal(page.headers.get("content-security-policy"), CSP);
  assert.match(html, /<script>/);
  assert.match(html, /<style>/);
  assert.match(html, /data:image/);

  const health = await fetch(`${url}/api/health`);
  assert.equal(health.status, 200);
  assert.equal(health.headers.get("content-security-policy"), CSP);
  await health.arrayBuffer();
});
