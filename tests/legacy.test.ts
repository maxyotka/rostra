import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The header comment lists what was removed, so searching the raw text would
// find those words in the comment itself.
const raw = readFileSync(join(process.cwd(), 'rostra.legacy.css'), 'utf8')
const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')

describe('legacy build', () => {
  it('rebuilds from the current rostra.css with no drift', () => {
    const before = raw
    execFileSync(process.execPath, ['scripts/build-legacy.mjs'], { cwd: process.cwd(), stdio: 'pipe' })
    expect(readFileSync(join(process.cwd(), 'rostra.legacy.css'), 'utf8')).toBe(before)
  })

  it('contains nothing an old browser cannot parse', () => {
    const forbidden = {
      'custom properties': /--rs-[\w-]+\s*:/,
      'var()': /var\(/,
      oklch: /oklch\(/,
      'color-mix()': /color-mix\(/,
      'dvh/svh/lvh units': /\d(dvh|dvw|svh|lvh)/,
      ':has()': /:has\(/,
      ':focus-visible': /:focus-visible/,
      'gap in flexbox': /(^|[^-\w])(row-|column-)?gap\s*:/m,
      'display: grid': /display:\s*(inline-)?grid/,
      '@supports': /@supports/,
    }
    const found = Object.entries(forbidden)
      .filter(([, pattern]) => pattern.test(css))
      .map(([name]) => name)
    expect(found).toEqual([])
  })

  it('lays out with flexbox and the IE prefixes', () => {
    expect(css).toMatch(/display:\s*-ms-flexbox/)
    expect(css).toMatch(/-ms-flex-align/)
    expect(css).toMatch(/-ms-flex-pack/)
  })

  it('moves the spacing gap provided onto siblings and pseudo-elements', () => {
    // The badge dot and the eyebrow tick were separated from their text by gap:
    // an adjacent-sibling selector cannot reach them, so the margin sits on the
    // pseudo-element itself.
    expect(css).toMatch(/\.rs-badge::before\s*\{[^}]*margin-right/)
    expect(css).toMatch(/\.rs-eyebrow--tick::before\s*\{[^}]*margin-right/)
    expect(css).toMatch(/\.rs-btn\s*>\s*\*\s*\+\s*\*\s*\{[^}]*margin-left/)
  })

  it('uses the same colours as the sRGB branch of the main build', () => {
    const main = readFileSync(join(process.cwd(), 'rostra.css'), 'utf8')
    // The light theme accent, as computed while building the main file.
    const accent = /--rs-accent-500:\s*(#[0-9a-f]{6})/.exec(main)?.[1]
    expect(accent).toBeTruthy()
    expect(css).toContain(accent as string)
  })
})
