import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from 'react'
import { cx } from './cx'

/* --- Dates ---------------------------------------------------
   Small local helpers instead of a date library: the calendar needs six
   operations, and every one of them is three lines. */

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function startOfMonth(date: Date) {
  const copy = startOfDay(date)
  copy.setDate(1)
  return copy
}

function addDays(date: Date, days: number) {
  const copy = startOfDay(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function addMonths(date: Date, months: number) {
  const copy = startOfMonth(date)
  copy.setMonth(copy.getMonth() + months)
  return copy
}

function sameDay(a: Date | null | undefined, b: Date | null | undefined) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export interface DateRange {
  from: Date
  to?: Date
}

function isRange(value: Date | DateRange | null | undefined): value is DateRange {
  return !!value && !(value instanceof Date)
}

export interface CalendarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onSelect' | 'defaultValue'> {
  /** A single day, or a period picked in two clicks. */
  mode?: 'single' | 'range'
  value?: Date | DateRange | null
  onValueChange?: (value: Date | DateRange | null) => void
  /** Controlled month. Without it the calendar keeps its own. */
  month?: Date
  defaultMonth?: Date
  onMonthChange?: (month: Date) => void
  /** Days that cannot be picked — weekends, anything before the contract date. */
  isDisabled?: (day: Date) => boolean
  /** 1 — the week starts on Monday, 0 — on Sunday. */
  weekStartsOn?: 0 | 1
  /** Month name, weekday names and day labels come from here. */
  locale?: string
  labels?: { previousMonth?: string; nextMonth?: string }
}

/**
 * Month grid following the APG date-picker pattern: the grid cell is the focus
 * target, arrows move it, and the month follows the cursor across its edges.
 */
export function Calendar({
  mode = 'single',
  value,
  onValueChange,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  isDisabled,
  weekStartsOn = 1,
  locale,
  labels,
  className,
  ...rest
}: CalendarProps) {
  const anchor = isRange(value) ? value.from : value instanceof Date ? value : null
  const [ownMonth, setOwnMonth] = useState(() => startOfMonth(defaultMonth ?? anchor ?? new Date()))
  const month = monthProp ? startOfMonth(monthProp) : ownMonth
  const [focused, setFocused] = useState(() => anchor ?? month)
  const gridRef = useRef<HTMLDivElement>(null)
  const moveFocus = useRef(false)

  const setMonth = useCallback(
    (next: Date) => {
      if (!monthProp) setOwnMonth(next)
      onMonthChange?.(next)
    },
    [monthProp, onMonthChange]
  )

  // The cursor drives the month, not the other way round: stepping off the
  // last day of August has to land on 1 September, not stall at the edge.
  const moveTo = useCallback(
    (day: Date) => {
      moveFocus.current = true
      setFocused(day)
      if (day.getMonth() !== month.getMonth() || day.getFullYear() !== month.getFullYear()) {
        setMonth(startOfMonth(day))
      }
    },
    [month, setMonth]
  )

  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    gridRef.current?.querySelector<HTMLElement>(`[data-day="${+focused}"]`)?.focus()
  }, [focused])

  const formats = useMemo(
    () => ({
      month: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      weekday: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      day: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    }),
    [locale]
  )

  // Six weeks always: a grid that changes height makes the buttons below it jump.
  const days = useMemo(() => {
    const first = startOfMonth(month)
    const shift = (first.getDay() - weekStartsOn + 7) % 7
    const start = addDays(first, -shift)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [month, weekStartsOn])

  const weekdays = useMemo(
    () => days.slice(0, 7).map((day) => formats.weekday.format(day)),
    [days, formats]
  )

  const today = startOfDay(new Date())
  const monthLabel = formats.month.format(month)

  function pick(day: Date) {
    if (isDisabled?.(day)) return
    if (mode === 'single') {
      onValueChange?.(day)
      return
    }
    // A completed range starts a new one; an open one closes, ordering itself
    // so that dragging backwards still yields from <= to.
    if (!isRange(value) || value.to) {
      onValueChange?.({ from: day })
    } else {
      onValueChange?.(+day < +value.from ? { from: day, to: value.from } : { from: value.from, to: day })
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const jump: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -((focused.getDay() - weekStartsOn + 7) % 7)),
      End: () => addDays(focused, 6 - ((focused.getDay() - weekStartsOn + 7) % 7)),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
    }
    const step = jump[event.key]
    if (step) {
      event.preventDefault()
      moveTo(step())
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      pick(focused)
    }
  }

  return (
    <div className={cx('rs-cal', className)} {...rest}>
      <div className="rs-cal__head">
        <button
          type="button"
          className="rs-btn rs-btn--sm rs-btn--icon rs-btn--ghost"
          aria-label={labels?.previousMonth ?? 'Previous month'}
          onClick={() => setMonth(addMonths(month, -1))}
        >
          ‹
        </button>
        <span className="rs-cal__month">{monthLabel}</span>
        <button
          type="button"
          className="rs-btn rs-btn--sm rs-btn--icon rs-btn--ghost"
          style={{ marginLeft: 'auto' }}
          aria-label={labels?.nextMonth ?? 'Next month'}
          onClick={() => setMonth(addMonths(month, 1))}
        >
          ›
        </button>
      </div>
      <div className="rs-cal__grid" role="grid" aria-label={monthLabel} ref={gridRef} onKeyDown={onKeyDown}>
        {/* display:contents keeps the seven-column grid while ARIA still sees rows */}
        <div role="row" style={{ display: 'contents' }}>
          {weekdays.map((name) => (
            <span role="columnheader" className="rs-cal__dow" key={name}>
              {name}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, week) => (
          <div role="row" style={{ display: 'contents' }} key={week}>
            {days.slice(week * 7, week * 7 + 7).map((day) => {
              const outside = day.getMonth() !== month.getMonth()
              const disabled = isDisabled?.(day) ?? false
              const selected = isRange(value)
                ? sameDay(day, value.from) || sameDay(day, value.to)
                : sameDay(day, value instanceof Date ? value : null)
              const inside =
                isRange(value) && value.to ? +day > +value.from && +day < +value.to : false
              return (
                <span
                  key={+day}
                  role="gridcell"
                  data-day={+day}
                  tabIndex={sameDay(day, focused) ? 0 : -1}
                  aria-selected={selected}
                  aria-disabled={disabled || undefined}
                  aria-current={sameDay(day, today) ? 'date' : undefined}
                  aria-label={formats.day.format(day)}
                  className={cx('rs-cal__day', {
                    'is-out': outside,
                    'is-off': disabled,
                    'is-sel': selected,
                    'is-range': inside,
                    'is-today': sameDay(day, today) && !selected,
                  })}
                  onClick={() => {
                    moveTo(day)
                    pick(day)
                  }}
                >
                  {day.getDate()}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* --- Combobox ------------------------------------------------ */

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'value' | 'defaultValue'> {
  options: ComboboxOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  /** Accessible name of the field. */
  label: string
  placeholder?: string
  /** Shown when the query matches nothing. */
  emptyText?: string
  /** Accessible name of a token's remove button. */
  removeLabel?: (option: ComboboxOption) => string
}

/**
 * Multiselect with tokens, on the ARIA 1.2 combobox pattern: the input keeps
 * focus and announces the active option through aria-activedescendant, so
 * arrow keys never move focus away from what the user is typing into.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  label,
  placeholder,
  emptyText = 'Nothing found',
  removeLabel = (option) => `Remove ${option.label}`,
  className,
  ...rest
}: ComboboxProps) {
  const id = useId()
  const listId = `${id}-list`
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(
    () => value.map((v) => options.find((o) => o.value === v)).filter((o): o is ComboboxOption => !!o),
    [options, value]
  )
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return options.filter((o) => !value.includes(o.value) && o.label.toLowerCase().includes(needle))
  }, [options, query, value])

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(0, matches.length - 1)))
  }, [matches.length])

  // Clicking outside closes the list. Focus alone is not enough: the pointer
  // can land on the page without ever moving focus.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function add(option: ComboboxOption) {
    if (option.disabled) return
    onValueChange([...value, option.value])
    setQuery('')
    setActive(0)
  }

  function remove(optionValue: string) {
    onValueChange(value.filter((v) => v !== optionValue))
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => (matches.length ? (current + step + matches.length) % matches.length : 0))
      return
    }
    const highlighted = matches[active]
    if (event.key === 'Enter' && open && highlighted) {
      event.preventDefault()
      add(highlighted)
      return
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      return
    }
    // Backspace on an empty query drops the last token — the habit every
    // tag input has taught people.
    const last = value[value.length - 1]
    if (event.key === 'Backspace' && !query && last) {
      remove(last)
    }
  }

  return (
    <div ref={rootRef} className={cx('rs-combo-wrap', className)} {...rest}>
      <div className="rs-combo" onClick={() => inputRef.current?.focus()}>
        {selected.map((option) => (
          <span className="rs-token" key={option.value}>
            {option.label}
            <button
              type="button"
              className="rs-token__x"
              aria-label={removeLabel(option)}
              onClick={(event) => {
                event.stopPropagation()
                remove(option.value)
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="rs-combo__input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${id}-option-${active}` : undefined}
          aria-label={label}
          placeholder={selected.length ? undefined : placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && (
        <ul className="rs-menu rs-combo__list" role="listbox" id={listId} aria-label={label}>
          {matches.length === 0 && (
            <li className="rs-menu__item rs-muted" role="presentation">
              {emptyText}
            </li>
          )}
          {matches.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === active}
              aria-disabled={option.disabled || undefined}
              className={cx('rs-menu__item', index === active && 'is-focus', option.disabled && 'is-disabled')}
              // mousedown would blur the input before the click lands
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => add(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* --- Tree ---------------------------------------------------- */

export interface TreeNode {
  id: string
  label: ReactNode
  /** Right-hand note: permission, count, status. */
  meta?: ReactNode
  children?: TreeNode[]
}

export interface TreeProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onSelect'> {
  items: TreeNode[]
  /** Accessible name of the tree. */
  label: string
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (ids: string[]) => void
  selected?: string | null
  onSelect?: (id: string) => void
}

/** Tree following the APG pattern: one tab stop, arrows walk and fold. */
export function Tree({
  items,
  label,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected,
  onSelect,
  className,
  ...rest
}: TreeProps) {
  const [ownExpanded, setOwnExpanded] = useState(defaultExpanded)
  const expanded = expandedProp ?? ownExpanded
  const open = useMemo(() => new Set(expanded), [expanded])
  const rootRef = useRef<HTMLDivElement>(null)

  // Only what is on screen: keyboard walking must skip collapsed subtrees.
  const visible = useMemo(() => {
    const rows: Array<{ node: TreeNode; level: number; parent: string | null }> = []
    const walk = (nodes: TreeNode[], level: number, parent: string | null) => {
      for (const node of nodes) {
        rows.push({ node, level, parent })
        if (node.children?.length && open.has(node.id)) walk(node.children, level + 1, node.id)
      }
    }
    walk(items, 1, null)
    return rows
  }, [items, open])

  const [focused, setFocused] = useState<string | null>(() => selected ?? items[0]?.id ?? null)
  const moveFocus = useRef(false)

  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    rootRef.current?.querySelector<HTMLElement>(`[data-node="${CSS.escape(focused ?? '')}"]`)?.focus()
  }, [focused])

  function setExpanded(ids: string[]) {
    if (expandedProp === undefined) setOwnExpanded(ids)
    onExpandedChange?.(ids)
  }

  function toggle(id: string, next: boolean) {
    setExpanded(next ? [...expanded, id] : expanded.filter((value) => value !== id))
  }

  function moveTo(id: string | undefined) {
    if (!id) return
    moveFocus.current = true
    setFocused(id)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = visible.findIndex((row) => row.node.id === focused)
    const row = index < 0 ? undefined : visible[index]
    if (!row) return
    const hasChildren = !!row.node.children?.length
    const isOpen = open.has(row.node.id)

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveTo(visible[index + 1]?.node.id)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveTo(visible[index - 1]?.node.id)
        break
      case 'ArrowRight':
        event.preventDefault()
        if (hasChildren && !isOpen) toggle(row.node.id, true)
        else if (hasChildren) moveTo(visible[index + 1]?.node.id)
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (hasChildren && isOpen) toggle(row.node.id, false)
        else moveTo(row.parent ?? undefined)
        break
      case 'Home':
        event.preventDefault()
        moveTo(visible[0]?.node.id)
        break
      case 'End':
        event.preventDefault()
        moveTo(visible[visible.length - 1]?.node.id)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelect?.(row.node.id)
        break
      default:
    }
  }

  const render = (nodes: TreeNode[], level: number) =>
    nodes.map((node) => {
      const hasChildren = !!node.children?.length
      const isOpen = open.has(node.id)
      return (
        <div key={node.id}>
          <div
            role="treeitem"
            data-node={node.id}
            aria-level={level}
            aria-expanded={hasChildren ? isOpen : undefined}
            aria-selected={selected === node.id}
            tabIndex={focused === node.id ? 0 : -1}
            className={cx('rs-tree__row', selected === node.id && 'is-on')}
            onFocus={() => setFocused(node.id)}
            onClick={(event) => {
              event.stopPropagation()
              if (hasChildren) toggle(node.id, !isOpen)
              onSelect?.(node.id)
            }}
          >
            <span className="rs-tree__toggle" aria-hidden="true">
              {hasChildren ? (isOpen ? '▾' : '▸') : ''}
            </span>
            <span>{node.label}</span>
            {node.meta != null && (
              <span className="rs-muted" style={{ marginLeft: 'auto' }}>
                {node.meta}
              </span>
            )}
          </div>
          {hasChildren && isOpen && (
            <div role="group" className="rs-tree__kids">
              {render(node.children!, level + 1)}
            </div>
          )}
        </div>
      )
    })

  return (
    <div ref={rootRef} role="tree" aria-label={label} className={className} onKeyDown={onKeyDown} {...rest}>
      {render(items, 1)}
    </div>
  )
}

/* --- Board --------------------------------------------------- */

export interface BoardCard {
  id: string
  /** Accessible name of the card — used by the move buttons. */
  label: string
  children: ReactNode
}

export interface BoardColumn {
  id: string
  title: ReactNode
  cards: BoardCard[]
  /** Shown instead of the cards when the column is empty. */
  empty?: ReactNode
}

export interface BoardProps extends ComponentPropsWithoutRef<'div'> {
  columns: BoardColumn[]
  /**
   * Turns on the move controls. Dragging is deliberately not implemented —
   * a pointer-only board is unusable by keyboard, and these buttons are what
   * a screen reader and a keyboard actually need.
   */
  onCardMove?: (move: { card: string; from: string; to: string }) => void
  labels?: { moveLeft?: string; moveRight?: string }
}

export function Board({ columns, onCardMove, labels, className, ...rest }: BoardProps) {
  return (
    <div className={cx('rs-board', className)} {...rest}>
      {columns.map((column, columnIndex) => {
        const previous = columns[columnIndex - 1]
        const next = columns[columnIndex + 1]
        return (
        <section className="rs-board__col" key={column.id} aria-label={typeof column.title === 'string' ? column.title : undefined}>
          <div className="rs-board__head">
            {column.title}
            <span className="rs-board__count">{column.cards.length}</span>
          </div>
          {column.cards.length === 0 && column.empty}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {column.cards.map((card) => (
              <li className="rs-board__card" key={card.id}>
                {card.children}
                {onCardMove && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    <button
                      type="button"
                      className="rs-btn rs-btn--sm rs-btn--icon rs-btn--ghost"
                      aria-label={`${labels?.moveLeft ?? 'Move left'}: ${card.label}`}
                      disabled={!previous}
                      onClick={() =>
                        previous && onCardMove({ card: card.id, from: column.id, to: previous.id })
                      }
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="rs-btn rs-btn--sm rs-btn--icon rs-btn--ghost"
                      aria-label={`${labels?.moveRight ?? 'Move right'}: ${card.label}`}
                      disabled={!next}
                      onClick={() => next && onCardMove({ card: card.id, from: column.id, to: next.id })}
                    >
                      →
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
        )
      })}
    </div>
  )
}
