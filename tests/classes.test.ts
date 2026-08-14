import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const src = join(process.cwd(), 'src')
const css = readFileSync(join(src, 'components.css'), 'utf8')

const sources = readdirSync(src)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => ({ file: f, code: readFileSync(join(src, f), 'utf8') }))

/**
 * Classes React assembles from a template (`rs-btn--${variant}`): the regular
 * expression only sees the stump, so the variants are listed explicitly. The
 * list is short precisely because the system has deliberately few variants.
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
  // Classes only live in string literals: className, cx(), visual arguments.
  for (const match of code.matchAll(/['"`]([^'"`]*)['"`]/g)) {
    for (const token of (match[1] ?? '').split(/\s+/)) {
      if (/^rs-[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(token) && !token.endsWith('-')) found.add(token)
    }
  }
  return [...found]
}

describe('classes used by the React layer', () => {
  it.each(sources)('$file references only classes that exist', ({ code }) => {
    const missing = classesIn(code).filter((cls) => !css.includes(`.${cls}`))
    expect(missing).toEqual([])
  })

  it('variants assembled from a template are described in the css too', () => {
    expect(templated.filter((cls) => !css.includes(`.${cls}`))).toEqual([])
  })
})

/**
 * Radix sets state through attributes rather than classes. While the css only
 * knows about .is-on, the active tab is not highlighted and the menu item under
 * the arrow keys looks like any other — and no behaviour test notices, because
 * the roles and attributes are correct all along.
 */
describe('state set by the behaviour library', () => {
  it.each([
    ['tab', "[data-state='active']"],
    ['menu item under arrow keys', '[data-highlighted]'],
    ['disabled menu item', '[data-disabled]'],
  ])('%s is described in the css', (_, selector) => {
    expect(css).toContain(selector)
  })

  it('a tab resets button styling — Radix renders a button', () => {
    const rule = /\.rs-tab \{[^}]*\}/.exec(css)?.[0] ?? ''
    expect(rule).toMatch(/appearance:\s*none/)
    expect(rule).toMatch(/background:\s*none/)
    expect(rule).toMatch(/border:\s*0/)
  })

  it('the button spinner is visible on a light surface', () => {
    // Text is transparent while loading, so currentColor is no help here:
    // a white spinner on a white button cannot be seen at all.
    const rule = /\.rs-btn\.is-loading::after \{[^}]*\}/.exec(css)?.[0] ?? ''
    expect(rule).toContain('color: var(--rs-text)')
  })
})
