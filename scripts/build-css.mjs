// Builds rostra.css: the token block is generated from rostra.tokens.json,
// everything else is taken from src/components.css as is.
// `node scripts/build-css.mjs`         — build
// `node scripts/build-css.mjs --check` — verify the build matches what is committed
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { clampChroma, formatHex, parse } from 'culori'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = JSON.parse(readFileSync(join(root, 'rostra.tokens.json'), 'utf8'))
const prefix = tokens.$meta.prefix

/**
 * oklch → hex for browsers that do not know oklch.
 * Out-of-gamut colours are clamped by chroma: lightness and hue matter more,
 * since the contrast verified by check-contrast.mjs rests on them.
 */
export function toSrgb(value) {
  if (!String(value).includes('oklch(')) return null
  return String(value).replace(/oklch\([^)]*\)/g, (color) => {
    const parsed = parse(color)
    return parsed ? (formatHex(clampChroma(parsed, 'rgb')) ?? color) : color
  })
}

const decl = (name, value) => `  ${prefix}${name}: ${value};`
const block = (selector, entries) =>
  `${selector} {\n${Object.entries(entries).map(([k, v]) => decl(k, v)).join('\n')}\n}`

/** The same, with colours resolved to sRGB. */
const fallbackBlock = (selector, entries) =>
  block(
    selector,
    Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, toSrgb(v) ?? v]))
  )

/** Only the tokens that differ in the sRGB version. */
const oklchOnly = (entries) =>
  Object.fromEntries(Object.entries(entries).filter(([, v]) => toSrgb(v) !== null))

// One line per density: there are few values, and side by side they are easier
// to compare by eye.
const inlineBlock = (selector, entries) =>
  `${selector} { ${Object.entries(entries).map(([k, v]) => `${prefix}${k}: ${v};`).join(' ')} }`

const { defaultTheme, defaultDensity } = tokens.$meta
const baseTheme = tokens.themes[defaultTheme]
if (!baseTheme) throw new Error(`$meta.defaultTheme=${defaultTheme} is not in themes`)
if (!tokens.density[defaultDensity]) throw new Error(`$meta.defaultDensity=${defaultDensity} is not in density`)

const parts = [
  `/* ============================================================
   rostra.css — v${tokens.$meta.version}
   Core of the Rostra design system: tokens, themes, density, components.
   Framework-independent: link the file and use the rs-* classes.
   Theme: data-theme="light|dark|warm|contrast" on any container.
   Density: data-density="compact|medium|roomy|mobile".

   No font is loaded from here: rostra.css makes no network requests.
   Link fonts.css or your own local copy of Golos Text — see the README.
   ============================================================ */

/* --- 1. Tokens ------------------------------------------------
   GENERATED from rostra.tokens.json — do not edit by hand.
   Rebuild with: npm run build:css

   Colours are declared twice: sRGB first, then oklch inside @supports.
   Duplicating the declaration within one block does not work: a browser does
   not validate a custom property's value, so an old one accepts oklch as a
   valid token and the property consuming it becomes invalid instead —
   leaving nothing at all instead of a fallback.
   -------------------------------------------------------------- */`,
  fallbackBlock(`:root,\n[data-theme='${defaultTheme}']`, {
    ...baseTheme,
    ...tokens.base,
    ...tokens.density[defaultDensity],
  }),
]

for (const [name, values] of Object.entries(tokens.themes)) {
  if (name === defaultTheme) continue
  parts.push(fallbackBlock(`[data-theme='${name}']`, values))
}

parts.push('/* Density */')
for (const [name, values] of Object.entries(tokens.density)) {
  parts.push(inlineBlock(`[data-density='${name}']`, values))
}

// Browsers with oklch get the original colours: wider gamut, exact hues.
const modern = [block(`:root,\n[data-theme='${defaultTheme}']`, oklchOnly(baseTheme))]
for (const [name, values] of Object.entries(tokens.themes)) {
  if (name === defaultTheme) continue
  const colors = oklchOnly(values)
  if (Object.keys(colors).length) modern.push(block(`[data-theme='${name}']`, colors))
}
parts.push(
  `/* Colour in oklch, where the browser understands it. */\n@supports (color: oklch(0 0 0)) {\n${modern
    .join('\n\n')
    .replace(/^/gm, '  ')}\n}`
)

const generated = parts.join('\n\n') + '\n'
const components = readFileSync(join(root, 'src', 'components.css'), 'utf8')
const css = `${generated}\n${components.startsWith('\n') ? components.slice(1) : components}`

const out = join(root, 'rostra.css')

// This file is also imported (check-contrast takes toSrgb from here), so it may
// only write to disk when it was started directly.
if (process.argv[1]?.endsWith('build-css.mjs')) {
  if (process.argv.includes('--check')) {
    const current = readFileSync(out, 'utf8')
    if (current !== css) {
      console.error(
        'rostra.css has drifted from rostra.tokens.json.\n' +
          'Tokens are edited in the json and the css is rebuilt: npm run build:css'
      )
      process.exit(1)
    }
    console.log('rostra.css matches the tokens')
  } else {
    writeFileSync(out, css)
    console.log(`rostra.css built: ${css.length} bytes`)
  }
}
