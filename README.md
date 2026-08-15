# Convert — Local Unit Converter + Right-Click Chrome Extension

A local, zero-dependency unit converter with two parts:

1. **The server** — a Node.js app that reads a number-plus-unit out of free text
   (`"118.5 billion cubic feet"`, `"50 feets"`, `"98.6 F"`) and returns every
   equivalent value across that unit's category.
2. **The Chrome extension** — select a measurement on any webpage, right-click, and
   it opens a new tab on the server with the conversion already done.

Everything runs on `localhost`. No external API calls, no telemetry, no build step,
no npm dependencies to install for either part.

**Current version: v1.0.4**

---

## Table of contents

- [Quick start](#quick-start)
- [Part 1 — The server](#part-1--the-server)
  - [Install & run](#install--run)
  - [Folder structure](#folder-structure)
  - [How it works](#how-it-works)
  - [Supported unit categories](#supported-unit-categories)
  - [API reference](#api-reference)
  - [Display & precision notes](#display--precision-notes)
  - [Extending it](#extending-it)
- [Part 2 — The Chrome extension](#part-2--the-chrome-extension)
  - [Install (unpacked / developer mode)](#install-unpacked--developer-mode)
  - [Usage](#usage)
  - [Changing the server address](#changing-the-server-address)
  - [How it works](#how-it-works-1)
  - [Permissions explained](#permissions-explained)
  - [Files](#files)
- [Troubleshooting](#troubleshooting)
- [Version history](#version-history)

---

## Quick start

```bash
# 1. Start the server
cd unit-converter
node server.js
# → Unit Converter running → http://localhost:3000

# 2. (Optional) Load the Chrome extension
# chrome://extensions → Developer mode ON → Load unpacked → select unit-converter-extension/

# 3. Try it
open "http://localhost:3000/?text=118.5%20billion%20cubic%20feet"
# or: select "50 feet" on any webpage → right-click → Convert "50 feet"
```

---

## Part 1 — The server

### Requirements

- [Node.js](https://nodejs.org) 14 or newer — no other dependencies. The server uses
  only Node's built-in `http`, `fs`, and `path` modules.

### Install & run

```bash
cd unit-converter
node server.js
```

You should see:

```
  Unit Converter running → http://localhost:3000
```

Open `http://localhost:3000` in a browser. To use a different port:

```bash
PORT=4000 node server.js
```

### Folder structure

```
unit-converter/
├── server.js          # HTTP server: routes, static file serving, API endpoints
├── units.js           # Unit definitions, alias table, text parser, conversion math
├── package.json
└── public/
    └── index.html      # The UI (single file: HTML + CSS + JS)
```

### How it works

1. **Parsing** (`units.js` → `extractNumberAndUnit`): pulls the first number out of the
   input text, then looks at what follows it. It tries the longest word-run first (up
   to 3 words) against a table of unit aliases, so multi-word units like `cubic feet`
   or `fl oz` are recognized as a single unit rather than misfiring on just `feet` or `fl`.
2. **Magnitude words**: if a scale word (`hundred`, `thousand`, `million`, `billion`,
   `trillion`) appears right after the number — e.g. `"2.5 million liters"` — it's
   multiplied into the value and skipped when searching for the unit.
3. **Detection** (`detectUnit`): normalizes the matched phrase (lowercase, no spaces/
   periods) and looks it up in a flat alias table built from all unit categories.
4. **Conversion** (`convertAll`): converts the source value to the category's base unit,
   then out to every other unit in that category. Temperature is handled separately
   since °C/°F/K aren't related by a simple multiplier.

### Supported unit categories

| Category | Units |
|---|---|
| **Length** | mm, cm, m, km, in, ft, yd, chain, furlong, mi, nautical mi |
| **Weight / Mass** | mg, g, kg, metric ton, oz, lb, stone |
| **Volume (liquid)** | ml, l, tsp, tbsp, fl oz, cup, pt, qt, gal |
| **Volume (cubic)** | mm³, cm³, m³, km³, in³, ft³, yd³ |
| **Pressure** | Pa, kPa, bar, atm, psi, mmHg |
| **Energy** | J, kJ, cal, kcal, Wh, kWh, BTU |
| **Speed** | m/s, km/h, mph, knots, ft/s |
| **Area** | mm², cm², m², hectares, km², ft², yd², acres, mi² |
| **Temperature** | °C, °F, K |
| **Digital storage** | bit, byte, KB, MB, GB, TB |

Each unit recognizes several aliases and common misspellings (e.g. `feets`, `kgs`,
`litre`/`liter`, `°C`/`celsius`/`centigrade`).

### API reference

The frontend and the Chrome extension both talk to these endpoints — you can call
them directly too (e.g. from scripts, curl, or other tools on the same machine).

#### `POST /api/convert`

**Request body:**
```json
{ "text": "50 feet" }
```

**Success response (200):**
```json
{
  "ok": true,
  "input": { "value": 50, "unitText": "feet", "raw": "50 feet" },
  "detected": {
    "category": "length",
    "categoryLabel": "Length",
    "unit": "ft",
    "unitLabel": "Feet"
  },
  "conversion": {
    "category": "Length",
    "results": [
      { "unit": "mm", "label": "Millimeters", "value": 15240, "isSource": false },
      { "unit": "ft", "label": "Feet", "value": 50, "isSource": true },
      { "unit": "mi", "label": "Miles", "value": 0.00946969696969697, "isSource": false }
      // ...one entry per unit in the category
    ]
  }
}
```

**Error response (400):**
```json
{ "ok": false, "error": "Unrecognized unit \"xyz\". Try feet, kg, liters, cubic meters, °C, mph, psi, joules..." }
```

Values in the response are always full-precision floats — the frontend handles its
own display rounding and large-number abbreviation, so if you're consuming this API
yourself, format however you like.

#### `GET /api/categories`

Returns a summary of every category and its unit keys — useful for building your own
UI on top of this server, or just for reference.

```json
{
  "length": { "name": "Length", "units": ["mm", "cm", "m", "km", "in", "ft", "yd", "chain", "furlong", "mi", "nmi"] },
  "weight": { "name": "Weight / Mass", "units": ["mg", "g", "kg", "t", "oz", "lb", "st"] }
  // ...
}
```

#### `GET /?text=<query>`

Serves the UI, with the given text pre-filled and pre-converted. This is what the
Chrome extension opens when you right-click selected text. The value is injected
server-side into the page's HTML (not just set by client-side JS), so it can't be
overwritten by a browser's own form-restore behavior.

```
http://localhost:3000/?text=118.5%20billion%20cubic%20feet
```

### Display & precision notes

- The frontend abbreviates large numbers: values ≥ 1 million show as `X Million`,
  ≥ 1 billion as `X Billion`, ≥ 1 trillion as `X Trillion` (e.g. `1,340,000,000` →
  `1.34 Billion`). Hover over an abbreviated value to see the full precise number as
  a tooltip.
- The server itself never rounds or abbreviates — the API always returns full-precision
  floating point values; only the browser display is simplified.

### Extending it

To add a new unit or category, edit `units.js`:

```js
// add a unit to an existing category
newunit: { label: 'My Unit', factor: 2.5, aliases: ['newunit', 'nu'] },

// or add a whole new category
newcategory: {
  name: 'My Category',
  base: 'baseunit',
  units: { /* ... */ }
}
```

`factor` is always "how many base units does 1 of this unit equal" — the rest (alias
lookup, conversion math, API responses) works automatically from that.

---

## Part 2 — The Chrome extension

Select any measurement on a webpage — `50 feet`, `3 cubic meters`, `98.6 F`,
`118.5 billion cubic feet` — right-click, and it opens a new tab on the server above
with every equivalent unit already calculated.

Manifest V3. No dependencies, no bundler, no build step — just static files loaded
as an unpacked extension.

### Requirements

- Google Chrome (or any Chromium-based browser: Edge, Brave, Opera...) that supports
  Manifest V3
- The server above running locally (`node server.js`), by default on
  `http://localhost:3000`

### Install (unpacked / developer mode)

Chrome extensions installed from outside the Web Store must be loaded as "unpacked"
in Developer Mode:

1. Open `chrome://extensions` in a new tab.
2. Toggle **Developer mode** on (top-right corner).
3. Click **Load unpacked**.
4. Select the `unit-converter-extension/` folder.
5. A brass-diamond icon for **Convert — Right-Click Unit Converter** appears in your
   extensions list and toolbar (pin it via the puzzle-piece icon for quick access).

### Usage

1. Make sure the server is running: `cd unit-converter && node server.js`.
2. On any webpage, select text containing a number and a unit (e.g. `12 kg`,
   `2.5 million liters`, `10 cubic feet`).
3. Right-click the selection → **Convert "..."**.
4. A new tab opens at `http://localhost:3000/?text=<your selection>` with the
   detected unit and every conversion in that category already displayed.

If the selected text doesn't contain a recognizable number + unit, the page shows an
"unrecognized unit" message rather than a conversion — no error dialog interrupts
your browsing.

### Changing the server address

By default the extension points at `http://localhost:3000`. If you run the server on
a different port or host:

1. Go to `chrome://extensions`.
2. Find **Convert — Right-Click Unit Converter** → click **Details**.
3. Click **Extension options**.
4. Enter the new server URL (e.g. `http://localhost:4000`) and **Save**.

The setting is stored via `chrome.storage.sync`, so it follows you across devices
signed into the same Chrome profile.

### How it works

- `manifest.json` declares the `contextMenus` and `storage` permissions and registers
  `background.js` as the service worker. No `host_permissions` or content-script
  injection are needed — the extension only ever reads the browser's built-in
  selection text and opens a new tab, it never fetches or scrapes page content.
- `background.js` creates a single context menu item (visible only when text is
  selected) and, on click, builds a URL of the form
  `SERVER_URL/?text=<encoded selection>` and opens it in a new tab next to the
  current one.
- The heavy lifting — parsing the text, detecting the unit, computing conversions,
  and rendering the page — all happens server-side and in the page itself (see
  [Part 1](#part-1--the-server)). The extension is intentionally thin: it's a
  shortcut for "open this text on the converter," nothing more.
- `options.html` / `options.js` provide a small settings page for the server URL,
  persisted with `chrome.storage.sync`.

### Permissions explained

| Permission | Why it's needed |
|---|---|
| `contextMenus` | To add the "Convert ..." item to the right-click menu |
| `storage` | To remember your server URL setting across browser restarts |

The extension does **not** request `host_permissions`, `activeTab`, `scripting`, or
any broad site access — it can't read page content beyond the text you explicitly
select and right-click.

### Files

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
└── README.md
```

---

## Troubleshooting

### Server

**"Not found" at `localhost:3000`**
Make sure `index.html` is inside a `public/` folder next to `server.js`, not next to
it directly.

**Page shows stale content after an update**
The server sends `Cache-Control: no-store` on every response, so this shouldn't
happen on a fresh load — but if you still see it, hard-refresh (Ctrl/Cmd+Shift+R)
once.

**"Could not reach the server" in the browser**
The Node process isn't running, or it's on a different port than the page expects.
Check the terminal where you ran `node server.js` for errors, and confirm the URL's
port matches.

**Port already in use**
Something else (possibly a previous instance of this same server) is bound to port
3000. Find and stop it, or run this instance on a different port with
`PORT=4000 node server.js`.

### Extension

**"Could not load icon..." / "Could not load manifest" when loading unpacked**
Make sure all three icon files (`icon16.png`, `icon48.png`, `icon128.png`) are
present in `icons/` — the manifest references all three, and Chrome refuses to load
if any is missing.

**Right-click menu doesn't show "Convert ..."**
The menu item only appears when text is actually selected on the page (some pages,
like `chrome://` internal pages or PDFs viewed outside a tab, don't support selection
context menus). Try it on a normal webpage first.

**New tab opens but shows an old/incorrect result, or the default "50 feet"**
Make sure the server is running the latest version — the query text is baked
directly into the page server-side (not set by client JS), so a stale server build
is the most likely cause. Restart `node server.js` and try again.

**New tab shows "Could not reach the server. Is it running?"**
The server isn't running, or it's on a different port than the extension is
configured for. Start it with `node server.js`, or update the server URL in the
extension's options page.

**Selection includes extra words the parser doesn't expect**
The server-side parser looks for a number followed by a unit phrase (optionally with
a magnitude word like "million" or "billion" in between). If your selection includes
a lot of surrounding prose, try selecting just the number-and-unit portion for a
cleaner result.

### Uninstalling the extension

Go to `chrome://extensions`, find **Convert — Right-Click Unit Converter**, and click
**Remove**.

---

## Version history

| Version | Changes |
|---|---|
| v1.0.4 | Large numbers abbreviated (`1.34 Billion` instead of `1,340,000,000`), hover tooltip shows exact value |
| v1.0.3 | Fixed query-param values being overwritten client-side by baking them into the HTML server-side instead; added version tag to UI |
| v1.0.2 | Added magnitude-word parsing (`"118.5 billion cubic feet"`) |
| v1.0.1 | Added cubic volume, pressure, and energy categories; multi-word unit parsing (`"cubic feet"`, `"fl oz"`) |
| v1.0.0 | Initial release — length, weight, volume, temperature, speed, area, digital storage; Chrome extension for right-click conversion |
