# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [SemVer](https://semver.org/).

## [0.2.0] — 2026-08-17

### Removed

- Every runtime dependency. The five Radix packages are gone, `dependencies` is
  empty, and React stays a peer. Installing the package no longer pulls a tree
  of 40-odd modules for consumers who only wanted the CSS.

### Changed

- Dialog, drawer, popover, tooltip, menu and tabs are implemented in
  `src/primitives.tsx` and `src/layers.tsx`. The public API did not move: same
  props, same class names, same `data-state` and `data-highlighted` attributes
  the CSS already keyed on.
- What the primitives provide, and what `tests/layers.test.tsx` pins down in 22
  tests: Tab cycling inside a layer, focus returning to the trigger, Escape
  versus outside-click telling apart who gets focus afterwards, `aria-hidden`
  over the rest of the page while a modal is open, anchoring that flips when
  the chosen side has no room and clamps to the viewport.
- Bundle size, measured with esbuild over the published build: a button went
  from 1.1 kB to 1.3 kB gzipped, a dialog and a menu together from 31.8 kB to
  4.4 kB, and the entire package from 40 kB to 9.8 kB.
- Tabs render a real `tabpanel` tied to its tab, with one tab stop for the list
  and arrows that move and activate.

## [Unreleased]

### Added

- `rostra-ui` package: esm + cjs builds, types, `exports` for `rostra.css`,
  `rostra.legacy.css`, `fonts.css` and `rostra.tokens.json`.
- React layer on top of the `rs-*` classes. Layers and tabs sit on Radix
  primitives (focus trap, Escape, keyboard, ARIA); form controls are native
  elements.
- `--rs-control-border` — the border of an interactive control, split from
  `--rs-border` because the two have different requirements: a card hairline is
  decorative, a field border must reach 3:1 under WCAG 1.4.11.
- Native `input` support in the CSS core (`.rs-choice`): checkbox, radio and
  switch work without JavaScript, including in plain HTML.
- Geometry for floating layers: `.rs-backdrop`, `.rs-layer`, `.rs-drawer__*`,
  `.rs-dialog__*`, `.rs-toast-viewport`. Previously every consumer had to write
  it inline.
- Support for old browsers. Colours are declared twice: sRGB in the main block,
  oklch inside `@supports`. Duplicating a custom property declaration does not
  work as a fallback — the browser does not validate the value, so an old
  browser would accept `oklch(...)` as a valid token and the property consuming
  it would become invalid instead, leaving nothing at all.
- Fallbacks for `color-mix()`, `100dvh`, `appearance` and `:focus-visible`. The
  focus ring is expressed as three rules so that old browsers show it on any
  focus while modern ones keep it for the keyboard.
- `rostra.legacy.css` — a second build for browsers without custom properties,
  including IE10 and IE11. The modern build is unchanged: a modern browser
  loads only that one. In the legacy build token values are inlined, `gap`
  becomes margins on siblings and pseudo-elements, `grid` becomes flex and
  float, and autoprefixer adds the `-ms-` prefixes. Theme and density are fixed
  at build time, since switching at runtime requires custom properties. The
  React layer is unavailable there — React 18+ dropped Internet Explorer.
- `scripts/check-contrast.mjs` — 23 foreground/background pairs in each of the
  four themes, verified against both oklch and sRGB values.
- `scripts/build-css.mjs` — builds `rostra.css` from the tokens; `--check` mode
  catches CSS edited outside the json.
- `scripts/check-support.mjs` — minimum version per browser from caniuse-lite
  data, naming the feature that sets each limit.
- Class-consistency test: the React layer references CSS through strings, so a
  typo breaks no behaviour test — it only breaks the way things look.
- Fallback test: every declaration using `color-mix()` or a dynamic viewport
  unit must have a predecessor, every oklch token an sRGB twin, and every
  `:focus-visible` rule a `:focus` counterpart.
- Legacy build test: reproducibility, absence of constructs an old browser
  cannot parse, presence of `-ms-flexbox`, and colours matching the sRGB branch
  of the main build.
- CI: token drift, contrast, browser support, types, tests, build, package
  import.
- Repository documentation: `SECURITY.md`, issue and pull request templates,
  and `docs/` covering principles, theming, accessibility, browser support and
  recipes.
- `examples/` — an index over the component library and the two prototypes,
  served as static files from the repository root.
- `Calendar`, `Combobox`, `Tree` and `Board` — the four components that existed
  as classes only. They have no Radix equivalent, so the keyboard behaviour is
  written here against the APG patterns: a roving tab stop in the calendar grid
  and the tree, `aria-activedescendant` in the combobox so focus stays in the
  input while arrows move through the list. The calendar takes its month name,
  weekday names and day labels from `Intl`, which leaves `locale` as the only
  thing to translate.
- Board card movement as buttons rather than dragging. A pointer-only board
  cannot be operated by keyboard, and `onCardMove` is what turns the controls
  on; without it the board renders read-only.

### Changed

- `rostra.tokens.json` became the complete source of truth: four themes, four
  densities, a base layer. The token block in `rostra.css` is now generated.
- The Google Fonts `@import` moved out of `rostra.css` into `fonts.css`. The
  core no longer makes network requests — which matters behind a firewall where
  `googleapis.com` is unreachable, and for first render.
- Support floor: Chrome 84, Firefox 63, Safari 14.1, down from Chrome 111 and
  Safari 16.2 that oklch required without a fallback.
- The JS build target moved from es2022 to es2019, so the script does not end
  up more demanding than the stylesheet.

### Fixed

- Tabs did not reset button styling. The React layer renders a `<button>` and
  the browser painted its own background, border and font — tabs looked like
  buttons.
- The active tab and the keyboard-highlighted menu item were not highlighted:
  that state arrives as `data-state` / `data-highlighted`, while the CSS only
  knew about `.is-on`. Behaviour tests could not see it — roles and attributes
  were correct.
- The button spinner in the loading state was white on a white background: the
  colour came from `--rs-text-invert` for every button, not just the primary
  one.
- The border of inputs, checkboxes, switches, the dropzone and the scrollbar
  thumb measured 1.5:1 against a required 3:1 — the controls were barely
  distinguishable.
- An unchecked switch differed from the card only by its fill (~1.1:1); it now
  has a border.
- Placeholder text measured 3.6:1 against a required 4.5:1 in the light and
  warm themes.
- The `contrast` theme did not override status colours and inherited them from
  the light theme.
- `.rs-alert--ok` was missing from the CSS even though the "healthy" status is
  declared alongside the others: the banner silently stayed neutral.
- A non-working day in the calendar carried `opacity: 0.45` over faint text,
  which lands at 1.9:1 against the surface. The token check never saw it — it
  compares token pairs, and the opacity was applied on top of them. The day now
  takes its colour from the token alone, at 4.6:1.

## [0.1.0] — 2026-08-11

- First version of the system: tokens, four themes, three densities, the `rs-*`
  classes, a live component library and two prototypes.
