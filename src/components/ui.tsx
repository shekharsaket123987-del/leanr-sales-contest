// Plain presentational components shared across the contest page (no client
// interactivity).

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-brand text-2xl font-bold tracking-wide text-zinc-900 dark:text-white">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-zinc-500 dark:text-leanr-text-secondary">{subtitle}</p>}
    </div>
  )
}

export function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-leanr-border-light bg-white p-4 dark:border-leanr-border dark:bg-leanr-card">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-leanr-text-secondary">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-leanr-yellow" aria-hidden="true" />
        {label}
      </div>
      <div className="font-brand mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500 dark:text-leanr-text-secondary">{sub}</div>}
    </div>
  )
}

export function Panel({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-xl border border-leanr-border-light bg-white p-4 dark:border-leanr-border dark:bg-leanr-card ${className}`}
    >
      <h2 className="font-brand mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
        {title}
      </h2>
      {children}
    </section>
  )
}
