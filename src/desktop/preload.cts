import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

// Keep in sync with ipc.ts. Sandboxed preload cannot require local modules.
const COMMAND_CHANNEL = "desktop:command";
const OPEN_FOLDER_CHANNEL = "desktop:open-folder";
type DesktopCommand = "refresh" | "toggle-sidebar" | "filter-commits" | "filter-files";
const COMMANDS: ReadonlySet<string> = new Set([
  "refresh",
  "toggle-sidebar",
  "filter-commits",
  "filter-files",
]);

interface RevisionDesktop {
  readonly runtime: "desktop";
  readonly platform: NodeJS.Platform;
  openFolder(): Promise<void>;
  onCommand(listener: (command: DesktopCommand) => void): () => void;
}

const api: RevisionDesktop = {
  runtime: "desktop",
  platform: process.platform,
  openFolder: () => ipcRenderer.invoke(OPEN_FOLDER_CHANNEL) as Promise<void>,
  onCommand(listener) {
    const wrapped = (_event: IpcRendererEvent, value: unknown): void => {
      if (typeof value === "string" && COMMANDS.has(value)) {
        listener(value as DesktopCommand);
      }
    };
    ipcRenderer.on(COMMAND_CHANNEL, wrapped);

    let active = true;
    return (): void => {
      if (!active) return;
      active = false;
      ipcRenderer.removeListener(COMMAND_CHANNEL, wrapped);
    };
  },
};

contextBridge.exposeInMainWorld("revisionDesktop", api);
