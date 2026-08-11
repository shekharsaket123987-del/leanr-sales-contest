// Parser + types for the "10th–16th August" sales-contest spreadsheet — a
// separate sheet (SHEET_CONTEST_ID) from the main LeanR sheet, dedicated to a
// week-long coach/dietitian sales contest. Five tabs are read live:
//
//   'Top Coaches' — one row per already-qualified coach/dietitian, ranked.
//     A Team | B Coach/Dietitian | C Plan Sold | D Payment Amount | ... | I Rank
//
//   'Top Leader' — one row per already-qualified team, ranked.
//     A Team | B Total Plan Sold | C Plan Amount | ... | F Rank
//
//   'Total Revenue' — single summary row (A2 revenue, B2 plan count), the
//     canonical totals for the KPI cards (independent of the leaderboards
//     above, which only list ranked/non-zero rows).
//
//   'Raw-Coach' / 'Raw-Leader' — coaches/teams who have NOT yet cleared both
//     qualification thresholds, for the "race to qualification" views (see
//     below). Columns documented next to their parsers further down.
//
// All are formula-driven off a raw sales log in the same spreadsheet, so they
// update live as sales are entered during the contest — we just re-read them
// on every page load (no Postgres mirror).

import type { CellValue } from '@/lib/google/sheets'

export const CONTEST_SPREADSHEET_ID = process.env.SHEET_CONTEST_ID ?? ''
export const CONTEST_LABEL = '10–16 August'

export type ContestCoachRow = {
  team: string
  coach: string // 'Name ECODE' as entered on the sheet (code kept visible)
  plansSold: number
  amount: number
  rank: number | null
}

export type ContestTeamRow = {
  team: string
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

// 'Top Leader' tab (row 0 = header). Rows without a team name are dropped.
export function parseContestTeamSheet(values: CellValue[][]): ContestTeamRow[] {
  const out: ContestTeamRow[] = []
  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? []
    const team = String(row[0] ?? '').trim()
    if (!team) continue
    out.push({
      team,
      plansSold: num(row[1]),
      amount: num(row[2]),
      rank: rankOf(row[5]),
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
// Business rules given directly by Fitelo (not derived from the sheet). Two
// separate tiers — individual (coach/dietitian) and leader (team) — each with
// its own qualification bar and payout.
//
// NOTE on "payments": the contest sheet only gives us a plan-sold COUNT per
// coach/team, not a separate transaction count, so plansSold stands in for
// payments here. If Fitelo tracks payments as a number distinct from plans
// sold, point this at that column instead.
export const INDIVIDUAL_QUALIFICATION = { minPayments: 2, minSales: 25_000 }
export const LEADER_QUALIFICATION = { minPayments: 6, minSales: 60_000 }
export const INDIVIDUAL_INCENTIVES = [2000, 1500, 1000] // 1st, 2nd, 3rd
export const LEADER_INCENTIVE = 2000

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

export type QualifiedTeam = ContestTeamRow & { incentive: number }

// Top N qualified teams for the "Top Performing Leaders" recognition display
// — only the #1 (index 0) actually carries the flat incentive; 2nd/3rd are
// shown for recognition only (the leader drive pays one winner, not a tier).
export function qualifiedTopTeams(rows: ContestTeamRow[], n = 3): QualifiedTeam[] {
  return rows
    .filter((r) => qualifies(r, LEADER_QUALIFICATION))
    .slice(0, n)
    .map((r, i) => ({ ...r, incentive: i === 0 ? LEADER_INCENTIVE : 0 }))
}

// The single qualified top team — the leader drive pays one flat incentive,
// not a 1st/2nd/3rd tier.
export function qualifiedTopTeam(rows: ContestTeamRow[]): QualifiedTeam | undefined {
  return qualifiedTopTeams(rows, 1)[0]
}

// Per-row incentive for the "Overall Performance" table — 0 unless this coach
// is a qualified top-3 individual.
export function incentiveFor(coach: ContestCoachRow, qualified: QualifiedCoach[]): number {
  return qualified.find((q) => q.coach === coach.coach)?.incentive ?? 0
}

// ---------- Race to qualification ----------
// 'Raw-Coach' / 'Raw-Leader' tabs list people/teams who have NOT yet cleared
// BOTH thresholds (the sheet's own QUERY filters on "below both"). We only
// read the raw plan/sales numbers from these tabs and compute progress/need
// ourselves — more robust than trusting the sheet's own precomputed "need"
// columns, and it means the math here is guaranteed consistent with the
// qualification bars above.
//
//   'Raw-Coach': A Team | B Coach/Dietitian | C Plan Sold | D Payment Amount
//   'Raw-Leader': A Team | B Plan Sold | C Payment Amount

export type RaceCoachRow = { team: string; coach: string; plansSold: number; amount: number }
export type RaceTeamRow = { team: string; plansSold: number; amount: number }

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

export function parseRaceTeamSheet(values: CellValue[][]): RaceTeamRow[] {
  const out: RaceTeamRow[] = []
  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? []
    const team = String(row[0] ?? '').trim()
    if (!team) continue
    out.push({ team, plansSold: num(row[1]), amount: num(row[2]) })
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
export type RaceTeam = RaceTeamRow & { status: RaceStatus }

// Unqualified individuals, closest-to-qualifying first. Anyone who (despite
// appearing in the "not yet qualified" sheet) already meets both bars is
// excluded defensively — they belong in the qualified list instead.
export function rankRaceCoaches(rows: RaceCoachRow[]): RaceCoach[] {
  return rows
    .map((r) => ({ ...r, status: computeRaceStatus(r.plansSold, r.amount, INDIVIDUAL_QUALIFICATION) }))
    .filter((r) => r.status.score < 1)
    .sort((a, b) => b.status.score - a.status.score)
}

export function rankRaceTeams(rows: RaceTeamRow[]): RaceTeam[] {
  return rows
    .map((r) => ({ ...r, status: computeRaceStatus(r.plansSold, r.amount, LEADER_QUALIFICATION) }))
    .filter((r) => r.status.score < 1)
    .sort((a, b) => b.status.score - a.status.score)
}
