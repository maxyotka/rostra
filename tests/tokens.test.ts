import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { checkTheme, themeNames, resolveTheme, variants } from '../scripts/check-contrast.mjs'
import tokens from '../rostra.tokens.json'

describe('tokens', () => {
  it('rostra.css is built from rostra.tokens.json with no drift', () => {
    // Editing the css by hand instead of the json is the likeliest way to break
    // the system: tokens drift away from client themes built from the same json.
    expect(() =>
      execFileSync(process.execPath, ['scripts/build-css.mjs', '--check'], {
        cwd: process.cwd(),
        stdio: 'pipe',
      })
    ).not.toThrow()
  })

  it('every theme declares the colours the contrast pairs refer to', () => {
    for (const theme of themeNames) {
      const values = resolveTheme(theme)
      for (const pair of tokens.contrastPairs) {
        expect(values[pair.fg], `${theme}: missing token ${pair.fg}`).toBeTruthy()
        expect(values[pair.bg], `${theme}: missing token ${pair.bg}`).toBeTruthy()
      }
    }
  })
})

interface PairResult {
  fg: string
  bg: string
  ratio: number
  min: number
  note: string
  pass: boolean
}

describe('contrast', () => {
  // srgb is what a browser without oklch sees: clamping chroma into gamut moves
  // the colour, and with it possibly the contrast ratio.
  for (const variant of variants) {
    for (const theme of themeNames) {
      it(`theme ${theme} (${variant}): every pair meets its WCAG threshold`, () => {
        const failed = (checkTheme(theme, variant) as PairResult[])
          .filter((r) => !r.pass)
          .map((r) => `${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)} < ${r.min} (${r.note})`)
        expect(failed).toEqual([])
      })
    }
  }
})
