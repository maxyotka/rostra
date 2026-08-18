# API reference

Generated from the shipped types by `npm run build:api` — do not edit by hand.
Every component also accepts the props of the element it renders, so
`className`, `style`, `id`, `aria-*` and event handlers work everywhere.

## Forms

### Button

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `onClick` | `(event: MouseEvent<HTMLElement>) => void` | — | Typed for both elements, because `href` turns the button into a link. |
| `variant` | `'default' \| 'primary' \| 'ghost' \| 'danger'` | — |  |
| `size` | `'md' \| 'sm'` | — |  |
| `icon` | `boolean` | — | Square button for a single icon. Requires an aria-label. |
| `loading` | `boolean` | — |  |
| `href` | `string` | — | Renders an `a` instead of a `button`. Navigation is a link — it belongs in * the browser's history, opens in a new tab on the middle button and is read * as a link. A router link goes here too: `href` plus its own `onClick`. |
| `target` | `string` | — |  |
| `rel` | `string` | — |  |

### Field

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | `ReactNode` | — |  |
| `hint` | `ReactNode` | — |  |
| `error` | `ReactNode` | — |  |
| `required` | `boolean` | — |  |
| `children` | `(props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?:…` | yes | Receives id, aria-describedby and aria-invalid — nothing to wire up by hand. |

## Data and status

### Eyebrow

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `variant` | `'line' \| 'tick' \| 'tag'` | — |  |
| `sentence` | `boolean` | — | Label longer than two words: uppercase is dropped, or the line stops reading. |
| `bare` | `boolean` | — |  |

### Badge

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | `Status` | — |  |
| `plain` | `boolean` | — | Without the coloured dot before the text. |

### Chip

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `selected` | `boolean` | — |  |
| `add` | `boolean` | — |  |

### Metric

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | `ReactNode` | yes |  |
| `value` | `ReactNode` | yes |  |
| `foot` | `ReactNode` | — |  |

### Meter

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `value` | `number` | yes | 0–100. Out-of-range values are clamped so the bar cannot overflow. |
| `label` | `string` | — |  |

### Table

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `zebra` | `boolean` | — |  |
| `sticky` | `boolean` | — | The first column pins during horizontal scrolling. |
| `sentenceHead` | `boolean` | — | Sentence-case header instead of uppercase: for headings longer than two words. |

### VirtualRowsOptions

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `count` | `number` | yes | How many rows the data has, not how many are on screen. |
| `rowHeight` | `number` | yes | Row height in pixels. It comes from the density — a row is taller in * roomy than in compact — so it is a prop, not a constant: measure one row * in the density you ship and pass that number. |
| `scrollRef` | `RefObject<HTMLElement \| null>` | yes | The element that scrolls: the table wrapper, with a height and overflow. |
| `overscan` | `number` | — | Rows kept above and below the viewport, so a fast scroll shows no gap. |

### EmptyState

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `ReactNode` | yes |  |
| `text` | `ReactNode` | — |  |
| `action` | `ReactNode` | — |  |
| `art` | `boolean` | — | A hatched rectangle instead of an illustration. |

### Skeleton

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `width` | `number \| string` | — |  |
| `height` | `number \| string` | — |  |

### Steps

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `steps` | `ReactNode[]` | yes |  |
| `current` | `number` | yes | Index of the current step; everything before it counts as done. |

### Alert

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | `Status` | — |  |
| `title` | `ReactNode` | — |  |
| `children` | `ReactNode` | — |  |

### Avatar

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | `string` | yes | The full name: initials are derived from it. |
| `round` | `boolean` | — |  |

### KeyValue

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `items` | `Array<{ key: ReactNode; value: ReactNode; }>` | yes |  |

### TimelineItem

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `when` | `ReactNode` | yes |  |
| `body` | `ReactNode` | yes |  |
| `muted` | `boolean` | — |  |

## Layers

### Popover

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `trigger` | `ReactNode` | yes |  |
| `children` | `ReactNode` | yes |  |
| `open` | `boolean` | — |  |
| `onOpenChange` | `(open: boolean) => void` | — |  |
| `side` | `Side` | — |  |
| `align` | `Align` | — |  |
| `label` | `string` | — | Accessible name. Without it the popover is a plain container, not a dialog. |
| `className` | `string` | — |  |
| `contentRef` | `Ref<HTMLDivElement>` | — | The floating panel itself. |

### Tooltip

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | yes |  |
| `label` | `ReactNode` | yes |  |
| `side` | `Side` | — |  |
| `delay` | `number` | — | Delay before showing; 0 means immediately. |

### MenuItem

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | `ReactNode` | yes |  |
| `onSelect` | `() => void` | — |  |
| `hint` | `ReactNode` | — | Keyboard shortcut hint, shown on the right. |
| `disabled` | `boolean` | — |  |
| `separated` | `boolean` | — | A separator before this item. |

### Menu

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `trigger` | `ReactNode` | yes |  |
| `items` | `MenuItem[]` | yes |  |
| `align` | `Align` | — |  |
| `label` | `string` | — | Accessible name of the menu. |

### Toast

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `ReactNode` | yes |  |
| `text` | `ReactNode` | — |  |

### ToastRecord

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `number` | yes |  |
| `title` | `ReactNode` | yes |  |
| `text` | `ReactNode` | — |  |

## Shell and navigation

### Pane

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `fixed` | `boolean` | — | Does not scroll itself; hands scrolling to a nested area. |

### Sidebar

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `collapsed` | `boolean` | — |  |

### NavItem

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `active` | `boolean` | — |  |
| `icon` | `ReactNode` | — |  |

### RailItem

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `active` | `boolean` | — |  |

### Breadcrumbs

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `items` | `Array<{ label: ReactNode; href?: string; }>` | yes |  |
| `aria-label` | `string` | — | Navigation name for screen readers. Translate it for a localised interface. |

### Tabs

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `items` | `Array<{ value: string; label: ReactNode; content?: ReactNode; }>` | yes |  |
| `value` | `string` | — |  |
| `defaultValue` | `string` | — |  |
| `onValueChange` | `(value: string) => void` | — |  |
| `className` | `string` | — |  |

### Segmented

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `options` | `Array<{ value: T; label: ReactNode; }>` | yes |  |
| `value` | `T` | yes |  |
| `onChange` | `(value: T) => void` | yes |  |
| `label` | `string` | yes | What the control governs — read out by screen readers. |
| `className` | `string` | — |  |

### SystemState

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `code` | `ReactNode` | — | Code or eyebrow: 403, 404, maintenance. |
| `tone` | `'warn' \| 'bad' \| 'info'` | — |  |
| `title` | `ReactNode` | yes |  |
| `text` | `ReactNode` | — |  |
| `actions` | `ReactNode` | — | Two ways out of the dead end: primary and fallback. |
| `tech` | `ReactNode` | — | Technical line at the bottom: request id, time, node. |

## Pickers

### Calendar

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `mode` | `'single' \| 'range'` | — | A single day, or a period picked in two clicks. |
| `value` | `Date \| DateRange \| null` | — |  |
| `defaultValue` | `Date \| DateRange \| null` | — | Starting selection when the calendar keeps the state itself. |
| `onValueChange` | `(value: Date \| DateRange \| null) => void` | — |  |
| `month` | `Date` | — | Controlled month. Without it the calendar keeps its own. |
| `defaultMonth` | `Date` | — |  |
| `onMonthChange` | `(month: Date) => void` | — |  |
| `isDisabled` | `(day: Date) => boolean` | — | Days that cannot be picked — weekends, anything before the contract date. |
| `weekStartsOn` | `0 \| 1` | — | 1 — the week starts on Monday, 0 — on Sunday. |
| `locale` | `string` | — | Month name, weekday names and day labels come from here. |
| `labels` | `{ previousMonth?: string` | — |  |
| `nextMonth` | `string` | — |  |

### DateRange

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `from` | `Date` | yes |  |
| `to` | `Date` | — |  |

### Combobox

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `options` | `ComboboxOption[]` | yes |  |
| `value` | `string[]` | — |  |
| `defaultValue` | `string[]` | — | Starting selection when the combobox keeps the state itself. |
| `onValueChange` | `(value: string[]) => void` | — |  |
| `label` | `string` | yes | Accessible name of the field. |
| `placeholder` | `string` | — |  |
| `emptyText` | `string` | — | Shown when the query matches nothing. |
| `removeLabel` | `(option: ComboboxOption) => string` | — | Accessible name of a token's remove button. |

### ComboboxOption

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `value` | `string` | yes |  |
| `label` | `string` | yes |  |
| `disabled` | `boolean` | — |  |

### Tree

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `items` | `TreeNode[]` | yes |  |
| `label` | `string` | yes | Accessible name of the tree. |
| `expanded` | `string[]` | — |  |
| `defaultExpanded` | `string[]` | — |  |
| `onExpandedChange` | `(ids: string[]) => void` | — |  |
| `selected` | `string \| null` | — |  |
| `onSelect` | `(id: string) => void` | — |  |

### TreeNode

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `string` | yes |  |
| `label` | `ReactNode` | yes |  |
| `meta` | `ReactNode` | — | Right-hand note: permission, count, status. |
| `children` | `TreeNode[]` | — |  |

### Board

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `columns` | `BoardColumn[]` | yes |  |
| `onCardMove` | `(move: { card: string; from: string; to: string; }) => void` | — | Turns on the move controls. Dragging is deliberately not implemented — * a pointer-only board is unusable by keyboard, and these buttons are what * a screen reader and a keyboard actually need. |
| `labels` | `{ moveLeft?: string` | — |  |
| `moveRight` | `string` | — |  |

### BoardColumn

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `string` | yes |  |
| `title` | `ReactNode` | yes |  |
| `cards` | `BoardCard[]` | yes |  |
| `empty` | `ReactNode` | — | Shown instead of the cards when the column is empty. |

### BoardCard

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `string` | yes |  |
| `label` | `string` | yes | Accessible name of the card — used by the move buttons. |
| `children` | `ReactNode` | yes |  |

## Theme

### ThemeSettings

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `theme` | `Theme` | yes |  |
| `density` | `Density` | yes |  |
| `viewport` | `'tablet'` | — |  |

### Rostra

No props of its own.

