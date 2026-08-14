// Checks foreground/background contrast against WCAG 2.1 for every theme.
// The pairs and thresholds live in rostra.tokens.json under contrastPairs.
// `node scripts/check-contrast.mjs` — report, non-zero exit on failure.
// `--verbose` also prints the pairs that pass.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { wcagContrast, parse } from 'culori'
import { toSrgb } from './build-css.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = JSON.parse(readFileSync(join(root, 'rostra.tokens.json'), 'utf8'))

/**
 * Theme values layered over the base theme, the same way CSS cascades them.
 * `variant: 'srgb'` yields what a browser without oklch sees — clamping chroma
 * into gamut moves the colour, which can move the contrast ratio with it.
 */
export function resolveTheme(name, variant = 'oklch') {
  const base = tokens.themes[tokens.$meta.defaultTheme]
  const values = name === tokens.$meta.defaultTheme ? { ...base } : { ...base, ...tokens.themes[name] }
  // var(--rs-x) inside a token refers to a sibling token of the same theme
  // (--rs-info: var(--rs-accent-500)).
  for (const [key, value] of Object.entries(values)) {
    const ref = /^var\(--rs-([\w-]+)\)$/.exec(String(value))
    if (ref) values[key] = values[ref[1]]
  }
  if (variant === 'srgb') {
    for (const [key, value] of Object.entries(values)) values[key] = toSrgb(value) ?? value
  }
  return values
}

export function contrast(fg, bg) {
  const a = parse(fg)
  const b = parse(bg)
  if (!a || !b) throw new Error(`could not parse colour: ${fg} / ${bg}`)
  return wcagContrast(a, b)
}

export function checkTheme(name, variant = 'oklch') {
  const values = resolveTheme(name, variant)
  return tokens.contrastPairs.map((pair) => {
    const fg = values[pair.fg]
    const bg = values[pair.bg]
    if (!fg || !bg) throw new Error(`theme ${name} has no token ${!fg ? pair.fg : pair.bg}`)
    const ratio = contrast(fg, bg)
    return { ...pair, theme: name, variant, ratio, pass: ratio >= pair.min }
  })
}

export const variants = ['oklch', 'srgb']

export const themeNames = Object.keys(tokens.themes)

if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/') || process.argv[1]?.endsWith('check-contrast.mjs')) {
  let failed = 0
  const verbose = process.argv.includes('--verbose')
  for (const variant of variants) {
    for (const theme of themeNames) {
      const results = checkTheme(theme, variant)
      const bad = results.filter((r) => !r.pass)
      failed += bad.length
      console.log(`\n${theme} / ${variant} — ${results.length - bad.length}/${results.length} pass`)
      for (const r of results) {
        if (r.pass && !verbose) continue
        const mark = r.pass ? '  ok  ' : ' FAIL '
        console.log(
          `${mark}${r.ratio.toFixed(2).padStart(5)} (needs ${r.min})  ${r.fg} on ${r.bg} — ${r.note}`
        )
      }
    }
  }
  if (failed) {
    console.error(`\n${failed} pairs fall short of their threshold`)
    process.exit(1)
  }
  console.log('\nall pairs pass')
}
