import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const src = join(process.cwd(), 'src')
const css = readFileSync(join(src, 'components.css'), 'utf8')

const sources = readdirSync(src)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => ({ file: f, code: readFileSync(join(src, f), 'utf8') }))

/**
 * Классы, которые React собирает из шаблона (`rs-btn--${variant}`): регулярка
 * видит только огрызок, поэтому варианты перечислены явно. Список короткий
 * ровно потому, что вариантов в системе намеренно мало.
 */
const templated = [
  'rs-btn--primary',
  'rs-btn--ghost',
  'rs-btn--danger',
  'rs-badge--ok',
  'rs-badge--warn',
  'rs-badge--bad',
  'rs-badge--info',
  'rs-alert--ok',
  'rs-alert--warn',
  'rs-alert--bad',
  'rs-alert--info',
  'rs-eyebrow--tick',
  'rs-eyebrow--tag',
  'rs-state__mark--warn',
  'rs-state__mark--bad',
  'rs-state__mark--info',
]

function classesIn(code: string): string[] {
  const found = new Set<string>()
  // Классы живут только в строковых литералах: className, cx(), visual-аргументы.
  for (const match of code.matchAll(/['"`]([^'"`]*)['"`]/g)) {
    for (const token of (match[1] ?? '').split(/\s+/)) {
      if (/^rs-[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(token) && !token.endsWith('-')) found.add(token)
    }
  }
  return [...found]
}

describe('классы React-слоя', () => {
  it.each(sources)('$file ссылается только на существующие классы', ({ code }) => {
    const missing = classesIn(code).filter((cls) => !css.includes(`.${cls}`))
    expect(missing).toEqual([])
  })

  it('варианты, собираемые из шаблона, тоже описаны в css', () => {
    expect(templated.filter((cls) => !css.includes(`.${cls}`))).toEqual([])
  })
})
