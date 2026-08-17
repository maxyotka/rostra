import { forwardRef, useId, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from 'react'
import { cx } from './cx'

/**
 * Application shell: height equals the window, the page never scrolls as a
 * whole. Only Pane scrolls — a rule of the system, not a styling detail.
 */
export function AppShell({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cx('rs-app', className)} {...rest} />
}

export function AppMain({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cx('rs-app__main', className)} {...rest} />
}

/** A pinned bar: header, filters, pagination. */
export function AppBar({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cx('rs-app__bar', className)} {...rest} />
}

export interface PaneProps extends ComponentPropsWithoutRef<'div'> {
  /** Does not scroll itself; hands scrolling to a nested area. */
  fixed?: boolean
}

/** The only scrollable area on the screen. */
export function Pane({ fixed, className, ...rest }: PaneProps) {
  return <div className={cx(fixed ? 'rs-pane--fixed' : 'rs-pane', className)} {...rest} />
}

export interface SidebarProps extends ComponentPropsWithoutRef<'nav'> {
  collapsed?: boolean
}

export function Sidebar({ collapsed, className, ...rest }: SidebarProps) {
  return <nav className={cx('rs-shell__side', className)} data-collapsed={collapsed} {...rest} />
}

export function Topbar({ className, ...rest }: ComponentPropsWithoutRef<'header'>) {
  return <header className={cx('rs-shell__topbar', className)} {...rest} />
}

export interface NavItemProps extends ComponentPropsWithoutRef<'a'> {
  active?: boolean
  icon?: ReactNode
}

export const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(function NavItem(
  { active, icon, className, children, ...rest },
  ref
) {
  return (
    <a
      ref={ref}
      className={cx('rs-nav-item', active && 'is-on', className)}
      aria-current={active ? 'page' : undefined}
      {...rest}
    >
      {icon}
      {children}
    </a>
  )
})

/** Rail: a 60px sidebar for tablets and narrow panels. */
export function Rail({ className, ...rest }: ComponentPropsWithoutRef<'nav'>) {
  return <nav className={cx('rs-rail', className)} {...rest} />
}

export interface RailItemProps extends ComponentPropsWithoutRef<'button'> {
  active?: boolean
}

export const RailItem = forwardRef<HTMLButtonElement, RailItemProps>(function RailItem(
  { active, className, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('rs-rail__item', active && 'is-on', className)}
      aria-current={active ? 'page' : undefined}
      {...rest}
    />
  )
})

export interface BreadcrumbsProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'children'> {
  items: Array<{ label: ReactNode; href?: string }>
  /** Navigation name for screen readers. Translate it for a localised interface. */
  'aria-label'?: string
}

export function Breadcrumbs({ items, className, 'aria-label': label = 'Breadcrumb', ...rest }: BreadcrumbsProps) {
  return (
    <nav className={cx('rs-crumbs', className)} aria-label={label} {...rest}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={i}>
            {item.href && !last ? <a href={item.href}>{item.label}</a> : <span aria-current={last ? 'page' : undefined}>{item.label}</span>}
            {!last && <span aria-hidden="true"> / </span>}
          </span>
        )
      })}
    </nav>
  )
}

export interface TabsProps {
  items: Array<{ value: string; label: ReactNode; content?: ReactNode }>
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
}

/**
 * Tabs on the APG pattern: one tab stop for the whole list, arrows move and
 * activate, Home and End jump to the ends. The panel is tied to its tab
 * through aria-controls and aria-labelledby.
 */
export function Tabs({ items, value, defaultValue, onValueChange, className }: TabsProps) {
  const id = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [own, setOwn] = useState(defaultValue ?? items[0]?.value)
  const current = value ?? own
  const activeItem = items.find((item) => item.value === current) ?? items[0]

  function activate(next: string) {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
    listRef.current?.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.value === current)
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 }
    const move = moves[event.key]
    if (move) {
      event.preventDefault()
      const next = items[(index + move + items.length) % items.length]
      if (next) activate(next.value)
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const next = event.key === 'Home' ? items[0] : items[items.length - 1]
      if (next) activate(next.value)
    }
  }

  return (
    <div className={className}>
      <div className="rs-tabs" role="tablist" ref={listRef} onKeyDown={onKeyDown}>
        {items.map((item) => {
          const selected = item.value === current
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`${id}-tab-${item.value}`}
              data-value={item.value}
              data-state={selected ? 'active' : 'inactive'}
              aria-selected={selected}
              aria-controls={item.content == null ? undefined : `${id}-panel-${item.value}`}
              tabIndex={selected ? 0 : -1}
              className="rs-tab"
              onClick={() => activate(item.value)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {activeItem?.content != null && (
        <div
          role="tabpanel"
          id={`${id}-panel-${activeItem.value}`}
          aria-labelledby={`${id}-tab-${activeItem.value}`}
          tabIndex={0}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  )
}

export interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: ReactNode }>
  value: T
  onChange: (value: T) => void
  /** What the control governs — read out by screen readers. */
  label: string
  className?: string
}

/** View switch: density, zoom, list mode. */
export function Segmented<T extends string>({ options, value, onChange, label, className }: SegmentedProps<T>) {
  return (
    <div className={cx('rs-seg', className)} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cx('rs-seg__btn', option.value === value && 'is-on')}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export interface SystemStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Code or eyebrow: 403, 404, maintenance. */
  code?: ReactNode
  tone?: 'warn' | 'bad' | 'info'
  title: ReactNode
  text?: ReactNode
  /** Two ways out of the dead end: primary and fallback. */
  actions?: ReactNode
  /** Technical line at the bottom: request id, time, node. */
  tech?: ReactNode
}

export function SystemState({ code, tone, title, text, actions, tech, className, ...rest }: SystemStateProps) {
  return (
    <div className={cx('rs-state', className)} {...rest}>
      {code && (
        <div className="rs-state__code">
          <span className={cx('rs-state__mark', tone && `rs-state__mark--${tone}`)} aria-hidden="true">
            ●
          </span>
          {code}
        </div>
      )}
      <div className="rs-state__title">{title}</div>
      {text && <div className="rs-state__text">{text}</div>}
      {actions && <div className="rs-state__actions">{actions}</div>}
      {tech && <div className="rs-state__tech">{tech}</div>}
    </div>
  )
}
