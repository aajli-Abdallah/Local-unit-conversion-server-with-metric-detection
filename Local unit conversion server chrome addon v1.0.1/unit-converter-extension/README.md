# Convert — Right-Click Unit Converter (Chrome extension)

Select any text on a page like `50 feet`, `3 cubic meters`, or `98.6 F`, right-click,
choose **Convert "..."**, and a new tab opens on your local Convert server with the
full conversion already filled in.

## Requirements

The Convert server (`unit-converter/`) must be running locally first:

```bash
cd unit-converter
node server.js
```

It listens on `http://localhost:3000` by default.

## Install the extension (unpacked)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select this folder (`unit-converter-extension/`).
5. The extension icon (brass diamond) appears in your toolbar/extension list.

## Use it

1. Make sure `node server.js` is running.
2. Select some text on any webpage, e.g. `12 kg` or `10 cubic feet`.
3. Right-click → **Convert "12 kg"**.
4. A new tab opens at `http://localhost:3000/?text=12%20kg` with every unit
   in that category already converted.

## Changing the server address

If you run the server on a different port, open the extension's **Details →
Extension options** page and update the server URL (default
`http://localhost:3000`).

## Files

- `manifest.json` — MV3 manifest, registers the context menu permission
- `background.js` — creates the right-click menu item and opens the tab
- `options.html` / `options.js` — lets you change the server URL
- `icons/` — toolbar icons
