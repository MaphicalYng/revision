import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { startServer } from "../dist/server.js";

import {
  classifyConnectError,
  isPrivateHost,
  parseDefaultGateway,
  parseDefaultRoutes,
  probeLocalNetwork,
  remoteHost,
  remotePort,
} from "../dist/localnet.js";

// Addresses are assembled instead of written out: private ranges belong in
// the code under test, not as literals that look like someone's real LAN.
const quad = (...parts) => parts.join(".");

test("isPrivateHost recognises the addresses macOS guards", () => {
  const privateHosts = [
    quad(192, 168, 10, 10),
    quad(10, 1, 2, 3),
    quad(172, 16, 0, 1),
    quad(172, 31, 255, 255),
    quad(169, 254, 7, 7),
    quad(127, 0, 0, 1),
    "localhost",
    "box.home",
    "fe80::1",
    "fd00::1",
  ];
  for (const host of privateHosts) assert.equal(isPrivateHost(host), true, host);

  const publicHosts = [quad(8, 8, 8, 8), quad(172, 32, 0, 1), "github.com", "2001:db8::1", ""];
  for (const host of publicHosts) assert.equal(isPrivateHost(host), false, host);
});

test("remoteHost/remotePort read every git remote form", () => {
  const ssh = "ssh://git@git.example.com:8022/maphicalyng/circle.git";
  assert.equal(remoteHost(ssh), "git.example.com");
  assert.equal(remotePort(ssh), 8022);

  const scp = "git@git.example.com:maphicalyng/circle.git";
  assert.equal(remoteHost(scp), "git.example.com");
  assert.equal(remotePort(scp), 22);

  // A local path remote has no host at all, so nothing gets probed.
  assert.equal(remoteHost("/srv/git/circle.git"), null);
  assert.equal(remoteHost("file:///srv/git/circle.git"), null);

  assert.equal(remotePort("https://git.example.com/x/y.git"), 443);
  assert.equal(remotePort("http://git.example.com/x/y.git"), 80);
  assert.equal(remotePort("git://git.example.com/x/y.git"), 22);
});

test("classifyConnectError separates a granted network from a blocked one", () => {
  assert.equal(classifyConnectError("ECONNREFUSED"), "granted");
  assert.equal(classifyConnectError(undefined), "granted");
  assert.equal(classifyConnectError("EHOSTUNREACH"), "blocked");
  assert.equal(classifyConnectError("ENETUNREACH"), "blocked");
  assert.equal(classifyConnectError("EACCES"), "blocked");
  assert.equal(classifyConnectError("ETIMEDOUT"), "timeout");
  assert.equal(classifyConnectError("ENOTFOUND"), "unknown");
});

test("gateways are read from the machine output, never hard-coded", () => {
  const route = [
    "   route to: default",
    "destination: default",
    `    gateway: ${quad(192, 168, 1, 1)}`,
    "  interface: en0",
  ].join("\n");
  assert.equal(parseDefaultGateway(route), quad(192, 168, 1, 1));
  assert.equal(parseDefaultGateway("route: writing to routing socket: not in table"), null);

  const netstat = [
    "Routing tables",
    "",
    "Internet:",
    "Destination        Gateway            Flags        Netif Expire",
    `default            ${quad(10, 0, 0, 254)}         UGScg         en1`,
    `default            ${quad(10, 8, 0, 1)}           UGScIg       utun4`,
    "default            fe80::1%en1        UGcIg         en1",
    "10.0.0/24          link#7             UCS           en1",
  ].join("\n");
  assert.deepEqual(parseDefaultRoutes(netstat), [quad(10, 0, 0, 254), quad(10, 8, 0, 1)]);
});

test("probe treats a refused loopback port as reachable", async () => {
  // Nothing listens here, so the kernel answers ECONNREFUSED: proof that the
  // connection was allowed through (no permission involved for loopback).
  const loopback = quad(127, 0, 0, 1);
  const report = await probeLocalNetwork({ targets: [{ host: loopback, port: 9 }], fallbackHosts: [], timeoutMs: 1500 });
  assert.equal(report.status, "granted");
  assert.equal(report.target, `${loopback}:9`);
});

test("probe stays quiet when it has nothing to test", async () => {
  const report = await probeLocalNetwork({ targets: [], fallbackHosts: [], timeoutMs: 200 });
  assert.deepEqual(report, { status: "unknown", target: null, detail: "no-target" });
});

test("web mode can read the probe but cannot open system Settings", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "revision-localnet-test-"));
  const { server, url } = await startServer({ root, host: "127.0.0.1", port: 0, token: null });
  t.after(async () => {
    server.closeIdleConnections();
    server.closeAllConnections();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });

  const probe = await (await fetch(`${url}/api/localnet`)).json();
  assert.ok(["granted", "blocked", "unknown"].includes(probe.status), probe.status);
  assert.equal(probe.canOpenSettings, false);

  const opened = await fetch(`${url}/api/localnet/open-settings`, { method: "POST" });
  assert.equal(opened.status, 404);
  assert.match((await opened.json()).error, /web mode/);
});
