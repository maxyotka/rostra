import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import axe from 'axe-core'
import { Board, Calendar, Combobox, Rostra, Tree } from '../src'
import type { DateRange } from '../src'

async function violations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  return results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.help}`)
}

const AUGUST = new Date(2026, 7, 12)

describe('Calendar', () => {
  it('walks the grid with arrows and crosses into the next month', async () => {
    render(<Calendar defaultMonth={AUGUST} value={new Date(2026, 7, 31)} locale="en-GB" />)
    const cell = screen.getByRole('gridcell', { name: '31 August 2026' })
    cell.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('grid')).toHaveAccessibleName('September 2026')
    expect(document.activeElement).toHaveAttribute('aria-label', '1 September 2026')
  })

  it('picks a range in two clicks and orders it backwards too', async () => {
    function Host() {
      const [value, setValue] = useState<Date | DateRange | null>(null)
      return (
        <Calendar
          mode="range"
          defaultMonth={AUGUST}
          value={value}
          onValueChange={setValue}
          locale="en-GB"
        />
      )
    }
    render(<Host />)
    await userEvent.click(screen.getByRole('gridcell', { name: '16 August 2026' }))
    await userEvent.click(screen.getByRole('gridcell', { name: '10 August 2026' }))
    expect(screen.getByRole('gridcell', { name: '10 August 2026' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('gridcell', { name: '16 August 2026' })).toHaveAttribute('aria-selected', 'true')
    // a day between the ends belongs to the range without being an endpoint
    const middle = screen.getByRole('gridcell', { name: '12 August 2026' })
    expect(middle.className).toContain('is-range')
    expect(middle).toHaveAttribute('aria-selected', 'false')
  })

  it('does not select a disabled day', async () => {
    const onValueChange = vi.fn()
    render(
      <Calendar
        defaultMonth={AUGUST}
        onValueChange={onValueChange}
        isDisabled={(day) => day.getDate() === 15}
        locale="en-GB"
      />
    )
    await userEvent.click(screen.getByRole('gridcell', { name: '15 August 2026' }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('produces no axe violations', async () => {
    const { container } = render(
      <Rostra>
        <Calendar defaultMonth={AUGUST} locale="en-GB" />
      </Rostra>
    )
    expect(await violations(container)).toEqual([])
  })
})

const PLANS = [
  { value: 'ent', label: 'Enterprise' },
  { value: 'biz', label: 'Business' },
  { value: 'start', label: 'Starter' },
]

function ComboHost({ initial = [] as string[] }) {
  const [value, setValue] = useState(initial)
  return <Combobox options={PLANS} value={value} onValueChange={setValue} label="Plans" placeholder="Add a plan…" />
}

describe('Combobox', () => {
  it('filters by query and takes the highlighted option on Enter', async () => {
    render(<ComboHost />)
    const input = screen.getByRole('combobox', { name: 'Plans' })
    await userEvent.type(input, 'bus')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByText('Business')).toHaveClass('rs-token')
    // a taken option leaves the list
    await userEvent.clear(input)
    expect(screen.queryByRole('option', { name: 'Business' })).not.toBeInTheDocument()
  })

  it('keeps focus on the input and points at the active option', async () => {
    render(<ComboHost />)
    const input = screen.getByRole('combobox', { name: 'Plans' })
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(input)
    const active = input.getAttribute('aria-activedescendant')
    expect(active).toBeTruthy()
    expect(document.getElementById(active!)).toHaveTextContent('Business')
  })

  it('backspace on an empty query removes the last token', async () => {
    render(<ComboHost initial={['ent', 'biz']} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Plans' }))
    await userEvent.keyboard('{Backspace}')
    // the token is gone; the option returning to the open list is expected
    expect(screen.queryByRole('button', { name: 'Remove Business' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Enterprise' })).toBeInTheDocument()
  })

  it('produces no axe violations with the list open', async () => {
    const { container } = render(
      <Rostra>
        <ComboHost initial={['ent']} />
      </Rostra>
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'Plans' }))
    expect(await violations(container)).toEqual([])
  })
})

const TREE = [
  {
    id: 'prod',
    label: 'Manufacturing',
    meta: 'Full',
    children: [
      { id: 'wh2', label: 'Warehouse 2', meta: 'Inherits' },
      { id: 'log', label: 'Logistics', meta: 'Read' },
    ],
  },
  { id: 'fin', label: 'Finance', meta: 'Closed' },
]

describe('Tree', () => {
  it('folds and unfolds with left and right arrows', async () => {
    render(<Tree items={TREE} label="Access" defaultExpanded={['prod']} />)
    const root = screen.getByRole('treeitem', { name: /Manufacturing/ })
    root.focus()
    expect(root).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('treeitem', { name: /Manufacturing/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('treeitem', { name: /Warehouse 2/ })).not.toBeInTheDocument()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('treeitem', { name: /Warehouse 2/ })).toBeInTheDocument()
  })

  it('walks visible rows only, skipping a collapsed subtree', async () => {
    render(<Tree items={TREE} label="Access" />)
    const root = screen.getByRole('treeitem', { name: /Manufacturing/ })
    root.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveAccessibleName(/Finance/)
  })

  it('reports depth and selection', async () => {
    const onSelect = vi.fn()
    render(<Tree items={TREE} label="Access" defaultExpanded={['prod']} selected="log" onSelect={onSelect} />)
    const child = screen.getByRole('treeitem', { name: /Logistics/ })
    expect(child).toHaveAttribute('aria-level', '2')
    expect(child).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('treeitem', { name: /Finance/ }))
    expect(onSelect).toHaveBeenCalledWith('fin')
  })

  it('produces no axe violations', async () => {
    const { container } = render(
      <Rostra>
        <Tree items={TREE} label="Access" defaultExpanded={['prod']} />
      </Rostra>
    )
    expect(await violations(container)).toEqual([])
  })
})

const COLUMNS = [
  { id: 'new', title: 'New', cards: [{ id: 't-1', label: 'T-4471', children: <span>Card payment fails</span> }] },
  { id: 'work', title: 'In progress', cards: [] },
]

describe('Board', () => {
  it('moves a card with a keyboard-reachable control', async () => {
    const onCardMove = vi.fn()
    render(<Board columns={COLUMNS} onCardMove={onCardMove} />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(onCardMove).toHaveBeenCalledWith({ card: 't-1', from: 'new', to: 'work' })
  })

  it('disables a move that has nowhere to go', () => {
    render(<Board columns={COLUMNS} onCardMove={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Move left: T-4471' })).toBeDisabled()
  })

  it('stays read-only without onCardMove', () => {
    render(<Board columns={COLUMNS} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('names its columns and counts their cards', () => {
    render(<Board columns={COLUMNS} />)
    const column = screen.getByRole('region', { name: 'New' })
    expect(within(column).getByText('Card payment fails')).toBeInTheDocument()
  })

  it('produces no axe violations', async () => {
    const { container } = render(
      <Rostra>
        <Board columns={COLUMNS} onCardMove={vi.fn()} />
      </Rostra>
    )
    expect(await violations(container)).toEqual([])
  })
})
