// Builds the React layer: esm + cjs. Types come from tsc in a separate step.
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

// Peers stay external: bundling React into the package is a reliable way to
// end up with two copies in the application and a broken context.
const external = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {}), 'react/jsx-runtime']

const common = {
  entryPoints: [join(root, 'src', 'index.ts')],
  bundle: true,
  external,
  platform: 'neutral',
  // Lower than the CSS core supports would be pointless; higher would make the
  // script the bottleneck — Chrome 84 from the support table cannot run es2022.
  target: ['es2019'],
  jsx: 'automatic',
  sourcemap: true,
  logLevel: 'info',
}

await build({ ...common, format: 'esm', outfile: join(root, 'dist', 'index.js') })
await build({ ...common, format: 'cjs', outfile: join(root, 'dist', 'index.cjs') })
