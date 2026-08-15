// units.js — unit definitions, aliases, and conversion logic
'use strict';

/**
 * Each category has:
 *  - base: the unit all factors are relative to
 *  - units: { key: { label, factor, aliases[] } }  (factor = value in base units per 1 of this unit)
 * Temperature is handled specially since it's not a pure multiplicative relationship.
 */

const CATEGORIES = {
  length: {
    name: 'Length',
    base: 'm',
    units: {
      mm:  { label: 'Millimeters', factor: 0.001,      aliases: ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'] },
      cm:  { label: 'Centimeters', factor: 0.01,       aliases: ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'] },
      m:   { label: 'Meters',      factor: 1,          aliases: ['m', 'meter', 'meters', 'metre', 'metres'] },
      km:  { label: 'Kilometers',  factor: 1000,       aliases: ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'] },
      in:  { label: 'Inches',      factor: 0.0254,     aliases: ['in', 'inch', 'inches', '"'] },
      ft:  { label: 'Feet',        factor: 0.3048,     aliases: ['ft', 'foot', 'feet', 'feets', "'"] },
      yd:  { label: 'Yards',       factor: 0.9144,     aliases: ['yd', 'yard', 'yards'] },
      chain:   { label: 'Chains',    factor: 20.1168,    aliases: ['chain', 'chains'] },
      furlong: { label: 'Furlongs',  factor: 201.168,    aliases: ['furlong', 'furlongs'] },
      mi:  { label: 'Miles',       factor: 1609.344,   aliases: ['mi', 'mile', 'miles'] },
      nmi: { label: 'Nautical mi', factor: 1852,       aliases: ['nmi', 'nauticalmile', 'nauticalmiles'] },
    }
  },
  weight: {
    name: 'Weight / Mass',
    base: 'g',
    units: {
      mg:  { label: 'Milligrams',  factor: 0.001,      aliases: ['mg', 'milligram', 'milligrams'] },
      g:   { label: 'Grams',       factor: 1,          aliases: ['g', 'gram', 'grams', 'gr'] },
      kg:  { label: 'Kilograms',   factor: 1000,       aliases: ['kg', 'kilogram', 'kilograms', 'kilo', 'kilos'] },
      t:   { label: 'Metric tons', factor: 1000000,    aliases: ['t', 'ton', 'tons', 'tonne', 'tonnes', 'metricton'] },
      oz:  { label: 'Ounces',      factor: 28.349523,  aliases: ['oz', 'ounce', 'ounces'] },
      lb:  { label: 'Pounds',      factor: 453.59237,  aliases: ['lb', 'lbs', 'pound', 'pounds'] },
      st:  { label: 'Stone',       factor: 6350.29318, aliases: ['st', 'stone', 'stones'] },
    }
  },
  volume: {
    name: 'Volume (liquid)',
    base: 'l',
    units: {
      ml:    { label: 'Milliliters', factor: 0.001,      aliases: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'] },
      l:     { label: 'Liters',      factor: 1,          aliases: ['l', 'liter', 'liters', 'litre', 'litres'] },
      tsp:   { label: 'Teaspoons',   factor: 0.00492892, aliases: ['tsp', 'teaspoon', 'teaspoons'] },
      tbsp:  { label: 'Tablespoons', factor: 0.0147868,  aliases: ['tbsp', 'tablespoon', 'tablespoons'] },
      floz:  { label: 'Fluid oz',    factor: 0.0295735,  aliases: ['floz', 'fluidounce', 'fluidounces', 'fl.oz', 'fl oz'] },
      cup:   { label: 'Cups',        factor: 0.24,       aliases: ['cup', 'cups'] },
      pt:    { label: 'Pints',       factor: 0.473176,   aliases: ['pt', 'pint', 'pints'] },
      qt:    { label: 'Quarts',      factor: 0.946353,   aliases: ['qt', 'quart', 'quarts'] },
      gal:   { label: 'Gallons',     factor: 3.785412,   aliases: ['gal', 'gallon', 'gallons'] },
    }
  },
  volume3: {
    name: 'Volume (cubic)',
    base: 'm3',
    units: {
      mm3: { label: 'mm³',           factor: 1e-9,        aliases: ['mm3', 'mm³', 'cubicmillimeter', 'cubicmillimeters', 'cubicmillimetre', 'cubicmillimetres'] },
      cm3: { label: 'cm³',           factor: 1e-6,        aliases: ['cm3', 'cm³', 'cubiccentimeter', 'cubiccentimeters', 'cubiccentimetre', 'cubiccentimetres', 'cc'] },
      m3:  { label: 'Cubic meters',  factor: 1,           aliases: ['m3', 'm³', 'cubicmeter', 'cubicmeters', 'cubicmetre', 'cubicmetres', 'cbm'] },
      km3: { label: 'km³',           factor: 1e9,         aliases: ['km3', 'km³', 'cubickilometer', 'cubickilometers', 'cubickilometre', 'cubickilometres'] },
      in3: { label: 'Cubic inches',  factor: 0.0000163871,aliases: ['in3', 'in³', 'cubicinch', 'cubicinches'] },
      ft3: { label: 'Cubic feet',    factor: 0.0283168,   aliases: ['ft3', 'ft³', 'cubicfoot', 'cubicfeet', 'cubicfeets'] },
      yd3: { label: 'Cubic yards',   factor: 0.764555,    aliases: ['yd3', 'yd³', 'cubicyard', 'cubicyards'] },
    }
  },
  pressure: {
    name: 'Pressure',
    base: 'pa',
    units: {
      pa:   { label: 'Pascals',        factor: 1,        aliases: ['pa', 'pascal', 'pascals'] },
      kpa:  { label: 'Kilopascals',    factor: 1000,     aliases: ['kpa', 'kilopascal', 'kilopascals'] },
      bar:  { label: 'Bar',            factor: 100000,   aliases: ['bar', 'bars'] },
      atm:  { label: 'Atmospheres',    factor: 101325,   aliases: ['atm', 'atmosphere', 'atmospheres'] },
      psi:  { label: 'PSI',            factor: 6894.76,  aliases: ['psi', 'poundspersquareinch', 'lbf/in2'] },
      mmhg: { label: 'mmHg',           factor: 133.322,  aliases: ['mmhg', 'torr', 'millimetersofmercury'] },
    }
  },
  energy: {
    name: 'Energy',
    base: 'j',
    units: {
      j:    { label: 'Joules',      factor: 1,          aliases: ['j', 'joule', 'joules'] },
      kj:   { label: 'Kilojoules',  factor: 1000,       aliases: ['kj', 'kilojoule', 'kilojoules'] },
      cal:  { label: 'Calories',    factor: 4.184,      aliases: ['cal', 'calorie', 'calories'] },
      kcal: { label: 'Kilocalories',factor: 4184,       aliases: ['kcal', 'kilocalorie', 'kilocalories'] },
      wh:   { label: 'Watt-hours',  factor: 3600,       aliases: ['wh', 'watthour', 'watthours'] },
      kwh:  { label: 'Kilowatt-hours', factor: 3600000, aliases: ['kwh', 'kilowatthour', 'kilowatthours'] },
      btu:  { label: 'BTU',         factor: 1055.06,    aliases: ['btu', 'britishthermalunit', 'britishthermalunits'] },
    }
  },
  speed: {
    name: 'Speed',
    base: 'mps',
    units: {
      mps:   { label: 'Meters/sec',  factor: 1,          aliases: ['mps', 'm/s', 'meterspersecond', 'metrespersecond'] },
      kmh:   { label: 'Km/h',        factor: 0.277778,   aliases: ['kmh', 'km/h', 'kph', 'kilometersperhour', 'kilometreperhour'] },
      mph:   { label: 'Mph',         factor: 0.44704,    aliases: ['mph', 'mi/h', 'milesperhour'] },
      knot:  { label: 'Knots',       factor: 0.514444,   aliases: ['knot', 'knots', 'kn', 'kt'] },
      fps:   { label: 'Feet/sec',    factor: 0.3048,     aliases: ['fps', 'ft/s', 'feetpersecond'] },
    }
  },
  area: {
    name: 'Area',
    base: 'm2',
    units: {
      mm2:   { label: 'mm²',         factor: 0.000001,   aliases: ['mm2', 'mm²', 'squaremillimeter', 'squaremillimeters'] },
      cm2:   { label: 'cm²',         factor: 0.0001,     aliases: ['cm2', 'cm²', 'squarecentimeter', 'squarecentimeters'] },
      m2:    { label: 'm²',          factor: 1,          aliases: ['m2', 'm²', 'squaremeter', 'squaremeters', 'squaremetre', 'squaremetres'] },
      ha:    { label: 'Hectares',    factor: 10000,      aliases: ['ha', 'hectare', 'hectares'] },
      km2:   { label: 'km²',         factor: 1000000,    aliases: ['km2', 'km²', 'squarekilometer', 'squarekilometers'] },
      ft2:   { label: 'ft²',         factor: 0.092903,   aliases: ['ft2', 'ft²', 'squarefoot', 'squarefeet'] },
      yd2:   { label: 'yd²',         factor: 0.836127,   aliases: ['yd2', 'yd²', 'squareyard', 'squareyards'] },
      acre:  { label: 'Acres',       factor: 4046.8564,  aliases: ['acre', 'acres'] },
      mi2:   { label: 'mi²',         factor: 2589988.11, aliases: ['mi2', 'mi²', 'squaremile', 'squaremiles'] },
    }
  },
  temperature: {
    name: 'Temperature',
    base: 'c',
    special: true,
    units: {
      c: { label: 'Celsius',    aliases: ['c', 'celsius', '°c', 'centigrade'] },
      f: { label: 'Fahrenheit', aliases: ['f', 'fahrenheit', '°f'] },
      k: { label: 'Kelvin',     aliases: ['k', 'kelvin'] },
    }
  },
  data: {
    name: 'Digital Storage',
    base: 'byte',
    units: {
      bit:  { label: 'Bits',      factor: 0.125,          aliases: ['bit', 'bits'] },
      byte: { label: 'Bytes',     factor: 1,              aliases: ['byte', 'bytes', 'b'] },
      kb:   { label: 'Kilobytes', factor: 1024,           aliases: ['kb', 'kilobyte', 'kilobytes'] },
      mb:   { label: 'Megabytes', factor: 1024 ** 2,      aliases: ['mb', 'megabyte', 'megabytes'] },
      gb:   { label: 'Gigabytes', factor: 1024 ** 3,      aliases: ['gb', 'gigabyte', 'gigabytes'] },
      tb:   { label: 'Terabytes', factor: 1024 ** 4,      aliases: ['tb', 'terabyte', 'terabytes'] },
    }
  },
};

// Build a flat lookup: normalized alias -> { category, unitKey }
const ALIAS_LOOKUP = {};
for (const [catKey, cat] of Object.entries(CATEGORIES)) {
  for (const [unitKey, unit] of Object.entries(cat.units)) {
    for (const alias of unit.aliases) {
      const norm = normalizeAlias(alias);
      // Longer/more specific match wins on collision (rare); first wins otherwise.
      if (!ALIAS_LOOKUP[norm]) {
        ALIAS_LOOKUP[norm] = { category: catKey, unit: unitKey };
      }
    }
  }
}

function normalizeAlias(s) {
  return s.toLowerCase().replace(/[\s.]/g, '');
}

// Scale words that can sit between the number and the unit, e.g. "118.5 billion cubic feet".
const MAGNITUDES = {
  hundred: 1e2,
  thousand: 1e3,
  million: 1e6,
  billion: 1e9,
  trillion: 1e12,
};

/**
 * Parse free text like "50 feet", "12.5kg", "-40 F", "2 cubic meters",
 * "118.5 billion cubic feet" into { value, unitText }.
 * Handles multi-word units (cubic feet, fl oz, square meters...) by trying the longest
 * word run after the number first, then backing off word by word until a known alias matches.
 * A magnitude word (thousand/million/billion/trillion) right after the number scales
 * the value and is skipped when searching for the unit.
 */
function extractNumberAndUnit(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim();

  // Grab the number itself.
  const numMatch = cleaned.match(/-?\d[\d,]*\.?\d*/);
  if (!numMatch) return null;

  let value = parseFloat(numMatch[0].replace(/,/g, ''));
  if (isNaN(value)) return null;

  // Everything after the number is a candidate unit phrase.
  let rest = cleaned.slice(numMatch.index + numMatch[0].length).trim();
  rest = rest.replace(/^°/, '°').trim(); // keep leading degree symbol attached, just tidy spacing

  if (!rest) return { value, unitText: '' };

  // Tokenize on whitespace, keeping symbol-only tokens like ° or " or ' intact.
  let tokens = rest.split(/\s+/).filter(Boolean);

  // Consume a leading magnitude word ("billion", "million"...) and scale the value.
  if (tokens.length && MAGNITUDES[tokens[0].toLowerCase()]) {
    value *= MAGNITUDES[tokens[0].toLowerCase()];
    tokens = tokens.slice(1);
  }

  if (!tokens.length) return { value, unitText: '' };

  // Try the longest word-run first (up to 3 words) so "cubic feet" beats a lone "feet"-less match,
  // and "fl oz" is recognized as one unit rather than two.
  const maxWords = Math.min(3, tokens.length);
  for (let len = maxWords; len >= 1; len--) {
    const candidate = tokens.slice(0, len).join(' ');
    if (detectUnit(candidate)) {
      return { value, unitText: candidate };
    }
  }

  // No known alias matched any run — fall back to the single first token so the
  // caller can still report a sensible "unrecognized unit" error.
  return { value, unitText: tokens[0] };
}

/**
 * Detect which unit/category a unit string refers to.
 */
function detectUnit(unitText) {
  if (!unitText) return null;
  const norm = normalizeAlias(unitText);
  return ALIAS_LOOKUP[norm] || null;
}

/**
 * Convert a value from one unit to all other units in its category.
 */
function convertAll(value, categoryKey, fromUnitKey) {
  const cat = CATEGORIES[categoryKey];
  if (!cat) return null;

  const results = [];

  if (cat.special && categoryKey === 'temperature') {
    // Convert to Celsius first, then to all others
    let celsius;
    if (fromUnitKey === 'c') celsius = value;
    else if (fromUnitKey === 'f') celsius = (value - 32) * (5 / 9);
    else if (fromUnitKey === 'k') celsius = value - 273.15;
    else return null;

    for (const [key, unit] of Object.entries(cat.units)) {
      let out;
      if (key === 'c') out = celsius;
      else if (key === 'f') out = celsius * (9 / 5) + 32;
      else if (key === 'k') out = celsius + 273.15;
      results.push({ unit: key, label: unit.label, value: out, isSource: key === fromUnitKey });
    }
    return { category: cat.name, results };
  }

  const fromUnit = cat.units[fromUnitKey];
  if (!fromUnit) return null;
  const baseValue = value * fromUnit.factor;

  for (const [key, unit] of Object.entries(cat.units)) {
    const out = baseValue / unit.factor;
    results.push({ unit: key, label: unit.label, value: out, isSource: key === fromUnitKey });
  }

  return { category: cat.name, results };
}

/**
 * Full pipeline: text -> detection -> conversions
 */
function convertFromText(text) {
  const parsed = extractNumberAndUnit(text);
  if (!parsed) {
    return { ok: false, error: 'Could not find a number in the input.' };
  }
  const { value, unitText } = parsed;

  if (!unitText) {
    return { ok: false, error: 'Found the number but no unit. Try e.g. "50 feet".' };
  }

  const detected = detectUnit(unitText);
  if (!detected) {
    return { ok: false, error: `Unrecognized unit "${unitText}". Try feet, kg, liters, cubic meters, °C, mph, psi, joules...` };
  }

  const conversion = convertAll(value, detected.category, detected.unit);
  const sourceUnit = CATEGORIES[detected.category].units[detected.unit];

  return {
    ok: true,
    input: { value, unitText, raw: text },
    detected: {
      category: detected.category,
      categoryLabel: CATEGORIES[detected.category].name,
      unit: detected.unit,
      unitLabel: sourceUnit.label,
    },
    conversion,
  };
}

module.exports = { CATEGORIES, extractNumberAndUnit, detectUnit, convertAll, convertFromText };
