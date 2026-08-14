# Accessibility

Not a declaration — checked on every push.

## Contrast

23 foreground/background pairs in each of the four themes, against WCAG 2.1 AA
thresholds: 4.5 for text, 3 for borders and other non-text indicators.

```bash
npm run check:contrast            # summary
npm run check:contrast -- --verbose   # every pair with its ratio
```

Each pair is checked twice: once against the oklch values and once against the
sRGB fallback that older browsers receive. Clamping a colour into the sRGB
gamut moves it, so a palette that passes in oklch can still fail in sRGB.

The pairs live in `rostra.tokens.json` under `contrastPairs`, each with a
threshold and a note explaining where the pair appears on screen. A pair that
is not listed is a pair nobody checks — add one when you add a colour token.

## Two kinds of border

This distinction is the reason the system passes non-text contrast at all.

| Token | Role | Requirement |
| --- | --- | --- |
| `--rs-border` | Hairlines of cards and dividers — decorative | none |
| `--rs-control-border` | Border of an input, checkbox, switch, dropzone, scrollbar thumb | 3:1 |

The border of a control is the only thing that shows the user a control is
there, which is exactly what WCAG 1.4.11 covers. The hairline around a card is
not: the card is already separated by its background.

Before this split the control border measured 1.5:1 and an unchecked switch on
a white card measured about 1.1:1 — effectively invisible.

If you need the quieter original look back, it is one line, and it is an
informed decision to fail AA rather than a matter of taste:

```css
.rs { --rs-control-border: var(--rs-border); }
```

## Native form controls

`input`, `select` and `textarea` are real elements. Checkbox, radio and switch
put the system's visuals on a real `input` through `.rs-choice`, so keyboard
support, autofill, form submission and the mobile OS pickers work without any
JavaScript. The checkmark is drawn with CSS borders, so a basic checkbox does
not pull in an icon font.

## Layers

Dialog, drawer, popover, tooltip, menu and tabs are built on Radix primitives.
Focus trapping, focus restoration, Escape, `aria-modal`, arrow-key navigation —
none of it is hand-written here.

The React layer also carries theme into portals: a dialog renders at the end of
`body`, outside the container that holds `data-theme`, so `LayerScope` sets it
again.

## Focus

`:focus-visible` produces the `--rs-ring` ring; removing it is not allowed.
Browsers without `:focus-visible` fall back to showing the ring on any focus,
including mouse clicks — the safe direction to fail in.

## Motion

`prefers-reduced-motion: reduce` cuts every animation and transition to 1ms.

## Automated checks

`tests/a11y.test.tsx` runs axe-core over a composite screen, an open dialog, a
system state page and switched tabs. Colour contrast is disabled in that run —
jsdom has no computed colours — because `check-contrast.mjs` covers it against
the real token values instead.

One test deliberately renders broken markup and asserts that axe reports it. A
green axe run proves nothing if the check silently did not execute.

## What the system does not do for you

- `aria-label` on an icon-only button. A tooltip is not a label.
- Heading order on the page.
- Meaningful link text.
- Announcing your own asynchronous updates.
- Screen reader testing. axe checks structure; it does not tell you how NVDA or
  VoiceOver actually reads the screen. That has not been done here.
