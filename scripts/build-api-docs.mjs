// Generates docs/api.md from the built .d.ts files.
// Hand-written prop tables drift the moment a prop is added; these are read
// out of the types the package actually ships.
//
//   node scripts/build-api-docs.mjs           write docs/api.md
//   node scripts/build-api-docs.mjs --check   fail if the file is out of date
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

/** Splits a `.d.ts` into interface blocks, keeping the doc comment above each member. */
function interfaces(source) {
  const found = new Map()
  const re = /(?:\/\*\*([\s\S]*?)\*\/\s*)?(?:export )?interface (\w+)([^{]*)\{([\s\S]*?)\n\}/g
  for (const match of source.matchAll(re)) {
    const [, doc, name, heritage, body] = match
    found.set(name, { doc: clean(doc), extends: (heritage.match(/extends ([^{]+)/)?.[1] ?? '').trim(), body })
  }
  return found
}

function clean(doc) {
  if (!doc) return ''
  return doc
    .split('\n')
    .map((line) => line.replace(/^\s*\*ы?\s?/, '').replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ')
    .trim()
}

/**
 * Members of one interface body: name, optionality, type, and the comment
 * above. Brace depth is tracked rather than matched, because a prop whose type
 * is an object literal spans lines and a regular expression would read each of
 * its fields as another prop.
 */
function members(body) {
  const out = []
  let doc = ''
  let pending = ''
  let declaration = ''
  let depth = 0

  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (!declaration && (line.startsWith('/**') || line.startsWith('*') || line.startsWith('*/'))) {
      pending += ' ' + line
      if (line.includes('*/')) {
        doc = clean(pending.replace('/**', '').replace('*/', ''))
        pending = ''
      }
      continue
    }
    if (!declaration && line.startsWith('//')) continue

    declaration += (declaration ? ' ' : '') + line
    for (const char of line) {
      if ('{(<['.includes(char)) depth++
      else if ('})>]'.includes(char)) depth--
    }
    if (depth > 0 || !declaration.endsWith(';')) continue

    const match = /^(\w+|'[^']+')(\?)?:\s*([\s\S]*);$/.exec(declaration)
    if (match) {
      out.push({
        name: match[1].replace(/'/g, ''),
        required: !match[2],
        type: match[3].replace(/\s+/g, ' ').trim(),
        doc,
      })
    }
    declaration = ''
    doc = ''
  }
  return out
}

const files = readdirSync(dist).filter((f) => f.endsWith('.d.ts') && f !== 'index.d.ts')
const all = new Map()
for (const file of files) {
  for (const [name, entry] of interfaces(readFileSync(join(dist, file), 'utf8'))) {
    all.set(name, { ...entry, file: file.replace('.d.ts', '') })
  }
}

// Only the interfaces the package exports, in the order index.d.ts lists them.
const index = readFileSync(join(dist, 'index.d.ts'), 'utf8')
const exported = [...index.matchAll(/export type \{([^}]+)\}/g)]
  .flatMap((m) => m[1].split(',').map((s) => s.trim()))
  .filter(Boolean)

const groups = { forms: 'Forms', data: 'Data and status', layers: 'Layers', shell: 'Shell and navigation', interactive: 'Pickers', theme: 'Theme' }

let md = `# API reference

Generated from the shipped types by \`npm run build:api\` — do not edit by hand.
Every component also accepts the props of the element it renders, so
\`className\`, \`style\`, \`id\`, \`aria-*\` and event handlers work everywhere.

`

for (const [file, title] of Object.entries(groups)) {
  const names = exported.filter((name) => all.get(name)?.file === file)
  if (!names.length) continue
  md += `## ${title}\n\n`
  for (const name of names) {
    const entry = all.get(name)
    const rows = members(entry.body)
    md += `### ${name.replace(/Props$/, '')}\n\n`
    if (entry.doc) md += `${entry.doc}\n\n`
    if (!rows.length) {
      md += `No props of its own.\n\n`
      continue
    }
    md += `| Prop | Type | Required | Notes |\n| --- | --- | --- | --- |\n`
    for (const row of rows) {
      const type = row.type.length > 70 ? row.type.slice(0, 67) + '…' : row.type
      md += `| \`${row.name}\` | \`${type.replace(/\|/g, '\\|')}\` | ${row.required ? 'yes' : '—'} | ${row.doc || ''} |\n`
    }
    md += '\n'
  }
}

const target = join(root, 'docs', 'api.md')
if (process.argv.includes('--check')) {
  const current = readFileSync(target, 'utf8')
  if (current !== md) {
    console.error('docs/api.md is out of date — run `npm run build:api`')
    process.exit(1)
  }
  console.log('docs/api.md matches the types')
} else {
  writeFileSync(target, md)
  console.log(`docs/api.md — ${md.split('\n### ').length - 1} components`)
}
