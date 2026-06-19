/* Universal Video Speed - content script.
 * Finds the largest visible <video> in this document and lets you control its
 * playbackRate (0.25x-4x) with a slider and the < / > keys.
 *
 * The panel is hidden by default and appears in one of two ways:
 *   - PINNED open by clicking the toolbar icon (click again to hide). The click
 *     is relayed here by the background service worker.
 *   - FLASHED for 3s after the last < / > key-press, then it auto-hides.
 *
 * Runs in every frame but only shows the panel in frames that actually contain
 * a video, so the control appears wherever the real player lives - the main
 * page (YouTube, X) or a cross-origin <iframe> (JWPlayer embeds, etc.).
 */
(() => {
  "use strict";

  const MIN = 0.25, MAX = 4, KEY_STEP = 0.25, SLIDER_STEP = 0.05;
  const STORE_KEY = "uvs_rate";
  const FLASH_MS = 3000;       // how long the panel lingers after the last < / > press

  let video = null;            // the current "main" video element
  let rate = loadRate();       // desired playback rate (persisted per origin)
  let host = null, ui = null;  // shadow host + control refs
  let pinned = false;          // toggled open/closed by the toolbar icon
  let flashTimer = null;       // non-null while the panel is showing transiently

  function clamp(x) { return Math.min(MAX, Math.max(MIN, Math.round(x * 100) / 100)); }
  function loadRate() {
    try { const v = parseFloat(localStorage.getItem(STORE_KEY)); return clamp(isNaN(v) ? 1 : v); }
    catch { return 1; }
  }
  function saveRate() { try { localStorage.setItem(STORE_KEY, String(rate)); } catch {} }
  function fmt(r) { return r.toFixed(2).replace(/\.?0+$/, "") + "x"; }

  // Pick the largest reasonably-sized, visible video in this document.
  function findMainVideo() {
    let best = null, bestArea = 0;
    for (const v of document.querySelectorAll("video")) {
      const r = v.getBoundingClientRect();
      const cs = getComputedStyle(v);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      if (r.width < 100 || r.height < 60) continue;
      const area = r.width * r.height;
      if (area > bestArea) { bestArea = area; best = v; }
    }
    return best;
  }

  function applyRate() {
    if (video) { try { video.playbackRate = rate; } catch {} }
    if (ui) { ui.slider.value = String(rate); ui.label.textContent = fmt(rate); }
  }

  function nudge(delta) { rate = clamp(rate + delta); applyRate(); saveRate(); }

  // UI lives in a shadow root so the host page's CSS can't restyle it. It is
  // anchored to the top-right corner, i.e. roughly beneath the toolbar icon.
  function buildUI() {
    host = document.createElement("div");
    host.style.cssText =
      "all:initial; position:fixed; z-index:2147483647; top:12px; right:12px; display:block;";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        .panel{font:13px/1.4 system-ui,sans-serif;background:rgba(20,20,22,.86);color:#fff;
               border-radius:10px;padding:8px 10px;display:flex;align-items:center;gap:8px;
               box-shadow:0 2px 12px rgba(0,0,0,.4);user-select:none;}
        .label{min-width:46px;text-align:center;font-variant-numeric:tabular-nums;font-weight:600;}
        input[type=range]{width:140px;cursor:pointer;accent-color:#4aa3ff;}
        button{all:unset;cursor:pointer;opacity:.7;padding:0 4px;font-size:14px;}
        button:hover{opacity:1;}
      </style>
      <div class="panel">
        <button id="reset" title="Reset to 1x">&#x21BA;</button>
        <input type="range" id="slider" min="${MIN}" max="${MAX}" step="${SLIDER_STEP}">
        <span class="label" id="label">1x</span>
      </div>`;
    ui = { slider: root.getElementById("slider"),
           label: root.getElementById("label"),
           reset: root.getElementById("reset") };
    ui.slider.addEventListener("input", () => { rate = clamp(parseFloat(ui.slider.value)); applyRate(); saveRate(); });
    ui.reset.addEventListener("click", () => { rate = 1; applyRate(); saveRate(); });
    document.documentElement.appendChild(host);
    applyRate();
  }

  // The panel is visible only when there's a video AND it's either pinned open
  // or inside its post-keypress flash window. Recompute that and reflect it.
  function refresh() {
    const show = !!video && (pinned || flashTimer !== null);
    if (show && !host) buildUI();
    if (host) host.style.display = show ? "block" : "none";
  }

  // Reveal the panel transiently, (re)starting the auto-hide countdown.
  function flashPanel() {
    if (flashTimer !== null) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { flashTimer = null; refresh(); }, FLASH_MS);
    refresh();
  }

  // Toolbar icon -> pin/unpin the panel. Ignored when this frame has no video.
  function togglePinned() {
    video = findMainVideo();
    if (!video) return;
    pinned = !pinned;
    refresh();
  }

  // Keep the panel on top of fullscreen video by re-parenting it.
  function onFullscreen() {
    if (!host) return;
    (document.fullscreenElement || document.documentElement).appendChild(host);
  }

  // < / > handler that defers to the page when the page already consumed the key.
  function onKeydown(e) {
    if (e.key !== ">" && e.key !== "<") return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return; // don't hijack typing
    if (e.defaultPrevented) return;   // the page already handled this key -> stay out of its way
    if (!video) return;
    nudge(e.key === ">" ? KEY_STEP : -KEY_STEP);
    if (!pinned) flashPanel();        // pinned panels stay put; otherwise reveal briefly
  }

  function rescan() {
    const found = findMainVideo();
    if (found && found !== video) { video = found; applyRate(); }
    if (!found) video = null;
    refresh();
  }

  // The background service worker relays toolbar-icon clicks here.
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === "uvs-toggle") togglePinned();
    });
  }

  // Bubble-phase listener on window runs after virtually all page handlers,
  // so e.defaultPrevented reliably reflects whether the page consumed the key.
  window.addEventListener("keydown", onKeydown, false);
  document.addEventListener("fullscreenchange", onFullscreen, false);
  rescan();
  setInterval(rescan, 1000);   // track the main video across SPA navigations / late loads
})();
