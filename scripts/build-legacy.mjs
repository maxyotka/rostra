// Собирает rostra.legacy.css — сборку для браузеров без кастомных свойств.
// Основная сборка при этом не меняется: современный браузер грузит только её,
// старый — только legacy. Подключение описано в README.
//
// `node scripts/build-legacy.mjs`                  — light, medium
// `node scripts/build-legacy.mjs --theme=dark`     — другая тема
// `node scripts/build-legacy.mjs --density=compact`
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import { toSrgb } from './build-css.mjs'
import { browserslistQuery } from './legacy-targets.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = JSON.parse(readFileSync(join(root, 'rostra.tokens.json'), 'utf8'))

const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback

const theme = arg('theme', tokens.$meta.defaultTheme)
const density = arg('density', tokens.$meta.defaultDensity)
const outName = arg('out', theme === tokens.$meta.defaultTheme ? 'rostra.legacy.css' : `rostra.legacy.${theme}.css`)

if (!tokens.themes[theme]) throw new Error(`нет темы ${theme}`)
if (!tokens.density[density]) throw new Error(`нет плотности ${density}`)

/** Плоская карта значений: базовая тема, поверх — выбранная, поверх — плотность. */
function buildValues() {
  const flat = {
    ...tokens.themes[tokens.$meta.defaultTheme],
    ...tokens.base,
    ...tokens.density[tokens.$meta.defaultDensity],
    ...(theme === tokens.$meta.defaultTheme ? {} : tokens.themes[theme]),
    ...tokens.density[density],
  }
  const values = {}
  // Токены в json заданы в oklch — для этой сборки нужен sRGB-двойник,
  // тот же, что уходит в основной css до блока @supports.
  for (const [key, value] of Object.entries(flat)) values[`--rs-${key}`] = toSrgb(value) ?? String(value)
  // Ссылки вида --rs-info: var(--rs-accent-500) разворачиваем до упора.
  for (let pass = 0; pass < 5; pass++) {
    let changed = false
    for (const [key, value] of Object.entries(values)) {
      const next = value.replace(/var\((--rs-[\w-]+)\)/g, (whole, ref) => values[ref] ?? whole)
      if (next !== value) {
        values[key] = next
        changed = true
      }
    }
    if (!changed) break
  }
  return values
}

const values = buildValues()

/** Раскрывает var() в конкретное значение — переменных в legacy быть не должно. */
function resolve(value) {
  let out = value
  for (let pass = 0; pass < 5 && out.includes('var('); pass++) {
    out = out.replace(/var\((--rs-[\w-]+)(?:,\s*([^)]+))?\)/g, (whole, ref, fallback) => values[ref] ?? fallback ?? whole)
  }
  return out
}

/**
 * Правила, где gap стоит не рядом с display: наследуют раскладку от базового
 * класса, поэтому направление приходится знать заранее. Список короткий и
 * проверяется тестом — если появится новое такое правило, тест упадёт.
 */
const inheritedFlex = { '.rs-eyebrow--tick': 'row' }

const source = readFileSync(join(root, 'rostra.css'), 'utf8')
const css = postcss.parse(source)

const notes = { vars: 0, gap: 0, pseudo: 0, grid: 0, dropped: 0, supports: 0 }
/** Селекторы, у которых gap уже разобран: нужны для отступов псевдоэлементов. */
const gapped = new Map()

// 1. Блок @supports с oklch адресован новым браузерам — в legacy он лишний.
css.walkAtRules('supports', (rule) => {
  if (rule.params.includes('oklch')) {
    rule.remove()
    notes.supports++
  }
})

// 2. Правила с непонятными старому браузеру псевдоклассами: :has() выбрасываем,
//    из пары :focus / :focus-visible оставляем :focus — он и есть фоллбэк.
css.walkRules((rule) => {
  if (rule.selector.includes(':has(')) {
    rule.remove()
    notes.dropped++
    return
  }
  if (rule.selector.includes(':focus-visible')) {
    rule.remove()
    notes.dropped++
  }
})

// 3. Объявления, которые IE отбросил бы сам. Удаляем явно, чтобы не мешали
//    autoprefixer и не путали при чтении файла.
css.walkDecls((decl) => {
  if (/color-mix\(|oklch\(|\d(dvh|dvw|svh|lvh)/.test(decl.value)) {
    decl.remove()
    notes.dropped++
  }
})

// 4. Разворачиваем переменные.
css.walkDecls((decl) => {
  if (decl.prop.startsWith('--')) {
    decl.remove()
    notes.vars++
    return
  }
  if (decl.value.includes('var(')) {
    decl.value = resolve(decl.value)
    notes.vars++
  }
})

// Пустые правила после удаления переменных не нужны.
css.walkRules((rule) => {
  if (rule.nodes.length === 0) rule.remove()
})

// 5. gap → отступы соседей. IE11 знает flexbox, но не gap, поэтому
//    расстояние между элементами задаём margin по направлению раскладки.
css.walkRules((rule) => {
  const gapDecl = rule.nodes.find((n) => n.type === 'decl' && ['gap', 'row-gap', 'column-gap'].includes(n.prop))
  if (!gapDecl) return

  const display = rule.nodes.find((n) => n.type === 'decl' && n.prop === 'display')?.value ?? ''
  const isGrid = display.includes('grid')
  const isFlex = display.includes('flex') || inheritedFlex[rule.selector.trim()]
  if (isGrid || !isFlex) return

  const direction =
    rule.nodes.find((n) => n.type === 'decl' && n.prop === 'flex-direction')?.value ??
    inheritedFlex[rule.selector.trim()] ??
    'row'
  const column = direction.startsWith('column')

  // gap: «8px» или «10px 16px» — по строке и по колонке.
  const parts = gapDecl.value.split(/\s+/)
  const rowGap = parts[0]
  const columnGap = parts[1] ?? parts[0]
  const step = gapDecl.prop === 'row-gap' ? rowGap : gapDecl.prop === 'column-gap' ? columnGap : column ? rowGap : columnGap

  const spacing = postcss.rule({ selector: rule.selectors.map((s) => `${s} > * + *`).join(', ') })
  spacing.append({ prop: column ? 'margin-top' : 'margin-left', value: step })
  rule.after(spacing)
  gapDecl.remove()
  gapped.set(rule.selector.trim(), { step, column })
  notes.gap++
})

/**
 * gap разделял и псевдоэлементы: точку бейджа, линию надзаголовка, риску.
 * Соседский селектор их не достаёт — ни ::before, ни текстовый узел рядом
 * с ним не являются «* + *». Поэтому отступ вешается на сам псевдоэлемент.
 */
css.walkRules((rule) => {
  const match = /^(.+?)::(before|after)$/.exec(rule.selector.trim())
  if (!match) return
  const parent = gapped.get(match[1])
  if (!parent) return
  const side = parent.column
    ? match[2] === 'before'
      ? 'margin-bottom'
      : 'margin-top'
    : match[2] === 'before'
      ? 'margin-right'
      : 'margin-left'
  // display:none у псевдоэлемента — он отключён в этом варианте, отступ не нужен.
  if (rule.nodes.some((n) => n.type === 'decl' && n.prop === 'display' && n.value === 'none')) return
  rule.append({ prop: side, value: parent.step })
  notes.pseudo++
})

// 6. grid → раскладка, доступная IE. Точных эквивалентов нет, поэтому
//    каждый случай описан отдельно: важно сохранить расположение, а не способ.
const gridFallbacks = {
  '.rs-kv': [
    { prop: 'display', value: 'block' },
    { prop: 'overflow', value: 'hidden' },
  ],
  '.rs-cal__grid': [{ prop: 'display', value: 'block' }],
  '.rs-m-nav': [
    { prop: 'display', value: '-ms-flexbox' },
    { prop: 'display', value: 'flex' },
  ],
  '.rs-timeline__item': [
    { prop: 'display', value: '-ms-flexbox' },
    { prop: 'display', value: 'flex' },
  ],
}

css.walkRules((rule) => {
  const display = rule.nodes.find((n) => n.type === 'decl' && n.prop === 'display')
  if (!display || !display.value.includes('grid')) return
  const fallback = gridFallbacks[rule.selector.trim()]
  if (!fallback) {
    console.warn(`  ! grid без описанного фоллбэка: ${rule.selector}`)
    return
  }
  rule.nodes
    .filter((n) => n.type === 'decl' && (n.prop.startsWith('grid') || n.prop.endsWith('gap')))
    .forEach((n) => n.remove())
  display.remove()
  rule.prepend(...fallback)
  notes.grid++
})

// 7. Комментарии основного файла, объясняющие oklch, @supports и токены,
//    к этой сборке не относятся и только сбивают с толку: здесь их нет.
css.walkComments((comment) => {
  if (/oklch|@supports|var\(--|СГЕНЕРИРОВАНО/.test(comment.text)) comment.remove()
})

// Ширина колонок KeyValue и календаря задаётся на детях — grid их больше не разложит.
css.append(`
/* Раскладки, которым в IE нужен явный размер: grid их больше не расставляет. */
.rs-kv dt { float: left; clear: left; width: 150px; padding-bottom: 10px; }
.rs-kv dd { margin-left: 166px; padding-bottom: 10px; }
.rs-cal__grid > * { display: inline-block; width: 14.28%; vertical-align: top; }
.rs-m-nav > * { -ms-flex: 1 1 25%; flex: 1 1 25%; }
.rs-timeline__when { -ms-flex: none; flex: none; width: 132px; }
.rs-timeline__rail { -ms-flex: none; flex: none; width: 16px; }
.rs-timeline__body { -ms-flex: 1 1 auto; flex: 1 1 auto; }
`)

const result = await postcss([
  autoprefixer({
    overrideBrowserslist: browserslistQuery,
    grid: false,
  }),
]).process(css.toString(), { from: undefined })

const header = `/* ============================================================
   rostra.legacy.css — сборка для браузеров без кастомных свойств.
   Тема: ${theme}. Плотность: ${density}. СГЕНЕРИРОВАНО, не править руками.
   Пересборка: node scripts/build-legacy.mjs --theme=${theme} --density=${density}

   Отличия от rostra.css:
   — значения токенов подставлены, поэтому тема и плотность здесь
     фиксированы: переключение на лету требует подмены файла;
   — gap заменён отступами соседних элементов;
   — grid заменён flex и float;
   — oklch, color-mix, dvh, :has() и :focus-visible убраны вместе с
     правилами, которые старый браузер всё равно не применил бы.

   Подключать вместо rostra.css и только старым браузерам — см. README.
   ============================================================ */
`

writeFileSync(join(root, outName), header + result.css)
console.log(`${outName}: ${(header + result.css).length} байт`)
console.log(
  `  переменных развёрнуто: ${notes.vars}, gap→margin: ${notes.gap}, отступов псевдоэлементов: ${notes.pseudo},` +
    ` grid→flex/float: ${notes.grid}, удалено правил и объявлений: ${notes.dropped}, блоков @supports: ${notes.supports}`
)
