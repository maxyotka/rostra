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

/** Корень системы: тема, плотность и режим окна для поддерева. */
export const Rostra = forwardRef<HTMLDivElement, RostraProps>(function Rostra(
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
 * Обёртка содержимого портала. Слой рендерится в конец body, вне .rs,
 * поэтому токены темы до него не доходят — здесь они ставятся заново.
 */
export function LayerScope({ children }: { children: ReactNode }) {
  const { theme, density } = useRostraTheme()
  return (
    <div className="rs" data-theme={theme} data-density={density} style={{ background: 'transparent' }}>
      {children}
    </div>
  )
}
