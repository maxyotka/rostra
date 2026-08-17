// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import {
  Board, Button, Calendar, Combobox, Dialog, Field, Input, Menu, Pane, Popover, Rostra, Tabs, Table,
  TableWrap, Tooltip, Tree,
} from '../src'

/**
 * Server rendering runs without a DOM: no window, no document, no layout. The
 * layers guard on that, and a component that forgets to is only found here —
 * jsdom hides the mistake by providing everything.
 */

function Screen() {
  return (
    <Rostra theme="dark" density="compact">
      <Button variant="primary">Save</Button>
      <Pane aria-label="Clients">
        <TableWrap>
          <Table zebra>
            <tbody><tr><td>Arcadia Group</td></tr></tbody>
          </Table>
        </TableWrap>
      </Pane>
      <Field label="Tax ID">{(props) => <Input {...props} />}</Field>
      <Tabs items={[{ value: 'a', label: 'Requests', content: <p>List</p> }]} />
      <Calendar defaultMonth={new Date(2026, 7, 1)} locale="en-GB" />
      <Combobox label="Plans" options={[{ value: 'a', label: 'Enterprise' }]} value={[]} onValueChange={() => {}} />
      <Tree label="Access" items={[{ id: 'a', label: 'Manufacturing' }]} />
      <Board columns={[{ id: 'new', title: 'New', cards: [] }]} />
      {/* closed layers: the trigger renders, the layer itself does not */}
      <Dialog open={false} title="Block client" trigger={<Button>Block</Button>} />
      <Popover trigger={<Button>Filters</Button>} label="Filters">body</Popover>
      <Tooltip label="Hint"><Button>Hover</Button></Tooltip>
      <Menu trigger={<Button>Actions</Button>} items={[{ label: 'Issue invoice' }]} />
    </Rostra>
  )
}

describe('server rendering', () => {
  it('renders the whole system without a DOM', () => {
    const html = renderToString(<Screen />)
    expect(html).toContain('data-theme="dark"')
    expect(html).toContain('rs-btn--primary')
    expect(html).toContain('rs-cal__day')
    expect(html).toContain('role="tabpanel"')
    expect(html).toContain('rs-board__col')
  })

  it('leaves closed layers out of the markup', () => {
    const html = renderToString(<Screen />)
    expect(html).not.toContain('rs-backdrop')
    expect(html).not.toContain('role="menu"')
    expect(html).not.toContain('role="tooltip"')
  })

  it('sends the triggers, so the page is usable before hydration', () => {
    const html = renderToString(<Screen />)
    expect(html).toContain('>Block</button>')
    expect(html).toContain('aria-expanded="false"')
  })
})
