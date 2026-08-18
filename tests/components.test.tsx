import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  Field,
  Input,
  Menu,
  Meter,
  Rostra,
  Segmented,
  Switch,
  Table,
  TableWrap,
  Tabs,
  cx,
  useVirtualRows,
} from '../src'

describe('cx', () => {
  it('joins strings and truthy object keys, skipping the empty ones', () => {
    expect(cx('a', false, undefined, { b: true, c: false }, 'd')).toBe('a b d')
  })
})

describe('Button', () => {
  it('does not fire onClick while loading and is marked aria-busy', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('with href renders a link that keeps the button styling', () => {
    render(<Button href="/reports" variant="primary">Reports</Button>)
    const link = screen.getByRole('link', { name: 'Reports' })
    expect(link).toHaveAttribute('href', '/reports')
    expect(link).toHaveClass('rs-btn', 'rs-btn--primary')
  })

  it('a disabled link keeps its place in the tab order but goes nowhere', async () => {
    const onClick = vi.fn()
    render(
      <Button href="/reports" disabled onClick={onClick}>
        Reports
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Reports' })
    expect(link).not.toHaveAttribute('href')
    expect(link).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(link)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('a link opening a new tab does not hand over the opener', () => {
    render(<Button href="https://example.org" target="_blank">Docs</Button>)
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('is clickable and does not submit the form by default', async () => {
    const onClick = vi.fn()
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button onClick={onClick}>OK</Button>
      </form>
    )
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('Field', () => {
  it('ties the label, hint and error to the input', () => {
    render(
      <Field label="Name" hint="As in the contract" error="This field is required" required>
        {(props) => <Input {...props} />}
      </Field>
    )
    const input = screen.getByLabelText(/Name/)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toBeRequired()
    expect(input).toHaveAccessibleDescription('As in the contract This field is required')
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
  })
})

describe('Checkbox and Switch', () => {
  it('toggle by mouse and space bar, staying native form controls', async () => {
    render(
      <>
        <Checkbox name="agree">I agree</Checkbox>
        <Switch name="live">Live data</Switch>
      </>
    )
    const checkbox = screen.getByRole('checkbox', { name: 'I agree' })
    const toggle = screen.getByRole('switch', { name: 'Live data' })

    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    toggle.focus()
    await userEvent.keyboard(' ')
    expect(toggle).toBeChecked()
  })
})

describe('Meter', () => {
  it('clamps out-of-range values so the bar cannot overflow', () => {
    const { rerender } = render(<Meter value={140} label="Usage" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    rerender(<Meter value={-20} label="Usage" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })
})

describe('Avatar', () => {
  it('derives initials and leaves the full name to screen readers', () => {
    render(<Avatar name="Peter Ivanov" />)
    expect(screen.getByText('PI')).toBeInTheDocument()
    expect(screen.getByText('Peter Ivanov')).toHaveClass('rs-sr')
  })
})

describe('Alert', () => {
  it('interrupts for an error and waits for a pause otherwise', () => {
    const { rerender } = render(<Alert status="bad" title="The report timed out" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(<Alert status="info" title="Maintenance is coming" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

function DialogHarness() {
  const [open, setOpen] = useState(false)
  return (
    <Rostra>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button>Open</Button>}
        title="Delete client"
        description="This cannot be undone."
        footer={
          <DialogClose>
            <Button>Cancel</Button>
          </DialogClose>
        }
      >
        <Input aria-label="Reason" />
      </Dialog>
    </Rostra>
  )
}

describe('Dialog', () => {
  it('opens, moves focus inside and closes on Escape', async () => {
    render(<DialogHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Delete client')).toBeInTheDocument()
    expect(dialog).toContainElement(document.activeElement as HTMLElement | null)

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('portal content inherits the theme of the root', async () => {
    render(
      <Rostra theme="dark" density="compact">
        <Dialog open title="Change stage" />
      </Rostra>
    )
    const scope = screen.getByRole('dialog').closest<HTMLElement>('[data-theme]')
    expect(scope).toHaveAttribute('data-theme', 'dark')
    expect(scope).toHaveAttribute('data-density', 'compact')
  })
})

describe('Tabs', () => {
  it('switches with arrow keys and ties the panel to its tab', async () => {
    render(
      <Tabs
        items={[
          { value: 'a', label: 'Requests', content: 'List of requests' },
          { value: 'b', label: 'History', content: 'Event timeline' },
        ]}
      />
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Requests' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Event timeline')
  })
})

describe('Menu', () => {
  it('opens from the keyboard and calls the selected item', async () => {
    const onSelect = vi.fn()
    render(
      <Rostra>
        <Menu
          trigger={<Button>Actions</Button>}
          items={[
            { label: 'Issue invoice', onSelect },
            { label: 'Archive', separated: true },
          ]}
        />
      </Rostra>
    )
    screen.getByRole('button', { name: 'Actions' }).focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Issue invoice' }))
    expect(onSelect).toHaveBeenCalledOnce()
  })
})

describe('Segmented', () => {
  it('reports the selected option and switches', async () => {
    function Harness() {
      const [value, setValue] = useState<'compact' | 'roomy'>('compact')
      return (
        <Segmented
          label="Density"
          value={value}
          onChange={setValue}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'roomy', label: 'Roomy' },
          ]}
        />
      )
    }
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Compact' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Roomy' }))
    expect(screen.getByRole('button', { name: 'Roomy' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('useVirtualRows', () => {
  function BigTable({ rows = 1000 }: { rows?: number }) {
    const wrap = useRef<HTMLDivElement>(null)
    const view = useVirtualRows({ count: rows, rowHeight: 20, scrollRef: wrap, overscan: 2 })
    return (
      <TableWrap ref={wrap} style={{ height: 100, overflowY: 'auto' }}>
        <Table aria-rowcount={rows}>
          <tbody>
            {view.padTop > 0 && <tr aria-hidden="true" style={{ height: view.padTop }} />}
            {Array.from({ length: view.end - view.start }, (_, i) => (
              <tr key={view.start + i} aria-rowindex={view.start + i + 1}>
                <td>Row {view.start + i}</td>
              </tr>
            ))}
            {view.padBottom > 0 && <tr aria-hidden="true" style={{ height: view.padBottom }} />}
          </tbody>
        </Table>
      </TableWrap>
    )
  }

  it('renders a window of rows, not the whole list, and moves it on scroll', () => {
    // jsdom lays nothing out, so the scroller reports its own size.
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 100 })
    onTestFinished(() => {
      if (original) Object.defineProperty(HTMLElement.prototype, 'clientHeight', original)
    })
    const { container } = render(<BigTable />)
    const rowsOnScreen = () => container.querySelectorAll('tr[aria-rowindex]').length

    expect(rowsOnScreen()).toBe(9) // 100/20 visible + 2 overscan on each side
    expect(screen.getByText('Row 0')).toBeInTheDocument()
    expect(screen.queryByText('Row 500')).not.toBeInTheDocument()

    const scroller = container.querySelector('.rs-table-wrap') as HTMLElement
    scroller.scrollTop = 10_000
    fireEvent.scroll(scroller)

    expect(screen.getByText('Row 498')).toBeInTheDocument()
    expect(screen.queryByText('Row 0')).not.toBeInTheDocument()
    expect(rowsOnScreen()).toBe(9)
  })
})
