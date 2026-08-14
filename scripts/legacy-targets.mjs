/**
 * Цели legacy-сборки. Отсюда их берут и autoprefixer, и отчёт о поддержке,
 * чтобы обещание в README не разошлось с тем, какие префиксы реально стоят.
 *
 * Ниже этих версий флексбокс существовал только в синтаксисе 2009 года
 * (`display: box`) — принципиально другая модель без переноса строк.
 * Autoprefixer его умеет, но раскладка получилась бы заметно иной, а вся
 * затея с legacy-сборкой держится на том, что вёрстка остаётся прежней.
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

/** Формат, который понимает browserslist. */
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
