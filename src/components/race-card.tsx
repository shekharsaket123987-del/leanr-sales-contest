import { formatINR } from '@/lib/format'
import type { RaceStatus } from '@/lib/sales-contest'

function ProgressBar({ pct, complete }: { pct: number; complete: boolean }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-leanr-border/60">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${complete ? 'bg-leanr-yellow' : 'bg-leanr-yellow/60'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// Premium "race to qualification" progress card — one per unqualified
// coach/dietitian or team, showing exactly how close they are and exactly
// what's left, rather than a plain table row.
export default function RaceCard({
  name,
  sub,
  plansSold,
  amount,
  minPlans,
  minSales,
  status,
}: {
  name: string
  sub?: string
  plansSold: number
  amount: number
  minPlans: number
  minSales: number
  status: RaceStatus
}) {
  return (
    <div className="rounded-2xl border border-leanr-yellow/30 bg-leanr-card p-4 text-left shadow-[0_0_16px_-8px_rgba(255,237,0,0.4)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-brand truncate text-base font-bold text-white">{name}</div>
          {sub && <div className="truncate text-xs text-leanr-text-secondary">{sub}</div>}
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full border border-leanr-yellow/40 bg-leanr-yellow/10 px-2.5 py-1 text-[11px] font-bold text-leanr-yellow">
          {status.statusTag}
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-leanr-text-secondary">
            <span>Plan sold</span>
            <span className="text-white">
              {plansSold} / {minPlans}
            </span>
          </div>
          <ProgressBar pct={status.planProgress} complete={status.plansNeeded === 0} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-leanr-text-secondary">
            <span>Sales</span>
            <span className="text-white">
              {formatINR(amount)} / {formatINR(minSales)}
            </span>
          </div>
          <ProgressBar pct={status.salesProgress} complete={status.salesNeeded === 0} />
        </div>
      </div>

      <p className="font-brand mt-3 text-sm font-bold text-white">{status.needLabel}</p>
    </div>
  )
}
