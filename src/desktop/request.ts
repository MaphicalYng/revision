import type http from "node:http";

import { renderWelcomePage } from "./welcome.js";

export interface DesktopRequestSession {
  token: string;
  loopbackUrl: string;
  loopbackOrigin: string;
  server: http.Server;
}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export async function handleDesktopRequest(
  request: Request,
  active: DesktopRequestSession | undefined,
  fetchImpl: Fetch,
): Promise<Response> {
  const source = new URL(request.url);
  if (
    source.protocol !== "revision:" ||
    source.host !== "app" ||
    source.username ||
    source.password
  ) {
    return new Response("Not found", { status: 404 });
  }
  const readOnly = request.method === "GET" || request.method === "HEAD";
  const mutation = request.method === "POST" || request.method === "DELETE";
  if (!readOnly && !mutation) {
    return new Response("Method not allowed", { status: 405 });
  }

  if (source.pathname === "/welcome") {
    if (!readOnly) return new Response("Method not allowed", { status: 405 });
    return new Response(request.method === "HEAD" ? null : renderWelcomePage(), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'",
        "cache-control": "no-store",
      },
    });
  }

  if (!active) return new Response("No active session", { status: 503 });

  const target = new URL(active.loopbackUrl);
  target.pathname = source.pathname;
  target.search = source.search;
  target.hash = "";
  if (target.origin !== active.loopbackOrigin || target.hostname !== "127.0.0.1") {
    return new Response("Invalid session endpoint", { status: 500 });
  }

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.set("Authorization", `Bearer ${active.token}`);

  try {
    return await fetchImpl(target.toString(), {
      method: request.method,
      headers,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return new Response("Session unavailable", { status: 502 });
  }
}
