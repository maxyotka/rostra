/**
 * Targets for the legacy build. Both autoprefixer and the support report read
 * them from here, so the promise in the README cannot drift away from the
 * prefixes that are actually emitted.
 *
 * Below these versions flexbox only existed in the 2009 syntax
 * (`display: box`) — a fundamentally different model without line wrapping.
 * Autoprefixer can emit it, but the whole point of the legacy build is that
 * the layout stays the same.
 */
export const legacyTargets = {
  ie: 10,
  edge: 12,
  chrome: 21,
  firefox: 28,
  safari: '6.1',
  ios_saf: 7,
  opera: 15,
  samsung: 4,
}

/** The same list in the form browserslist understands. */
export const browserslistQuery = [
  'ie 11',
  'ie 10',
  'chrome >= 21',
  'firefox >= 28',
  'safari >= 6.1',
  'ios_saf >= 7',
  'edge >= 12',
  'opera >= 15',
  'samsung >= 4',
]
