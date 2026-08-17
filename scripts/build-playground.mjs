// Builds the interactive playground served from GitHub Pages.
// React stays external and arrives from a CDN through an import map, so the
// bundle contains this library and nothing else — which is also the point the
// page makes about its size.
import { build } from 'esbuild'
import { gzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outfile = join(root, 'examples', 'playground.js')

await build({
  entryPoints: [join(root, 'examples', 'playground.jsx')],
  outfile,
  bundle: true,
  minify: true,
  format: 'esm',
  jsx: 'automatic',
  target: 'es2020',
  external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
})

const bytes = readFileSync(outfile)
console.log(`playground.js — ${(bytes.length / 1024).toFixed(1)} kB, ${(gzipSync(bytes).length / 1024).toFixed(1)} kB gzipped`)
