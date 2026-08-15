# Convert — Right-Click Unit Converter (Chrome Extension)

Select any measurement on a webpage — `50 feet`, `3 cubic meters`, `98.6 F`,
`118.5 billion cubic feet` — right-click, and it opens a new tab on your local
[Convert server](../unit-converter) with every equivalent unit already calculated.

Manifest V3. No dependencies, no bundler, no build step — just static files loaded
as an unpacked extension.

---

## Requirements

- Google Chrome (or any Chromium-based browser: Edge, Brave, Opera...) that supports Manifest V3
- The [Convert server](../unit-converter) running locally (`node server.js`), by default on `http://localhost:3000`

The extension itself has no dependencies to install.

## Install (unpacked / developer mode)

Chrome extensions installed from outside the Web Store must be loaded as "unpacked"
in Developer Mode:

1. Open `chrome://extensions` in a new tab.
2. Toggle **Developer mode** on (top-right corner).
3. Click **Load unpacked**.
4. Select this folder (`unit-converter-extension/`).
5. A brass-diamond icon for **Convert — Right-Click Unit Converter** appears in your
   extensions list and toolbar (pin it via the puzzle-piece icon for quick access).

## Usage

1. Make sure the server is running: `cd unit-converter && node server.js`.
2. On any webpage, select text containing a number and a unit (e.g. `12 kg`,
   `2.5 million liters`, `10 cubic feet`).
3. Right-click the selection → **Convert "..."**.
4. A new tab opens at `http://localhost:3000/?text=<your selection>` with the
   detected unit and every conversion in that category already displayed.

If the selected text doesn't contain a recognizable number + unit, the page will show
an "unrecognized unit" message rather than a conversion — no error dialog interrupts
your browsing.

## Changing the server address

By default the extension points at `http://localhost:3000`. If you run the server on
a different port or host:

1. Go to `chrome://extensions`.
2. Find **Convert — Right-Click Unit Converter** → click **Details**.
3. Click **Extension options**.
4. Enter the new server URL (e.g. `http://localhost:4000`) and **Save**.

The setting is stored via `chrome.storage.sync`, so it follows you across devices
signed into the same Chrome profile.

## How it works

- `manifest.json` declares the `contextMenus` and `storage` permissions and registers
  `background.js` as the service worker. No `host_permissions` or content-script
  injection are needed — the extension only ever reads the browser's built-in
  selection text and opens a new tab, it never fetches or scrapes page content.
- `background.js` creates a single context menu item (visible only when text is
  selected) and, on click, builds a URL of the form `SERVER_URL/?text=<encoded selection>`
  and opens it in a new tab next to the current one.
- The heavy lifting — parsing the text, detecting the unit, computing conversions,
  and rendering the page — all happens server-side and in the page itself. The
  extension is intentionally thin: it's a shortcut for "open this text on the
  converter," nothing more.
- `options.html` / `options.js` provide a small settings page for the server URL,
  persisted with `chrome.storage.sync`.

## Permissions explained

| Permission | Why it's needed |
|---|---|
| `contextMenus` | To add the "Convert ..." item to the right-click menu |
| `storage` | To remember your server URL setting across browser restarts |

The extension does **not** request `host_permissions`, `activeTab`, `scripting`, or
any broad site access — it can't read page content beyond the text you explicitly
select and right-click.

## Files

```
unit-converter-extension/
├── manifest.json      # MV3 manifest — permissions, icons, background worker
├── background.js      # Creates the context menu, opens the conversion tab on click
├── options.html        # Settings page (server URL)
├── options.js          # Settings page logic (chrome.storage.sync)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

## Troubleshooting

**"Could not load icon..." / "Could not load manifest" when loading unpacked**
Make sure all three icon files (`icon16.png`, `icon48.png`, `icon128.png`) are present
in `icons/` — the manifest references all three, and Chrome refuses to load if any is
missing.

**Right-click menu doesn't show "Convert ..."**
The menu item only appears when text is actually selected on the page (some pages,
like `chrome://` internal pages or PDFs viewed outside a tab, don't support selection
context menus). Try it on a normal webpage first.

**New tab opens but shows an old/incorrect result, or the default "50 feet"**
Make sure the server is running the latest version — the query text is baked directly
into the page server-side (not set by client JS), so a stale server build is the most
likely cause. See the [server README](../unit-converter/README.md#troubleshooting).

**New tab shows "Could not reach the server. Is it running?"**
The Convert server isn't running, or it's on a different port than the extension is
configured for. Start it with `node server.js`, or update the server URL in the
extension's options page.

**Selection includes extra words the parser doesn't expect**
The server-side parser looks for a number followed by a unit phrase (optionally with
a magnitude word like "million" or "billion" in between). If your selection includes
a lot of surrounding prose, try selecting just the number-and-unit portion for a
cleaner result.

## Uninstalling

Go to `chrome://extensions`, find **Convert — Right-Click Unit Converter**, and click
**Remove**.
