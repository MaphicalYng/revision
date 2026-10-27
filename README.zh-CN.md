# revision

[English](README.md) | 简体中文

一个零依赖的 Web UI，用于浏览本地 Git 仓库：分支、提交历史，以及**带对齐行号的并排 Commit Diff**——左侧为旧文件、右侧为新文件，每一行两侧都有行号，并对变更 token 提供词级高亮。

![revision 桌面应用，展示 Commit Diff、文件树和提交历史](docs/revision-desktop.png)

视觉参考：[Linear](https://linear.app) 风格的深色 UI，[GitHub Dark](https://github.com) 风格的 Diff 配色。

```
┌──────────────────────────────────────────────────────────────┐
│ ⎇ revision   [alpha ▾]  [main ▾]                      ⟳     │
├──────────────┬───────────────────────────────────────────────┤
│ Commits      │  refactor server, add util + assets           │
│  filter…     │  Demo Dev · Oct 1, 2026 · a1b2c3d · 5 files  │
│ ──────────── │ ┌ src/server.ts │A src/util.ts │R docs/… ┐    │
│ ● a1b2c3 v2… │ ├───────────────────────────────────────────┤ │
│ ○ 9f8e7d …   │ │  @@ -1,5 +1,6 @@                            │ │
│ ○ 3c4d5e …   │ │   1  import http…   │ 1  import http…       │ │
│              │ │   2                 │ 2  import { readFi…   │ │
│ ○ 1f2e3d …   │ │   3  const server…  │ 3  const server…      │ │
│ [Load more]  │ │   4    res.writ…    │ 4 -  res.end('hello…  │ │
│              │ │   5                 │ 5 +  res.end('hello…  │ │
│              │ │   6  });            │ 6  });                │ │
│              │ └───────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────┘
```

## 安装

要求 Node.js >= 18，且 Git 可通过 `PATH` 调用。

```bash
npm install -g @maphicalyng/revision
```

也可以直接通过 npx 运行（无需按需编译——发布的包已经包含纯 JS）：

```bash
npx @maphicalyng/revision ~/code
```

## 用法

```bash
revision [dir]            # 提供 `dir` 下的仓库（默认为当前工作目录）
  -p, --port <n>          # 默认 4777；端口被占用时最多向后尝试 20 个端口
  --host <ip>             # 默认 127.0.0.1；局域网访问可使用 0.0.0.0
  --token <secret>        # 访问令牌（默认随机生成，并在启动时打印）
  --no-auth               # 禁用令牌认证（仅限回环地址！）
  --no-open               # 不自动打开浏览器
  -v, --version           # 输出包版本
  -h, --help              # 输出用法
```

**令牌认证默认开启。** 每次启动都会生成随机令牌，并打印可直接使用的 URL：

```
revision ~/code
  listen  : http://127.0.0.1:4777/?token=GgY9rM3xQ8wK2vZpL7sN4tRf
```

页面 URL 携带 `?token=`，并在每次 API 请求中转发为 `Authorization: Bearer` 请求头；API 客户端可以任选一种方式。没有有效令牌时，页面和 API 都会返回 `401`。令牌比较使用常量时间算法。通过 `--token <secret>` 可指定固定令牌（便于收藏 URL 或运行多个客户端）；`--no-auth` 仅应在绑定回环地址或已有反向代理认证时使用。

当 `dir` 本身是 Git 仓库时，它会显示在列表中（因此 `revision ~/code/app` 可用）；`dir` 下每个包含 `.git` 条目的直接子目录也会显示。点击左侧的 Commit，在 Diff 旁的文件树中选择文件，即可查看 Diff。

桌面应用是运行同一 UI 的另一种方式，CLI/Web 工作流仍然可用：默认端口仍为 4777，除非传入 `--no-open`，否则 `revision` 仍会打开浏览器。

### 键盘

| 按键 | 操作 |
| --- | --- |
| `j` / `k` | 列表中的下一个 / 上一个 Commit |

## 桌面应用

桌面构建为各平台提供独立应用：

| 平台 | 安装包 |
| --- | --- |
| macOS | 包含 `.app` 的 DMG，支持 arm64 和 x64 |
| Windows | NSIS 安装程序，x64 |
| Linux | AppImage，x64 |

直接启动应用即可：Electron/Chromium 和 Node 运行时均已包含，无需系统安装 Node.js、npm、终端或外部浏览器。**Git 未捆绑在内。** 请单独安装 Git。应用会搜索 `PATH` 及标准安装位置（`/usr/bin`、`/opt/homebrew/bin`、`/usr/local/bin`，以及 Linux 上的 `/snap/bin`）。如果 Git 缺失或无法运行，应用会显示带 **Retry** 的原生错误提示。

### macOS DMG

发布的 DMG 未签名且未经公证，因此 macOS 可能会阻止下载后的应用直接打开。打开 DMG 并将 `revision.app` 复制到 `/Applications` 后，请移除其隔离属性：

```bash
xattr -dr com.apple.quarantine /Applications/revision.app
```

随后即可正常启动 revision。请仅对信任的应用执行此命令。

首次启动时，应用会显示欢迎页，而不是自动打开仓库。请选择一个 Git 仓库，或选择一个直接子目录为仓库的文件夹；后续启动会恢复上次成功打开的文件夹。**Open Folder…** 使用原生目录选择器，**Open Recent** 最多保留 10 个文件夹，并提供 **Clear Recent**。文件夹发现规则与 CLI 相同：如果所选文件夹本身是 Git 仓库，会将其包含在内；其包含 `.git` 条目的直接子目录也会被包含。切换文件夹时不会要求确认，因为 revision 是只读的。

### 桌面键盘快捷键

| 操作 | macOS | Windows / Linux |
| --- | --- | --- |
| Open Folder… | `⌘O` | `Ctrl+O` |
| 刷新数据（不是重新加载整个页面） | `⌘R` | `Ctrl+R` |
| 显示 / 隐藏 Commit 列表 | `⌘B` | `Ctrl+B` |
| 筛选 Commit | `⌘F` | `Ctrl+F` |
| 筛选变更文件 | `⇧⌘F` | `Ctrl+Shift+F` |
| 下一个 / 上一个 Commit | `j` / `k` | `j` / `k` |
| 关闭 / 退出 | `⌘W` / `⌘Q` | 系统标准快捷键 |
| 撤销、重做、剪切、复制、粘贴、全选 | 系统标准快捷键 | 系统标准快捷键 |

### 窗口与布局

窗口大小、位置和最大化状态、明暗主题、Commit 列表折叠状态以及两个面板的宽度都会在重启后保留。Commit 消息分隔条的初始高度会适配所选 Commit 的消息，因此切换 Commit 时会重新适配。拖动分隔条，或聚焦后使用上下方向键，可覆盖当前 Commit 的高度；双击可重新适配消息高度。

| 面板 | 可调范围 | 默认值 |
| --- | --- | --- |
| Commit 列表 | 宽 240–420 px | 320 px |
| 变更文件树 | 宽 200–380 px | 264 px |
| Commit 消息 | 88 px 至可用高度 | 适配内容；长消息正文在 26vh 处滚动 |

### 构建桌面安装包

```bash
npm run dev:desktop   # 构建并启动 Electron 应用
npm run dist:desktop  # 构建本地安装包，不发布
```

安装包输出到 `release/`。未签名的本地安装包可用于验证。公开分发时，macOS 需要 Apple 代码签名和公证，Windows 需要代码签名；仓库中不包含签名凭证。Windows 和 Linux 安装包尚未在本机验证。

## 功能

- **仓库发现**——目标目录本身为仓库时会被包含，同时扫描下一层目录；支持 worktree 和 submodule（`.git` 文件或目录），名称冲突时添加后缀，最多 100 个仓库；每次刷新浏览器时重新扫描
- **分支**——本地分支并预选当前分支；远程分支位于单独的 optgroup 中
- **可搜索下拉框**——仓库和分支选择器使用自定义下拉框（非原生 `<select>`），支持输入筛选、键盘导航（↑↓ Enter Esc）、分组分支列表（Local / Remote），以及标记当前选中项
- **文件树搜索**——文件树顶部的筛选框可实时缩小到匹配路径（显示扁平化完整路径）
- **Commit 列表**——可折叠侧栏（记住偏好），每页 100 条并提供“Load more”；服务端全历史搜索（匹配标题、作者名称或邮箱和 SHA——短 SHA 或完整 40 字符 SHA，支持任意长度前缀）、合并 Commit 标记、相对时间戳
- **文件树**——变更文件以可展开目录树显示在 Diff 旁（不是标签栏），提供每个文件和目录的 `+x −y` 统计及 `A`/`M`/`D`/`R`/`U` 状态标记；自动展开指向所选文件的路径，其余路径默认折叠
- **Working tree**——Commit 列表顶部的“Working tree”条目显示未提交变更（合并暂存和未暂存内容，与 HEAD 比较）；支持重命名感知的文件状态、来自 numstat 的每文件 `+x −y` 统计、将未跟踪文件渲染为全新行 Diff、文件和完全未跟踪目录上的 `U` 标记，以及无提交分支支持
- **Commit 详情**——完整消息正文、作者、精确日期、可复制的 SHA 和文件路径，以及 `files changed / +ins / −del` 汇总统计
- **并排 Diff**——旧文件在左、新文件在右，各自带行号；删除和新增行段逐行配对，使两列保持对齐，未配对的多余行在对侧显示空单元格
- **语法高亮**——根据文件扩展名高亮 Diff 行（32 种扩展名映射语言，来自内置的 37 语言 [highlight.js](https://highlightjs.org) common bundle——无 CDN、无额外依赖，仍是一个自包含 HTML 页面）；GitHub 明暗 token 配色跟随主题切换；词级变更标记叠加在高亮行上，使跨变更的字符串和注释保留颜色；超过 5000 个 Diff 行的文件会跳过高亮以保持速度
- **词级高亮**——配对的变更行会拆分为公共前缀 / 变更中段 / 公共后缀 token span，因此只有实际变更部分会高亮
- **Hunk 标头**——变更块之间显示 `@@ -a,b +c,d @@` 分隔符
- **可折叠上下文**——Hunk 上方、之间和下方的空间渲染为细条（`↑ 46 lines above [+20] [all]`）；`+20` 向 Diff 方向多显示 20 行，中间空隙每侧增加 10 行，`all` 展开整个区域；Diff 标头中的 corners 按钮可展开**整个文件**（并再次折叠）。展开通过局部 DOM 插入完成，不重新渲染，滚动位置不会跳动；展开的行复用相同的语法高亮，并与 Hunk 共享 5000 行预算
- **二进制和超大文件**——检测后显示提示，避免页面卡住（约 1.5 MB 以上的 Diff 会被拒绝，并显示可复制的 `git diff` 命令）；超过 1,000,000 字节的文件仍显示 Hunk，但无法使用折叠上下文和整文件展开
- **合并 Commit**——与第一个父提交计算 Diff，并在标头中显示说明
- **根 Commit**——通过 `git diff-tree --root` / `git show` 处理
- **Hash 路由**——导航时同步 `#r=<repo>&b=<branch>&c=<sha>`，因此仓库、分支和 Commit 导航可分享、可收藏
- **安全**——默认启用令牌认证（每次启动生成随机令牌，打印可直接使用的 URL；通过 `--token` 固定令牌，`--no-auth` 可关闭）；常量时间比较；仓库 ID 来自发现扫描，绝不使用原始路径；revision 必须是十六进制；文件路径必须是仓库相对路径；所有 Git 调用均使用参数数组（不使用 shell）；`GIT_OPTIONAL_LOCKS=0` 防止读取操作触碰索引锁；默认绑定 localhost
- **服务状态与构建版本**——标头通过需要认证的 10 秒健康检查和浏览器网络事件显示已连接 / 已断开状态；页脚显示工具构建日期和源码 Commit ID，这些信息在构建时嵌入，因此 npm 安装不需要工具的 `.git` 目录

## 架构

CLI/Web UI 没有运行时 npm 依赖：Node >= 18、原生 `node:http`，以及编译到 `dist/` 的 TypeScript。

```
src/
  cli.ts      参数解析、浏览器启动
  server.ts   HTTP 服务器、路由、输入验证、JSON API
  git.ts      使用参数数组安全调用 git CLI
  diff.ts     unified-diff 解析器 + 并排逐行配对 + 词级 span
  page.ts     单页 UI（内联 CSS/JS，无构建步骤）
  hljs.ts     内置 highlight.js v11.11.1（common bundle），内联到页面
  desktop/
    main.ts    Electron 生命周期、原生文件夹会话和窗口状态
    preload.cts  沙箱 contextBridge API 和桌面命令订阅
    menu.ts    原生菜单、最近文件夹和快捷键
    settings.ts  持久化最近文件夹和窗口位置
    env.ts     用于 Git 发现的 GUI PATH 增强
    ipc.ts     主进程与 preload 共享的 IPC 通道名称
    welcome.ts 首次启动欢迎页
bin/
  revision.js  npm bin 包装器 -> dist/cli.js
scripts/
  demo.mjs     在 /tmp/revision-demo 下生成示例仓库
  build-version.mjs  将构建日期和工具 Commit ID 嵌入 src/build-info.ts
tests/
  *.test.mjs  桌面菜单 / 设置 / 页面契约和服务器端口行为
```

数据流：

```
page --GET /api/repos----------------> server --fs scan------------> 仓库列表
page --GET /api/repo/:id/branches----> server --git branch---------> 本地 + 远程分支
page --GET /api/health---------------> server（需要认证的存活检查）
page --GET /api/repo/:id/log?branch--> server --git log------------> Commit 行
page --GET /api/repo/:id/commit/:sha-> server --git diff-tree/show-> 文件列表 + 统计
page --GET /api/repo/:id/work--------> server --git status/diff-----> working-tree 文件 + 统计
page --GET .../diff?file=-----------> server --git diff + parse---> { hunks: [{ rows }] }
page --GET .../work/diff?file=------> server --git diff + parse---> working-tree hunks
page --GET .../file?file=-----------> server --git cat-file/fs read--> { old, new } 完整文本（用于折叠上下文）
page --GET .../work/file?file=------> server --git show/fs read------> working-tree 完整文本
page 将行渲染为 4 列网格：[旧行号][旧代码][新行号][新代码]
```

行号对齐是配对问题，而不是渲染问题：在每个 Hunk 内，上下文行同时携带两个行号，缓冲的删除行与后续新增行逐行配对，剩余未配对行在对侧显示空单元格。结果是两列始终逐行对齐。

## 开发

```bash
npm install
npm run build          # 嵌入构建日期 + Commit ID，然后 tsc -> dist/
npm run demo           # 在 /tmp/revision-demo 中创建示例仓库
node bin/revision.js /tmp/revision-demo
```

## 许可证

MIT
