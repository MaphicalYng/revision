import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface DesktopWindowSettings {
  x?: number;
  y?: number;
  width: number;
  height: number;
  maximized: boolean;
}

export interface DesktopSettings {
  version: 1;
  lastRoot?: string;
  recentRoots: string[];
  window?: DesktopWindowSettings;
}

export interface DesktopRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowPlacement extends DesktopWindowSettings {
  center: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function defaultDesktopSettings(): DesktopSettings {
  return { version: 1, recentRoots: [] };
}

export function normalizeDesktopSettings(value: unknown): DesktopSettings {
  if (!isPlainObject(value) || value.version !== 1) return defaultDesktopSettings();

  const normalized = defaultDesktopSettings();
  if (typeof value.lastRoot === "string" && value.lastRoot.length > 0) {
    normalized.lastRoot = value.lastRoot;
  }

  if (Array.isArray(value.recentRoots)) {
    const seen = new Set<string>();
    for (const root of value.recentRoots) {
      if (typeof root !== "string" || root.length === 0 || seen.has(root)) continue;
      seen.add(root);
      normalized.recentRoots.push(root);
      if (normalized.recentRoots.length === 10) break;
    }
  }

  if (isPlainObject(value.window)) {
    const candidate = value.window;
    if (
      Number.isInteger(candidate.width) &&
      (candidate.width as number) > 0 &&
      Number.isInteger(candidate.height) &&
      (candidate.height as number) > 0 &&
      typeof candidate.maximized === "boolean"
    ) {
      const window: DesktopWindowSettings = {
        width: candidate.width as number,
        height: candidate.height as number,
        maximized: candidate.maximized,
      };
      if (Number.isInteger(candidate.x)) window.x = candidate.x as number;
      if (Number.isInteger(candidate.y)) window.y = candidate.y as number;
      normalized.window = window;
    }
  }

  return normalized;
}

export async function loadDesktopSettings(filePath: string): Promise<DesktopSettings> {
  let source: string;
  try {
    source = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return defaultDesktopSettings();
    throw error;
  }

  try {
    return normalizeDesktopSettings(JSON.parse(source) as unknown);
  } catch (error) {
    if (error instanceof SyntaxError) return defaultDesktopSettings();
    throw error;
  }
}

export async function saveDesktopSettings(filePath: string, settings: DesktopSettings): Promise<void> {
  const normalized = normalizeDesktopSettings(settings);
  const payload = `${JSON.stringify(normalized, null, 2)}\n`;
  const directory = path.dirname(filePath);
  await fs.mkdir(directory, { recursive: true });
  const temporaryPath = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let renamed = false;
  try {
    await fs.writeFile(temporaryPath, payload, { encoding: "utf8", flag: "wx", mode: 0o600 });
    await fs.rename(temporaryPath, filePath);
    renamed = true;
  } finally {
    if (!renamed) {
      await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
    }
  }
}

export function recordRecentRoot(settings: DesktopSettings, root: string): DesktopSettings {
  if (typeof root !== "string" || root.length === 0) {
    throw new TypeError("root must be a non-empty string");
  }
  const normalized = normalizeDesktopSettings(settings);
  return {
    ...normalized,
    lastRoot: root,
    recentRoots: [root, ...normalized.recentRoots.filter((item) => item !== root)].slice(0, 10),
  };
}

export function clearRecentRoots(settings: DesktopSettings): DesktopSettings {
  return { ...normalizeDesktopSettings(settings), recentRoots: [] };
}

export function resolveWindowPlacement(
  saved: DesktopWindowSettings | undefined,
  workAreas: readonly DesktopRectangle[],
  defaults: { width: number; height: number },
): WindowPlacement {
  if (!saved) {
    return {
      width: defaults.width,
      height: defaults.height,
      maximized: false,
      center: true,
    };
  }

  const placement: WindowPlacement = {
    width: saved.width,
    height: saved.height,
    maximized: saved.maximized,
    center: true,
  };
  if (saved.x === undefined || saved.y === undefined) return placement;

  const contained = workAreas.some(
    (area) =>
      saved.x! >= area.x &&
      saved.y! >= area.y &&
      saved.x! + saved.width <= area.x + area.width &&
      saved.y! + saved.height <= area.y + area.height,
  );
  if (contained) {
    placement.x = saved.x;
    placement.y = saved.y;
    placement.center = false;
  }
  return placement;
}
