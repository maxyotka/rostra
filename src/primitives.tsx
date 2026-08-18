import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'

/**
 * The behaviour under the layers: focus trapping, dismissal, anchoring and
 * modality. Everything here is deliberately small and observable — the parts a
 * layer gets wrong are the parts a keyboard user cannot work around.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function focusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true'
  )
}

// useLayoutEffect warns during SSR; the layers only ever mount in a browser,
// but the warning would still reach anyone rendering on a server.
export const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Renders into body inside a marked wrapper. React owns the wrapper, so the
 * content lands in the DOM on the first commit — a host created in an effect
 * would appear one render later, and the isolation below would run against an
 * empty layer.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null
  return createPortal(<div data-rs-portal="">{children}</div>, document.body)
}

/**
 * Keeps Tab inside the container and returns focus where it came from. The
 * focusin listener covers the case Tab cannot: a click that lands outside
 * while the layer is modal.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const container = ref.current
    if (!active || !container) return
    const previous = document.activeElement as HTMLElement | null

    const focusInside = () => {
      const items = focusable(container)
      const target = items[0] ?? container
      if (target === container && !container.hasAttribute('tabindex')) container.tabIndex = -1
      target.focus()
    }
    focusInside()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !container) return
      const items = focusable(container)
      if (!items.length) {
        event.preventDefault()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
      const current = document.activeElement
      const outside = !container.contains(current)
      if (event.shiftKey && (current === first || outside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault()
        first.focus()
      }
    }

    function onFocusIn(event: FocusEvent) {
      if (container && !container.contains(event.target as Node)) focusInside()
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('focusin', onFocusIn, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('focusin', onFocusIn, true)
      // The trigger may have unmounted with the layer; focusing a detached
      // node throws nothing but moves focus to body, which is also fine.
      previous?.focus?.()
    }
  }, [active, ref])
}

/**
 * Escape anywhere, pointer outside every element in `within`. The reason is
 * passed on because the two differ in one thing that matters: Escape returns
 * focus to the trigger, a click outside leaves it where the user clicked.
 */
export function useDismiss({
  within,
  active,
  onDismiss,
  outside = true,
  escape = true,
}: {
  within: Array<RefObject<HTMLElement | null>>
  active: boolean
  onDismiss: (reason: 'escape' | 'outside') => void
  outside?: boolean
  escape?: boolean
}) {
  const dismiss = useRef(onDismiss)
  dismiss.current = onDismiss

  useEffect(() => {
    if (!active) return
    function onKeyDown(event: KeyboardEvent) {
      if (escape && event.key === 'Escape') {
        event.stopPropagation()
        dismiss.current('escape')
      }
    }
    function onPointerDown(event: Event) {
      if (!outside) return
      const target = event.target as Node
      if (within.some((ref) => ref.current?.contains(target))) return
      dismiss.current('outside')
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
    // `within` is a fresh array on every render; its contents are refs, which
    // are stable, so the listener does not need to care.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, outside, escape])
}

/**
 * Modality for assistive technology: everything outside the layer is hidden,
 * and the page behind stops scrolling. aria-modal alone is not enough —
 * screen readers still reach the background through their own navigation.
 */
export function useModalIsolation(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return
    const layer = ref.current
    const owner = layer?.closest('[data-rs-portal]') ?? layer
    // Without an owner every sibling would be hidden, the layer included.
    if (!owner) return
    const hidden: HTMLElement[] = []
    for (const node of [...document.body.children]) {
      if (node === owner || !(node instanceof HTMLElement)) continue
      if (node.hasAttribute('aria-hidden')) continue
      node.setAttribute('aria-hidden', 'true')
      hidden.push(node)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      for (const node of hidden) node.removeAttribute('aria-hidden')
      document.body.style.overflow = previousOverflow
    }
  }, [active, ref])
}

export type Side = 'top' | 'right' | 'bottom' | 'left'
export type Align = 'start' | 'center' | 'end'

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
const EDGE = 8

export function place(anchor: DOMRect, floating: { width: number; height: number }, side: Side, align: Align, offset: number) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const room: Record<Side, number> = {
    top: anchor.top,
    bottom: vh - anchor.bottom,
    left: anchor.left,
    right: vw - anchor.right,
  }
  const along = side === 'top' || side === 'bottom' ? floating.height : floating.width
  // Flip only when the other side genuinely has more room: a popover that
  // jumps on every scroll pixel is worse than one that is slightly clipped.
  let resolved = side
  if (room[side] < along + offset && room[OPPOSITE[side]] > room[side]) resolved = OPPOSITE[side]

  let top: number
  let left: number
  if (resolved === 'bottom') top = anchor.bottom + offset
  else if (resolved === 'top') top = anchor.top - floating.height - offset
  else top = align === 'start' ? anchor.top : align === 'end' ? anchor.bottom - floating.height : anchor.top + anchor.height / 2 - floating.height / 2

  if (resolved === 'right') left = anchor.right + offset
  else if (resolved === 'left') left = anchor.left - floating.width - offset
  else left = align === 'start' ? anchor.left : align === 'end' ? anchor.right - floating.width : anchor.left + anchor.width / 2 - floating.width / 2

  left = Math.min(Math.max(EDGE, left), Math.max(EDGE, vw - floating.width - EDGE))
  top = Math.min(Math.max(EDGE, top), Math.max(EDGE, vh - floating.height - EDGE))
  return { top, left, side: resolved }
}

/** Pins a floating element to its anchor, re-measuring on scroll and resize. */
export function useAnchoredPosition({
  anchorRef,
  floatingRef,
  open,
  side = 'bottom',
  align = 'start',
  offset = 6,
  matchWidth = false,
}: {
  anchorRef: RefObject<HTMLElement | null>
  floatingRef: RefObject<HTMLElement | null>
  open: boolean
  side?: Side
  align?: Align
  offset?: number
  /** The layer takes the anchor's width — what a combobox list is expected to do. */
  matchWidth?: boolean
}) {
  const [style, setStyle] = useState<{ top: number; left: number; width?: number }>({ top: 0, left: 0 })
  const [resolvedSide, setResolvedSide] = useState<Side>(side)

  const update = useCallback(() => {
    const anchor = anchorRef.current
    const floating = floatingRef.current
    if (!anchor || !floating) return
    const box = floating.getBoundingClientRect()
    const anchorBox = anchor.getBoundingClientRect()
    const width = matchWidth ? anchorBox.width : box.width
    const next = place(anchorBox, { width, height: box.height }, side, align, offset)
    setStyle({ top: next.top, left: next.left, width: matchWidth ? width : undefined })
    setResolvedSide(next.side)
  }, [anchorRef, floatingRef, side, align, offset, matchWidth])

  useBrowserLayoutEffect(() => {
    if (!open) return
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, update])

  return { style: { position: 'fixed' as const, ...style }, side: resolvedSide, update }
}

/**
 * One state, driven either by the caller or by the component. A prop that is
 * present wins every time — passing `value` and then dropping it mid-life is a
 * bug in the caller, not a mode this hook tries to support.
 */
export function useControlled<T>(controlled: T | undefined, initial: T, onChange?: (next: T) => void) {
  const [own, setOwn] = useState(initial)
  const value = controlled === undefined ? own : controlled
  const set = useCallback(
    (next: T) => {
      if (controlled === undefined) setOwn(next)
      onChange?.(next)
    },
    [controlled, onChange]
  )
  return [value, set] as const
}

/** Merges a ref of ours into whatever ref the caller's element already has. */
export function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(value)
      else if (ref) (ref as { current: T | null }).current = value
    }
  }
}
