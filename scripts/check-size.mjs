// Measures what the published builds cost: esbuild bundles dist/, gzip counts.
// The numbers in the README come from here, and `--check` fails when a build
// grows past the budget recorded below.
// `node scripts/check-size.mjs`         — print the table
// `node scripts/check-size.mjs --check` — fail if anything exceeds its budget
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { build } from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const entry = join(root, 'dist/index.js')

/** Budgets in kB gzipped. A change that exceeds one is a decision, not an accident. */
const budgets = {
  'A button': 2,
  'A screen: shell, filters, fields, table, badges': 3,
  'Button, table, badge, dialog, text input': 4,
  'Every component in the package': 13,
  'rostra.css': 14,
  'rostra.legacy.css': 13,
}

const imports = {
  'A button': ['Button'],
  'A screen: shell, filters, fields, table, badges': [
    'AppShell', 'AppMain', 'Sidebar', 'NavItem', 'Topbar', 'Pane',
    'Field', 'Input', 'Select', 'Button', 'Table', 'TableWrap', 'Badge',
  ],
  'Button, table, badge, dialog, text input': ['Button', 'Table', 'Badge', 'Dialog', 'Input'],
}

async function bundle(names) {
  const contents = names
    ? `import {${names.join(',')}} from ${JSON.stringify(entry)}\nconsole.log(${names.join(',')})`
    : `import * as everything from ${JSON.stringify(entry)}\nconsole.log(everything)`
  const out = await build({
    stdin: { contents, resolveDir: root, loader: 'js' },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    // React is a peer: it is already on the page, so it is not part of the cost.
    external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
  })
  return gzipSync(out.outputFiles[0].contents).length / 1024
}

const measured = {}
for (const [label, names] of Object.entries(imports)) measured[label] = await bundle(names)
measured['Every component in the package'] = await bundle(null)
for (const file of ['rostra.css', 'rostra.legacy.css']) {
  measured[file] = gzipSync(readFileSync(join(root, file))).length / 1024
}

const width = Math.max(...Object.keys(measured).map((k) => k.length))
let over = 0
for (const [label, kb] of Object.entries(measured)) {
  const budget = budgets[label]
  const exceeded = budget !== undefined && kb > budget
  if (exceeded) over++
  console.log(
    `  ${label.padEnd(width)}  ${kb.toFixed(1).padStart(5)} kB` +
      (budget === undefined ? '' : `   budget ${budget} kB${exceeded ? '   OVER' : ''}`)
  )
}

if (process.argv.includes('--check') && over) {
  console.error(`\n${over} measurement(s) over budget. Raise the budget in scripts/check-size.mjs, or take the bytes back out.`)
  process.exit(1)
}
