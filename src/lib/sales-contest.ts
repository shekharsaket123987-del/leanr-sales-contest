// Parser + types for the "8th–14th September" sales-contest spreadsheet — a
// separate sheet (SHEET_CONTEST_ID) from the main LeanR sheet, dedicated to a
// week-long coach/dietitian sales contest. Individual basis only — every
// coach/dietitian competes on their own, there is no team/leader leaderboard.
// Three tabs are read live:
//
//   'Top Coaches' — one row per already-qualified coach/dietitian, ranked.
//     A Team | B Coach/Dietitian | C Plan Sold | D Payment Amount | ... | I Rank
//
//   'Total Revenue' — single summary row (A2 revenue, B2 plan count), the
//     canonical totals for the KPI cards (independent of the leaderboard
//     above, which only lists ranked/non-zero rows).
//
//   'Raw-Coach' — coaches/dietitians who have NOT yet cleared both
//     qualification thresholds, for the "race to qualification" view (see
//     below). Columns documented next to its parser further down.
//
// All are formula-driven off a raw sales log in the same spreadsheet, so they
// update live as sales are entered during the contest — we just re-read them
// on every page load (no Postgres mirror).

import type { CellValue } from '@/lib/google/sheets'

export const CONTEST_SPREADSHEET_ID = process.env.SHEET_CONTEST_ID ?? ''
export const CONTEST_LABEL = '8–14 September'

export type ContestCoachRow = {
  team: string
  coach: string // 'Name ECODE' as entered on the sheet (code kept visible)
  plansSold: number
  amount: number
  rank: number | null
}

const num = (v: CellValue): number => {
  const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const rankOf = (v: CellValue): number | null => {
  const n = Number(v)
  return v !== '' && v != null && Number.isFinite(n) ? n : null
}

const byRankThenAmount = (a: { rank: number | null; amount: number }, b: { rank: number | null; amount: number }) =>
  (a.rank ?? Infinity) - (b.rank ?? Infinity) || b.amount - a.amount

// 'Top Coaches' tab (row 0 = header). Rows without a coach name are blank
// leaderboard slots (rank formulas with no data yet) and are dropped.
export function parseContestCoachSheet(values: CellValue[][]): ContestCoachRow[] {
  const out: ContestCoachRow[] = []
  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? []
    const coach = String(row[1] ?? '').trim()
    if (!coach) continue
    out.push({
      team: String(row[0] ?? '').trim(),
      coach, // full 'Name ECODE' — employee code kept visible per contest request
      plansSold: num(row[2]),
      amount: num(row[3]),
      rank: rankOf(row[8]),
    })
  }
  return out.sort(byRankThenAmount)
}

// Top N entries with real sales (drops zero-amount rows so a leaderboard of
// all-zero placeholders doesn't render as a fake podium).
export function topEntries<T extends { amount: number }>(rows: T[], n = 3): T[] {
  return rows.filter((r) => r.amount > 0).slice(0, n)
}

export type ContestSummary = { revenue: number; plans: number }

// 'Total Revenue' tab: row 0 = header ('Total Revenue' | 'Total Plan'), row 1
// (A2/B2) = the values themselves.
export function parseContestSummarySheet(values: CellValue[][]): ContestSummary {
  const row = values[1] ?? []
  return { revenue: num(row[0]), plans: num(row[1]) }
}

// ---------- Weekly-drive qualification & incentives ----------
// Business rules given directly by Fitelo (not derived from the sheet).
// Individual (coach/dietitian) basis only.
export const INDIVIDUAL_QUALIFICATION = { minPayments: 2, minSales: 25_000 }
export const INDIVIDUAL_INCENTIVES = [3000, 2500, 2000] // 1st, 2nd, 3rd

function qualifies(
  r: { plansSold: number; amount: number },
  bar: { minPayments: number; minSales: number },
): boolean {
  return r.plansSold >= bar.minPayments && r.amount >= bar.minSales
}

export type QualifiedCoach = ContestCoachRow & { incentive: number }

// Top N *qualified* individuals (rows already arrive sorted by amount desc
// from parseContestCoachSheet), each carrying its incentive payout.
export function qualifiedTopCoaches(rows: ContestCoachRow[], n = 3): QualifiedCoach[] {
  return rows
    .filter((r) => qualifies(r, INDIVIDUAL_QUALIFICATION))
    .slice(0, n)
    .map((r, i) => ({ ...r, incentive: INDIVIDUAL_INCENTIVES[i] ?? 0 }))
}

// Per-row incentive for the "Overall Performance" table — 0 unless this coach
// is a qualified top-3 individual.
export function incentiveFor(coach: ContestCoachRow, qualified: QualifiedCoach[]): number {
  return qualified.find((q) => q.coach === coach.coach)?.incentive ?? 0
}

// ---------- Race to qualification ----------
// 'Raw-Coach' tab lists coaches/dietitians who have NOT yet cleared BOTH
// thresholds (the sheet's own QUERY filters on "below both"). We only read
// the raw plan/sales numbers from this tab and compute progress/need
// ourselves — more robust than trusting the sheet's own precomputed "need"
// columns, and it means the math here is guaranteed consistent with the
// qualification bar above.
//
//   'Raw-Coach': A Team | B Coach/Dietitian | C Plan Sold | D Payment Amount

export type RaceCoachRow = { team: string; coach: string; plansSold: number; amount: number }

export function parseRaceCoachSheet(values: CellValue[][]): RaceCoachRow[] {
  const out: RaceCoachRow[] = []
  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? []
    const coach = String(row[1] ?? '').trim()
    if (!coach) continue
    out.push({ team: String(row[0] ?? '').trim(), coach, plansSold: num(row[2]), amount: num(row[3]) })
  }
  return out
}

export type RaceStatus = {
  planProgress: number // 0-100, capped
  salesProgress: number // 0-100, capped
  plansNeeded: number // 0 once met
  salesNeeded: number // 0 once met
  score: number // 0-1 average of capped fractions — higher = closer to qualifying
  needLabel: string // exact "what's left" message
  statusTag: string // encouragement badge
}

export function computeRaceStatus(
  plansSold: number,
  amount: number,
  bar: { minPayments: number; minSales: number },
): RaceStatus {
  const planFrac = plansSold / bar.minPayments
  const salesFrac = amount / bar.minSales
  const planProgress = Math.min(planFrac, 1) * 100
  const salesProgress = Math.min(salesFrac, 1) * 100
  const plansNeeded = Math.max(0, bar.minPayments - plansSold)
  const salesNeeded = Math.max(0, bar.minSales - amount)
  const score = (Math.min(planFrac, 1) + Math.min(salesFrac, 1)) / 2

  const plansLabel = `${plansNeeded} more plan${plansNeeded === 1 ? '' : 's'}`
  const salesLabel = `₹${salesNeeded.toLocaleString('en-IN')} more sales`

  let needLabel: string
  if (plansNeeded === 0 && salesNeeded === 0) needLabel = '🏆 Qualified — now competing for Top 3'
  else if (plansNeeded > 0 && salesNeeded > 0) needLabel = `🔥 ${plansLabel} + ${salesLabel} needed`
  else if (salesNeeded > 0) needLabel = `💰 ${salesLabel} needed`
  else needLabel = `📦 ${plansLabel} needed`

  let statusTag: string
  if (plansNeeded === 0 && salesNeeded === 0) statusTag = '🏆 Qualified — Top 3 race'
  else if (plansNeeded === 0 || salesNeeded === 0) statusTag = '⚡ One step away'
  else if (score >= 0.7) statusTag = '🔥 Almost there!'
  else statusTag = '🚀 Keep pushing'

  return { planProgress, salesProgress, plansNeeded, salesNeeded, score, needLabel, statusTag }
}

export type RaceCoach = RaceCoachRow & { status: RaceStatus }

// Unqualified individuals, closest-to-qualifying first. Anyone who (despite
// appearing in the "not yet qualified" sheet) already meets both bars is
// excluded defensively — they belong in the qualified list instead.
export function rankRaceCoaches(rows: RaceCoachRow[]): RaceCoach[] {
  return rows
    .map((r) => ({ ...r, status: computeRaceStatus(r.plansSold, r.amount, INDIVIDUAL_QUALIFICATION) }))
    .filter((r) => r.status.score < 1)
    .sort((a, b) => b.status.score - a.status.score)
}
