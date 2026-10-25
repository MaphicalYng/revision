/**
 * First-run desktop screen. It is served directly by the revision:// protocol
 * before any repository session exists, so it must stay self-contained.
 */
export function renderWelcomePage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<script>try{if(localStorage.getItem("revision-theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}</script>
<title>revision</title>
<style>
  :root {
    color-scheme: light;
    --bg: #ffffff;
    --text: #1f2328;
    --text-2: #59636e;
    --text-3: #8b949e;
    --accent: #0969da;
    --accent-hover: #0550ae;
    --accent-glow: rgba(9, 105, 218, 0.07);
    --border: #d1d9e0;
    --panel: #f6f8fa;
    --focus: rgba(9, 105, 218, 0.35);
    --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  [data-theme="dark"] {
    color-scheme: dark;
    --bg: #0c0e12;
    --text: #e6e9ef;
    --text-2: #9aa3b2;
    --text-3: #5d6472;
    --accent: #5b9dff;
    --accent-hover: #7ab0ff;
    --accent-glow: rgba(91, 157, 255, 0.09);
    --border: #232833;
    --panel: #12151b;
    --focus: rgba(91, 157, 255, 0.4);
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font: 14px/1.5 var(--sans);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background: radial-gradient(620px 380px at 50% 38%, var(--accent-glow), transparent 72%);
    pointer-events: none;
  }
  .welcome {
    position: relative;
    z-index: 1;
    width: min(560px, calc(100vw - 48px));
    padding: 48px 24px 56px;
    text-align: center;
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    margin-bottom: 20px;
    color: var(--accent);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 16px;
  }
  .mark svg { width: 28px; height: 28px; }
  h1 {
    margin: 0;
    font-size: 26px;
    line-height: 1.25;
    font-weight: 650;
    letter-spacing: -0.35px;
  }
  .lede {
    max-width: 430px;
    margin: 12px auto 28px;
    color: var(--text-2);
    font-size: 14px;
    line-height: 1.65;
  }
  .open {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-width: 168px;
    height: 40px;
    padding: 0 18px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: var(--accent);
    color: #fff;
    font: 600 13.5px var(--sans);
    cursor: pointer;
    transition: background-color 120ms ease, transform 120ms ease;
  }
  .open svg { width: 16px; height: 16px; flex: none; }
  .open:hover { background: var(--accent-hover); }
  .open:active { transform: scale(0.98); }
  .open:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
  .open:disabled { opacity: 0.65; cursor: default; transform: none; }
  .hint {
    margin: 24px 0 0;
    color: var(--text-3);
    font-size: 12.5px;
    line-height: 1.75;
  }
  .hint b { color: var(--text-2); font-weight: 550; }
  kbd {
    display: inline-block;
    min-width: 22px;
    padding: 1px 5px;
    border: 1px solid var(--border);
    border-bottom-width: 2px;
    border-radius: 5px;
    background: var(--panel);
    color: var(--text-2);
    font: 11px var(--mono);
  }
  .status {
    min-height: 18px;
    margin-top: 16px;
    color: var(--text-3);
    font-size: 12px;
  }
  @media (prefers-reduced-motion: reduce) {
    .open { transition: none; }
  }
</style>
</head>
<body>
<main class="welcome">
  <div class="mark" aria-hidden="true">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <circle cx="4.5" cy="3.5" r="1.8"/>
      <circle cx="4.5" cy="12.5" r="1.8"/>
      <circle cx="11.5" cy="8" r="1.8"/>
      <path d="M4.5 5.3v5.4M6 4.2l3.2 2.8M6 11.8l3.2-2.8"/>
    </svg>
  </div>
  <h1>Welcome to revision</h1>
  <p class="lede">Open a Git repository, or a folder whose direct subfolders are repositories.</p>
  <button class="open" id="openFolder" type="button" autofocus>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M1.5 4.5h4l1.3 1.5h7.7v7.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"/>
    </svg>
    <span class="label">Open Folder…</span>
  </button>
  <p class="hint">Press <kbd id="shortcut">⌘O</kbd> to open a folder at any time.<br>Recent folders stay available under <b>File → Open Recent</b>.</p>
  <div class="status" id="status" role="status" aria-live="polite"></div>
</main>
<script>
(function () {
  var desktop = window.revisionDesktop;
  var button = document.getElementById("openFolder");
  var label = button.querySelector(".label");
  var shortcut = document.getElementById("shortcut");
  var status = document.getElementById("status");

  if (shortcut) shortcut.textContent = desktop && desktop.platform === "darwin" ? "⌘O" : "Ctrl+O";
  if (!desktop) {
    button.disabled = true;
    label.textContent = "Open Folder unavailable";
    if (status) status.textContent = "Open this window from the revision desktop app.";
    return;
  }

  button.addEventListener("click", function () {
    if (button.disabled) return;
    button.disabled = true;
    label.textContent = "Opening…";
    Promise.resolve().then(function () {
      return desktop.openFolder();
    }).catch(function () {
      if (status) status.textContent = "Could not open the folder picker. Try again.";
    }).then(function () {
      button.disabled = false;
      label.textContent = "Open Folder…";
    });
  });
})();
</script>
</body>
</html>`;
}
