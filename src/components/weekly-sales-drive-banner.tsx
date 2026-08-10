import { CONTEST_LABEL, INDIVIDUAL_INCENTIVES, INDIVIDUAL_QUALIFICATION } from '@/lib/sales-contest'
import { formatINR } from '@/lib/format'
import { SparkleRing } from '@/components/winner-celebration'

const MEDALS = ['🥇 1st', '🥈 2nd', '🥉 3rd']

// Persistent (non-rotating) promotional card for the individual weekly
// drive — Swiggy/Zomato-style advertisement banner, always visible below the
// ticker. Purely informational/static; the qualification numbers come from
// the same constants that gate the incentive table and winner reveals, so
// this can never drift out of sync with them.
export default function WeeklySalesDriveBanner() {
  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl border border-leanr-yellow/40 bg-gradient-to-br from-leanr-bg via-leanr-card to-leanr-bg p-5 shadow-[0_0_30px_-10px_rgba(255,237,0,0.5)] sm:p-6">
      {/* Dynamic diagonal shapes + gold particles — subtle, ambient. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          background: 'repeating-linear-gradient(115deg, #FFED00 0, #FFED00 2px, transparent 2px, transparent 44px)',
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-leanr-yellow/10 blur-2xl" aria-hidden="true" />
      <SparkleRing />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl" aria-hidden="true">🚀</span>
            <div>
              <h2 className="font-brand text-2xl font-extrabold uppercase tracking-wide text-leanr-yellow sm:text-3xl" style={{ textShadow: '0 0 18px rgba(255,237,0,0.4)' }}>
                Weekly Sales Drive
              </h2>
              <p className="text-sm font-semibold text-white">{CONTEST_LABEL.toUpperCase()}</p>
            </div>
          </div>
          <p className="mt-3 max-w-md text-sm text-zinc-300">
            Your opportunity to boost your earnings alongside your regular incentives.
          </p>

          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-widest text-leanr-text-secondary">
              Qualification Criteria <span className="text-leanr-yellow">— Weekly Top Coaches (Individual Basis)</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <span className="rounded-full border border-leanr-yellow/40 bg-leanr-yellow/10 px-3 py-1 text-xs font-semibold text-leanr-yellow">
                ✓ Minimum {INDIVIDUAL_QUALIFICATION.minPayments} Payments
              </span>
              <span className="rounded-full border border-leanr-yellow/40 bg-leanr-yellow/10 px-3 py-1 text-xs font-semibold text-leanr-yellow">
                ✓ Minimum {formatINR(INDIVIDUAL_QUALIFICATION.minSales)} Total Sales
              </span>
            </div>
            <p className="mt-2 text-xs italic text-zinc-400">
              Meet <span className="font-bold text-white not-italic">BOTH</span> criteria to qualify for the Top 3 Individual Incentives.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <div className="text-center text-xs font-bold uppercase tracking-widest text-leanr-text-secondary lg:text-left">
            💰 Incentive Opportunity
          </div>
          <div className="mt-2 flex gap-3">
            {INDIVIDUAL_INCENTIVES.map((amt, i) => (
              <div
                key={i}
                className={`rounded-xl border px-4 py-3 text-center ${
                  i === 0 ? 'border-leanr-yellow bg-leanr-yellow/10' : 'border-leanr-border bg-leanr-graphite'
                }`}
              >
                <div className="text-[11px] font-medium text-zinc-400">{MEDALS[i]}</div>
                <div className="font-brand mt-0.5 text-lg font-extrabold text-white sm:text-xl">{formatINR(amt)}</div>
              </div>
            ))}
          </div>
          <p className="font-brand mt-3 text-center text-xs font-bold uppercase tracking-widest text-leanr-yellow lg:text-left">
            Meet the criteria. Make the Top 3.
          </p>
        </div>
      </div>
    </div>
  )
}
