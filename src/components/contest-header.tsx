'use client'

import { useTheme } from '@/components/theme-provider'
import Logo from '@/components/logo'

// Standalone top bar for the public contest page — no LEANR sidebar/login here
// (see src/proxy.ts). Permanently black brand chrome (matches the Sidebar),
// independent of the light/dark toggle, which only affects the page content
// below it.
export default function ContestHeader() {
  const { toggle } = useTheme()
  return (
    <header className="border-b border-leanr-border bg-leanr-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
        <Logo height={24} />
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-leanr-card hover:text-white"
        >
          <span aria-hidden="true">
            <span className="dark:hidden">🌙</span>
            <span className="hidden dark:inline">☀️</span>
          </span>
        </button>
      </div>
    </header>
  )
}
