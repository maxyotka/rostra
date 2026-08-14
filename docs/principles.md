# Principles

Eight rules. A change that breaks any of them requires updating this document
in the same commit — otherwise the document stops describing the system, which
costs more than it looks.

## 1. Density is a token, not a rework

`data-density` changes control height, card padding and table row padding.
Components do not know which mode they render in. There is no compact variant
of a component — there is a compact container.

## 2. One accent

Blue at hue 262 works in the primary button, the active navigation item, links
and charts. Status colours never take part in navigation: green is "healthy",
not "clickable".

## 3. Borders instead of shadows

A shadow belongs only to floating layers: toast, dialog, popover, command
palette. Everything on the page plane is separated by hairlines.

## 4. Three registers, each with its own job

Sentence case for headings, field labels, buttons and statuses.

`UPPERCASE` with 0.07em tracking is allowed in exactly two places: the section
eyebrow (`.rs-eyebrow`), the table head, and codes or abbreviations — `SSO`,
`CSV`, `PDF`, `ORG-4182`. Uppercase inside a button, a heading or a sentence is
a mistake: `.rs-eyebrow--sentence` and `.rs-table--sentence-head` turn it off
where the string runs longer than two words.

Section eyebrows come in three variants and no more:

- `.rs-eyebrow` — default. Uppercase plus a hairline running to the end of the
  block. Page and library sections.
- `.rs-eyebrow--tick` — a 10×2 accent tick instead of the line. Inside cards
  and panels, where a line would compete with the border.
- `.rs-eyebrow--tag` — a label on `--rs-surface-3` plus a line. Above a group
  of cards, when the label should read as a section of its own.

Service modifiers: `--bare` (no line, for sidebar groups), `--sentence` (no
uppercase, when the label is longer than two words).

## 5. One screen

An admin panel behaves like an application, not a page: its height equals the
window and the page never scrolls as a whole. Only the working area scrolls
(`.rs-pane`); navigation, header, filters and pagination are pinned.

If the content does not fit, that is a reason to remove something or collapse
it into a disclosure — not to hand the user a vertical scrollbar. One
exception: long documents and regulations (`.rs-md`).

## 6. A wide table gets two scrollbars

One above the header and one below the last row (`.rs-xbar`), because with
twenty rows on screen, scrolling right should not require going to the end of
the list first. The native scrollbar is hidden.

## 7. Numbers align right

Always in tabular figures, so columns do not jump when data refreshes.

## 8. Focus is always visible

`:focus-visible` produces the `--rs-ring` ring. Removing it is not allowed. In
browsers without `:focus-visible` support a fallback shows the ring on any
focus, which is the safe direction to fail in.

---

# Writing guidelines

The system was designed for Russian-language interfaces, so the examples are in
Russian. The rules themselves are not language-specific.

- Address the user formally, no exclamation marks, no emoji.
- A button is a verb in the infinitive: «Сохранить», «Выставить счёт»,
  «Запросить доступ» — Save, Issue invoice, Request access.
- An error names the cause and the next action: «Отчёт не собрался за
  30 секунд» plus «Повторить» — the report timed out, retry.
- An empty state does not apologise, it offers a way out: «Ничего не найдено»
  plus «Сбросить фильтры» — nothing found, reset filters.
- Units in lowercase, codes in uppercase: `2 часа назад`, `ORG-4182`,
  `API 42 мс`.

# Motion

One idea: everything entering decelerates for a long time at the end
(easeOutQuint), everything leaving accelerates briefly. An element should come
back faster than it arrived, otherwise closing feels like lag.

- Entry: 10px from below and scale 0.985.
- Exit: same geometry at 0.6 of the duration, easeIn.
- A modal backdrop starts 40ms before the window.
- Infinite animation is only for live data.
- `prefers-reduced-motion` turns everything off.
