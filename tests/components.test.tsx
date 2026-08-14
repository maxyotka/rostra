import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
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
  Tabs,
  cx,
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
