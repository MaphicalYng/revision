/**
 * macOS "Local Network" privacy probe.
 *
 * Since macOS 15 an app must be granted access to touch private network
 * addresses (RFC1918, link-local, `*.local`). Without the grant the kernel
 * *rejects* the connection instead of dropping packets, which makes the two
 * cases distinguishable in one short connect attempt:
 *
 *   connect ok / ECONNREFUSED   -> the LAN answered: the grant is in place
 *   EHOSTUNREACH / ENETUNREACH  -> rejected by the local-network policy
 *   timeout / anything else     -> unknown, stay quiet
 *
 * Only the first two are actionable, so `unknown` never produces a prompt.
 */

import { execFile } from "node:child_process";
import net from "node:net";

export type LocalNetworkStatus = "granted" | "blocked" | "unknown";

export interface LocalNetworkProbe {
  status: LocalNetworkStatus;
  /** The address that produced the verdict, e.g. `<gateway>:<port>`. */
  target: string | null;
  /** Short machine-readable reason, shown in the UI for support. */
  detail: string;
}

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

const PRIVATE_NAMES = [".local", ".lan", ".home", ".internal"];

/** True for RFC1918 / link-local IPv4, private IPv6, and mDNS-style names. */
export function isPrivateHost(rawHost: string): boolean {
  const host = rawHost.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return false;
  if (host === "localhost") return true;
  if (PRIVATE_NAMES.some((suffix) => host.endsWith(suffix))) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return PRIVATE_V4.some((re) => re.test(host));
  if (host.includes(":")) return /^f[cd][0-9a-f]{0,2}:/.test(host) || /^fe[89ab][0-9a-f]?:/.test(host);
  return false;
}

/**
 * Host of a git remote, without running git: understands `scheme://host/path`
 * and the scp-like `user@host:path` shorthand.
 */
export function remoteHost(remoteUrl: string): string | null {
  const url = remoteUrl.trim();
  if (!url) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    try {
      return new URL(url).hostname || null;
    } catch {
      return null;
    }
  }
  const scp = /^(?:[^@/]+@)?([^:/]+):/.exec(url);
  return scp ? scp[1] : null;
}

/** Port a git remote talks to, used so the probe tests the same door. */
export function remotePort(remoteUrl: string): number {
  const url = remoteUrl.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return 22;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 22;
  }
  if (parsed.port) return Number(parsed.port);
  if (parsed.protocol === "http:") return 80;
  if (parsed.protocol === "https:") return 443;
  return 22;
}

/** Map a socket error code onto the permission verdict it proves. */
export function classifyConnectError(code: string | undefined): LocalNetworkStatus | "timeout" {
  switch (code) {
    case undefined:
    case "ECONNREFUSED":
    case "ECONNRESET":
      return "granted";
    case "EHOSTUNREACH":
    case "EHOSTDOWN":
    case "ENETUNREACH":
    case "EACCES":
    case "EPERM":
      return "blocked";
    case "ETIMEDOUT":
    case "EAI_AGAIN":
      return "timeout";
    default:
      return "unknown";
  }
}

function connect(host: string, port: number, timeoutMs: number): Promise<LocalNetworkStatus | "timeout"> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (verdict: LocalNetworkStatus | "timeout") => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(verdict);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish("granted"));
    socket.once("timeout", () => finish("timeout"));
    socket.once("error", (error: NodeJS.ErrnoException) => finish(classifyConnectError(error.code)));
    socket.connect(port, host);
  });
}

/** Parse the `gateway:` line of `route -n get default`. Pure, so it is testable. */
export function parseDefaultGateway(routeOutput: string): string | null {
  const match = /^\s*gateway:\s*(\S+)$/m.exec(routeOutput);
  return match ? match[1] : null;
}

/**
 * Parse every `default  <gateway>` row of `netstat -rn -f inet`. A VPN adds
 * its own default route, so the LAN gateway is not always the primary one —
 * collecting all of them keeps the probe meaningful on tunnelled machines.
 */
export function parseDefaultRoutes(netstatOutput: string): string[] {
  const hosts: string[] = [];
  for (const line of netstatOutput.split("\n")) {
    const fields = line.trim().split(/\s+/);
    if (fields[0] !== "default") continue;
    const gateway = fields[1];
    // IPv4 only: a link-local IPv6 gateway carries a `%en1` zone that a plain
    // TCP connect cannot use, and failing to reach it would look like a denial.
    if (gateway && /^\d{1,3}(\.\d{1,3}){3}$/.test(gateway) && isPrivateHost(gateway)) hosts.push(gateway);
  }
  return hosts;
}

function run(command: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: 2000 }, (error, stdout) => resolve(error ? null : stdout));
  });
}

/**
 * Candidate LAN gateways for this machine, discovered at probe time. Never a
 * constant: the address belongs to whatever network the machine is on now.
 */
export async function lanGateways(): Promise<string[]> {
  const [routeOutput, netstatOutput] = await Promise.all([
    run("route", ["-n", "get", "default"]),
    run("netstat", ["-rn", "-f", "inet"]),
  ]);
  const found: string[] = [];
  if (routeOutput) {
    const gateway = parseDefaultGateway(routeOutput);
    if (gateway && /^\d{1,3}(\.\d{1,3}){3}$/.test(gateway) && isPrivateHost(gateway)) found.push(gateway);
  }
  if (netstatOutput) found.push(...parseDefaultRoutes(netstatOutput));
  return [...new Set(found)];
}

export interface ProbeTarget {
  host: string;
  port: number;
}

export interface ProbeOptions {
  /** Tried first — normally the git remote that just failed. */
  targets?: ProbeTarget[];
  /** Override the discovered gateways (tests, or an explicit user setting). */
  fallbackHosts?: string[];
  timeoutMs?: number;
}

/**
 * Walk the candidate addresses until one of them proves the permission state.
 * `blocked` wins over silence only when at least one target was actually
 * rejected; if every attempt merely times out the answer is `unknown`.
 */
export async function probeLocalNetwork(options: ProbeOptions = {}): Promise<LocalNetworkProbe> {
  const timeoutMs = options.timeoutMs ?? 1200;
  const attempts: ProbeTarget[] = [...(options.targets ?? [])];
  const fallbackHosts = options.fallbackHosts ?? (await lanGateways());

  // A remote port that is closed answers instantly with ECONNREFUSED, which is
  // itself proof of reachability; only add well-known ports when we have to.
  for (const host of fallbackHosts) {
    if (attempts.some((target) => target.host === host)) continue;
    for (const port of [445, 22, 80]) attempts.push({ host, port });
  }

  let sawTimeout = false;
  for (const target of attempts) {
    const verdict = await connect(target.host, target.port, timeoutMs);
    const label = `${target.host}:${target.port}`;
    if (verdict === "granted") return { status: "granted", target: label, detail: "reached" };
    if (verdict === "blocked") return { status: "blocked", target: label, detail: "host-unreachable" };
    sawTimeout = true;
  }

  if (attempts.length === 0) return { status: "unknown", target: null, detail: "no-target" };
  return { status: "unknown", target: null, detail: sawTimeout ? "timeout" : "no-answer" };
}

/** Settings deep link for Privacy & Security → Local Network (macOS 14+). */
export const LOCAL_NETWORK_SETTINGS_URL =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_LocalNetwork";
