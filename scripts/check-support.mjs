// Считает минимальную версию браузера по данным caniuse-lite.
// Не «мы думаем, что работает», а «вот фича, вот версия, где она появилась».
// `node scripts/check-support.mjs`
import { feature, features } from 'caniuse-lite'
import { legacyTargets } from './legacy-targets.mjs'

/**
 * Фичи, без которых система ломается: раскладка едет или переменные не
 * работают вовсе. Они и задают нижнюю границу поддержки.
 */
const required = {
  'css-variables': 'токены — вся система построена на кастомных свойствах',
  'flexbox-gap': 'gap во flex — 43 места, без него отступы схлопываются',
  'css-grid': 'grid — KeyValue, календарь, лента событий, мобильная навигация',
  calc: 'calc() — размеры слоёв и отступы',
}

/**
 * Фичи, которые деградируют мягко: интерфейс остаётся рабочим и читаемым,
 * просто без части удобств. Нижнюю границу они не поднимают.
 */
const progressive = {
  // Неизвестное at-rule браузер пропускает целиком, а вместе с ним и
  // oklch-ветку — остаётся sRGB-блок, объявленный до него. Это ровно то
  // поведение, которое нужно, поэтому @supports в обязательные не входит.
  'css-supports-api': '@supports — без него берётся sRGB-блок, объявленный раньше',
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

/**
 * Что держит rostra.legacy.css. Префиксы там уже проставлены, поэтому
 * поддержка считается вместе с частичной ('a'): для flexbox это как раз
 * старый -ms- и -webkit- синтаксис, ради которого сборка и существует.
 */
const legacyRequired = {
  flexbox: 'вся раскладка — сайдбар, шапка, карточки, фильтры, строки',
  calc: 'calc() — размеры слоёв и отступы',
  'css-mediaqueries': 'медиазапросы — планшетный и мобильный контур',
  'css-gencontent': '::before и ::after — точки статусов, галочки, линии',
  transforms2d: 'transform — переключатель, кнопки, слои',
  'css-transitions': 'переходы состояний',
  'border-radius': 'скругления — без них система выглядит чужой',
  'css-boxshadow': 'тени всплывающих слоёв и кольцо фокуса',
  'css3-colors': 'rgba — подложка модального окна',
  'viewport-units': 'vh — высота приложения и слоёв',
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

// caniuse хранит для Chrome и Firefox под Android только текущую версию,
// поэтому «с какой начали поддерживать» по этим данным не восстановить —
// их десктопные близнецы отвечают на тот же вопрос точнее.

// Версия может быть диапазоном ("14.5-14.8") — берём нижнюю границу.
const versionKey = (v) => parseFloat(String(v).split('-')[0])
// caniuse держит и нечисловые метки: TP у Safari, "all" у мобильных.
const isRealVersion = (v) => Number.isFinite(versionKey(v))

/**
 * Первая версия браузера с поддержкой; null — не поддержана нигде.
 * `withPartial` засчитывает и частичную ('a') — она означает префиксный или
 * устаревший синтаксис, который в legacy-сборке уже проставлен.
 */
function firstSupported(featureId, browser, withPartial = false) {
  const data = features[featureId]
  if (!data) throw new Error(`caniuse не знает фичу ${featureId}`)
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

console.log('Минимальная версия — определяется самой поздней из обязательных фич:\n')
for (const [browser, label] of Object.entries(browsers)) {
  const { min, blocker, unsupported } = report[browser]
  if (unsupported) {
    console.log(`  ${label.padEnd(18)} не поддерживается: ${unsupported}`)
  } else {
    console.log(`  ${label.padEnd(18)} ${String(min).padEnd(6)} ← ${blocker}`)
  }
}

console.log('\n\nrostra.legacy.css — сборка для старых браузеров:\n')
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
    console.log(`  ${label.padEnd(18)} не поддерживается: ${unsupported}`)
    continue
  }
  // Одной поддержки браузером мало: нужны ещё и префиксы, а их autoprefixer
  // расставляет ровно по целям сборки. Обещаем меньшее из двух.
  const target = legacyTargets[browser]
  if (target !== undefined && versionKey(target) > versionKey(min)) {
    console.log(`  ${label.padEnd(18)} ${String(target).padEnd(6)} ← цель сборки (браузер умеет с ${min}: ${blocker})`)
  } else {
    console.log(`  ${label.padEnd(18)} ${String(min).padEnd(6)} ← ${blocker}`)
  }
}

// Практический предел задаёт не css, а транспорт: браузер без TLS 1.2 не
// установит соединение с современным сервером и до стилей просто не дойдёт.
console.log('\n\nTLS 1.2 — ниже этих версий браузер не откроет сайт по https:\n')
for (const [browser, label] of Object.entries(browsers)) {
  const version = firstSupported('tls1-2', browser)
  console.log(`  ${label.padEnd(18)} ${version ?? 'не поддерживает'}`)
}
console.log('  (во внутренней сети по http ограничение не действует)')

console.log('\nДеградируют мягко, нижнюю границу не поднимают:\n')
for (const [id, why] of Object.entries(progressive)) {
  if (!features[id]) continue
  const chrome = firstSupported(id, 'chrome')
  const safari = firstSupported(id, 'safari')
  console.log(`  ${id.padEnd(24)} Chrome ${String(chrome ?? '—').padEnd(5)} Safari ${String(safari ?? '—').padEnd(6)} ${why}`)
}
