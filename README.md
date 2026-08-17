# Rostra

A component system for admin panels and internal corporate tools. Four themes,
four densities, a CSS core with no dependencies, and an optional React layer.

[![npm](https://img.shields.io/npm/v/rostra-ui)](https://www.npmjs.com/package/rostra-ui)
[![CI](https://github.com/maxyotka/rostra/actions/workflows/ci.yml/badge.svg)](https://github.com/maxyotka/rostra/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/maxyotka/rostra)](LICENSE)

![The component library in the light theme](screenshots/library-light.jpg)

<sub>A client registry built on the same tokens, dark theme:
[screenshots/prototype-clients-dark.jpg](screenshots/prototype-clients-dark.jpg)</sub>

---

## Installation

```bash
npm i rostra-ui
```

```tsx
import 'rostra-ui/rostra.css'
import { Rostra, Button } from 'rostra-ui'

<Rostra theme="light" density="medium">
  <Button variant="primary">Save</Button>
</Rostra>
```

The React layer is optional. Without a bundler the same system is one file and
a class name:

```html
<link rel="stylesheet" href="rostra.css">
<div class="rs" data-theme="light" data-density="medium">
  <button class="rs-btn rs-btn--primary">Save</button>
</div>
```

Theme and density are attributes on any container, so a light workspace and a
dark monitoring panel can live in the same application.

"No dependencies" applies to the CSS core, which is one file and nothing else.
The React layer sits on five Radix primitives (dialog, dropdown menu, popover,
tabs, tooltip), so installing it brings their tree with it — around 45 packages.
Take `rostra.css` alone and you install nothing.

## How it works

**Density.** `data-density` sets control height, card padding and table row
padding. A component reads those values and has no size variants of its own.

**Form controls.** Checkbox, radio and switch are native `input` elements under
`.rs-choice`, so form submission, keyboard support and the mobile OS pickers
work with JavaScript switched off.

**Contrast.** `npm run check:contrast` measures 23 foreground/background pairs
in each of the four themes, against the oklch values and against their sRGB
fallbacks. CI fails below WCAG 2.1 AA.

**Old browsers.** `rostra.legacy.css` is generated from the same source for
IE10 and browsers back to 2012. The modern build carries nothing on its behalf.

**Layers.** Dialog, drawer, popover, tooltip, menu and tabs are Radix
primitives wearing Rostra classes — focus trapping, positioning and ARIA come
from there. Calendar, combobox, tree and board are implemented here, on the APG
keyboard patterns.

## Documentation

| Document | Contents |
| --- | --- |
| [Principles](docs/principles.md) | The eight rules the system is built on, and the writing guidelines |
| [Theming](docs/theming.md) | Tokens, custom themes, density, building your own palette |
| [Accessibility](docs/accessibility.md) | Contrast policy, control borders, what the system does not do for you |
| [Browser support](docs/browser-support.md) | Support floor per browser, the legacy build, how to serve both |
| [Recipes](docs/recipes.md) | Common screens: layout, forms, confirmation dialogs, notifications |

## Examples

**[Open the live pages →](https://maxyotka.github.io/rostra/examples/)**

The component library and two clickable prototypes are `.html` files in the
repository root. They render from a static server — no build step:

```bash
python -m http.server 5501   # from the repository root
```

- [`examples/`](examples/index.html) — index of the three pages
- `rostra-library.html` — every component, with theme and density switches
- `prototype-clients.html` — a registry screen: filters, drawer, dialog, toasts
- `prototype-dispatch.html` — a request board with SLA timers and a live feed

Each page is checked with axe-core against WCAG 2.1 A/AA and reports no
violations.

## Browser support

| Build | Browsers |
| --- | --- |
| `rostra.css` | Chrome 84+, Firefox 63+, Safari 14.1+, Edge 84+ |
| `rostra.legacy.css` | IE10+, Chrome 21+, Firefox 28+, Safari 6.1+, Opera 15+ |

Both floors come from caniuse data. `npm run check:support` prints the table and
names the feature that sets each limit. Details and the TLS caveat are in
[docs/browser-support.md](docs/browser-support.md).

## Development

```bash
npm ci
npm run verify   # tokens, contrast, types, tests
npm run build    # css, legacy build, js, types
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, [CHANGELOG.md](CHANGELOG.md)
for history, and [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Status

Version 0.1.0. The API may still change in minor releases.

Every component in the library has a React counterpart. Dragging on the board
is not implemented — the move controls are buttons, which is what a keyboard
and a screen reader can use.

Not covered yet: print styles, visual regression tests, and verification on a
real IE11 rather than a simulated one.

## License

[MIT](LICENSE)
