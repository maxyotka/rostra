// Собирает rostra.css: блок токенов генерируется из rostra.tokens.json,
// остальное берётся из src/components.css как есть.
// `node scripts/build-css.mjs`         — собрать
// `node scripts/build-css.mjs --check` — проверить, что собранное совпадает с закоммиченным
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { clampChroma, formatHex, parse } from 'culori'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = JSON.parse(readFileSync(join(root, 'rostra.tokens.json'), 'utf8'))
const prefix = tokens.$meta.prefix

/**
 * oklch → hex для браузеров, которые про oklch не знают.
 * Цвета вне sRGB подрезаются по насыщенности: светлота и тон важнее — на них
 * держится контраст, проверенный check-contrast.mjs.
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

/** То же, но с цветами, разложенными в sRGB. */
const fallbackBlock = (selector, entries) =>
  block(
    selector,
    Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, toSrgb(v) ?? v]))
  )

/** Только те токены, которые в sRGB-версии выглядят иначе. */
const oklchOnly = (entries) =>
  Object.fromEntries(Object.entries(entries).filter(([, v]) => toSrgb(v) !== null))

// Одна строка на плотность: значений мало, а сравнивать варианты глазами удобнее рядом.
const inlineBlock = (selector, entries) =>
  `${selector} { ${Object.entries(entries).map(([k, v]) => `${prefix}${k}: ${v};`).join(' ')} }`

const { defaultTheme, defaultDensity } = tokens.$meta
const baseTheme = tokens.themes[defaultTheme]
if (!baseTheme) throw new Error(`$meta.defaultTheme=${defaultTheme} нет в themes`)
if (!tokens.density[defaultDensity]) throw new Error(`$meta.defaultDensity=${defaultDensity} нет в density`)

const parts = [
  `/* ============================================================
   rostra.css — v${tokens.$meta.version}
   Ядро дизайн-системы Rostra: токены, темы, плотность, компоненты.
   Фреймворк-независимо: подключите файл и используйте классы rs-*.
   Тема: data-theme="light|dark|warm|contrast" на любом контейнере.
   Плотность: data-density="compact|medium|roomy|mobile".

   Шрифт не подключается отсюда: rostra.css не делает сетевых запросов.
   Подключите fonts.css или свою локальную копию Golos Text — см. README.
   ============================================================ */

/* --- 1. Токены ------------------------------------------------
   СГЕНЕРИРОВАНО из rostra.tokens.json — не править руками.
   Пересборка: npm run build:css

   Цвета объявлены дважды: сначала sRGB, затем oklch внутри @supports.
   Дублировать объявление прямо в блоке нельзя: значение кастомного
   свойства браузер не проверяет, поэтому старый примет oklch как валидный
   токен, и невалидным станет уже свойство, которое его использует —
   вместо фоллбэка получится пустое место.
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

parts.push('/* Плотность */')
for (const [name, values] of Object.entries(tokens.density)) {
  parts.push(inlineBlock(`[data-density='${name}']`, values))
}

// Браузеры с oklch получают исходные цвета: широкий охват, точные тона.
const modern = [block(`:root,\n[data-theme='${defaultTheme}']`, oklchOnly(baseTheme))]
for (const [name, values] of Object.entries(tokens.themes)) {
  if (name === defaultTheme) continue
  const colors = oklchOnly(values)
  if (Object.keys(colors).length) modern.push(block(`[data-theme='${name}']`, colors))
}
parts.push(
  `/* Цвет в oklch — там, где браузер его понимает. */\n@supports (color: oklch(0 0 0)) {\n${modern
    .join('\n\n')
    .replace(/^/gm, '  ')}\n}`
)

const generated = parts.join('\n\n') + '\n'
const components = readFileSync(join(root, 'src', 'components.css'), 'utf8')
const css = `${generated}\n${components.startsWith('\n') ? components.slice(1) : components}`

const out = join(root, 'rostra.css')

// Файл ещё и импортируется (check-contrast берёт отсюда toSrgb), поэтому
// писать на диск он имеет право только когда его запустили напрямую.
if (process.argv[1]?.endsWith('build-css.mjs')) {
  if (process.argv.includes('--check')) {
    const current = readFileSync(out, 'utf8')
    if (current !== css) {
      console.error(
        'rostra.css разошёлся с rostra.tokens.json.\n' +
          'Токены правятся в json, css пересобирается: npm run build:css'
      )
      process.exit(1)
    }
    console.log('rostra.css совпадает с токенами')
  } else {
    writeFileSync(out, css)
    console.log(`rostra.css собран: ${css.length} байт`)
  }
}
