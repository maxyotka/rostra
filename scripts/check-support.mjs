// Derives the minimum browser version from caniuse-lite data.
// Not "we think it works", but "here is the feature and the version it landed in".
// `node scripts/check-support.mjs`
import { feature, features } from 'caniuse-lite'
import { legacyTargets } from './legacy-targets.mjs'

/**
 * Features without which the system breaks: the layout falls apart or custom
 * properties do not work at all. These set the support floor.
 */
const required = {
  'css-variables': 'tokens — the whole system is built on custom properties',
  'flexbox-gap': 'gap in flexbox — 43 places; without it spacing collapses',
  'css-grid': 'grid — KeyValue, calendar, event timeline, mobile navigation',
  calc: 'calc() — layer sizes and spacing',
}

/**
 * Features that degrade gracefully: the interface stays usable and readable,
 * just without some conveniences. They do not raise the floor.
 */
const progressive = {
  // An unknown at-rule is skipped whole, and the oklch branch with it — what
  // remains is the sRGB block declared before it. That is exactly the desired
  // behaviour, which is why @supports is not in the required list.
  'css-supports-api': '@supports — without it the earlier sRGB block applies',
  'css-lch-lab': 'oklch — older browsers take the sRGB twin declared before @supports',
  'css-color-function': 'color-mix — a static colour is declared before it',
  'css-focus-visible': ':focus-visible — the fallback shows the ring on any focus',
  'css-has': ':has() — only the not-allowed cursor on a disabled control',
  'viewport-unit-variants': 'dvh — vh is declared before it',
  'css-sticky': 'sticky — the first table column simply does not pin',
  'css-appearance': 'appearance — prefixed variants are declared alongside',
  'text-underline-offset': 'link underline offset',
  'prefers-reduced-motion': 'muting animation — otherwise it just plays',
}

/**
 * What rostra.legacy.css holds. Prefixes are already in place there, so support
 * counts partial ('a') too: for flexbox that is precisely the old -ms- and
 * -webkit- syntax the build exists for.
 */
const legacyRequired = {
  flexbox: 'the entire layout — sidebar, header, cards, filters, rows',
  calc: 'calc() — layer sizes and spacing',
  'css-mediaqueries': 'media queries — tablet and mobile shells',
  'css-gencontent': '::before and ::after — status dots, checkmarks, lines',
  transforms2d: 'transform — switch, buttons, layers',
  'css-transitions': 'state transitions',
  'border-radius': 'rounded corners — without them the system looks foreign',
  'css-boxshadow': 'shadows of floating layers and the focus ring',
  'css3-colors': 'rgba — the modal backdrop',
  'viewport-units': 'vh — application and layer height',
}

const browsers = {
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  safari: 'Safari',
  ios_saf: 'Safari iOS',
  samsung: 'Samsung Internet',
  opera: 'Opera',
  and_uc: 'UC Browser',
  ie: 'Internet Explorer',
}

// caniuse keeps only the current version for Chrome and Firefox on Android, so
// "which version started supporting this" cannot be recovered from that data —
// their desktop twins answer the same question more precisely.

// A version may be a range ("14.5-14.8") — take the lower bound.
const versionKey = (v) => parseFloat(String(v).split('-')[0])
// caniuse also stores non-numeric labels: TP for Safari, "all" for mobile.
const isRealVersion = (v) => Number.isFinite(versionKey(v))

/**
 * First version of the browser with support; null if never supported.
 * `withPartial` also counts partial ('a') support — that means prefixed or
 * legacy syntax, which the legacy build already emits.
 */
function firstSupported(featureId, browser, withPartial = false) {
  const data = features[featureId]
  if (!data) throw new Error(`caniuse does not know the feature ${featureId}`)
  const stats = feature(data).stats[browser]
  if (!stats) return null
  const ok = (support) => support.startsWith('y') || (withPartial && support.startsWith('a'))
  const supported = Object.entries(stats)
    .filter(([version, support]) => ok(support) && isRealVersion(version))
    .map(([version]) => version)
    .sort((a, b) => versionKey(a) - versionKey(b))
  return supported[0] ?? null
}

const report = {}
for (const browser of Object.keys(browsers)) {
  let min = null
  let blocker = null
  let unsupported = null
  for (const [id, why] of Object.entries(required)) {
    const version = firstSupported(id, browser)
    if (version === null) {
      unsupported = `${id} — ${why}`
      break
    }
    if (min === null || versionKey(version) > versionKey(min)) {
      min = version
      blocker = `${id} — ${why}`
    }
  }
  report[browser] = { min, blocker, unsupported }
}

console.log('rostra.css — the floor is set by the latest of the required features:\n')
for (const [browser, label] of Object.entries(browsers)) {
  const { min, blocker, unsupported } = report[browser]
  if (unsupported) {
    console.log(`  ${label.padEnd(18)} unsupported: ${unsupported}`)
  } else {
    console.log(`  ${label.padEnd(18)} ${String(min).padEnd(6)} <- ${blocker}`)
  }
}

console.log('\n\nrostra.legacy.css — the build for old browsers:\n')
for (const [browser, label] of Object.entries(browsers)) {
  let min = null
  let blocker = null
  let unsupported = null
  for (const [id, why] of Object.entries(legacyRequired)) {
    const version = firstSupported(id, browser, true)
    if (version === null) {
      unsupported = `${id} — ${why}`
      break
    }
    if (min === null || versionKey(version) > versionKey(min)) {
      min = version
      blocker = `${id} — ${why}`
    }
  }
  if (unsupported) {
    console.log(`  ${label.padEnd(18)} unsupported: ${unsupported}`)
    continue
  }
  // Browser support alone is not enough: the prefixes have to be there too, and
  // autoprefixer emits them strictly for the build targets. Promise the lower
  // of the two.
  const target = legacyTargets[browser]
  if (target !== undefined && versionKey(target) > versionKey(min)) {
    console.log(`  ${label.padEnd(18)} ${String(target).padEnd(6)} <- build target (the browser can do it from ${min}: ${blocker})`)
  } else {
    console.log(`  ${label.padEnd(18)} ${String(min).padEnd(6)} <- ${blocker}`)
  }
}

// The practical floor is set by transport, not CSS: a browser without TLS 1.2
// will not reach a modern server and never gets to the stylesheet at all.
console.log('\n\nTLS 1.2 — below these versions a browser cannot open the site over https:\n')
for (const [browser, label] of Object.entries(browsers)) {
  const version = firstSupported('tls1-2', browser)
  console.log(`  ${label.padEnd(18)} ${version ?? 'not supported'}`)
}
console.log('  (on an internal network over plain http this limit does not apply)')

console.log('\nDegrade gracefully, do not raise the floor:\n')
for (const [id, why] of Object.entries(progressive)) {
  if (!features[id]) continue
  const chrome = firstSupported(id, 'chrome')
  const safari = firstSupported(id, 'safari')
  console.log(`  ${id.padEnd(24)} Chrome ${String(chrome ?? '—').padEnd(5)} Safari ${String(safari ?? '—').padEnd(6)} ${why}`)
}
