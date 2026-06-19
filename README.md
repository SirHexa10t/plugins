# Plugins

A small, growing collection of general-purpose tools and quality-of-life (QoL)
plugins for everyday programs — mostly browser extensions. Each plugin is
self-contained in its own folder and installs independently, so you can grab
only the ones you want.

## Available plugins

### Chromium-based browsers (Chrome, Edge, Brave, Opera, …)

- **[Universal Video Speed](chromium/video-speedup)** — control the speed
  (0.25x–4x) of the main video on *any* page, from YouTube and X to arbitrary
  JWPlayer embeds. Click the toolbar icon to toggle a speed slider open, or
  nudge with the `<` / `>` keys (the slider flashes for a few seconds to
  confirm). Remembers your setting per site.
- **[Save All Tabs](chromium/dump_urls)** — click the toolbar icon to dump every
  open **incognito** tab's URL and title to a timestamped `.txt` file in your
  Downloads folder.

## Installing an unpacked extension

These extensions aren't on the Web Store — load them straight from this repo:

1. Open your browser's extensions page: `chrome://extensions` (Chrome),
   `edge://extensions` (Edge), `brave://extensions` (Brave), etc.
2. Toggle on **Developer mode** (top-right).
3. Click **Load unpacked** and select the plugin's folder — e.g.
   `chromium/video-speedup`.
4. *(Optional)* Pin the extension from the puzzle-piece menu so its icon stays
   visible.

**Save All Tabs** needs one extra step: on its card, enable **Allow in
Incognito** — otherwise it can't see your incognito tabs. It has no popup; just
click its toolbar icon to trigger the download.

No build step and no dependencies. After editing a file, hit the **↻ reload**
button on the extension's card to pick up the changes.

## License

[GPL-3.0](LICENSE).
