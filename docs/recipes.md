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

## Menu

```tsx
<Menu
  trigger={<Button>Actions</Button>}
  items={[
    { label: 'Issue invoice', hint: <Kbd>⌘I</Kbd>, onSelect: issue },
    { label: 'Export CSV', onSelect: exportCsv },
    { label: 'Archive', separated: true, disabled: true },
  ]}
/>
```

## System state pages

403, 404, 500, maintenance and first run share one component and differ only in
tone. Two ways out of the dead end, and a technical line at the bottom for
support.

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

## Components without a React wrapper

Calendar, combobox with tokens, inline cell editing, tree, dropzone, kanban
board and the mobile shell exist as CSS classes only. The markup and the
classes are documented in the live library (`Rostra Library.html`); the
behaviour is up to the application. Wrappers are on the roadmap.
