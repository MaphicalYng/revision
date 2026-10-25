/**
 * Finder-launched macOS apps do not inherit a login shell's PATH, and an empty
 * PATH makes `execFile("git")` fail even though Git is installed. Append the
 * standard tool locations while preserving anything the environment supplied.
 */
export function ensureExecutablePath(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): void {
  const delimiter = platform === "win32" ? ";" : ":";
  const entries = (env.PATH ?? "").split(delimiter).filter(Boolean);
  const known = platform === "darwin"
    ? ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin", "/opt/local/bin"]
    : platform === "linux"
      ? ["/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin", "/snap/bin"]
      : [];
  for (const entry of known) {
    if (!entries.includes(entry)) entries.push(entry);
  }
  if (entries.length > 0) env.PATH = entries.join(delimiter);
}
