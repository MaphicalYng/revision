import type { MenuItemConstructorOptions } from "electron";

import type { DesktopCommand } from "./ipc.js";

export interface MenuActions {
  openFolder(): void;
  openRecent(root: string): void;
  clearRecent(): void;
  command(command: DesktopCommand): void;
}

export function createMenuTemplate(
  platform: NodeJS.Platform,
  recentRoots: readonly string[],
  actions: MenuActions,
): MenuItemConstructorOptions[] {
  const recentItems: MenuItemConstructorOptions[] = recentRoots.length === 0
    ? [{ label: "No Recent Folders", enabled: false }]
    : recentRoots.slice(0, 10).map((root) => ({
        label: root,
        click: () => actions.openRecent(root),
      }));
  recentItems.push(
    { type: "separator" },
    {
      label: "Clear Recent",
      enabled: recentRoots.length > 0,
      click: () => actions.clearRecent(),
    },
  );

  const fileMenu: MenuItemConstructorOptions[] = [
    {
      label: "Open Folder…",
      accelerator: "CmdOrCtrl+O",
      click: () => actions.openFolder(),
    },
    { label: "Open Recent", submenu: recentItems },
    { type: "separator" },
    { role: "close" },
  ];
  if (platform !== "darwin") {
    fileMenu.push({ type: "separator" }, { role: "quit" });
  }

  const template: MenuItemConstructorOptions[] = [];
  if (platform === "darwin") template.push({ role: "appMenu" });
  template.push(
    { label: "File", submenu: fileMenu },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        {
          label: "Refresh",
          accelerator: "CmdOrCtrl+R",
          click: () => actions.command("refresh"),
        },
        {
          label: "Toggle Commit List",
          accelerator: "CmdOrCtrl+B",
          click: () => actions.command("toggle-sidebar"),
        },
        { type: "separator" },
        {
          label: "Filter Commits",
          accelerator: "CmdOrCtrl+F",
          click: () => actions.command("filter-commits"),
        },
        {
          label: "Filter Changed Files",
          accelerator: "CmdOrCtrl+Shift+F",
          click: () => actions.command("filter-files"),
        },
      ],
    },
  );
  return template;
}
