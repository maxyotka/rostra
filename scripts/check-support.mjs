// Считает минимальную версию браузера по данным caniuse-lite.
// Не «мы думаем, что работает», а «вот фича, вот версия, где она появилась».
// `node scripts/check-support.mjs`
import { feature, features } from 'caniuse-lite'

/**
 * Фичи, без которых система ломается: раскладка едет или переменные не
 * работают вовсе. Они и задают нижнюю границу поддержки.
 */
const required = {
  'css-variables': 'токены — вся система построена на кастомных свойствах',
  'flexbox-gap': 'gap во flex — 43 места, без него отступы схлопываются',
  'css-grid': 'grid — KeyValue, календарь, лента событий, мобильная навигация',
  'css-supports-api': '@supports — им отделена oklch-ветка от sRGB-фоллбэка',
  calc: 'calc() — размеры слоёв и отступы',
}

/**
 * Фичи, которые деградируют мягко: интерфейс остаётся рабочим и читаемым,
 * просто без части удобств. Нижнюю границу они не поднимают.
 */
const progressive = {
  'css-lch-lab': 'oklch — старые берут sRGB-двойник из блока до @supports',
  'css-color-function': 'color-mix — перед ним объявлен статический цвет',
  'css-focus-visible': ':focus-visible — фоллбэк даёт кольцо на любом фокусе',
  'css-has': ':has() — только курсор not-allowed у выключенного контрола',
  'viewport-unit-variants': 'dvh — перед ним объявлен vh',
  'css-sticky': 'sticky — первая колонка таблицы просто не залипает',
  'css-appearance': 'appearance — рядом объявлены префиксные варианты',
  'text-underline-offset': 'отступ подчёркивания ссылки',
  'prefers-reduced-motion': 'гашение анимаций — иначе они просто играют',
}

const browsers = {
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  safari: 'Safari',
  ios_saf: 'Safari iOS',
  samsung: 'Samsung Internet',
  ie: 'Internet Explorer',
}

// caniuse хранит для Chrome и Firefox под Android только текущую версию,
// поэтому «с какой начали поддерживать» по этим данным не восстановить —
// их десктопные близнецы отвечают на тот же вопрос точнее.

// Версия может быть диапазоном ("14.5-14.8") — берём нижнюю границу.
const versionKey = (v) => parseFloat(String(v).split('-')[0])
// caniuse держит и нечисловые метки: TP у Safari, "all" у мобильных.
const isRealVersion = (v) => Number.isFinite(versionKey(v))

/** Первая версия браузера с полной поддержкой ('y'); null — не поддержана нигде. */
function firstSupported(featureId, browser) {
  const data = features[featureId]
  if (!data) throw new Error(`caniuse не знает фичу ${featureId}`)
  const stats = feature(data).stats[browser]
  if (!stats) return null
  const supported = Object.entries(stats)
    .filter(([version, support]) => support.startsWith('y') && isRealVersion(version))
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

console.log('Минимальная версия — определяется самой поздней из обязательных фич:\n')
for (const [browser, label] of Object.entries(browsers)) {
  const { min, blocker, unsupported } = report[browser]
  if (unsupported) {
    console.log(`  ${label.padEnd(18)} не поддерживается: ${unsupported}`)
  } else {
    console.log(`  ${label.padEnd(18)} ${String(min).padEnd(6)} ← ${blocker}`)
  }
}

console.log('\nДеградируют мягко, нижнюю границу не поднимают:\n')
for (const [id, why] of Object.entries(progressive)) {
  if (!features[id]) continue
  const chrome = firstSupported(id, 'chrome')
  const safari = firstSupported(id, 'safari')
  console.log(`  ${id.padEnd(24)} Chrome ${String(chrome ?? '—').padEnd(5)} Safari ${String(safari ?? '—').padEnd(6)} ${why}`)
}
