import { stat, rm } from "node:fs/promises"
import { basename, join } from "node:path"

/**
 * electron-builder afterPack 钩子：删掉运行时里本应用用不到的文件。
 *
 * 每一项的收益与风险见 plans/desktop-size.md §A2。原则是「只删可证明不参与运行的文件」：
 * 删错了应用起不来（`libffmpeg.dylib`、`icudtl.dat`、`resources.pak` 这类一律不动）。
 *
 * @param {import("app-builder-lib").AfterPackContext} context
 */
export default async function afterPack(context) {
  const { appOutDir, electronPlatformName, packager } = context
  const appRoot =
    electronPlatformName === "darwin"
      ? join(appOutDir, `${packager.appInfo.productFilename}.app`, "Contents")
      : appOutDir

  const removed = []
  let freed = 0

  for (const relativePath of REMOVALS[electronPlatformName] ?? []) {
    const file = join(appRoot, relativePath)
    try {
      const { size } = await stat(file)
      await rm(file, { force: true })
      freed += size
      removed.push(`${relativePath.split("/").pop()} ${(size / MB).toFixed(1)} MB`)
    } catch {
      // 当前 Electron 版本里没有这个文件 —— 不是错误，只是没得删。
    }
  }

  const archName = basename(appOutDir) // 例如 mac-arm64
  console.log(
    removed.length > 0
      ? `  • 裁剪运行时 (${electronPlatformName}/${archName}): ${removed.join(", ")} → -${(freed / MB).toFixed(1)} MB`
      : `  • 裁剪运行时 (${electronPlatformName}/${archName}): 无可删文件（可能已被上游移除）`,
  )
}

const MB = 1_000_000 // 用十进制口径打印，与发布说明/报告一致

const REMOVALS = {
  darwin: [
    // 无 GPU 时的软件渲染兜底（Vulkan/SwiftShader），16.5 MB。
    // 有 GPU 的机器不会加载它；无 GPU 的虚拟机/远程桌面可能白屏 —— 发版前在 VM 里回归一次。
    "Frameworks/Electron Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib",
    "Frameworks/Electron Framework.framework/Versions/A/Libraries/vk_swiftshader_icd.json",
    // 崩溃上报守护进程，1.2 MB。本应用没有接入任何崩溃收集服务。
    "Frameworks/Electron Framework.framework/Versions/A/Helpers/chrome_crashpad_handler",
  ],
  win32: ["vk_swiftshader.dll", "vk_swiftshader_icd.json"],
  linux: ["libvk_swiftshader.so", "vk_swiftshader_icd.json", "chrome_crashpad_handler"],
}
