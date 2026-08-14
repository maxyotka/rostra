import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Комментарии заголовка перечисляют убранное — по тексту искать нельзя.
const raw = readFileSync(join(process.cwd(), 'rostra.legacy.css'), 'utf8')
const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')

describe('сборка для старых браузеров', () => {
  it('пересобирается из текущего rostra.css без расхождений', () => {
    const before = raw
    execFileSync(process.execPath, ['scripts/build-legacy.mjs'], { cwd: process.cwd(), stdio: 'pipe' })
    expect(readFileSync(join(process.cwd(), 'rostra.legacy.css'), 'utf8')).toBe(before)
  })

  it('не содержит ничего, чего старый браузер не поймёт', () => {
    const forbidden = {
      'кастомные свойства': /--rs-[\w-]+\s*:/,
      'var()': /var\(/,
      oklch: /oklch\(/,
      'color-mix()': /color-mix\(/,
      'единицы dvh/svh/lvh': /\d(dvh|dvw|svh|lvh)/,
      ':has()': /:has\(/,
      ':focus-visible': /:focus-visible/,
      'gap во flex': /(^|[^-\w])(row-|column-)?gap\s*:/m,
      'display: grid': /display:\s*(inline-)?grid/,
      '@supports': /@supports/,
    }
    const found = Object.entries(forbidden)
      .filter(([, pattern]) => pattern.test(css))
      .map(([name]) => name)
    expect(found).toEqual([])
  })

  it('раскладка переведена на флексбокс с префиксами для IE', () => {
    expect(css).toMatch(/display:\s*-ms-flexbox/)
    expect(css).toMatch(/-ms-flex-align/)
    expect(css).toMatch(/-ms-flex-pack/)
  })

  it('отступы, которые задавал gap, перенесены на соседей и псевдоэлементы', () => {
    // Точка бейджа и риска надзаголовка отделялись от текста через gap:
    // соседский селектор их не достаёт, поэтому отступ висит на них самих.
    expect(css).toMatch(/\.rs-badge::before\s*\{[^}]*margin-right/)
    expect(css).toMatch(/\.rs-eyebrow--tick::before\s*\{[^}]*margin-right/)
    expect(css).toMatch(/\.rs-btn\s*>\s*\*\s*\+\s*\*\s*\{[^}]*margin-left/)
  })

  it('цвета совпадают с sRGB-ветвью основной сборки', () => {
    const main = readFileSync(join(process.cwd(), 'rostra.css'), 'utf8')
    // Акцент светлой темы, посчитанный при сборке основного файла.
    const accent = /--rs-accent-500:\s*(#[0-9a-f]{6})/.exec(main)?.[1]
    expect(accent).toBeTruthy()
    expect(css).toContain(accent as string)
  })
})
