import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cx } from './cx'

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger'
  size?: 'md' | 'sm'
  /** Квадратная кнопка под одну иконку. Требует aria-label. */
  icon?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', icon, loading, className, disabled, type = 'button', children, onClick, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'rs-btn',
        variant !== 'default' && `rs-btn--${variant}`,
        size === 'sm' && 'rs-btn--sm',
        icon && 'rs-btn--icon',
        loading && 'is-loading',
        className
      )}
      // Кнопка в загрузке остаётся в потоке фокуса, но не срабатывает:
      // disabled увёл бы фокус в никуда прямо в момент отправки формы.
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      disabled={disabled}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      {children}
    </button>
  )
})

export interface FieldProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  /** Получает id, aria-describedby и aria-invalid — связывать руками не нужно. */
  children: (props: {
    id: string
    'aria-describedby'?: string
    'aria-invalid'?: true
    required?: boolean
  }) => ReactNode
}

export function Field({ label, hint, error, required, className, children, ...rest }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={cx('rs-field', className)} {...rest}>
      {label && (
        <label className="rs-label" htmlFor={id}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        required,
      })}
      {hint && (
        <span className="rs-hint" id={hintId}>
          {hint}
        </span>
      )}
      {/* role=alert, чтобы диктор прочитал ошибку валидации сразу после отправки */}
      {error && (
        <span className="rs-error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(function Input(
  { className, ...rest },
  ref
) {
  return <input ref={ref} className={cx('rs-input', className)} {...rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<'textarea'>>(
  function Textarea({ className, rows = 3, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cx('rs-textarea', className)} {...rest} />
  }
)

/** Нативный select: даром получает клавиатуру, поиск по букве и мобильный контур ОС. */
export const Select = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<'select'>>(
  function Select({ className, ...rest }, ref) {
    return <select ref={ref} className={cx('rs-select', className)} {...rest} />
  }
)

type ChoiceProps = ComponentPropsWithoutRef<'input'> & { children?: ReactNode }

/** Общая обвязка нативных чекбокса, радио и переключателя. */
function choice(visual: 'rs-check' | 'rs-radio' | 'rs-switch', type: 'checkbox' | 'radio', role?: 'switch') {
  return forwardRef<HTMLInputElement, ChoiceProps>(function Choice(
    { className, children, ...rest },
    ref
  ) {
    return (
      <label className={cx('rs-choice', className)}>
        <input ref={ref} type={type} role={role} className="rs-choice__input" {...rest} />
        <span className={visual} aria-hidden="true" />
        {children != null && <span>{children}</span>}
      </label>
    )
  })
}

export const Checkbox = choice('rs-check', 'checkbox')
export const Radio = choice('rs-radio', 'radio')
export const Switch = choice('rs-switch', 'checkbox', 'switch')
