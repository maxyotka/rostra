import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import axe from 'axe-core'
import { Button, Dialog, DialogClose, Drawer, Input, Menu, Popover, Rostra, Tabs, Tooltip } from '../src'
import { place } from '../src/primitives'

async function violations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  return results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.help}`)
}

/**
 * These cover what the behaviour library used to guarantee. Every one of them
 * fails loudly if the hand-written focus, dismissal or ARIA wiring regresses.
 */

function DialogHost() {
  const [open, setOpen] = useState(false)
  return (
    <Rostra>
      <button type="button">before</button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button>Open</Button>}
        title="Block client"
        description="They lose access immediately."
        footer={
          <>
            <DialogClose>
              <Button>Cancel</Button>
            </DialogClose>
            <Button variant="danger">Block</Button>
          </>
        }
      >
        <Input aria-label="Reason" />
      </Dialog>
    </Rostra>
  )
}

describe('Dialog', () => {
  it('traps Tab inside and cycles at both ends', async () => {
    render(<DialogHost />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = screen.getByRole('dialog')
    const reason = screen.getByLabelText('Reason')
    const block = screen.getByRole('button', { name: 'Block' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    await userEvent.tab()
    await userEvent.tab()
    expect(document.activeElement).toBe(block)
    await userEvent.tab()
    // wrapped back to the first control rather than escaping to the page
    expect(document.activeElement).toBe(reason)
    await userEvent.tab({ shift: true })
    expect(document.activeElement).toBe(block)
  })

  it('returns focus to the trigger after closing', async () => {
    render(<DialogHost />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.activeElement).toBe(trigger)
  })

  it('closes on a click outside the window', async () => {
    render(<DialogHost />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(document.querySelector('.rs-backdrop') as HTMLElement)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('closes through DialogClose', async () => {
    render(<DialogHost />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('hides the rest of the page from assistive technology', async () => {
    render(<DialogHost />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    // the button outside the layer is no longer reachable by role
    expect(screen.queryByRole('button', { name: 'before' })).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByRole('button', { name: 'before' })).toBeInTheDocument())
  })

  it('names and describes itself for a screen reader', async () => {
    render(<DialogHost />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Block client')
    expect(dialog).toHaveAccessibleDescription('They lose access immediately.')
  })

  it('produces no axe violations', async () => {
    render(<DialogHost />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(await violations(screen.getByRole('dialog'))).toEqual([])
  })
})

describe('Drawer', () => {
  it('opens as a dialog on the right and closes on Escape', async () => {
    render(
      <Rostra>
        <Drawer trigger={<Button>Details</Button>} title="ORG-4182" />
      </Rostra>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(screen.getByRole('dialog')).toHaveClass('rs-drawer')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('Popover', () => {
  it('reports its state on the trigger and closes on Escape', async () => {
    render(
      <Rostra>
        <Popover trigger={<Button>Filters</Button>} label="Filters">
          <Input aria-label="Query" />
        </Popover>
      </Rostra>
    )
    const trigger = screen.getByRole('button', { name: 'Filters' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Query')).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByLabelText('Query')).not.toBeInTheDocument())
    expect(document.activeElement).toBe(trigger)
  })

  it('leaves the page behind reachable', async () => {
    render(
      <Rostra>
        <button type="button">outside</button>
        <Popover trigger={<Button>Filters</Button>} label="Filters">
          <Input aria-label="Query" />
        </Popover>
      </Rostra>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    // non-modal: unlike Dialog, the rest of the page keeps its roles
    expect(screen.getByRole('button', { name: 'outside' })).toBeInTheDocument()
  })
})

describe('Tooltip', () => {
  it('appears on keyboard focus and describes its trigger', async () => {
    render(
      <Rostra>
        <Tooltip label="Column settings">
          <Button icon aria-label="Settings">
            ⚙
          </Button>
        </Tooltip>
      </Rostra>
    )
    const trigger = screen.getByRole('button', { name: 'Settings' })
    await userEvent.tab()
    expect(trigger).toHaveFocus()
    const tip = await screen.findByRole('tooltip')
    expect(tip).toHaveTextContent('Column settings')
    // the tooltip describes, it does not rename: the button keeps its label
    expect(trigger).toHaveAccessibleName('Settings')
    expect(trigger).toHaveAccessibleDescription('Column settings')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })
})

const ITEMS = [
  { label: 'Issue invoice', onSelect: vi.fn() },
  { label: 'Export CSV', onSelect: vi.fn() },
  { label: 'Archive', disabled: true, separated: true },
]

describe('Menu', () => {
  it('opens on ArrowDown with the first item focused', async () => {
    render(
      <Rostra>
        <Menu trigger={<Button>Actions</Button>} items={ITEMS} />
      </Rostra>
    )
    screen.getByRole('button', { name: 'Actions' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    const items = screen.getAllByRole('menuitem')
    expect(items[0]).toHaveFocus()
    expect(items[0]).toHaveAttribute('data-highlighted')
  })

  it('walks with arrows, jumps with Home and End, and skips disabled items', async () => {
    render(
      <Rostra>
        <Menu trigger={<Button>Actions</Button>} items={ITEMS} />
      </Rostra>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    const items = screen.getAllByRole('menuitem')
    await userEvent.keyboard('{ArrowDown}')
    expect(items[1]).toHaveFocus()
    // 'Archive' is disabled, so the walk wraps to the top instead
    await userEvent.keyboard('{ArrowDown}')
    expect(items[0]).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(items[1]).toHaveFocus()
    expect(items[2]).toHaveAttribute('data-disabled')
  })

  it('jumps to an item by typing its first letters', async () => {
    render(
      <Rostra>
        <Menu trigger={<Button>Actions</Button>} items={ITEMS} />
      </Rostra>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    await userEvent.keyboard('ex')
    expect(screen.getAllByRole('menuitem')[1]).toHaveFocus()
  })

  it('selects with Enter, then closes and restores focus', async () => {
    const onSelect = vi.fn()
    render(
      <Rostra>
        <Menu trigger={<Button>Actions</Button>} items={[{ label: 'Issue invoice', onSelect }]} />
      </Rostra>
    )
    const trigger = screen.getByRole('button', { name: 'Actions' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(document.activeElement).toBe(trigger)
  })

  it('produces no axe violations while open', async () => {
    render(
      <Rostra>
        <Menu trigger={<Button>Actions</Button>} items={ITEMS} />
      </Rostra>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    expect(await violations(screen.getByRole('menu'))).toEqual([])
  })
})

describe('Tabs', () => {
  const items = [
    { value: 'a', label: 'Requests', content: <p>List</p> },
    { value: 'b', label: 'History', content: <p>Timeline</p> },
  ]

  it('moves and activates with arrows, wrapping at the ends', async () => {
    render(<Tabs items={items} />)
    const first = screen.getByRole('tab', { name: 'Requests' })
    first.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Timeline')
    await userEvent.keyboard('{ArrowRight}')
    expect(first).toHaveAttribute('aria-selected', 'true')
  })

  it('keeps a single tab stop and ties the panel to its tab', async () => {
    render(<Tabs items={items} />)
    const [first, second] = screen.getAllByRole('tab')
    expect(first).toHaveAttribute('tabindex', '0')
    expect(second).toHaveAttribute('tabindex', '-1')
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', first!.id)
    expect(first).toHaveAttribute('aria-controls', panel.id)
  })

  it('reports the active tab through data-state for the CSS', () => {
    render(<Tabs items={items} defaultValue="b" />)
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('data-state', 'active')
    expect(screen.getByRole('tab', { name: 'Requests' })).toHaveAttribute('data-state', 'inactive')
  })
})

describe('place', () => {
  const viewport = { width: 1000, height: 800 }
  const anchor = (box: Partial<DOMRect>) => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, ...box }) as DOMRect

  beforeEach(() => {
    Object.assign(window, { innerWidth: viewport.width, innerHeight: viewport.height })
  })

  it('sits under the anchor when there is room', () => {
    const result = place(anchor({ top: 100, bottom: 130, left: 200, right: 300, width: 100, height: 30 }), { width: 200, height: 100 }, 'bottom', 'start', 6)
    expect(result).toMatchObject({ side: 'bottom', top: 136, left: 200 })
  })

  it('flips above when the space below runs out', () => {
    const result = place(anchor({ top: 700, bottom: 740, left: 100, right: 200, width: 100, height: 40 }), { width: 200, height: 200 }, 'bottom', 'start', 6)
    expect(result.side).toBe('top')
    expect(result.top).toBe(494)
  })

  it('never leaves the viewport horizontally', () => {
    const result = place(anchor({ top: 10, bottom: 40, left: 960, right: 990, width: 30, height: 30 }), { width: 300, height: 80 }, 'bottom', 'start', 6)
    expect(result.left).toBe(viewport.width - 300 - 8)
  })
})
