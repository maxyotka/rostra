import { useCallback, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import * as RDialog from '@radix-ui/react-dialog'
import * as RPopover from '@radix-ui/react-popover'
import * as RTooltip from '@radix-ui/react-tooltip'
import * as RMenu from '@radix-ui/react-dropdown-menu'
import { cx } from './cx'
import { LayerScope } from './theme'

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
}

/** Modal window: focus is trapped, Escape closes, the background is inert. */
export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  className,
}: OverlayProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}
      <RDialog.Portal>
        <LayerScope>
          <RDialog.Overlay className="rs-backdrop" />
          <div className="rs-layer rs-layer--center">
            <RDialog.Content className={cx('rs-dialog', className)}>
              <div className="rs-dialog__head">
                <RDialog.Title className="rs-section-title">{title}</RDialog.Title>
              </div>
              <div className="rs-dialog__body">
                {description ? (
                  <RDialog.Description className="rs-text rs-muted">{description}</RDialog.Description>
                ) : (
                  <RDialog.Description className="rs-sr">{title}</RDialog.Description>
                )}
                {children}
              </div>
              {footer && <div className="rs-dialog__foot">{footer}</div>}
            </RDialog.Content>
          </div>
        </LayerScope>
      </RDialog.Portal>
    </RDialog.Root>
  )
}

/** Right-hand panel. Same primitive as the dialog: focus trapped, Escape closes. */
export function Drawer({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  className,
}: OverlayProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}
      <RDialog.Portal>
        <LayerScope>
          <RDialog.Overlay className="rs-backdrop" />
          <div className="rs-layer rs-layer--right">
            <RDialog.Content className={cx('rs-drawer', className)}>
              <div className="rs-drawer__head">
                <RDialog.Title className="rs-section-title">{title}</RDialog.Title>
              </div>
              <div className="rs-drawer__body">
                {description ? (
                  <RDialog.Description className="rs-text rs-muted">{description}</RDialog.Description>
                ) : (
                  <RDialog.Description className="rs-sr">{title}</RDialog.Description>
                )}
                {children}
              </div>
              {footer && <div className="rs-drawer__foot">{footer}</div>}
            </RDialog.Content>
          </div>
        </LayerScope>
      </RDialog.Portal>
    </RDialog.Root>
  )
}

/** Closes the layer: works inside both Dialog and Drawer. */
export function DialogClose({ children }: { children: ReactNode }) {
  return <RDialog.Close asChild>{children}</RDialog.Close>
}

export interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function Popover({ trigger, children, open, onOpenChange, side = 'bottom', align = 'start', className }: PopoverProps) {
  return (
    <RPopover.Root open={open} onOpenChange={onOpenChange}>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <LayerScope>
          <RPopover.Content className={cx('rs-popover', className)} side={side} align={align} sideOffset={6}>
            {children}
          </RPopover.Content>
        </LayerScope>
      </RPopover.Portal>
    </RPopover.Root>
  )
}

export interface TooltipProps {
  children: ReactNode
  label: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Delay before showing; 0 means immediately. */
  delay?: number
}

/**
 * Tooltip. Radix also shows it on keyboard focus, but a tooltip is not a
 * label: an icon-only button still needs its own aria-label.
 */
export function Tooltip({ children, label, side = 'top', delay = 300 }: TooltipProps) {
  return (
    <RTooltip.Provider delayDuration={delay}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <LayerScope>
            <RTooltip.Content className="rs-tooltip" side={side} sideOffset={6}>
              {label}
            </RTooltip.Content>
          </LayerScope>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
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
  align?: 'start' | 'center' | 'end'
}

export function Menu({ trigger, items, align = 'start' }: MenuProps) {
  return (
    <RMenu.Root>
      <RMenu.Trigger asChild>{trigger}</RMenu.Trigger>
      <RMenu.Portal>
        <LayerScope>
          <RMenu.Content className="rs-menu" align={align} sideOffset={6}>
            {items.map((item, i) => (
              <div key={i}>
                {item.separated && <RMenu.Separator className="rs-menu__sep" />}
                <RMenu.Item
                  className="rs-menu__item"
                  disabled={item.disabled}
                  onSelect={item.onSelect}
                >
                  {item.label}
                  {item.hint && <span className="rs-menu__hint">{item.hint}</span>}
                </RMenu.Item>
              </div>
            ))}
          </RMenu.Content>
        </LayerScope>
      </RMenu.Portal>
    </RMenu.Root>
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
