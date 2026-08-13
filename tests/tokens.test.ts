import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { checkTheme, themeNames, resolveTheme } from '../scripts/check-contrast.mjs'
import tokens from '../rostra.tokens.json'

describe('токены', () => {
  it('rostra.css собран из rostra.tokens.json без расхождений', () => {
    // Правка css руками мимо json — самый вероятный способ развалить систему:
    // токены разъедутся с темами клиентов, собранными из того же json.
    expect(() =>
      execFileSync(process.execPath, ['scripts/build-css.mjs', '--check'], {
        cwd: process.cwd(),
        stdio: 'pipe',
      })
    ).not.toThrow()
  })

  it('каждая тема объявляет все цвета, на которые ссылаются пары контраста', () => {
    for (const theme of themeNames) {
      const values = resolveTheme(theme)
      for (const pair of tokens.contrastPairs) {
        expect(values[pair.fg], `${theme}: нет токена ${pair.fg}`).toBeTruthy()
        expect(values[pair.bg], `${theme}: нет токена ${pair.bg}`).toBeTruthy()
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

describe('контраст', () => {
  for (const theme of themeNames) {
    it(`тема ${theme}: все пары проходят свой порог WCAG`, () => {
      const failed = (checkTheme(theme) as PairResult[])
        .filter((r) => !r.pass)
        .map((r) => `${r.fg} на ${r.bg}: ${r.ratio.toFixed(2)} < ${r.min} (${r.note})`)
      expect(failed).toEqual([])
    })
  }
})
