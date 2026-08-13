import { forwardRef, Fragment } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cx } from './cx'

type Status = 'ok' | 'warn' | 'bad' | 'info'

export interface EyebrowProps extends ComponentPropsWithoutRef<'div'> {
  variant?: 'line' | 'tick' | 'tag'
  /** Надпись длиннее двух слов: капс отключается, иначе строка не читается. */
  sentence?: boolean
  bare?: boolean
}

export function Eyebrow({ variant = 'line', sentence, bare, className, children, ...rest }: EyebrowProps) {
  return (
    <div
      className={cx(
        'rs-eyebrow',
        variant !== 'line' && `rs-eyebrow--${variant}`,
        sentence && 'rs-eyebrow--sentence',
        bare && 'rs-eyebrow--bare',
        className
      )}
      {...rest}
    >
      {variant === 'tag' ? <span>{children}</span> : children}
    </div>
  )
}

export const Card = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(function Card(
  { className, ...rest },
  ref
) {
  return <div ref={ref} className={cx('rs-card', className)} {...rest} />
})

export function CardBody({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cx('rs-card__body', className)} {...rest} />
}

export function Divider(props: ComponentPropsWithoutRef<'hr'>) {
  return <hr {...props} className={cx('rs-divider', props.className)} />
}

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  status?: Status
  /** Без цветной точки перед текстом. */
  plain?: boolean
}

export function Badge({ status, plain, className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx('rs-badge', status && `rs-badge--${status}`, plain && 'rs-badge--plain', className)}
      {...rest}
    />
  )
}

export interface ChipProps extends ComponentPropsWithoutRef<'button'> {
  selected?: boolean
  add?: boolean
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected, add, className, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cx('rs-chip', selected && 'is-on', add && 'rs-chip--add', className)}
      {...rest}
    />
  )
})

export interface MetricProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  label: ReactNode
  value: ReactNode
  foot?: ReactNode
}

export function Metric({ label, value, foot, className, ...rest }: MetricProps) {
  return (
    <div className={cx('rs-metric', className)} {...rest}>
      <div className="rs-metric__label">{label}</div>
      <div className="rs-metric__value">{value}</div>
      {foot}
    </div>
  )
}

export interface MeterProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** 0–100. Значения вне диапазона подрезаются, чтобы полоса не выехала. */
  value: number
  label?: string
}

export function Meter({ value, label, className, ...rest }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cx('rs-meter', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      {...rest}
    >
      <div className="rs-meter__fill" style={{ width: `${clamped}%` }} />
    </div>
  )
}

export interface TableProps extends ComponentPropsWithoutRef<'table'> {
  zebra?: boolean
  /** Первая колонка залипает при горизонтальной прокрутке. */
  sticky?: boolean
  /** Шапка предложением, а не капсом: для заголовков длиннее двух слов. */
  sentenceHead?: boolean
}

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { zebra, sticky, sentenceHead, className, ...rest },
  ref
) {
  return (
    <table
      ref={ref}
      className={cx(
        'rs-table',
        zebra && 'rs-table--zebra',
        sticky && 'rs-table--sticky',
        sentenceHead && 'rs-table--sentence-head',
        className
      )}
      {...rest}
    />
  )
})

export function TableWrap({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cx('rs-table-wrap', className)} {...rest} />
}

/** Числовая ячейка: правый край и табличные цифры, чтобы колонка не прыгала. */
export function Num({ className, ...rest }: ComponentPropsWithoutRef<'td'>) {
  return <td className={cx('rs-num', className)} {...rest} />
}

export interface EmptyStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  title: ReactNode
  text?: ReactNode
  action?: ReactNode
  /** Штриховой прямоугольник вместо иллюстрации. */
  art?: boolean
}

export function EmptyState({ title, text, action, art = true, className, ...rest }: EmptyStateProps) {
  return (
    <div className={cx('rs-empty', className)} {...rest}>
      {art && <div className="rs-empty__art" aria-hidden="true" />}
      <div className="rs-section-title">{title}</div>
      {text && <div className="rs-text rs-muted">{text}</div>}
      {action}
    </div>
  )
}

export interface SkeletonProps extends ComponentPropsWithoutRef<'div'> {
  width?: number | string
  height?: number | string
}

export function Skeleton({ width, height, className, style, ...rest }: SkeletonProps) {
  return (
    <div
      className={cx('rs-skeleton', className)}
      // Заглушка — служебная графика: диктору читать нечего, но статус загрузки нужен.
      aria-hidden="true"
      style={{ width, height, ...style }}
      {...rest}
    />
  )
}

export interface StepsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  steps: ReactNode[]
  /** Индекс текущего шага; всё до него считается пройденным. */
  current: number
}

export function Steps({ steps, current, className, ...rest }: StepsProps) {
  return (
    <div className={cx('rs-steps', className)} {...rest}>
      {steps.map((label, i) => {
        const done = i < current
        const now = i === current
        return (
          <Fragment key={i}>
            <div className={cx('rs-step', { 'is-done': done, 'is-now': now })} aria-current={now ? 'step' : undefined}>
              <span className="rs-step__dot">{done ? '✓' : i + 1}</span>
              <span>{label}</span>
            </div>
            {i < steps.length - 1 && <span className={cx('rs-step__line', done && 'is-done')} />}
          </Fragment>
        )
      })}
    </div>
  )
}

export interface AlertProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  status?: Status
  title?: ReactNode
  children?: ReactNode
}

export function Alert({ status, title, className, children, ...rest }: AlertProps) {
  return (
    <div
      className={cx('rs-alert', status && `rs-alert--${status}`, className)}
      // Ошибка и предупреждение перебивают чтение, остальное ждёт паузы.
      role={status === 'bad' ? 'alert' : 'status'}
      {...rest}
    >
      <div className="rs-alert__mark" aria-hidden="true" />
      <div>
        {title && <div className="rs-alert__title">{title}</div>}
        {children && <div className="rs-alert__text">{children}</div>}
      </div>
    </div>
  )
}

export interface AvatarProps extends ComponentPropsWithoutRef<'span'> {
  /** Имя целиком: инициалы система соберёт сама. */
  name: string
  round?: boolean
}

export function Avatar({ name, round, className, ...rest }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => [...word][0]?.toUpperCase() ?? '')
    .join('')
  return (
    <span className={cx('rs-avatar', round && 'rs-avatar--round', className)} title={name} {...rest}>
      <span aria-hidden="true">{initials}</span>
      <span className="rs-sr">{name}</span>
    </span>
  )
}

export function AvatarStack({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cx('rs-stack', className)} {...rest} />
}

export function Kbd({ className, ...rest }: ComponentPropsWithoutRef<'kbd'>) {
  return <kbd className={cx('rs-kbd', className)} {...rest} />
}

export interface KeyValueProps extends Omit<ComponentPropsWithoutRef<'dl'>, 'children'> {
  items: Array<{ key: ReactNode; value: ReactNode }>
}

export function KeyValue({ items, className, ...rest }: KeyValueProps) {
  return (
    <dl className={cx('rs-kv', className)} {...rest}>
      {items.map((item, i) => (
        <Fragment key={i}>
          <dt>{item.key}</dt>
          <dd>{item.value}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

export interface TimelineItem {
  when: ReactNode
  body: ReactNode
  muted?: boolean
}

export function Timeline({
  items,
  className,
  ...rest
}: Omit<ComponentPropsWithoutRef<'div'>, 'children'> & { items: TimelineItem[] }) {
  return (
    <div className={cx('rs-timeline', className)} {...rest}>
      {items.map((item, i) => (
        <div className="rs-timeline__item" key={i}>
          <div className="rs-timeline__when">{item.when}</div>
          <div className="rs-timeline__rail" aria-hidden="true">
            <span className={cx('rs-timeline__dot', item.muted && 'rs-timeline__dot--muted')} />
            {i < items.length - 1 && <span className="rs-timeline__line" />}
          </div>
          <div className="rs-timeline__body">{item.body}</div>
        </div>
      ))}
    </div>
  )
}
