import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Комментарии выкидываются сразу: иначе они прилипают к следующему селектору.
const css = readFileSync(join(process.cwd(), 'rostra.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

// Блок @supports адресован только новым браузерам — фоллбэки живут вне его.
const supportsBlock = /@supports[^{]*\{[\s\S]*?\n\}/.exec(css)?.[0] ?? ''
const legacy = css.replace(supportsBlock, '')

interface Rule {
  selector: string
  declarations: Array<{ prop: string; value: string }>
}

const rules: Rule[] = [...legacy.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
  selector: (match[1] ?? '').trim(),
  declarations: (match[2] ?? '')
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const at = d.indexOf(':')
      return { prop: d.slice(0, at).trim(), value: d.slice(at + 1).trim() }
    }),
}))

/** Объявления, которые старый браузер отбросит, — каждому нужен предшественник. */
function unguarded(pattern: RegExp): string[] {
  const problems: string[] = []
  for (const rule of rules) {
    rule.declarations.forEach((decl, i) => {
      if (!pattern.test(decl.value)) return
      const hasFallback = rule.declarations.slice(0, i).some((earlier) => earlier.prop === decl.prop)
      if (!hasFallback) problems.push(`${rule.selector} { ${decl.prop}: ${decl.value} }`)
    })
  }
  return problems
}

describe('фоллбэки для старых браузеров', () => {
  it('перед каждым color-mix() объявлен обычный цвет', () => {
    expect(unguarded(/color-mix\(/)).toEqual([])
  })

  it('перед каждой динамической единицей вьюпорта объявлена статическая', () => {
    expect(unguarded(/\d(dvh|dvw|svh|lvh)/)).toEqual([])
  })

  it('цвета вне @supports не используют oklch', () => {
    const oklchOutside = rules.flatMap((rule) =>
      rule.declarations.filter((d) => d.value.includes('oklch(')).map((d) => `${rule.selector} { ${d.prop} }`)
    )
    expect(oklchOutside).toEqual([])
  })

  it('каждый токен из блока @supports объявлен и в sRGB-версии', () => {
    const inSupports = [...supportsBlock.matchAll(/(--rs-[\w-]+):/g)].map((m) => m[1])
    expect(inSupports.length).toBeGreaterThan(50)
    const missing = [...new Set(inSupports)].filter((token) => !legacy.includes(`${token}:`))
    expect(missing).toEqual([])
  })

  it('каждому правилу с :focus-visible отвечает правило с :focus', () => {
    const selectors = rules
      .map((r) => r.selector)
      .filter((s) => s.includes(':focus-visible') && !s.includes(':not(:focus-visible)'))
    expect(selectors.length).toBeGreaterThan(0)

    const missing = selectors.filter((selector) => {
      const fallback = selector.replaceAll(':focus-visible', ':focus')
      return !legacy.includes(fallback)
    })
    expect(missing).toEqual([])
  })
})
