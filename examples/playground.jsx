import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Alert, AppBar, AppMain, AppShell, Badge, Board, Button, Calendar, Card, CardBody, Checkbox, Chip,
  Combobox, Dialog, DialogClose, Divider, Drawer, EmptyState, Eyebrow, Field, Input, Kbd, KeyValue,
  Menu, Meter, Metric, NavItem, Num, Pane, Popover, Radio, Rostra, Segmented, Select, Sidebar,
  Skeleton, Steps, Switch, SystemState, Table, TableWrap, Tabs, Textarea, Timeline, ToastViewport,
  Tooltip, Tree, useToasts,
} from '../src/index'

/**
 * The playground the static library page cannot be: every control here is the
 * real React component, and the code beside it is what produces it.
 */

function Demo({ title, note, code, children }) {
  return (
    <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'start' }}>
      <div>
        <Eyebrow>{title}</Eyebrow>
        {note && <div className="rs-hint" style={{ marginTop: 8 }}>{note}</div>}
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>{children}</div>
      </div>
      <pre className="rs-pre" style={{ fontSize: 12 }}>
        {code.trim()}
      </pre>
    </section>
  )
}

function Buttons() {
  return (
    <Demo
      title="Buttons"
      note="One primary per screen. A loading button keeps its place in the focus order but stops firing."
      code={`<Button variant="primary">Save</Button>
<Button>Cancel</Button>
<Button variant="ghost">More</Button>
<Button variant="danger">Block</Button>
<Button loading>Saving</Button>
<Button icon aria-label="Add">+</Button>`}
    >
      <Button variant="primary">Save</Button>
      <Button>Cancel</Button>
      <Button variant="ghost">More</Button>
      <Button variant="danger">Block</Button>
      <Button loading>Saving</Button>
      <Button icon aria-label="Add">+</Button>
    </Demo>
  )
}

function Fields() {
  const [taxId, setTaxId] = useState('7714')
  const error = taxId.length === 10 ? undefined : 'Exactly 10 digits required'
  return (
    <Demo
      title="Fields"
      note="Field hands out id, aria-describedby and aria-invalid — there is nothing to wire by hand."
      code={`<Field label="Tax ID" hint="10 digits" error={error} required>
  {(props) => <Input {...props} value={taxId} onChange={onChange} />}
</Field>`}
    >
      <div style={{ width: 220 }}>
        <Field label="Tax ID" hint="10 digits" error={error} required>
          {(props) => <Input {...props} value={taxId} onChange={(e) => setTaxId(e.target.value)} />}
        </Field>
      </div>
      <div style={{ width: 200 }}>
        <Field label="Plan">{(props) => <Select {...props}><option>Enterprise</option><option>Business</option></Select>}</Field>
      </div>
      <div style={{ width: 200 }}>
        <Field label="Comment">{(props) => <Textarea {...props} placeholder="Not filled in" />}</Field>
      </div>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <Checkbox defaultChecked>Active</Checkbox>
        <Radio name="lang" defaultChecked>English</Radio>
        <Switch defaultChecked>Notifications</Switch>
      </div>
    </Demo>
  )
}

const ROWS = [
  { id: 'ORG-4182', name: 'Arcadia Group', plan: 'Enterprise', status: 'ok', label: 'Active', seats: 128, updated: '2 hours ago' },
  { id: 'ORG-3771', name: 'Medline Clinic', plan: 'Enterprise', status: 'warn', label: 'Paused', seats: 92, updated: 'yesterday, 18:40' },
  { id: 'ORG-3588', name: 'Greenfield Retail', plan: 'Business', status: 'info', label: 'Trial', seats: 21, updated: '2 days ago' },
  { id: 'ORG-3402', name: 'Polus Engineering', plan: 'Starter', status: 'bad', label: 'Blocked', seats: 3, updated: '3 days ago' },
]

function Tables() {
  return (
    <Demo
      title="Table"
      note="Num puts the cell in tabular figures and aligns it right, so the column stops jumping when data refreshes."
      code={`<TableWrap>
  <Table zebra>
    <thead><tr><th scope="col">Organization</th>…</tr></thead>
    <tbody>{rows.map((row) => (
      <tr key={row.id}>
        <td>{row.name}</td>
        <td><Badge status={row.status}>{row.label}</Badge></td>
        <Num>{row.seats}</Num>
      </tr>
    ))}</tbody>
  </Table>
</TableWrap>`}
    >
      <TableWrap style={{ width: '100%' }}>
        <Table zebra>
          <caption className="rs-sr">Clients</caption>
          <thead>
            <tr>
              <th scope="col">Organization</th>
              <th scope="col">Plan</th>
              <th scope="col">Status</th>
              <th scope="col" className="rs-num">Seats</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.plan}</td>
                <td><Badge status={row.status}>{row.label}</Badge></td>
                <Num>{row.seats}</Num>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </Demo>
  )
}

function Layers() {
  const { toasts, push, dismiss } = useToasts()
  return (
    <Demo
      title="Layers"
      note="Focus is trapped and returned, Escape closes, the page behind a modal is hidden from screen readers. No dependencies do this — it is 250 lines in src/primitives.tsx."
      code={`<Dialog trigger={<Button variant="primary">Block client</Button>}
  title="Block client" description="They lose access immediately."
  footer={<><DialogClose><Button>Cancel</Button></DialogClose>
           <Button variant="danger">Block</Button></>} />

<Menu trigger={<Button>Actions</Button>} items={[
  { label: 'Issue invoice', hint: <Kbd>⌘I</Kbd>, onSelect: issue },
  { label: 'Archive', separated: true, disabled: true },
]} />`}
    >
      <Dialog
        trigger={<Button variant="primary">Dialog</Button>}
        title="Block client"
        description="128 users lose access immediately. The data is kept for 90 days."
        footer={<><DialogClose><Button>Cancel</Button></DialogClose><Button variant="danger">Block</Button></>}
      >
        <Field label="Reason">{(props) => <Input {...props} />}</Field>
      </Dialog>
      <Drawer trigger={<Button>Drawer</Button>} title="ORG-4182" description="Arcadia Group, Enterprise">
        <KeyValue items={[{ label: 'Tax ID', value: '7714836902' }, { label: 'Owner', value: 'Irene Keller' }]} />
      </Drawer>
      <Popover trigger={<Button>Popover</Button>} label="Quick filter">
        <div style={{ display: 'grid', gap: 8, width: 220 }}>
          <Field label="Seats above">{(props) => <Input {...props} defaultValue="50" />}</Field>
          <Button variant="primary" size="sm">Apply</Button>
        </div>
      </Popover>
      <Menu
        trigger={<Button>Menu</Button>}
        items={[
          { label: 'Issue invoice', hint: <Kbd>⌘I</Kbd>, onSelect: () => push({ title: 'Invoice issued', text: 'INV-2026-114 for 12,400' }) },
          { label: 'Export CSV', onSelect: () => push({ title: 'Export ready', text: 'clients-08-17.csv sent by email' }) },
          { label: 'Archive', separated: true, disabled: true },
        ]}
      />
      <Tooltip label="Column settings"><Button icon aria-label="Settings">⚙</Button></Tooltip>
      <Button onClick={() => push({ title: 'Saved', text: 'Nothing else to do.' })}>Toast</Button>
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </Demo>
  )
}

function Navigation() {
  const [density, setDensity] = useState('medium')
  return (
    <Demo
      title="Navigation"
      note="Tabs keep one tab stop for the list; arrows move and activate, and the panel is tied to its tab."
      code={`<Tabs items={[
  { value: 'overview', label: 'Overview', content: <Overview /> },
  { value: 'history', label: 'History', content: <History /> },
]} />

<Segmented label="Density" value={density} onChange={setDensity}
  options={[{ value: 'compact', label: 'Compact' }, …]} />`}
    >
      <div style={{ width: '100%' }}>
        <Tabs
          items={[
            { value: 'overview', label: 'Overview', content: <p className="rs-text" style={{ marginTop: 12 }}>Seats, plan and contract.</p> },
            { value: 'history', label: 'History', content: <p className="rs-text" style={{ marginTop: 12 }}>Every change with an author.</p> },
            { value: 'billing', label: 'Billing', content: <p className="rs-text" style={{ marginTop: 12 }}>Invoices and payment method.</p> },
          ]}
        />
        <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Segmented
            label="Density"
            value={density}
            onChange={setDensity}
            options={[{ value: 'compact', label: 'Compact' }, { value: 'medium', label: 'Medium' }, { value: 'roomy', label: 'Roomy' }]}
          />
          <Steps steps={['Details', 'Plan', 'Team']} current={1} />
        </div>
      </div>
    </Demo>
  )
}

function Pickers() {
  const [range, setRange] = useState(null)
  const [plans, setPlans] = useState(['ent'])
  const [selected, setSelected] = useState('log')
  return (
    <Demo
      title="Calendar, combobox, tree"
      note="Arrows walk the calendar grid and pull the month along at its edges. The combobox keeps focus in the input and moves aria-activedescendant instead."
      code={`<Calendar mode="range" value={range} onValueChange={setRange}
  isDisabled={(day) => day.getDay() === 0 || day.getDay() === 6} />

<Combobox label="Plans" options={PLANS} value={plans} onValueChange={setPlans} />

<Tree label="Access" items={ACCESS} defaultExpanded={['prod']}
  selected={selected} onSelect={setSelected} />`}
    >
      <Card><CardBody>
        <Calendar mode="range" value={range} onValueChange={setRange} locale="en-GB" isDisabled={(day) => day.getDay() === 0 || day.getDay() === 6} />
      </CardBody></Card>
      <div style={{ width: 260, display: 'grid', gap: 14 }}>
        <Combobox
          label="Plans"
          placeholder="Add a plan…"
          value={plans}
          onValueChange={setPlans}
          options={[{ value: 'ent', label: 'Enterprise' }, { value: 'biz', label: 'Business' }, { value: 'st', label: 'Starter' }]}
        />
        <Tree
          label="Access"
          defaultExpanded={['prod']}
          selected={selected}
          onSelect={setSelected}
          items={[
            { id: 'prod', label: 'Manufacturing', meta: 'Full', children: [
              { id: 'wh2', label: 'Warehouse 2', meta: 'Inherits' },
              { id: 'log', label: 'Logistics', meta: 'Read' },
            ] },
            { id: 'fin', label: 'Finance', meta: 'Closed' },
          ]}
        />
      </div>
    </Demo>
  )
}

const START = [
  { id: 'new', title: 'New', cards: [{ id: 't-4471', label: 'T-4471', children: <><div style={{ fontWeight: 500 }}>Card payment fails</div><div className="rs-hint" style={{ marginTop: 4 }}>Polus Engineering · 49 min</div></> }] },
  { id: 'work', title: 'In progress', cards: [{ id: 't-4468', label: 'T-4468', children: <><div style={{ fontWeight: 500 }}>SSO setup</div><div className="rs-hint" style={{ marginTop: 4 }}>Cascade Energy · 2 h 10 m</div></> }] },
  { id: 'done', title: 'Closed', cards: [] },
]

function BoardDemo() {
  const [columns, setColumns] = useState(START)
  const move = ({ card, from, to }) =>
    setColumns((current) => {
      const moved = current.find((c) => c.id === from)?.cards.find((c) => c.id === card)
      if (!moved) return current
      return current.map((column) =>
        column.id === from ? { ...column, cards: column.cards.filter((c) => c.id !== card) }
          : column.id === to ? { ...column, cards: [...column.cards, moved] }
          : column
      )
    })
  return (
    <Demo
      title="Board"
      note="Cards move with buttons, not dragging: a pointer-only board cannot be operated from a keyboard or a screen reader."
      code={`<Board columns={columns} onCardMove={({ card, from, to }) => move(card, from, to)} />`}
    >
      <div style={{ width: '100%' }}><Board columns={columns} onCardMove={move} /></div>
    </Demo>
  )
}

function Status() {
  return (
    <Demo
      title="Status and data"
      note="Statuses carry the same four tones everywhere: ok, warn, bad, info."
      code={`<Metric label="Active clients" value="203" foot="+6 this week" />
<Meter value={73} label="Seats in use" />
<Alert status="warn" title="The licence expires in 14 days">…</Alert>`}
    >
      <div style={{ display: 'grid', gap: 14, width: '100%' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Card style={{ flex: '1 1 160px' }}><CardBody><Metric label="Active clients" value="203" foot="+6 this week" /></CardBody></Card>
          <Card style={{ flex: '1 1 160px' }}><CardBody><Metric label="Open requests" value="12" foot="3 overdue" /></CardBody></Card>
          <Card style={{ flex: '1 1 220px' }}><CardBody><Meter value={73} label="Seats in use" /></CardBody></Card>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge status="ok">Active</Badge><Badge status="warn">Paused</Badge>
          <Badge status="bad">Blocked</Badge><Badge status="info">Trial</Badge>
          <Chip>Enterprise</Chip><Chip selected>Active</Chip>
        </div>
        <Alert status="warn" title="The licence expires in 14 days">After 26.08 invitations stop; current users keep their access.</Alert>
        <Divider />
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Timeline items={[
            { when: '14:08', body: 'Plan changed to Enterprise · Dmitri L.' },
            { when: '13:52', body: 'Seat limit raised from 300 to 400 · Auto-check', muted: true },
          ]} />
          <div style={{ width: 220 }}><Skeleton height={12} /><Skeleton height={12} style={{ marginTop: 8, width: '70%' }} /><Skeleton height={12} style={{ marginTop: 8, width: '85%' }} /></div>
          <EmptyState title="Nothing found" text="Try removing some of the filters" action={<Button size="sm">Reset filters</Button>} />
        </div>
      </div>
    </Demo>
  )
}

function Shell() {
  return (
    <Demo
      title="Application shell"
      note="Height equals the window and only Pane scrolls: navigation, header and pagination stay pinned."
      code={`<AppShell>
  <Sidebar aria-label="Sections">
    <NavItem href="#" active>Organizations</NavItem>
  </Sidebar>
  <AppMain>
    <AppBar>…filters…</AppBar>
    <Pane>…the only scrollable area…</Pane>
  </AppMain>
</AppShell>`}
    >
      <div style={{ width: '100%', height: 260, border: '1px solid var(--rs-border)', borderRadius: 'var(--rs-radius)', overflow: 'hidden' }}>
        <AppShell style={{ height: '100%' }}>
          <Sidebar aria-label="Sections" style={{ width: 180 }}>
            <div className="rs-eyebrow rs-eyebrow--bare">Work</div>
            <NavItem href="#organizations" active>Organizations</NavItem>
            <NavItem href="#requests">Requests</NavItem>
          </Sidebar>
          <AppMain>
            <AppBar><div style={{ padding: '10px 14px', display: 'flex', gap: 8 }}><Chip>All</Chip><Chip>Active</Chip></div></AppBar>
            <Pane>
              {ROWS.concat(ROWS).map((row, i) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--rs-hairline)' }}>{row.name}</div>
              ))}
            </Pane>
          </AppMain>
        </AppShell>
      </div>
    </Demo>
  )
}

function States() {
  return (
    <Demo
      title="System states"
      note="403, 404, 500, maintenance and first run share one component and differ in tone only."
      code={`<SystemState code="403" tone="bad" title="This section is closed to your role"
  text="Plans are open to the finance administrator."
  actions={<><Button variant="primary">Request access</Button><Button>Back</Button></>}
  tech="Request ID R-8842" />`}
    >
      <SystemState
        code="403"
        tone="bad"
        title="This section is closed to your role"
        text="Plans are open to the finance administrator. The request goes to the workspace owner."
        actions={<><Button variant="primary">Request access</Button><Button>Back</Button></>}
        tech="Request ID R-8842"
      />
    </Demo>
  )
}

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'warm', label: 'Warm' },
  { value: 'contrast', label: 'Contrast' },
]
const DENSITIES = [
  { value: 'compact', label: 'Compact' },
  { value: 'medium', label: 'Medium' },
  { value: 'roomy', label: 'Roomy' },
]

function App() {
  const [theme, setTheme] = useState('light')
  const [density, setDensity] = useState('medium')
  return (
    <Rostra theme={theme} density={density} style={{ minHeight: '100vh', background: 'var(--rs-canvas)' }}>
      <header style={{ borderBottom: '1px solid var(--rs-border)', background: 'var(--rs-surface)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '20px 24px', display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <h1 className="rs-title" style={{ margin: 0 }}>Rostra</h1>
            <p className="rs-hint" style={{ marginTop: 6, maxWidth: 620 }}>
              Components for admin panels. Every control below is the React component, not a screenshot —
              open the dialog, walk the menu with arrows, switch the theme and watch it repaint.
            </p>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge status="ok" plain>0 dependencies</Badge>
              <Badge status="info" plain>9.8 kB gzipped</Badge>
              <Badge status="info" plain>WCAG 2.1 AA in CI</Badge>
              <Badge plain>IE10 build</Badge>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="rs-label" style={{ marginBottom: 6 }}>Theme</div>
              <Segmented label="Theme" value={theme} onChange={setTheme} options={THEMES} />
            </div>
            <div>
              <div className="rs-label" style={{ marginBottom: 6 }}>Density</div>
              <Segmented label="Density" value={density} onChange={setDensity} options={DENSITIES} />
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 24px 80px', display: 'grid', gap: 36 }}>
        <pre className="rs-pre">{`npm i rostra-ui

import 'rostra-ui/rostra.css'
import { Rostra, Button } from 'rostra-ui'`}</pre>
        <Buttons />
        <Fields />
        <Layers />
        <Tables />
        <Navigation />
        <Pickers />
        <BoardDemo />
        <Status />
        <Shell />
        <States />
      </main>
    </Rostra>
  )
}

createRoot(document.getElementById('root')).render(<App />)
