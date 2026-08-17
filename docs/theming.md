# Theming

## How tokens work

Every token value is written in `rostra.tokens.json`. The token block inside
`rostra.css` is generated from it:

```bash
npm run build:css        # tokens -> css
npm run check:tokens     # fails if css drifted from the json
```

A token edited directly in `rostra.css` is lost on the next build and drifts
away from client themes generated from the same json. CI catches this.

The json has three parts:

| Section | Contents |
| --- | --- |
| `base` | Values that do not depend on the theme: typography, radii, spacing, motion |
| `themes` | Four themes. Only what differs from `light` needs to be listed |
| `density` | `compact`, `medium`, `roomy`, `mobile` |

## Applying a theme

Theme and density are attributes on any container, not global state:

```html
<div class="rs" data-theme="dark" data-density="compact">
```

In React the same thing is the `Rostra` component, which also passes the theme
into portals — a dialog rendered at the end of `body` would otherwise lose it:

```tsx
<Rostra theme="dark" density="compact">
```

## Building a client theme

Add a block to `themes` and list only the values that differ from `light`; the
rest cascades. A theme may override more than colour — `warm` also changes the
corner radius:

```json
"warm": {
  "bg": "oklch(0.976 0.008 85)",
  "surface-3": "oklch(0.955 0.012 85)",
  "radius": "10px",
  "radius-lg": "14px"
}
```

Then rebuild and check that the new theme did not fail AA:

```bash
npm run build:css
npm run check:contrast
npm run build:legacy      # if you also ship the legacy build
```

If a new token takes part in contrast, add it to `contrastPairs` with a
threshold: 4.5 for text, 3 for borders and other non-text indicators. Nothing
outside that list is measured.

## Colour format

Tokens are authored in oklch: it keeps lightness perceptually even across hue
changes, which is what makes a four-theme system possible at all.

Colours are emitted twice — sRGB in the main block and oklch inside
`@supports`. Duplicating the declaration inside one block does not work for
custom properties: the browser does not validate a custom property's value, so
an old browser accepts `oklch(...)` as a valid token and the property that
consumes it becomes invalid instead. Instead of a fallback you get nothing.

The sRGB twins are produced by clamping chroma into gamut, keeping lightness
and hue — the two things contrast depends on. Both variants are checked.

## Density

| Density | Control height | Row padding | Card padding |
| --- | --- | --- | --- |
| `compact` | 28px | 7px | 14px |
| `medium` | 32px | 12px | 18px |
| `roomy` | 38px | 16px | 24px |
| `mobile` | 44px | 14px | 16px |

`mobile` also raises the base font size and the corner radius, and enables the
mobile shell: `.rs-m-card`, `.rs-m-nav`, `.rs-sheet`, `.rs-m-scroller`,
`.rs-m-action`. A table on mobile breaks apart into cards — two key metrics in
the footer, everything else on the detail screen.

## Tablet

`data-viewport="tablet"` turns the sidebar into a 60px rail (`.rs-rail`),
switches the table to `.rs-table--sticky` with a pinned first column and
collapses filters behind a single button with a counter. It is an attribute
rather than a media query, so the same layout works inside a narrow panel on a
large screen.
