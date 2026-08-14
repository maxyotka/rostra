// Проверяет контраст пар «текст на фоне» по WCAG 2.1 для всех тем.
// Пары и пороги перечислены в rostra.tokens.json → contrastPairs.
// `node scripts/check-contrast.mjs` — отчёт, ненулевой выход при провале.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { wcagContrast, parse } from 'culori'
import { toSrgb } from './build-css.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = JSON.parse(readFileSync(join(root, 'rostra.tokens.json'), 'utf8'))

/**
 * Значения темы поверх базовой: так же, как каскадирует css.
 * `variant: 'srgb'` даёт то, что увидит браузер без oklch — подрезка
 * насыщенности меняет цвет, а значит может изменить и контраст.
 */
export function resolveTheme(name, variant = 'oklch') {
  const base = tokens.themes[tokens.$meta.defaultTheme]
  const values = name === tokens.$meta.defaultTheme ? { ...base } : { ...base, ...tokens.themes[name] }
  // var(--rs-x) внутри токена — ссылка на соседний токен той же темы (--rs-info: var(--rs-accent-500)).
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
  if (!a || !b) throw new Error(`не разобрал цвет: ${fg} / ${bg}`)
  return wcagContrast(a, b)
}

export function checkTheme(name, variant = 'oklch') {
  const values = resolveTheme(name, variant)
  return tokens.contrastPairs.map((pair) => {
    const fg = values[pair.fg]
    const bg = values[pair.bg]
    if (!fg || !bg) throw new Error(`в теме ${name} нет токена ${!fg ? pair.fg : pair.bg}`)
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
      console.log(`\n${theme} / ${variant} — ${results.length - bad.length}/${results.length} проходят`)
      for (const r of results) {
        if (r.pass && !verbose) continue
        const mark = r.pass ? '  ok  ' : ' FAIL '
        console.log(
          `${mark}${r.ratio.toFixed(2).padStart(5)} (нужно ${r.min})  ${r.fg} на ${r.bg} — ${r.note}`
        )
      }
    }
  }
  if (failed) {
    console.error(`\n${failed} пар не дотягивают до порога`)
    process.exit(1)
  }
  console.log('\nвсе пары проходят')
}
