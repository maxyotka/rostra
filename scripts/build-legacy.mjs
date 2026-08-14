// Builds rostra.legacy.css — the build for browsers without custom properties.
// The main build is untouched: a modern browser loads only that one, an old one
// only the legacy file. Wiring both up is described in the README.
//
// `node scripts/build-legacy.mjs`                  — light, medium
// `node scripts/build-legacy.mjs --theme=dark`     — another theme
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

if (!tokens.themes[theme]) throw new Error(`no such theme: ${theme}`)
if (!tokens.density[density]) throw new Error(`no such density: ${density}`)

/** Flat value map: base theme, then the chosen theme, then the density. */
function buildValues() {
  const flat = {
    ...tokens.themes[tokens.$meta.defaultTheme],
    ...tokens.base,
    ...tokens.density[tokens.$meta.defaultDensity],
    ...(theme === tokens.$meta.defaultTheme ? {} : tokens.themes[theme]),
    ...tokens.density[density],
  }
  const values = {}
  // Tokens in the json are authored in oklch — this build needs the sRGB twin,
  // the same one that goes into the main css before the @supports block.
  for (const [key, value] of Object.entries(flat)) values[`--rs-${key}`] = toSrgb(value) ?? String(value)
  // References such as --rs-info: var(--rs-accent-500) are resolved all the way.
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

/** Expands var() into a concrete value — the legacy build must contain none. */
function resolve(value) {
  let out = value
  for (let pass = 0; pass < 5 && out.includes('var('); pass++) {
    out = out.replace(/var\((--rs-[\w-]+)(?:,\s*([^)]+))?\)/g, (whole, ref, fallback) => values[ref] ?? fallback ?? whole)
  }
  return out
}

/**
 * Rules where gap is not declared next to display inherit their layout from a
 * base class, so the direction has to be known in advance. The list is short
 * and covered by a test — a new rule of this kind makes the test fail.
 */
const inheritedFlex = { '.rs-eyebrow--tick': 'row' }

const source = readFileSync(join(root, 'rostra.css'), 'utf8')
const css = postcss.parse(source)

const notes = { vars: 0, gap: 0, pseudo: 0, grid: 0, dropped: 0, supports: 0 }
/** Selectors whose gap is already handled: needed for pseudo-element spacing. */
const gapped = new Map()

// 1. The @supports block with oklch is addressed to modern browsers — here it
//    is dead weight.
css.walkAtRules('supports', (rule) => {
  if (rule.params.includes('oklch')) {
    rule.remove()
    notes.supports++
  }
})

// 2. Rules whose selectors use pseudo-classes an old browser cannot parse:
//    :has() is dropped, and of the :focus / :focus-visible pair the plain
//    :focus stays — that is the fallback.
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

// 3. Declarations IE would discard on its own. Removed explicitly so they do
//    not confuse autoprefixer or a human reading the file.
css.walkDecls((decl) => {
  if (/color-mix\(|oklch\(|\d(dvh|dvw|svh|lvh)/.test(decl.value)) {
    decl.remove()
    notes.dropped++
  }
})

// 4. Resolve custom properties.
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

// Rules left empty after the custom properties were removed serve no purpose.
css.walkRules((rule) => {
  if (rule.nodes.length === 0) rule.remove()
})

// 5. gap -> margins on siblings. IE11 knows flexbox but not gap, so the spacing
//    between items becomes a margin along the layout direction.
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

  // gap is either "8px" or "10px 16px" — row gap and column gap.
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
 * gap also separated pseudo-elements: the badge dot, the eyebrow line, the
 * tick. An adjacent-sibling selector cannot reach them — neither ::before nor
 * the text node next to it is a "* + *". So the margin goes on the
 * pseudo-element itself.
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
  // display:none on the pseudo-element means it is switched off in this
  // variant, so it needs no spacing.
  if (rule.nodes.some((n) => n.type === 'decl' && n.prop === 'display' && n.value === 'none')) return
  rule.append({ prop: side, value: parent.step })
  notes.pseudo++
})

// 6. grid -> a layout IE can do. There are no exact equivalents, so every case
//    is described separately: what matters is the arrangement, not the method.
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
    console.warn(`  ! grid with no described fallback: ${rule.selector}`)
    return
  }
  rule.nodes
    .filter((n) => n.type === 'decl' && (n.prop.startsWith('grid') || n.prop.endsWith('gap')))
    .forEach((n) => n.remove())
  display.remove()
  rule.prepend(...fallback)
  notes.grid++
})

// 7. Comments from the main file that explain oklch, @supports and tokens do
//    not apply to this build and would only mislead: none of that is here.
css.walkComments((comment) => {
  if (/oklch|@supports|var\(--|GENERATED/.test(comment.text)) comment.remove()
})

// Column widths for KeyValue and the calendar move onto the children — grid no
// longer arranges them.
css.append(`
/* Layouts that need an explicit size in IE, now that grid no longer places them. */
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
   rostra.legacy.css — the build for browsers without custom properties.
   Theme: ${theme}. Density: ${density}. GENERATED, do not edit by hand.
   Rebuild with: node scripts/build-legacy.mjs --theme=${theme} --density=${density}

   Differences from rostra.css:
   — token values are inlined, so theme and density are fixed here:
     switching at runtime means swapping the file;
   — gap is replaced with margins on adjacent elements;
   — grid is replaced with flex and float;
   — oklch, color-mix, dvh, :has() and :focus-visible are removed along with
     the rules an old browser would not have applied anyway.

   Load instead of rostra.css, and only for old browsers — see the README.
   ============================================================ */
`

writeFileSync(join(root, outName), header + result.css)
console.log(`${outName}: ${(header + result.css).length} bytes`)
console.log(
  `  custom properties resolved: ${notes.vars}, gap->margin: ${notes.gap}, pseudo-element spacing: ${notes.pseudo},` +
    ` grid->flex/float: ${notes.grid}, rules and declarations removed: ${notes.dropped}, @supports blocks: ${notes.supports}`
)
