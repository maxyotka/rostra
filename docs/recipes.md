# Recipes

## Application shell

The one-screen rule in markup: only `Pane` scrolls, the bars around it stay
pinned.

```tsx
<AppShell>
  <Sidebar aria-label="Sections">
    <NavItem href="/clients" active>Clients</NavItem>
    <NavItem href="/dispatch">Dispatch</NavItem>
  </Sidebar>
  <AppMain>
    <AppBar><Topbar>…filters…</Topbar></AppBar>
    <Pane>…the only scrollable area…</Pane>
    <AppBar>…pagination…</AppBar>
  </AppMain>
</AppShell>
```

Without React it is the same structure on `.rs-app`, `.rs-app__main`,
`.rs-app__bar` and `.rs-pane`.

## Field with hint and error

`Field` hands out `id`, `aria-describedby` and `aria-invalid` — there is
nothing to wire up by hand. The error is announced through `role="alert"`.

```tsx
<Field label="Tax ID" hint="10 digits" error={errors.taxId} required>
  {(props) => <Input {...props} value={taxId} onChange={onChange} />}
</Field>
```

## Confirmation dialog

Focus is trapped inside, Escape closes, and focus returns to the button that
opened it.

```tsx
<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Delete client"
  description="This cannot be undone."
  footer={
    <>
      <DialogClose><Button>Cancel</Button></DialogClose>
      <Button variant="danger" onClick={remove}>Delete</Button>
    </>
  }
/>
```

`Drawer` takes the same props and renders as a right-hand panel.

## Notifications

```tsx
const { toasts, push, dismiss } = useToasts()

push({ title: 'Invoice issued', text: 'INV-2026-114 for 12,400' })

<ToastViewport toasts={toasts} onDismiss={dismiss} />
```

The viewport is a `polite` live region, so an announcement waits for the
screen reader to finish its current sentence instead of interrupting.

## Table

```tsx
<TableWrap>
  <Table zebra>
    <caption className="rs-sr">Clients</caption>
    <thead>
      <tr>
        <th scope="col">Organisation</th>
        <th scope="col">Status</th>
        <th scope="col" className="rs-num">Seats</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Arcada Group</td>
        <td><Badge status="ok">Active</Badge></td>
        <Num>128</Num>
      </tr>
    </tbody>
  </Table>
</TableWrap>
```

`Num` puts the cell in tabular figures and aligns it right, so the column does
not jump when data refreshes. For a wide table add `sticky` to pin the first
column.

## Twenty thousand rows

Past a few thousand rows the browser, not the network, is what makes the screen
crawl. `useVirtualRows` renders only the rows in view and holds the rest of the
height with two spacer rows:

```tsx
const scroller = useRef<HTMLDivElement>(null)
const window = useVirtualRows({ count: rows.length, rowHeight: 33, scrollRef: scroller })

<TableWrap ref={scroller} style={{ overflowY: 'auto', maxHeight: '100%' }}>
  <Table zebra aria-rowcount={rows.length}>
    <thead>…</thead>
    <tbody>
      {window.padTop > 0 && <tr aria-hidden="true" style={{ height: window.padTop }} />}
      {rows.slice(window.start, window.end).map((row, i) => (
        <tr key={row.id} aria-rowindex={window.start + i + 1}>
          <td>{row.org}</td>
          <Num>{row.seats}</Num>
        </tr>
      ))}
      {window.padBottom > 0 && <tr aria-hidden="true" style={{ height: window.padBottom }} />}
    </tbody>
  </Table>
</TableWrap>
```

Two things the hook cannot do for you:

**`rowHeight` is a measurement, not a guess.** Row height follows the density —
a compact row is shorter than a roomy one — so measure one rendered row in the
density you ship and pass that number. Wrong by a pixel and the scrollbar
drifts by a pixel per row.

**`aria-rowcount` and `aria-rowindex` are not optional here.** The DOM no longer
holds all the rows, so without them a screen reader announces "row 3 of 40"
over a table of twenty thousand.

The rows themselves must be one line tall — a cell that wraps breaks the
arithmetic. Where content varies, keep the table unvirtualised and paginate.

## Menu

```tsx
<Menu
  trigger={<Button>Actions</Button>}
  items={[
    { label: 'Issue invoice', hint: <Kbd>Ctrl</Kbd>+<Kbd>I</Kbd>, onSelect: issue },
    { label: 'Export CSV', onSelect: exportCsv },
    { label: 'Archive', separated: true, disabled: true },
  ]}
/>
```

## System state pages

403, 404, 500, maintenance and first run share one component and differ in tone
only. Give the page two actions and a technical line for support to quote.

```tsx
<SystemState
  code="403"
  tone="bad"
  title="No access to this section"
  text="The section is closed for the Operator role."
  actions={
    <>
      <Button variant="primary">Request access</Button>
      <Button>Go home</Button>
    </>
  }
  tech="request 8f21c4 · 12:04 · node msk-2"
/>
```

## Picking a period

`Calendar` keeps the month itself unless you pass one. In range mode the first
click opens the period and the second closes it, in either direction.

```tsx
const [period, setPeriod] = useState<DateRange | null>(null)

<Calendar
  mode="range"
  value={period}
  onValueChange={(value) => setPeriod(value as DateRange)}
  isDisabled={(day) => day.getDay() === 0 || day.getDay() === 6}
/>
```

Arrows walk the grid and pull the month along at its edges; PageUp and PageDown
jump a month; Enter picks. Weekday names, the month title and the label a
screen reader reads for a day all come from `Intl`, so `locale` is the only
translation needed.

## Multiselect

```tsx
const [plans, setPlans] = useState<string[]>([])

<Combobox
  label="Plans"
  placeholder="Add a plan…"
  options={[
    { value: 'ent', label: 'Enterprise' },
    { value: 'biz', label: 'Business' },
  ]}
  value={plans}
  onValueChange={setPlans}
/>
```

Focus never leaves the input: arrows move `aria-activedescendant` instead, so
typing continues to work while the list is open. Backspace on an empty query
removes the last token.

## Access tree

```tsx
<Tree
  label="Access"
  items={[
    { id: 'prod', label: 'Manufacturing', meta: 'Full', children: [
      { id: 'wh2', label: 'Warehouse 2', meta: 'Inherits' },
    ]},
    { id: 'fin', label: 'Finance', meta: 'Closed' },
  ]}
  defaultExpanded={['prod']}
  selected={selected}
  onSelect={setSelected}
/>
```

One tab stop for the whole tree. Up and down walk the visible rows, right opens
a branch and then steps into it, left folds it and then climbs to the parent.

## Board

```tsx
<Board
  columns={columns}
  onCardMove={({ card, from, to }) => move(card, from, to)}
/>
```

Dragging is not implemented. `onCardMove` renders a pair of buttons on each
card, which is the part a keyboard and a screen reader can reach; without the
prop the board is read-only. Every card needs a `label` — the buttons borrow it
for their accessible names.

## Still CSS-only

Inline cell editing, the dropzone, and the mobile shell (`.rs-m-card`,
`.rs-m-nav`, `.rs-sheet`) exist as classes without a React wrapper. The markup
is in the live library page.
