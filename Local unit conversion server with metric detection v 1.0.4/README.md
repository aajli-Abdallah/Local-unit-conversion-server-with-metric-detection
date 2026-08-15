# Convert — Local Unit Conversion Server

A zero-dependency Node.js server that reads a number-plus-unit straight out of free text
(`"118.5 billion cubic feet"`, `"50 feets"`, `"98.6 F"`) and returns every equivalent
value across that unit's category — length, weight, volume, cubic volume, pressure,
energy, speed, area, temperature, and digital storage.

Runs entirely on `localhost`. No external API calls, no telemetry, no build step.

**Current version: v1.0.4**

---

## Requirements

- [Node.js](https://nodejs.org) 14 or newer (no other dependencies — the server uses only Node's built-in `http`, `fs`, and `path` modules)

## Install & run

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

## Folder structure

```
unit-converter/
├── server.js          # HTTP server: routes, static file serving, API endpoints
├── units.js           # Unit definitions, alias table, text parser, conversion math
├── package.json
└── public/
    └── index.html      # The UI (single file: HTML + CSS + JS)
```

## How it works

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

## Supported unit categories

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

## API

The frontend talks to these endpoints — you can call them directly too (e.g. from
scripts, curl, or other tools on the same machine).

### `POST /api/convert`

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

Values in the response are always full precision floats — the frontend does its own
display rounding and large-number abbreviation (`1.34 Billion` instead of
`1,340,000,000`), so if you're consuming this API yourself, format however you like.

### `GET /api/categories`

Returns a summary of every category and its unit keys — useful for building your own
UI on top of this server, or just for reference.

```json
{
  "length": { "name": "Length", "units": ["mm", "cm", "m", "km", "in", "ft", "yd", "chain", "furlong", "mi", "nmi"] },
  "weight": { "name": "Weight / Mass", "units": ["mg", "g", "kg", "t", "oz", "lb", "st"] }
  // ...
}
```

### `GET /?text=<query>`

Serves the UI, with the given text pre-filled and pre-converted. This is what the
[Chrome extension](../unit-converter-extension) opens when you right-click selected text.
The value is injected server-side into the page's HTML (not just set by client-side
JS), so it can't be overwritten by a browser's own form-restore behavior.

```
http://localhost:3000/?text=118.5%20billion%20cubic%20feet
```

## Notes on precision & display

- The frontend abbreviates large numbers: values ≥ 1 million show as `X Million`,
  ≥ 1 billion as `X Billion`, ≥ 1 trillion as `X Trillion`. Hover over an abbreviated
  value to see the full precise number as a tooltip.
- The server itself never rounds or abbreviates — the API always returns full-precision
  floating point values.

## Troubleshooting

**"Not found" at `localhost:3000`**
Make sure `index.html` is inside a `public/` folder next to `server.js`, not next to it directly.

**Page shows stale content after an update**
The server sends `Cache-Control: no-store` on every response, so this shouldn't happen
on a fresh load — but if you still see it, hard-refresh (Ctrl/Cmd+Shift+R) once.

**"Could not reach the server" in the browser**
The Node process isn't running, or it's on a different port than the page expects.
Check the terminal where you ran `node server.js` for errors, and confirm the URL's
port matches.

**Port already in use**
Something else (possibly a previous instance of this same server) is bound to port
3000. Find and stop it, or run this instance on a different port with `PORT=4000 node server.js`.

## Extending it

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
