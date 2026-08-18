import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactElement, ReactNode, Ref } from 'react'
import { cx } from './cx'
import { LayerScope } from './theme'
import {
  Portal,
  focusable,
  mergeRefs,
  useAnchoredPosition,
  useDismiss,
  useFocusTrap,
  useModalIsolation,
} from './primitives'
import type { Align, Side } from './primitives'

/** Adds behaviour to whatever element the caller passed as a trigger. */
function withTrigger(
  trigger: ReactNode,
  props: Record<string, unknown>
): ReactNode {
  if (!isValidElement(trigger)) return trigger
  const own = trigger.props as Record<string, unknown>
  const merged: Record<string, unknown> = { ...props }
  for (const key of ['onClick', 'onKeyDown', 'onPointerEnter', 'onPointerLeave', 'onFocus', 'onBlur']) {
    const theirs = own[key]
    const ours = props[key]
    if (typeof theirs === 'function' && typeof ours === 'function') {
      merged[key] = (event: unknown) => {
        ;(theirs as (e: unknown) => void)(event)
        ;(ours as (e: unknown) => void)(event)
      }
    }
  }
  return cloneElement(trigger as ReactElement<Record<string, unknown>>, merged)
}

function useControlledOpen(open: boolean | undefined, onOpenChange: ((open: boolean) => void) | undefined) {
  const [own, setOwn] = useState(false)
  const value = open ?? own
  const set = useCallback(
    (next: boolean) => {
      if (open === undefined) setOwn(next)
      onOpenChange?.(next)
    },
    [open, onOpenChange]
  )
  return [value, set] as const
}

interface OverlayProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element that opens the layer. Without it the layer is driven by `open`. */
  trigger?: ReactNode
  title: ReactNode
  /** Announced together with the title. When absent, the description is hidden. */
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  className?: string
  /** The window itself — for measuring it, or scrolling it back to the top. */
  contentRef?: Ref<HTMLDivElement>
}

const CloseContext = createContext<(() => void) | null>(null)

function Overlay({
  variant,
  open: openProp,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  className,
  contentRef: callerRef,
}: OverlayProps & { variant: 'dialog' | 'drawer' }) {
  const [open, setOpen] = useControlledOpen(openProp, onOpenChange)
  const contentRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const close = useCallback(() => setOpen(false), [setOpen])

  useFocusTrap(contentRef, open)
  useModalIsolation(contentRef, open)
  useDismiss({ within: [contentRef], active: open, onDismiss: close })

  return (
    <>
      {withTrigger(trigger, { onClick: () => setOpen(true) })}
      {open && (
        <Portal>
          <LayerScope>
            <div className="rs-backdrop" />
            <div className={cx('rs-layer', variant === 'drawer' ? 'rs-layer--right' : 'rs-layer--center')}>
              <div
                ref={mergeRefs(contentRef, callerRef)}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                className={cx(variant === 'drawer' ? 'rs-drawer' : 'rs-dialog', className)}
              >
                <CloseContext.Provider value={close}>
                  <div className={`rs-${variant}__head`}>
                    <div className="rs-section-title" id={titleId}>
                      {title}
                    </div>
                  </div>
                  <div className={`rs-${variant}__body`}>
                    {description && (
                      <div className="rs-text rs-muted" id={descriptionId}>
                        {description}
                      </div>
                    )}
                    {children}
                  </div>
                  {footer && <div className={`rs-${variant}__foot`}>{footer}</div>}
                </CloseContext.Provider>
              </div>
            </div>
          </LayerScope>
        </Portal>
      )}
    </>
  )
}

/** Modal window: focus is trapped, Escape closes, the background is hidden. */
export function Dialog(props: OverlayProps) {
  return <Overlay variant="dialog" {...props} />
}

/** Right-hand panel. Same behaviour as the dialog, different geometry. */
export function Drawer(props: OverlayProps) {
  return <Overlay variant="drawer" {...props} />
}

/** Closes the layer: works inside both Dialog and Drawer. */
export function DialogClose({ children }: { children: ReactNode }) {
  const close = useContext(CloseContext)
  return <>{withTrigger(children, { onClick: () => close?.() })}</>
}

export interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: Side
  align?: Align
  /** Accessible name. Without it the popover is a plain container, not a dialog. */
  label?: string
  className?: string
  /** The floating panel itself. */
  contentRef?: Ref<HTMLDivElement>
}

/**
 * Non-modal layer: focus moves in, Escape and a click outside close it, and
 * focus returns to the trigger. The page behind stays live, which is the
 * difference from Dialog.
 */
export function Popover({ trigger, children, open: openProp, onOpenChange, side = 'bottom', align = 'start', label, className, contentRef: callerRef }: PopoverProps) {
  const [open, setOpen] = useControlledOpen(openProp, onOpenChange)
  const anchorRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const position = useAnchoredPosition({ anchorRef, floatingRef: contentRef, open, side, align })

  useFocusTrap(contentRef, open)
  useDismiss({ within: [contentRef, anchorRef], active: open, onDismiss: () => setOpen(false) })

  return (
    <>
      {withTrigger(trigger, {
        ref: anchorRef,
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
        onClick: () => setOpen(!open),
      })}
      {open && (
        <Portal>
          <LayerScope>
            <div
              ref={mergeRefs(contentRef, callerRef)}
              className={cx('rs-popover', className)}
              style={position.style}
              data-side={position.side}
              role={label ? 'dialog' : undefined}
              aria-label={label}
            >
              {children}
            </div>
          </LayerScope>
        </Portal>
      )}
    </>
  )
}

export interface TooltipProps {
  children: ReactNode
  label: ReactNode
  side?: Side
  /** Delay before showing; 0 means immediately. */
  delay?: number
}

/**
 * Tooltip on hover and on keyboard focus. It describes the trigger rather than
 * naming it: an icon-only button still needs its own aria-label.
 */
export function Tooltip({ children, label, side = 'top', delay = 300 }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const id = useId()
  const position = useAnchoredPosition({ anchorRef, floatingRef: contentRef, open, side, align: 'center' })

  const show = useCallback(
    (immediate: boolean) => {
      clearTimeout(timer.current)
      if (immediate || delay === 0) setOpen(true)
      else timer.current = setTimeout(() => setOpen(true), delay)
    },
    [delay]
  )
  const hide = useCallback(() => {
    clearTimeout(timer.current)
    setOpen(false)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])
  // Escape hides a tooltip that covers what the user is trying to read.
  useDismiss({ within: [], active: open, onDismiss: hide, outside: false })

  return (
    <>
      {withTrigger(children, {
        ref: anchorRef,
        'aria-describedby': open ? id : undefined,
        onPointerEnter: () => show(false),
        onPointerLeave: hide,
        onFocus: () => show(true),
        onBlur: hide,
      })}
      {open && (
        <Portal>
          <LayerScope>
            <div ref={contentRef} id={id} role="tooltip" className="rs-tooltip" style={position.style} data-side={position.side}>
              {label}
            </div>
          </LayerScope>
        </Portal>
      )}
    </>
  )
}

export interface MenuItem {
  label: ReactNode
  onSelect?: () => void
  /** Keyboard shortcut hint, shown on the right. */
  hint?: ReactNode
  disabled?: boolean
  /** A separator before this item. */
  separated?: boolean
}

export interface MenuProps {
  trigger: ReactNode
  items: MenuItem[]
  align?: Align
  /** Accessible name of the menu. */
  label?: string
}

/** Dropdown menu on the APG pattern: arrows, Home/End, type-ahead, Escape. */
export function Menu({ trigger, items, align = 'start', label = 'Menu' }: MenuProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const anchorRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const typed = useRef({ query: '', at: 0 })
  const id = useId()
  const position = useAnchoredPosition({ anchorRef, floatingRef: contentRef, open, side: 'bottom', align })

  const enabled = items.map((item, index) => ({ item, index })).filter(({ item }) => !item.disabled)

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) anchorRef.current?.focus()
  }, [])

  // Escape hands focus back to the trigger; a click outside leaves focus where
  // the pointer put it.
  useDismiss({ within: [contentRef, anchorRef], active: open, onDismiss: (reason) => close(reason === 'escape') })

  // The item under the cursor owns focus, so the browser announces it and the
  // ring lands where the user is looking.
  useEffect(() => {
    if (!open) return
    const node = contentRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    node?.focus()
  }, [open, active])

  function openAt(index: number) {
    setActive(index)
    setOpen(true)
  }

  function step(from: number, direction: 1 | -1) {
    if (!enabled.length) return from
    const positions = enabled.map((entry) => entry.index)
    const current = positions.indexOf(from)
    const next = current === -1 ? 0 : (current + direction + positions.length) % positions.length
    return positions[next]!
  }

  function select(index: number) {
    const item = items[index]
    if (!item || item.disabled) return
    close()
    item.onSelect?.()
  }

  function onTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openAt(enabled[0]?.index ?? 0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openAt(enabled[enabled.length - 1]?.index ?? 0)
    }
  }

  function onMenuKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive((current) => step(current, 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActive((current) => step(current, -1))
        break
      case 'Home':
        event.preventDefault()
        setActive(enabled[0]?.index ?? 0)
        break
      case 'End':
        event.preventDefault()
        setActive(enabled[enabled.length - 1]?.index ?? 0)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        select(active)
        break
      case 'Tab':
        // Tab leaves the menu rather than cycling inside it.
        close(false)
        break
      default: {
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey) return
        const now = Date.now()
        typed.current.query = now - typed.current.at > 700 ? event.key : typed.current.query + event.key
        typed.current.at = now
        const query = typed.current.query.toLowerCase()
        const match = enabled.find(({ item }) => String(item.label).toLowerCase().startsWith(query))
        if (match) setActive(match.index)
      }
    }
  }

  return (
    <>
      {withTrigger(trigger, {
        ref: anchorRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        onClick: () => (open ? close() : openAt(enabled[0]?.index ?? 0)),
        onKeyDown: onTriggerKeyDown,
      })}
      {open && (
        <Portal>
          <LayerScope>
            <div
              ref={contentRef}
              id={id}
              role="menu"
              aria-label={label}
              aria-orientation="vertical"
              className="rs-menu"
              style={position.style}
              onKeyDown={onMenuKeyDown}
            >
              {items.map((item, index) => (
                <div key={index}>
                  {item.separated && <div className="rs-menu__sep" role="separator" />}
                  <div
                    role="menuitem"
                    tabIndex={-1}
                    data-index={index}
                    data-highlighted={index === active && !item.disabled ? '' : undefined}
                    data-disabled={item.disabled ? '' : undefined}
                    aria-disabled={item.disabled || undefined}
                    className="rs-menu__item"
                    onMouseEnter={() => !item.disabled && setActive(index)}
                    onClick={() => select(index)}
                  >
                    {item.label}
                    {item.hint && <span className="rs-menu__hint">{item.hint}</span>}
                  </div>
                </div>
              ))}
            </div>
          </LayerScope>
        </Portal>
      )}
    </>
  )
}

export interface ToastProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  title: ReactNode
  text?: ReactNode
}

export function Toast({ title, text, className, ...rest }: ToastProps) {
  return (
    <div className={cx('rs-toast', className)} {...rest}>
      <div>
        <div className="rs-toast__title">{title}</div>
        {text && <div className="rs-toast__text">{text}</div>}
      </div>
    </div>
  )
}

export interface ToastRecord {
  id: number
  title: ReactNode
  text?: ReactNode
}

/**
 * Toast queue. Show, auto-dismiss, dismiss — an admin panel rarely needs
 * more than that from a notification manager.
 */
export function useToasts(timeout = 5000) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<ToastRecord, 'id'>) => {
      const id = nextId.current++
      setToasts((list) => [...list, { ...toast, id }])
      if (timeout > 0) timers.current.set(id, setTimeout(() => dismiss(id), timeout))
      return id
    },
    [dismiss, timeout]
  )

  return { toasts, push, dismiss }
}

/**
 * Where toasts land. aria-live="polite" means an announcement waits for the
 * screen reader to finish its current sentence instead of interrupting it.
 */
export function ToastViewport({
  toasts,
  onDismiss,
  label = 'Notifications',
}: {
  toasts: ToastRecord[]
  onDismiss?: (id: number) => void
  /** Region name for screen readers. Translate it for a localised interface. */
  label?: string
}) {
  return (
    <div className="rs-toast-viewport" role="region" aria-live="polite" aria-label={label}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          text={toast.text}
          onClick={onDismiss ? () => onDismiss(toast.id) : undefined}
        />
      ))}
    </div>
  )
}

export { focusable }
