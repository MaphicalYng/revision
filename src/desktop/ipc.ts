export const DESKTOP_COMMAND_CHANNEL = "desktop:command";
export const DESKTOP_OPEN_FOLDER_CHANNEL = "desktop:open-folder";

export type DesktopCommand = "refresh" | "toggle-sidebar" | "filter-commits" | "filter-files";

export interface RevisionDesktop {
  readonly runtime: "desktop";
  readonly platform: NodeJS.Platform;
  openFolder(): Promise<void>;
  onCommand(listener: (command: DesktopCommand) => void): () => void;
}
