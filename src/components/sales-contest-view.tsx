'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { SalesContestData } from '@/lib/data'
import type { ContestCoachRow, ContestTeamRow, RaceCoach, RaceTeam } from '@/lib/sales-contest'
import {
  CONTEST_LABEL,
  INDIVIDUAL_QUALIFICATION,
  LEADER_QUALIFICATION,
  incentiveFor,
  qualifiedTopCoaches,
  qualifiedTopTeams,
  rankRaceCoaches,
  rankRaceTeams,
} from '@/lib/sales-contest'
import { formatINR } from '@/lib/format'
import { Kpi } from '@/components/ui'
import ContestCountdown from '@/components/contest-countdown'
import LiveNewsTicker from '@/components/live-news-ticker'
import WeeklySalesDriveBanner from '@/components/weekly-sales-drive-banner'
import TopIndividualsReveal from '@/components/top-individuals-reveal'
import TopLeaderReveal from '@/components/top-leader-reveal'
import RaceReveal from '@/components/race-reveal'
import RaceCard from '@/components/race-card'

// How long the dashboard sits idle between periodic winner/race reveals.
const IDLE_MS = 13_000

const MEDAL = ['🥇', '🥈', '🥉']
const RANK_STYLE = [
  'border-leanr-yellow bg-amber-50 dark:bg-leanr-yellow/10',
  'border-zinc-300 bg-zinc-50 dark:border-zinc-500/50 dark:bg-zinc-500/10',
  'border-orange-400 bg-orange-50 dark:border-orange-500/50 dark:bg-orange-500/10',
]

type PodiumItem = { name: string; sub: string; right?: { value: string; label: string } }

// Compact top-3 ranked list (poster-style "Individual Wise" / "Leader Wise"
// cards) — one medal row per rank, all three always visible together rather
// than switched behind a tab. `right` is omitted entirely for leaders (no
// figures shown, per the leader recognition-only display rule).
function TopThreeList({ items }: { items: PodiumItem[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((it, i) => (
        <li
          key={`${it.name}-${i}`}
          className={`flex items-center gap-3 rounded-xl border p-3 ${RANK_STYLE[i]}`}
        >
          <span className="text-xl leading-none" aria-hidden="true">
            {MEDAL[i]}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{it.name}</div>
            {it.sub && (
              <div className="truncate text-xs text-zinc-500 dark:text-leanr-text-secondary">{it.sub}</div>
            )}
          </div>
          {it.right && (
            <div className="shrink-0 text-right">
              <div className="font-brand text-sm font-bold text-leanr-yellow">{it.right.value}</div>
              <div className="text-[11px] text-zinc-500 dark:text-leanr-text-secondary">{it.right.label}</div>
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

// "Still in the race" strip — compact, sits below a qualified Top-3 list when
// some but not all have qualified (dashboard STATE 2/3).
function StillInRace({ label, items }: { label: string; items: { name: string; needLabel: string }[] }) {
  if (items.length === 0) return null
  return (
    <div className="mt-4 border-t border-leanr-border-light pt-3 dark:border-leanr-border">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-leanr-yellow">🚀 Still in the race</div>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.name} className="text-xs">
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">{r.name}</div>
            <div className="mt-0.5 font-semibold text-leanr-yellow">{r.needLabel}</div>
          </li>
        ))}
      </ul>
      <p className="sr-only">{label}</p>
    </div>
  )
}

// Champion spotlight — celebrates the qualified #1 individual performer when
// one exists; otherwise never shows an empty state, instead teasing the
// closest racer's progress.
function ChampionSpotlight({
  champion,
  closestRacer,
}: {
  champion: { name: string; sub: string; incentive: number } | undefined
  closestRacer: RaceCoach | undefined
}) {
  if (champion) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-leanr-yellow/40 bg-gradient-to-b from-amber-50 to-white p-6 text-center dark:border-leanr-yellow/30 dark:from-leanr-yellow/10 dark:to-transparent">
        <div className="text-4xl" aria-hidden="true">
          👑
        </div>
        <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-leanr-yellow">
          Top Performer
        </div>
        <div className="font-brand mt-2 text-xl font-bold text-zinc-900 dark:text-white">{champion.name}</div>
        {champion.sub && (
          <div className="text-xs text-zinc-500 dark:text-leanr-text-secondary">{champion.sub}</div>
        )}
        <div className="font-brand mt-3 text-2xl font-extrabold text-leanr-yellow">
          {formatINR(champion.incentive)}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-leanr-text-secondary">
          Incentive earned
        </div>
        <p className="mt-3 text-xs italic text-zinc-500 dark:text-leanr-text-secondary">
          One team. One vision. One LeanR!
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-leanr-yellow/40 bg-gradient-to-b from-amber-50 to-white p-6 text-center dark:border-leanr-yellow/30 dark:from-leanr-yellow/10 dark:to-transparent">
      <div className="text-4xl" aria-hidden="true">
        🚀
      </div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-leanr-yellow">
        The Race Is On
      </div>
      {closestRacer ? (
        <>
          <div className="font-brand mt-2 text-xl font-bold text-zinc-900 dark:text-white">{closestRacer.coach}</div>
          <div className="text-xs text-zinc-500 dark:text-leanr-text-secondary">{closestRacer.team}</div>
          <div className="mt-3 text-sm font-bold text-leanr-yellow">{closestRacer.status.needLabel}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-leanr-text-secondary">
            {closestRacer.status.statusTag}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-zinc-400 dark:text-leanr-text-secondary">
          Waiting for this week&apos;s first sale…
        </p>
      )}
      <p className="mt-3 text-xs italic text-zinc-500 dark:text-leanr-text-secondary">
        One team. One vision. One LeanR!
      </p>
    </div>
  )
}

function RankCell({ rank }: { rank: number | null }) {
  if (rank == null) return <span className="text-zinc-400 dark:text-zinc-600">—</span>
  if (rank <= 3) return <span className="text-base">{MEDAL[rank - 1]}</span>
  return <span className="font-semibold text-zinc-500 dark:text-leanr-text-secondary">#{rank}</span>
}

function CoachTable({ rows, incentiveOf }: { rows: ContestCoachRow[]; incentiveOf: (r: ContestCoachRow) => number }) {
  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-leanr-border-light text-left text-zinc-500 dark:border-leanr-border dark:text-leanr-text-secondary">
            <th className="py-2 pr-4 font-medium">Rank</th>
            <th className="py-2 pr-4 font-medium">Coach / Dietitian</th>
            <th className="py-2 pr-4 font-medium">Team</th>
            <th className="py-2 pr-4 text-right font-medium">Plans Sold</th>
            <th className="py-2 pr-4 text-right font-medium">Amount</th>
            <th className="py-2 text-right font-medium">Incentive</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const incentive = incentiveOf(r)
            return (
              <tr key={`${r.coach}-${i}`} className="border-b border-zinc-100 dark:border-leanr-border">
                <td className="py-2 pr-4">
                  <RankCell rank={r.rank} />
                </td>
                <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-white">{r.coach}</td>
                <td className="py-2 pr-4 text-zinc-600 dark:text-leanr-text-secondary">{r.team || '—'}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{r.plansSold.toLocaleString('en-IN')}</td>
                <td className="py-2 pr-4 text-right font-semibold tabular-nums text-zinc-900 dark:text-white">
                  {formatINR(r.amount)}
                </td>
                <td className="py-2 text-right font-semibold tabular-nums">
                  {incentive > 0 ? (
                    <span className="text-leanr-yellow">{formatINR(incentive)}</span>
                  ) : (
                    // Every row here comes from the "Top Coaches" tab, which by
                    // its own sheet formula only ever lists people who've
                    // already crossed BOTH thresholds — so a non-Top-3 row
                    // isn't "no data", it's "qualified, just not in the money".
                    <span className="whitespace-nowrap text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ✅ Eligibility Crossed
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TeamTable({ rows }: { rows: ContestTeamRow[] }) {
  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-leanr-border-light text-left text-zinc-500 dark:border-leanr-border dark:text-leanr-text-secondary">
            <th className="py-2 pr-4 font-medium">Rank</th>
            <th className="py-2 pr-4 font-medium">Team</th>
            <th className="py-2 pr-4 text-right font-medium">Plans Sold</th>
            <th className="py-2 pr-4 text-right font-medium">Amount</th>
            <th className="py-2 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.team}-${i}`} className="border-b border-zinc-100 dark:border-leanr-border">
              <td className="py-2 pr-4">
                <RankCell rank={r.rank} />
              </td>
              <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-white">{r.team}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.plansSold.toLocaleString('en-IN')}</td>
              <td className="py-2 pr-4 text-right font-semibold tabular-nums text-zinc-900 dark:text-white">
                {formatINR(r.amount)}
              </td>
              <td className="py-2 text-right">
                {/* Every row here comes from the "Top Leader" tab — already
                    fully qualified by definition. No incentive/revenue shown
                    for leaders (recognition only), just the status. */}
                <span className="whitespace-nowrap text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ✅ Eligibility Crossed
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Fallback full-roster table shown instead of the (qualified-only) coach/team
// tables when nobody has qualified yet — "Rank" becomes progress-toward-
// qualification instead of a leaderboard position, so the table is never
// empty this early in the week.
function RaceCoachTable({ rows }: { rows: RaceCoach[] }) {
  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-leanr-border-light text-left text-zinc-500 dark:border-leanr-border dark:text-leanr-text-secondary">
            <th className="py-2 pr-4 font-medium">Coach / Dietitian</th>
            <th className="py-2 pr-4 font-medium">Team</th>
            <th className="py-2 pr-4 text-right font-medium">Plans</th>
            <th className="py-2 pr-4 text-right font-medium">Sales</th>
            <th className="py-2 text-right font-medium">Still Needed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.coach}-${i}`} className="border-b border-zinc-100 dark:border-leanr-border">
              <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-white">{r.coach}</td>
              <td className="py-2 pr-4 text-zinc-600 dark:text-leanr-text-secondary">{r.team || '—'}</td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {r.plansSold}/{INDIVIDUAL_QUALIFICATION.minPayments}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatINR(r.amount)}</td>
              <td className="py-2 text-right font-semibold text-leanr-yellow">{r.status.needLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RaceTeamTable({ rows }: { rows: RaceTeam[] }) {
  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-leanr-border-light text-left text-zinc-500 dark:border-leanr-border dark:text-leanr-text-secondary">
            <th className="py-2 pr-4 font-medium">Team</th>
            <th className="py-2 pr-4 text-right font-medium">Plans</th>
            <th className="py-2 pr-4 text-right font-medium">Sales</th>
            <th className="py-2 text-right font-medium">Still Needed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.team}-${i}`} className="border-b border-zinc-100 dark:border-leanr-border">
              <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-white">{r.team}</td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {r.plansSold}/{LEADER_QUALIFICATION.minPayments}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatINR(r.amount)}</td>
              <td className="py-2 text-right font-semibold text-leanr-yellow">{r.status.needLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const FOOTER_CHIPS = [
  { icon: '🚀', label: 'Focus on goals' },
  { icon: '🏃', label: 'Stay consistent' },
  { icon: '⭐', label: 'Be exceptional' },
  { icon: '🏆', label: 'Be a LeanR champion' },
]

type Phase = 'dashboard' | 'individual' | 'leader'

export default function SalesContestView({ data }: { data: SalesContestData }) {
  const [table, setTable] = useState<'coach' | 'team'>('coach')
  const [search, setSearch] = useState('')
  const [phase, setPhase] = useState<Phase>('dashboard')
  const nextPhase = useRef<'individual' | 'leader'>('individual')

  // Qualification-gated winners — these drive the mini leaderboards, the
  // incentive table, and the periodic reveal animations, per the
  // weekly-drive rules (minimum payments + minimum sales; see
  // src/lib/sales-contest.ts). Individuals show incentive earned; leaders
  // show recognition only — no figures at all.
  const qualifiedCoaches = useMemo(() => qualifiedTopCoaches(data.coaches, 3), [data.coaches])
  const qualifiedTeams = useMemo(() => qualifiedTopTeams(data.teams, 3), [data.teams])
  const incentiveOf = useMemo(
    () => (r: ContestCoachRow) => incentiveFor(r, qualifiedCoaches),
    [qualifiedCoaches],
  )

  // "Race to qualification" — closest-first, for whenever the qualified
  // lists above are thin or empty. Never leaves the dashboard with nothing
  // to show.
  const raceCoaches = useMemo(() => rankRaceCoaches(data.raceCoaches), [data.raceCoaches])
  const raceTeams = useMemo(() => rankRaceTeams(data.raceTeams), [data.raceTeams])

  // Periodic reveal rotation: idle on the dashboard for IDLE_MS, then show
  // either a Top-3 Individual celebration (qualifiers exist) or a "race is
  // on" motivational reveal (nobody's qualified yet) — same for leaders —
  // back to idle, repeat, alternating for as long as the page stays open.
  useEffect(() => {
    if (phase !== 'dashboard') return
    const hasIndividual = qualifiedCoaches.length > 0 || raceCoaches.length > 0
    const hasLeader = qualifiedTeams.length > 0 || raceTeams.length > 0
    if (!hasIndividual && !hasLeader) return
    const t = setTimeout(() => {
      let candidate = nextPhase.current
      if (candidate === 'individual' && !hasIndividual) candidate = 'leader'
      else if (candidate === 'leader' && !hasLeader) candidate = 'individual'
      nextPhase.current = candidate === 'individual' ? 'leader' : 'individual'
      setPhase(candidate)
    }, IDLE_MS)
    return () => clearTimeout(t)
  }, [phase, qualifiedCoaches.length, qualifiedTeams.length, raceCoaches.length, raceTeams.length])

  const filteredCoaches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data.coaches
    return data.coaches.filter(
      (r) => r.coach.toLowerCase().includes(q) || r.team.toLowerCase().includes(q),
    )
  }, [data.coaches, search])

  const filteredRaceCoaches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return raceCoaches
    return raceCoaches.filter(
      (r) => r.coach.toLowerCase().includes(q) || r.team.toLowerCase().includes(q),
    )
  }, [raceCoaches, search])

  return (
    <>
      {phase === 'individual' &&
        (qualifiedCoaches.length > 0 ? (
          <TopIndividualsReveal
            winners={qualifiedCoaches.map((c) => ({ name: c.coach, sub: c.team, incentive: c.incentive }))}
            onDone={() => setPhase('dashboard')}
          />
        ) : (
          raceCoaches.length > 0 && (
            <RaceReveal
              kind="individual"
              leader={{ name: raceCoaches[0].coach, sub: raceCoaches[0].team, status: raceCoaches[0].status }}
              onDone={() => setPhase('dashboard')}
            />
          )
        ))}
      {phase === 'leader' &&
        (qualifiedTeams.length > 0 ? (
          <TopLeaderReveal
            leaders={qualifiedTeams.map((t) => ({ name: t.team }))}
            onDone={() => setPhase('dashboard')}
          />
        ) : (
          raceTeams.length > 0 && (
            <RaceReveal
              kind="leader"
              leader={{ name: raceTeams[0].team, status: raceTeams[0].status }}
              onDone={() => setPhase('dashboard')}
            />
          )
        ))}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-brand text-2xl font-bold tracking-wide text-zinc-900 dark:text-white">
            Weekly Top Performers
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-leanr-text-secondary">
            Celebrating consistency. Recognizing excellence. Building the LeanR legacy together!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ContestCountdown />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-leanr-yellow/50 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-leanr-yellow/40 dark:bg-leanr-yellow/10 dark:text-leanr-yellow">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leanr-yellow" />
            Live
          </span>
        </div>
      </div>

      <LiveNewsTicker />

      <WeeklySalesDriveBanner />

      {/* Filter-date + mission strip */}
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-leanr-border-light bg-white px-4 py-3 text-sm dark:border-leanr-border dark:bg-leanr-card">
        <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <span aria-hidden="true">📅</span>
          <span className="font-medium">Filter date:</span> {CONTEST_LABEL}
        </span>
        <span className="hidden h-4 w-px bg-leanr-border-light dark:bg-leanr-border sm:block" />
        <span className="flex items-center gap-2 text-zinc-500 dark:text-leanr-text-secondary">
          <span aria-hidden="true">🎯</span>
          One team. One goal. Maximum impact.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Total plans sold" value={data.summary.plans.toLocaleString('en-IN')} />
        <Kpi label="Total revenue" value={formatINR(data.summary.revenue)} />
        <Kpi label="Coaches competing" value={String(data.coaches.length + data.raceCoaches.length)} />
        <Kpi label="Teams competing" value={String(data.teams.length + data.raceTeams.length)} />
      </div>

      {/* Individual / Leader / Champion — side by side, always visible. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-leanr-border-light bg-white p-4 dark:border-leanr-border dark:bg-leanr-card">
          <h2 className="font-brand mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            {qualifiedCoaches.length > 0 ? (
              <>
                Individual Wise <span className="font-normal normal-case text-zinc-400 dark:text-leanr-text-secondary">(Coach / Dietitian)</span>
              </>
            ) : (
              '🚀 Race to Qualification'
            )}
          </h2>
          {qualifiedCoaches.length > 0 ? (
            <>
              <TopThreeList
                items={qualifiedCoaches.map((c) => ({
                  name: c.coach,
                  sub: c.team,
                  right: { value: formatINR(c.incentive), label: 'Incentive' },
                }))}
              />
              <StillInRace
                label="Unqualified coaches still racing for a Top 3 spot"
                items={raceCoaches.slice(0, 3).map((r) => ({ name: r.coach, needLabel: r.status.needLabel }))}
              />
            </>
          ) : raceCoaches.length > 0 ? (
            <div className="space-y-3">
              {raceCoaches.slice(0, 3).map((r) => (
                <RaceCard
                  key={r.coach}
                  name={r.coach}
                  sub={r.team}
                  plansSold={r.plansSold}
                  amount={r.amount}
                  minPlans={INDIVIDUAL_QUALIFICATION.minPayments}
                  minSales={INDIVIDUAL_QUALIFICATION.minSales}
                  status={r.status}
                />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-zinc-400 dark:text-leanr-text-secondary">
              Waiting for this week&apos;s first sale…
            </p>
          )}
        </section>

        <section className="rounded-xl border border-leanr-border-light bg-white p-4 dark:border-leanr-border dark:bg-leanr-card">
          <h2 className="font-brand mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            {qualifiedTeams.length > 0 ? (
              <>
                Leader Wise <span className="font-normal normal-case text-zinc-400 dark:text-leanr-text-secondary">(Team)</span>
              </>
            ) : (
              '🏆 Race to Leadership'
            )}
          </h2>
          {qualifiedTeams.length > 0 ? (
            <>
              <TopThreeList items={qualifiedTeams.map((t) => ({ name: t.team, sub: '' }))} />
              <StillInRace
                label="Unqualified teams still racing for top leader"
                items={raceTeams.slice(0, 3).map((t) => ({ name: t.team, needLabel: t.status.needLabel }))}
              />
            </>
          ) : raceTeams.length > 0 ? (
            <div className="space-y-3">
              {raceTeams.slice(0, 3).map((t) => (
                <RaceCard
                  key={t.team}
                  name={t.team}
                  plansSold={t.plansSold}
                  amount={t.amount}
                  minPlans={LEADER_QUALIFICATION.minPayments}
                  minSales={LEADER_QUALIFICATION.minSales}
                  status={t.status}
                />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-zinc-400 dark:text-leanr-text-secondary">
              Waiting for this week&apos;s first sale…
            </p>
          )}
        </section>

        <section className="rounded-xl border border-leanr-border-light bg-white p-4 dark:border-leanr-border dark:bg-leanr-card">
          <h2 className="font-brand mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            Overall Performance
          </h2>
          <ChampionSpotlight
            champion={
              qualifiedCoaches[0]
                ? { name: qualifiedCoaches[0].coach, sub: qualifiedCoaches[0].team, incentive: qualifiedCoaches[0].incentive }
                : undefined
            }
            closestRacer={raceCoaches[0]}
          />
        </section>
      </div>

      {/* Full ranked table — all coaches or all teams. Falls back to the race
          view (progress instead of rank) when nobody's qualified yet. */}
      <section className="mt-4 rounded-xl border border-leanr-border-light bg-white p-4 dark:border-leanr-border dark:bg-leanr-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-brand text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            {table === 'coach' && data.coaches.length === 0 && filteredRaceCoaches.length > 0 ? (
              <>🚀 Race to Qualification <span className="font-normal normal-case text-zinc-400 dark:text-leanr-text-secondary">— all coaches &amp; dietitians</span></>
            ) : table === 'team' && data.teams.length === 0 && raceTeams.length > 0 ? (
              <>🏆 Race to Leadership <span className="font-normal normal-case text-zinc-400 dark:text-leanr-text-secondary">— all teams</span></>
            ) : (
              <>Overall Performance <span className="font-normal normal-case text-zinc-400 dark:text-leanr-text-secondary">— all coaches &amp; dietitians</span></>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {(['coach', 'team'] as const).map((k) => {
              const on = table === k
              return (
                <button
                  key={k}
                  onClick={() => setTable(k)}
                  aria-pressed={on}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    on
                      ? 'bg-leanr-yellow text-leanr-black font-semibold'
                      : 'border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-leanr-border dark:text-zinc-300 dark:hover:bg-leanr-graphite'
                  }`}
                >
                  {k === 'coach' ? 'All coaches' : 'All teams'}
                </button>
              )
            })}
          </div>
        </div>

        {table === 'coach' && (
          <div className="mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coach or team…"
              className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-leanr-yellow focus:outline-none dark:border-leanr-border dark:bg-leanr-graphite dark:text-white"
            />
          </div>
        )}

        {table === 'coach' ? (
          filteredCoaches.length > 0 ? (
            <CoachTable rows={filteredCoaches} incentiveOf={incentiveOf} />
          ) : filteredRaceCoaches.length > 0 ? (
            <RaceCoachTable rows={filteredRaceCoaches} />
          ) : (
            <p className="py-6 text-center text-sm text-zinc-400 dark:text-leanr-text-secondary">No coaches found.</p>
          )
        ) : data.teams.length > 0 ? (
          <TeamTable rows={data.teams} />
        ) : raceTeams.length > 0 ? (
          <RaceTeamTable rows={raceTeams} />
        ) : (
          <p className="py-6 text-center text-sm text-zinc-400 dark:text-leanr-text-secondary">No teams found.</p>
        )}
      </section>

      {/* Motivational footer — poster-style tagline chips, no live data. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-xl border border-leanr-border-light bg-white px-4 py-3 dark:border-leanr-border dark:bg-leanr-card">
        {FOOTER_CHIPS.map((c) => (
          <span key={c.label} className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <span aria-hidden="true">{c.icon}</span>
            {c.label}
          </span>
        ))}
      </div>
      <p className="mt-3 text-center font-brand text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-leanr-text-secondary">
        Together we grow. Together we win.
      </p>
      <p className="mt-1 text-center text-xs italic text-zinc-400 dark:text-leanr-text-secondary">
        Focus. Perform. Win. Grow with LeanR.
      </p>

      <p className="mt-3 text-xs text-zinc-400 dark:text-leanr-text-secondary">
        Source: <span className="font-medium">Top Coaches</span>, <span className="font-medium">Top Leader</span>,{' '}
        <span className="font-medium">Raw-Coach</span> and <span className="font-medium">Raw-Leader</span> tabs —
        updated live from the contest sheet on every page load.
      </p>
    </>
  )
}
