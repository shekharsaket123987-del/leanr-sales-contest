'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'

// Inline script string run in <head> before first paint so the stored theme is
// applied before the browser renders — prevents a theme flash on reload. Kept
// in sync with the lazy initializer below (both read THEME_STORAGE_KEY).
// Dark is the default (the LeanR brand identity is black + electric yellow) —
// only an explicit saved "light" choice opts out.
export const NO_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light")document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}})()`

type ThemeContextValue = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy init reads the same key as NO_FLASH_SCRIPT, so React's state always
  // matches the class the script already set on <html> — no hydration mismatch.
  // Dark is the default; only an explicit saved "light" choice opts out.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // localStorage can be unavailable (private mode); theme still works for the session.
    }
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
