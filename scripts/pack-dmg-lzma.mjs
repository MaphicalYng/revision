import { execFile } from "node:child_process"
import { createHash } from "node:crypto"
import { createReadStream } from "node:fs"
import { readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { promisify } from "node:util"

const run = promisify(execFile)
const MB = 1_000_000 // 用十进制口径打印，与发布说明/报告一致

/**
 * 把 electron-builder 产出的 DMG 从 zlib（UDZO）换成 LZMA（ULMO），并同步修复更新元数据。
 *
 * 为什么不做成 electron-builder 钩子：`dmg.format` 白名单只有 UDZO/UDRO/UDBZ，
 * 而 `latest-*.yml`（sha512/size）由 `PublishManager.awaitTasks()` 在**所有钩子之后**才写出
 * （app-builder-lib/out/index.js:90）。所以转换只能放在构建完全结束后的独立步骤里，
 * 否则元数据会指向已经不存在的字节。
 *
 * 用法：node scripts/pack-dmg-lzma.mjs [输出目录，默认 release]
 * 实测：同一份 .app，UDZO(zlib-9) 123.4 MB → ULMO 91.7 MB（-25.7%），不删任何文件。
 */
const outputDir = process.argv[2] ?? "release"

if (process.platform !== "darwin") {
  console.log("跳过 DMG LZMA 转换：hdiutil 仅在 macOS 可用")
  process.exit(0)
}

const entries = await readdir(outputDir).catch(() => [])
const dmgs = entries.filter(name => name.endsWith(".dmg")).sort()

if (dmgs.length === 0) {
  console.log(`跳过 DMG LZMA 转换：${outputDir} 下没有 .dmg`)
  process.exit(0)
}

const digests = new Map()

for (const name of dmgs) {
  const dmg = join(outputDir, name)

  if (await isLzma(dmg)) {
    console.log(`  • 已是 LZMA，跳过: ${name}`)
    digests.set(name, await describe(dmg))
    continue
  }

  const { size: before } = await stat(dmg)
  // 临时名必须以 .dmg 结尾：hdiutil 在 -o 缺少该扩展名时会自动补上，导致随后 rename 扑空。
  const converted = dmg.replace(/\.dmg$/, ".ulmo.dmg")

  await run("hdiutil", ["convert", dmg, "-format", "ULMO", "-ov", "-quiet", "-o", converted])
  // 先确认产物存在再删原文件：宁可留下未优化的包，也不能把两个都弄丢。
  const { size: after } = await stat(converted).catch(error => {
    throw new Error(`hdiutil 未按预期生成 ${converted}: ${error.message}`)
  })
  await rm(dmg, { force: true })
  await rename(converted, dmg)

  // 字节变了：blockmap 与 latest-*.yml 的 sha512/size 全部失效。
  // 将来接入 electron-updater 时，blockmap 必须在转换**之后**重新生成，不能只删。
  await rm(`${dmg}.blockmap`, { force: true })

  digests.set(name, { sha512: await sha512Base64(dmg), size: after })
  console.log(
    `  • DMG → LZMA: ${name} ${(before / MB).toFixed(1)} MB → ${(after / MB).toFixed(1)} MB ` +
      `(-${(100 * (1 - after / before)).toFixed(1)}%)`,
  )
}

await patchUpdateInfo(digests)

async function isLzma(file) {
  const { stdout } = await run("hdiutil", ["imageinfo", file]).catch(() => ({ stdout: "" }))
  return /^Format: ULMO$/m.test(stdout)
}

async function describe(file) {
  const { size } = await stat(file)
  return { sha512: await sha512Base64(file), size }
}

async function patchUpdateInfo(digests) {
  const entries = await readdir(outputDir)
  const files = entries.filter(name => /^latest-.*\.yml$/.test(name))

  for (const name of files) {
    const file = join(outputDir, name)
    const source = await readFile(file, "utf8")
    const patched = patchDigests(source, digests)
    if (patched === source) {
      continue
    }
    await writeFile(file, patched)
    console.log(`  • 更新元数据已按 LZMA 产物重算: ${name}`)
  }
}

/**
 * 就地改写 electron-updater 元数据里的 sha512/size。该文件由 electron-builder 自己产出，
 * 结构固定（`files:` 下是 `- url:` / `sha512:` / `size:`，顶层另有 `path:` / `sha512:`），
 * 所以用行级改写而不是引入 YAML 依赖。
 */
function patchDigests(text, digests) {
  const lines = text.split("\n")
  const primary = /^path:\s*(.+)$/m.exec(text)?.[1]?.trim() ?? null
  let currentUrl = null

  for (let i = 0; i < lines.length; i++) {
    const url = /^\s*- url:\s*(.+)$/.exec(lines[i])
    if (url) {
      currentUrl = url[1].trim()
      continue
    }

    const field = /^(\s*)(sha512|size):\s*\S+\s*$/.exec(lines[i])
    if (!field) {
      continue
    }

    const [, indent, key] = field
    let lookup = currentUrl
    if (indent === "") {
      lookup = key === "sha512" ? primary : null
    }
    const target = lookup ? digests.get(lookup) : undefined

    if (target) {
      lines[i] = `${indent}${key}: ${key === "size" ? target.size : target.sha512}`
    }
  }

  return lines.join("\n")
}

async function sha512Base64(file) {
  const hash = createHash("sha512")
  for await (const chunk of createReadStream(file)) {
    hash.update(chunk)
  }
  return hash.digest("base64")
}
