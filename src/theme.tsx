import { createContext, forwardRef, useContext, useMemo } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cx } from './cx'

export type Theme = 'light' | 'dark' | 'warm' | 'contrast'
export type Density = 'compact' | 'medium' | 'roomy' | 'mobile'

export interface ThemeSettings {
  theme: Theme
  density: Density
  viewport?: 'tablet'
}

const ThemeContext = createContext<ThemeSettings>({ theme: 'light', density: 'medium' })

export const useRostraTheme = (): ThemeSettings => useContext(ThemeContext)

export interface RostraProps extends ComponentPropsWithoutRef<'div'>, Partial<ThemeSettings> {}

/** Root of the system: theme, density and viewport mode for the subtree. */
export const Rostra = /* @__PURE__ */ forwardRef<HTMLDivElement, RostraProps>(function Rostra(
  { theme = 'light', density = 'medium', viewport, className, ...rest },
  ref
) {
  const value = useMemo(() => ({ theme, density, viewport }), [theme, density, viewport])
  return (
    <ThemeContext.Provider value={value}>
      <div
        ref={ref}
        className={cx('rs', className)}
        data-theme={theme}
        data-density={density}
        data-viewport={viewport}
        {...rest}
      />
    </ThemeContext.Provider>
  )
})

/**
 * Wrapper for portal content. A layer renders at the end of body, outside
 * .rs, so theme tokens never reach it — they are applied again here.
 */
export function LayerScope({ children }: { children: ReactNode }) {
  const { theme, density } = useRostraTheme()
  return (
    <div className="rs" data-theme={theme} data-density={density} style={{ background: 'transparent' }}>
      {children}
    </div>
  )
}
