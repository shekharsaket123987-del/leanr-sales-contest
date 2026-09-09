import { readRange } from '@/lib/google/sheets'
import {
  CONTEST_SPREADSHEET_ID,
  parseContestCoachSheet,
  parseContestSummarySheet,
  parseRaceCoachSheet,
  type ContestCoachRow,
  type ContestSummary,
  type RaceCoachRow,
} from '@/lib/sales-contest'

export type SalesContestData = {
  coaches: ContestCoachRow[]
  summary: ContestSummary
  raceCoaches: RaceCoachRow[]
}

const EMPTY_CONTEST_DATA: SalesContestData = {
  coaches: [],
  summary: { revenue: 0, plans: 0 },
  raceCoaches: [],
}

// Contest leaderboard (qualified coaches/dietitians, race-to-qualification
// candidates, and summary totals), read live from the contest spreadsheet
// (SHEET_CONTEST_ID) on every page load — no database, no caching, just a
// direct Sheets API read via the service account. Individual basis only.
export async function getSalesContestData(): Promise<SalesContestData> {
  if (!CONTEST_SPREADSHEET_ID) return EMPTY_CONTEST_DATA
  try {
    const [coachValues, summaryValues, raceCoachValues] = await Promise.all([
      readRange(CONTEST_SPREADSHEET_ID, "'Top Coaches'!A1:I60"),
      readRange(CONTEST_SPREADSHEET_ID, "'Total Revenue'!A1:B2"),
      readRange(CONTEST_SPREADSHEET_ID, "'Raw-Coach'!A1:D60"),
    ])
    return {
      coaches: parseContestCoachSheet(coachValues),
      summary: parseContestSummarySheet(summaryValues),
      raceCoaches: parseRaceCoachSheet(raceCoachValues),
    }
  } catch {
    return EMPTY_CONTEST_DATA
  }
}
