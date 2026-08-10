import { readRange } from '@/lib/google/sheets'
import {
  CONTEST_SPREADSHEET_ID,
  parseContestCoachSheet,
  parseContestSummarySheet,
  parseContestTeamSheet,
  type ContestCoachRow,
  type ContestSummary,
  type ContestTeamRow,
} from '@/lib/sales-contest'

export type SalesContestData = {
  coaches: ContestCoachRow[]
  teams: ContestTeamRow[]
  summary: ContestSummary
}

const EMPTY_CONTEST_SUMMARY: ContestSummary = { revenue: 0, plans: 0 }

// Contest leaderboard (coaches + teams + summary totals), read live from the
// contest spreadsheet (SHEET_CONTEST_ID) on every page load — no database,
// no caching, just a direct Sheets API read via the service account.
export async function getSalesContestData(): Promise<SalesContestData> {
  if (!CONTEST_SPREADSHEET_ID) return { coaches: [], teams: [], summary: EMPTY_CONTEST_SUMMARY }
  try {
    const [coachValues, teamValues, summaryValues] = await Promise.all([
      readRange(CONTEST_SPREADSHEET_ID, "'Top Coaches'!A1:I60"),
      readRange(CONTEST_SPREADSHEET_ID, "'Top Leader'!A1:F20"),
      readRange(CONTEST_SPREADSHEET_ID, "'Total Revenue'!A1:B2"),
    ])
    return {
      coaches: parseContestCoachSheet(coachValues),
      teams: parseContestTeamSheet(teamValues),
      summary: parseContestSummarySheet(summaryValues),
    }
  } catch {
    return { coaches: [], teams: [], summary: EMPTY_CONTEST_SUMMARY }
  }
}
