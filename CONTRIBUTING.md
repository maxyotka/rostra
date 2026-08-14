# Contributing

```bash
npm ci
npm run verify          # tokens, contrast, types, tests
npm run build           # css, legacy build, js, types
npm run check:support   # which browsers the result supports
```

## What is edited by hand

| File | Edited by hand? |
| --- | --- |
| `rostra.tokens.json` | yes — the single source of truth for tokens |
| `src/components.css` | yes — every class except the token block |
| `src/*.tsx` | yes — the React layer |
| `rostra.css` | no — generated from the two above |
| `rostra.legacy.css` | no — generated from `rostra.css` |
| `*.html` | yes — the demo pages, plain markup on the `rs-*` classes |

A token edited directly in `rostra.css` is lost on the next build and drifts
away from client themes generated from the same json. `npm run check:tokens`
catches it in CI.

## Adding a token

1. Add it to `rostra.tokens.json`, in every theme where the value differs.
2. If it takes part in contrast, add a pair to `contrastPairs` with a
   threshold: 4.5 for text, 3 for borders and other non-text indicators.
3. Run `npm run build:css`, `npm run check:contrast`, `npm run build:legacy`.

## Adding a component

- Classes in `src/components.css` first, the React wrapper second. The core
  must work without JavaScript — not every consumer uses React.
- Do not hand-roll behaviour. Focus traps, positioning and ARIA are better
  implemented in Radix than they will be here.
- For form controls use the native element. `input` and `select` give keyboard
  support, autofill, form submission and mobile OS pickers for free.
- Every class the React layer names as a string must exist in the CSS —
  `tests/classes.test.ts` checks this. A typo breaks no behaviour test; it only
  breaks the way things look.
- State that Radix sets through attributes (`data-state`, `data-highlighted`,
  `data-disabled`) needs a CSS rule next to the manual `.is-on`.
- A component with state leaves behind a test for behaviour, not for markup:
  "loading does not fire onClick", not "has class is-loading".

## Old browsers

The modern build is not affected by them: `rostra.css` stays modern and
everything old lives in `rostra.legacy.css`. When you use a property that is
missing below the support floor:

- declare the fallback **before** the modern value in the same rule —
  `tests/fallbacks.test.ts` verifies a predecessor exists;
- colours in custom properties are not duplicated that way. The browser does
  not validate a custom property's value, so the sRGB version lives in the main
  block and oklch inside `@supports`;
- rebuild the legacy file: `npm run build:legacy`.

## Principles

There are eight of them, in [docs/principles.md](docs/principles.md). A change
that breaks any of them requires updating that document in the same commit —
otherwise it stops describing the system, which costs more than it looks.

## Commits

The subject line is one imperative sentence with no trailing period. The body
explains the reason rather than restating the diff: what would break if it were
done differently.
