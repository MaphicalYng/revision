import test from "node:test";
import assert from "node:assert/strict";

import { handleDesktopRequest } from "../dist/desktop/request.js";

const session = {
  token: "<test-token>",
  loopbackUrl: "http://127.0.0.1:4777/",
  loopbackOrigin: "http://127.0.0.1:4777",
  server: null,
};

for (const [method, path] of [
  ["POST", "/api/repo/demo/pull?branch=main"],
  ["DELETE", "/api/repo/demo/work/untracked?file=scratch.txt"],
]) {
  test(`desktop proxy forwards ${method} mutations to the local server`, async () => {
    const calls = [];
    const response = await handleDesktopRequest(
      new Request(`revision://app${path}`, { method }),
      session,
      async (input, init) => {
        calls.push({ url: String(input), init });
        return new Response('{"ok":true}', { status: 200 });
      },
    );

    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `http://127.0.0.1:4777${path}`);
    assert.equal(calls[0].init.method, method);
    assert.equal(calls[0].init.headers.get("Authorization"), "Bearer <test-token>");
  });
}

test("desktop proxy keeps read requests and rejects unsupported methods", async () => {
  const read = await handleDesktopRequest(
    new Request("revision://app/api/health"),
    session,
    async () => new Response('{"ok":true}'),
  );
  assert.equal(read.status, 200);

  let forwarded = false;
  const rejected = await handleDesktopRequest(
    new Request("revision://app/api/repo/demo/pull", { method: "PUT" }),
    session,
    async () => {
      forwarded = true;
      return new Response();
    },
  );
  assert.equal(rejected.status, 405);
  assert.equal(forwarded, false);
});

test("welcome page remains read-only", async () => {
  const response = await handleDesktopRequest(
    new Request("revision://app/welcome", { method: "POST" }),
    session,
    async () => {
      throw new Error("must not forward");
    },
  );
  assert.equal(response.status, 405);
});
