import { readRange } from '@/lib/google/sheets'
import {
  CONTEST_SPREADSHEET_ID,
  parseContestCoachSheet,
  parseContestSummarySheet,
  parseContestTeamSheet,
  parseRaceCoachSheet,
  parseRaceTeamSheet,
  type ContestCoachRow,
  type ContestSummary,
  type ContestTeamRow,
  type RaceCoachRow,
  type RaceTeamRow,
} from '@/lib/sales-contest'

export type SalesContestData = {
  coaches: ContestCoachRow[]
  teams: ContestTeamRow[]
  summary: ContestSummary
  raceCoaches: RaceCoachRow[]
  raceTeams: RaceTeamRow[]
}

const EMPTY_CONTEST_DATA: SalesContestData = {
  coaches: [],
  teams: [],
  summary: { revenue: 0, plans: 0 },
  raceCoaches: [],
  raceTeams: [],
}

// Contest leaderboard (qualified coaches/teams, race-to-qualification
// candidates, and summary totals), read live from the contest spreadsheet
// (SHEET_CONTEST_ID) on every page load — no database, no caching, just a
// direct Sheets API read via the service account.
export async function getSalesContestData(): Promise<SalesContestData> {
  if (!CONTEST_SPREADSHEET_ID) return EMPTY_CONTEST_DATA
  try {
    const [coachValues, teamValues, summaryValues, raceCoachValues, raceTeamValues] = await Promise.all([
      readRange(CONTEST_SPREADSHEET_ID, "'Top Coaches'!A1:I60"),
      readRange(CONTEST_SPREADSHEET_ID, "'Top Leader'!A1:F20"),
      readRange(CONTEST_SPREADSHEET_ID, "'Total Revenue'!A1:B2"),
      readRange(CONTEST_SPREADSHEET_ID, "'Raw-Coach'!A1:D60"),
      readRange(CONTEST_SPREADSHEET_ID, "'Raw-Leader'!A1:C20"),
    ])
    return {
      coaches: parseContestCoachSheet(coachValues),
      teams: parseContestTeamSheet(teamValues),
      summary: parseContestSummarySheet(summaryValues),
      raceCoaches: parseRaceCoachSheet(raceCoachValues),
      raceTeams: parseRaceTeamSheet(raceTeamValues),
    }
  } catch {
    return EMPTY_CONTEST_DATA
  }
}
