// Сборка React-слоя: esm + cjs. Типы отдаёт tsc отдельным шагом.
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

// Всё, что объявлено зависимостью, остаётся внешним: дублировать react
// или примитивы Radix внутрь пакета — верный способ получить два экземпляра
// в приложении и сломать контекст.
const external = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {}), 'react/jsx-runtime']

const common = {
  entryPoints: [join(root, 'src', 'index.ts')],
  bundle: true,
  external,
  platform: 'neutral',
  // Ниже, чем поддерживает css-ядро, смысла не имеет, выше — сделало бы
  // js узким местом: Chrome 84 из таблицы поддержки es2022 не выполнит.
  target: ['es2019'],
  jsx: 'automatic',
  sourcemap: true,
  logLevel: 'info',
}

await build({ ...common, format: 'esm', outfile: join(root, 'dist', 'index.js') })
await build({ ...common, format: 'cjs', outfile: join(root, 'dist', 'index.cjs') })
