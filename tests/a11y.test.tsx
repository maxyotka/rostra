import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import {
  AppBar,
  AppMain,
  AppShell,
  Badge,
  Breadcrumbs,
  Button,
  Checkbox,
  Dialog,
  Field,
  Input,
  Meter,
  NavItem,
  Num,
  Pane,
  Rostra,
  Select,
  Sidebar,
  SystemState,
  Table,
  TableWrap,
  Tabs,
  Topbar,
} from '../src'

/**
 * axe cannot compute contrast in jsdom — there are no resolved colours.
 * check-contrast.mjs covers that against the real token values instead; what
 * is checked here is structure: roles, names, relationships, heading order.
 */
async function violations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  return results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.help}`)
}

function Screen() {
  return (
    <Rostra>
      <AppShell>
        <Sidebar aria-label="Sections">
          <NavItem href="#clients" active>
            Clients
          </NavItem>
          <NavItem href="#dispatch">Dispatch</NavItem>
        </Sidebar>
        <AppMain>
          <AppBar>
            <Topbar>
              <Breadcrumbs items={[{ label: 'Clients', href: '#clients' }, { label: 'ORG-4182' }]} />
            </Topbar>
          </AppBar>
          <Pane>
            <h1 className="rs-title">ORG-4182</h1>

            <Field label="Name" hint="As in the contract">
              {(props) => <Input {...props} placeholder="Arcada Group" />}
            </Field>
            <Field label="Plan" error="Choose a plan">
              {(props) => (
                <Select {...props}>
                  <option value="">Not selected</option>
                  <option value="base">Basic</option>
                </Select>
              )}
            </Field>
            <Checkbox name="sla">Track SLA</Checkbox>
            <Meter value={72} label="Seats used" />

            <Tabs
              items={[
                { value: 'a', label: 'Requests', content: <p className="rs-text">List of requests</p> },
                { value: 'b', label: 'History', content: <p className="rs-text">Event timeline</p> },
              ]}
            />

            <TableWrap>
              <Table zebra>
                <caption className="rs-sr">Client requests</caption>
                <thead>
                  <tr>
                    <th scope="col">Request</th>
                    <th scope="col">Status</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>INV-2026-114</td>
                    <td>
                      <Badge status="ok">In progress</Badge>
                    </td>
                    <Num>12 400</Num>
                  </tr>
                </tbody>
              </Table>
            </TableWrap>

            <Button variant="ghost" icon aria-label="Column settings">
              ⚙
            </Button>
          </Pane>
        </AppMain>
      </AppShell>
    </Rostra>
  )
}

describe('accessibility', () => {
  // A green axe run is worth nothing if the check did not actually execute:
  // this test fails when the check silently returns an empty result.
  it('axe really does inspect the markup', async () => {
    const { container } = render(
      <Rostra>
        <button className="rs-btn rs-btn--icon" />
      </Rostra>
    )
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.passes.length).toBeGreaterThan(0)
    expect(results.violations.map((v) => v.id)).toContain('button-name')
  })

  it('a composite screen produces no axe violations', async () => {
    const { container } = render(<Screen />)
    expect(await violations(container)).toEqual([])
  })

  it('an open dialog produces no axe violations', async () => {
    render(
      <Rostra>
        <Dialog
          open
          title="Delete client"
          description="This cannot be undone."
          footer={<Button variant="danger">Delete</Button>}
        >
          <Field label="Reason">{(props) => <Input {...props} />}</Field>
        </Dialog>
      </Rostra>
    )
    const dialog = screen.getByRole('dialog')
    expect(await violations(dialog)).toEqual([])
  })

  it('a system state page produces no axe violations', async () => {
    const { container } = render(
      <Rostra>
        <SystemState
          code="403"
          tone="bad"
          title="No access to this section"
          text="The section is closed for the Operator role."
          actions={<Button>Request access</Button>}
          tech="request 8f21c4 · 12:04 · node msk-2"
        />
      </Rostra>
    )
    expect(await violations(container)).toEqual([])
  })

  it('menus and tabs pass axe while open', async () => {
    const { container } = render(
      <Rostra>
        <Tabs
          items={[
            { value: 'a', label: 'Requests', content: <p className="rs-text">List</p> },
            { value: 'b', label: 'History', content: <p className="rs-text">Timeline</p> },
          ]}
        />
      </Rostra>
    )
    await userEvent.click(screen.getByRole('tab', { name: 'History' }))
    expect(await violations(container)).toEqual([])
  })
})
