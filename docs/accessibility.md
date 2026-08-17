# Accessibility

What is checked automatically, what the split between border tokens buys, and
what the system leaves to the application.

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
threshold and a note explaining where the pair appears on screen. Nothing
outside that list is measured, so a new colour token needs a new pair.

## Two kinds of border

| Token | Role | Requirement |
| --- | --- | --- |
| `--rs-border` | Hairlines of cards and dividers — decorative | none |
| `--rs-control-border` | Border of an input, checkbox, switch, dropzone, scrollbar thumb | 3:1 |

A control's border is what tells the user the control is there, which is what
WCAG 1.4.11 covers. A card hairline carries no such duty: the card is already
separated by its background.

Before the split, the control border measured 1.5:1, and an unchecked switch on
a white card about 1.1:1.

The quieter original look is one line away. It fails AA, so make it knowingly:

```css
.rs { --rs-control-border: var(--rs-border); }
```

## Native form controls

`input`, `select` and `textarea` are real elements. Checkbox, radio and switch
put the system's visuals on a real `input` through `.rs-choice`, so keyboard
support, autofill, form submission and the mobile OS pickers work without any
JavaScript. The checkmark is drawn with CSS borders, so a basic checkbox does
not pull in an icon font.

## Layers and keyboard patterns

Every layer is implemented in `src/primitives.tsx` and `src/layers.tsx` against
the APG patterns. What that means concretely:

| Behaviour | Where it applies |
| --- | --- |
| Tab cycles inside, focus returns to the trigger on close | dialog, drawer, popover |
| Escape closes and hands focus back; a click outside closes and leaves focus alone | every layer |
| `aria-hidden` on every other child of `body`, scroll locked | dialog, drawer |
| Anchoring that flips side when the room runs out and clamps to the viewport | popover, tooltip, menu |
| Roving tab stop, arrows, Home/End, type-ahead | menu, tree, calendar grid |
| `aria-activedescendant`, so focus never leaves the input | combobox |
| Arrows move and activate, one tab stop per list | tabs |

`tests/layers.test.tsx` holds 22 tests over exactly these guarantees, and the
same set is exercised in a real browser — jsdom reports every rectangle as
zero, so anchoring cannot be verified there at all.

The React layer also carries theme into portals: a dialog renders at the end of
`body`, outside the container that holds `data-theme`, so `LayerScope` sets it
again.

## Focus

`:focus-visible` produces the `--rs-ring` ring, and no component may remove it.
Browsers without `:focus-visible` fall back to showing the ring on every focus,
including mouse clicks.

## Motion

`prefers-reduced-motion: reduce` cuts every animation and transition to 1ms.

## Automated checks

`tests/a11y.test.tsx` runs axe-core over a composite screen, an open dialog, a
system state page and switched tabs; `tests/interactive.test.tsx` does the same
for the calendar, combobox, tree and board, and drives each of them from the
keyboard. Colour contrast is disabled in those runs, since jsdom has no
computed colours; `check-contrast.mjs` covers it against the real token values.

One test renders deliberately broken markup and asserts that axe reports it —
a green run means nothing until the check is known to execute.

The three demo pages are also scanned in a real browser, where contrast does
resolve. That run is what caught the calendar's `opacity: 0.45` at 1.9:1.

## What the system does not do for you

- `aria-label` on an icon-only button. A tooltip is not a label.
- Heading order on the page.
- Meaningful link text.
- Announcing your own asynchronous updates.
- Screen reader testing. axe checks structure; it does not tell you how NVDA or
  VoiceOver actually reads the screen. That has not been done here.
