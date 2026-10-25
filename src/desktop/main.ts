import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { constants as fsConstants, promises as fs } from "node:fs";
import type http from "node:http";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  net,
  protocol,
  screen,
  session,
  type IpcMainInvokeEvent,
} from "electron";

import { startServer } from "../server.js";
import { DESKTOP_COMMAND_CHANNEL, DESKTOP_OPEN_FOLDER_CHANNEL } from "./ipc.js";
import { createMenuTemplate } from "./menu.js";
import {
  clearRecentRoots,
  defaultDesktopSettings,
  loadDesktopSettings,
  recordRecentRoot,
  resolveWindowPlacement,
  saveDesktopSettings,
  type DesktopSettings,
} from "./settings.js";

const DESKTOP_SCHEME = "revision";
const DESKTOP_ORIGIN = "revision://app";
const DESKTOP_PAGE_URL = "revision://app/";

protocol.registerSchemesAsPrivileged([
  {
    scheme: DESKTOP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

interface Session {
  root: string;
  token: string;
  loopbackUrl: string;
  loopbackOrigin: string;
  server: http.Server;
  closing?: Promise<void>;
}

interface SwitchJob {
  id: number;
  root: string;
}

interface WindowState {
  saveTimer?: NodeJS.Timeout;
}

let settingsFile = "";
let settings = defaultDesktopSettings();
let settingsWrites: Promise<void> = Promise.resolve();
let mainWindow: BrowserWindow | undefined;
let controller: DesktopController | undefined;
let windowCreation: Promise<void> | undefined;
let folderPicker: Promise<string | undefined> | undefined;
let quitCleanup: Promise<void> | undefined;
let shutdownComplete = false;
const controllers = new Set<DesktopController>();
const windowStates = new WeakMap<BrowserWindow, WindowState>();

function closeSession(value: Session): Promise<void> {
  if (value.closing) return value.closing;
  value.closing = new Promise<void>((resolve, reject) => {
    if (!value.server.listening) {
      value.server.closeIdleConnections();
      value.server.closeAllConnections();
      resolve();
      return;
    }
    value.server.close((error) => {
      if (error && (error as NodeJS.ErrnoException).code !== "ERR_SERVER_NOT_RUNNING") {
        reject(error);
      } else {
        resolve();
      }
    });
    value.server.closeIdleConnections();
    value.server.closeAllConnections();
  });
  return value.closing;
}

function checkGit(): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile("git", ["--version"], { timeout: 5_000, windowsHide: true }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function ensureGitWithRetry(
  win: BrowserWindow,
  mode: "startup" | "switch",
): Promise<boolean> {
  for (;;) {
    try {
      await checkGit();
      return true;
    } catch {
      // The native dialog deliberately omits subprocess output and paths.
    }
    if (win.isDestroyed()) return false;
    let response: number;
    try {
      ({ response } = await dialog.showMessageBox(win, {
        type: "error",
        message: "Git is required",
        detail: "Install Git and make sure the git executable is available in PATH, then retry.",
        buttons: mode === "startup" ? ["Retry", "Quit"] : ["Retry", "Cancel"],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
      }));
    } catch {
      return false;
    }
    if (response === 0) continue;
    if (mode === "startup") app.quit();
    return false;
  }
}

async function validateRoot(root: string): Promise<void> {
  const stat = await fs.stat(root);
  if (!stat.isDirectory()) throw new Error("Selected path is not a directory");
  await fs.access(root, fsConstants.R_OK);
}

type FailureAction = "retry" | "open" | "cancel";

async function showSessionFailure(win: BrowserWindow): Promise<FailureAction> {
  if (win.isDestroyed()) return "cancel";
  try {
    const { response } = await dialog.showMessageBox(win, {
      type: "error",
      message: "Unable to open folder",
      detail: "The folder could not be opened. Retry, choose another folder, or cancel.",
      buttons: ["Retry", "Open Folder…", "Cancel"],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
    });
    return response === 0 ? "retry" : response === 1 ? "open" : "cancel";
  } catch {
    return "cancel";
  }
}

class DesktopController {
  private active?: Session;
  private candidate?: Session;
  private pending?: SwitchJob;
  private latestId = 0;
  private draining?: Promise<void>;
  private disposed = false;
  private initial = true;
  private shutdownPromise?: Promise<void>;

  constructor(
    private readonly win: BrowserWindow,
    private readonly onCommit: (root: string) => void,
  ) {}

  get activeSession(): Session | undefined {
    return this.active;
  }

  switchRoot(root: string): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.pending = { id: ++this.latestId, root: path.resolve(root) };
    if (!this.draining) {
      this.draining = this.drain().finally(() => {
        this.draining = undefined;
      });
    }
    return this.draining;
  }

  shutdown(): Promise<void> {
    if (this.shutdownPromise) return this.shutdownPromise;
    this.disposed = true;
    this.latestId += 1;
    this.pending = undefined;
    const sessions = new Set<Session>();
    if (this.active) sessions.add(this.active);
    if (this.candidate) sessions.add(this.candidate);
    this.active = undefined;
    this.candidate = undefined;
    this.shutdownPromise = Promise.all(
      [...sessions].map((value) => closeSession(value).catch(() => undefined)),
    ).then(() => undefined);
    return this.shutdownPromise;
  }

  private isCurrent(job: SwitchJob): boolean {
    return !this.disposed && job.id === this.latestId && !this.win.isDestroyed();
  }

  private async discard(value: Session): Promise<void> {
    if (this.active === value) this.active = undefined;
    if (this.candidate === value) this.candidate = undefined;
    await closeSession(value);
  }

  private async drain(): Promise<void> {
    while (this.pending && !this.disposed) {
      const job = this.pending;
      this.pending = undefined;
      const mode = this.initial ? "startup" : "switch";
      await this.runJob(job, mode);
      this.initial = false;
    }
  }

  private async runJob(job: SwitchJob, mode: "startup" | "switch"): Promise<void> {
    while (this.isCurrent(job)) {
      try {
        await validateRoot(job.root);
      } catch {
        if (!this.isCurrent(job)) return;
        const action = await showSessionFailure(this.win);
        if (!this.isCurrent(job)) return;
        if (action === "retry") continue;
        if (action === "open") void openFolder();
        return;
      }
      if (!this.isCurrent(job)) return;
      if (!(await ensureGitWithRetry(this.win, mode)) || !this.isCurrent(job)) return;

      let candidate: Session | undefined;
      try {
        const previous = this.active;
        this.active = undefined;
        if (previous) await closeSession(previous);
        if (!this.isCurrent(job)) return;

        const token = randomBytes(18).toString("base64url");
        const { server, url } = await startServer({
          root: job.root,
          host: "127.0.0.1",
          port: 0,
          token,
        });
        candidate = {
          root: job.root,
          token,
          loopbackUrl: url,
          loopbackOrigin: new URL(url).origin,
          server,
        };
        this.candidate = candidate;
        if (!this.isCurrent(job)) {
          await this.discard(candidate);
          return;
        }

        this.active = candidate;
        await this.win.loadURL(DESKTOP_PAGE_URL);
        if (!this.isCurrent(job)) {
          await this.discard(candidate);
          return;
        }

        this.win.setTitle(`revision — ${path.basename(job.root) || path.parse(job.root).root}`);
        this.onCommit(job.root);
        this.candidate = undefined;
        return;
      } catch {
        if (candidate) await this.discard(candidate).catch(() => undefined);
        if (!this.isCurrent(job)) return;
        const action = await showSessionFailure(this.win);
        if (!this.isCurrent(job)) return;
        if (action === "retry") continue;
        if (action === "open") void openFolder();
        return;
      }
    }
  }
}

async function handleDesktopRequest(request: Request): Promise<Response> {
  const source = new URL(request.url);
  if (
    source.protocol !== "revision:" ||
    source.host !== "app" ||
    source.username ||
    source.password
  ) {
    return new Response("Not found", { status: 404 });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const active = controller?.activeSession;
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
    return await net.fetch(target.toString(), {
      method: request.method,
      headers,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return new Response("Session unavailable", { status: 502 });
  }
}

function persistSettings(): Promise<void> {
  const snapshot: DesktopSettings = {
    ...settings,
    recentRoots: [...settings.recentRoots],
    window: settings.window ? { ...settings.window } : undefined,
  };
  const write = settingsWrites
    .catch(() => undefined)
    .then(() => saveDesktopSettings(settingsFile, snapshot));
  settingsWrites = write;
  return write;
}

function rebuildMenu(): void {
  const template = createMenuTemplate(process.platform, settings.recentRoots, {
    openFolder: () => {
      void openFolder();
    },
    openRecent: (root) => {
      const current = controller;
      if (current) void current.switchRoot(root);
    },
    clearRecent: () => {
      settings = clearRecentRoots(settings);
      rebuildMenu();
      void persistSettings().catch(() => undefined);
    },
    command: (command) => {
      const win = mainWindow;
      if (win && !win.isDestroyed() && controller?.activeSession) {
        win.webContents.send(DESKTOP_COMMAND_CHANNEL, command);
      }
    },
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function snapshotWindow(win: BrowserWindow): void {
  if (win.isDestroyed()) return;
  const bounds = win.getNormalBounds();
  settings = {
    ...settings,
    window: { ...bounds, maximized: win.isMaximized() },
  };
}

function flushWindowState(win: BrowserWindow): void {
  const state = windowStates.get(win);
  clearTimeout(state?.saveTimer);
  if (state) state.saveTimer = undefined;
  snapshotWindow(win);
  void persistSettings().catch(() => undefined);
}

function scheduleWindowSave(win: BrowserWindow): void {
  const state = windowStates.get(win);
  if (!state) return;
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    state.saveTimer = undefined;
    snapshotWindow(win);
    void persistSettings().catch(() => undefined);
  }, 250);
}

async function openFolder(): Promise<void> {
  const win = mainWindow;
  if (!win || win.isDestroyed()) return;
  if (!folderPicker) {
    folderPicker = (async () => {
      try {
        const result = await dialog.showOpenDialog(win, { properties: ["openDirectory"] });
        return result.canceled ? undefined : result.filePaths[0];
      } catch {
        return undefined;
      }
    })().finally(() => {
      folderPicker = undefined;
    });
  }
  const root = await folderPicker;
  if (!root || mainWindow !== win || win.isDestroyed()) return;
  await controller?.switchRoot(root);
}

function isDesktopOrigin(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "revision:" &&
      url.host === "app" &&
      !url.username &&
      !url.password;
  } catch {
    return false;
  }
}

function validIpc(event: IpcMainInvokeEvent): boolean {
  return !!mainWindow &&
    event.sender === mainWindow.webContents &&
    isDesktopOrigin(event.sender.getURL());
}

async function createMainWindow(): Promise<void> {
  if (mainWindow && !mainWindow.isDestroyed()) return;
  if (windowCreation) return windowCreation;
  windowCreation = (async () => {
    const primary = screen.getPrimaryDisplay().workArea;
    const placement = resolveWindowPlacement(
      settings.window,
      screen.getAllDisplays().map((display) => display.workArea),
      { width: Math.min(1440, primary.width), height: Math.min(900, primary.height) },
    );
    const targetWorkArea = placement.x === undefined || placement.y === undefined
      ? primary
      : screen.getAllDisplays().find((display) => {
          const area = display.workArea;
          return placement.x! >= area.x &&
            placement.y! >= area.y &&
            placement.x! + placement.width <= area.x + area.width &&
            placement.y! + placement.height <= area.y + area.height;
        })?.workArea ?? primary;
    const win = new BrowserWindow({
      title: "revision",
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      minWidth: Math.min(1024, targetWorkArea.width),
      minHeight: Math.min(700, targetWorkArea.height),
      show: false,
      webPreferences: {
        preload: fileURLToPath(new URL("./preload.cjs", import.meta.url)),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });
    const windowController = new DesktopController(win, (root) => {
      settings = recordRecentRoot(settings, root);
      rebuildMenu();
      void persistSettings().catch(() => undefined);
    });
    mainWindow = win;
    controller = windowController;
    controllers.add(windowController);
    windowStates.set(win, {});
    rebuildMenu();

    if (placement.center || placement.x === undefined || placement.y === undefined) win.center();
    if (placement.maximized) win.maximize();
    win.once("ready-to-show", () => {
      if (!win.isDestroyed()) win.show();
    });
    win.on("resize", () => scheduleWindowSave(win));
    win.on("move", () => scheduleWindowSave(win));
    win.on("maximize", () => scheduleWindowSave(win));
    win.on("unmaximize", () => scheduleWindowSave(win));
    win.on("close", () => flushWindowState(win));
    win.on("closed", () => {
      if (mainWindow === win) {
        mainWindow = undefined;
        controller = undefined;
      }
      windowStates.delete(win);
      void windowController.shutdown().finally(() => {
        controllers.delete(windowController);
      });
    });
    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    win.webContents.on("will-navigate", (event, target) => {
      if (!isDesktopOrigin(target)) event.preventDefault();
    });

    await windowController.switchRoot(settings.lastRoot ?? homedir());
  })().finally(() => {
    windowCreation = undefined;
  });
  return windowCreation;
}

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!app.isReady()) return;
    const win = mainWindow;
    if (!win) {
      void createMainWindow().catch(() => undefined);
      return;
    }
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow().catch(() => undefined);
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", (event) => {
    if (shutdownComplete) return;
    event.preventDefault();
    if (quitCleanup) return;
    quitCleanup = (async () => {
      try {
        for (const win of BrowserWindow.getAllWindows()) flushWindowState(win);
        await Promise.all([...controllers].map((item) => item.shutdown()));
        await settingsWrites.catch(() => undefined);
      } finally {
        shutdownComplete = true;
        app.quit();
      }
    })();
  });

  void app.whenReady().then(async () => {
    settingsFile = path.join(app.getPath("userData"), "settings.json");
    settings = await loadDesktopSettings(settingsFile);
    session.defaultSession.protocol.handle(DESKTOP_SCHEME, handleDesktopRequest);
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false);
    });
    ipcMain.handle(DESKTOP_OPEN_FOLDER_CHANNEL, async (event) => {
      if (!validIpc(event)) throw new Error("Unauthorized desktop IPC");
      await openFolder();
    });
    await createMainWindow();
  }).catch(() => {
    dialog.showErrorBox("Unable to start revision", "The desktop application could not be initialized.");
    app.quit();
  });
}
