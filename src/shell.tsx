import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import * as RTabs from '@radix-ui/react-tabs'
import { cx } from './cx'

/**
 * Каркас приложения: высота равна окну, страница целиком не листается.
 * Скроллится только Pane — это правило системы, а не стилевая деталь.
 */
export function AppShell({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cx('rs-app', className)} {...rest} />
}

export function AppMain({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cx('rs-app__main', className)} {...rest} />
}

/** Приклеенная полоса: шапка, фильтры, пагинация. */
export function AppBar({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cx('rs-app__bar', className)} {...rest} />
}

export interface PaneProps extends ComponentPropsWithoutRef<'div'> {
  /** Не скроллится сам, а отдаёт прокрутку вложенной области. */
  fixed?: boolean
}

/** Единственная прокручиваемая область экрана. */
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

/** Рельс: сайдбар в 60 px для планшета и узких панелей. */
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
}

export function Breadcrumbs({ items, className, ...rest }: BreadcrumbsProps) {
  return (
    <nav className={cx('rs-crumbs', className)} aria-label="Хлебные крошки" {...rest}>
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

/** Вкладки: стрелки переключают, содержимое связано с вкладкой через ARIA. */
export function Tabs({ items, value, defaultValue, onValueChange, className }: TabsProps) {
  return (
    <RTabs.Root
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      className={className}
    >
      <RTabs.List className="rs-tabs">
        {items.map((item) => (
          <RTabs.Trigger key={item.value} value={item.value} className="rs-tab">
            {item.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {items.map((item) =>
        item.content == null ? null : (
          <RTabs.Content key={item.value} value={item.value}>
            {item.content}
          </RTabs.Content>
        )
      )}
    </RTabs.Root>
  )
}

export interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: ReactNode }>
  value: T
  onChange: (value: T) => void
  /** Чем управляет переключатель — читает диктор. */
  label: string
  className?: string
}

/** Переключатель вида: плотность, масштаб, режим списка. */
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
  /** Код или надзаголовок: 403, 404, обслуживание. */
  code?: ReactNode
  tone?: 'warn' | 'bad' | 'info'
  title: ReactNode
  text?: ReactNode
  /** Два выхода из тупика: основной и запасной. */
  actions?: ReactNode
  /** Техническая строка внизу: id запроса, время, узел. */
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
