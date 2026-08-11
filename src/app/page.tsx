import { getSalesContestData } from '@/lib/data'
import { PageHeader, Panel } from '@/components/ui'
import SalesContestView from '@/components/sales-contest-view'
import ContestHeader from '@/components/contest-header'

export const dynamic = 'force-dynamic'

export default async function SalesContestPage() {
  const data = await getSalesContestData()
  // Only the true "nothing anywhere" case falls back to the placeholder —
  // SalesContestView itself handles "nobody's qualified yet" via the race
  // system, so race-only data should still render the full page.
  const empty =
    !data.coaches.length && !data.teams.length && !data.raceCoaches.length && !data.raceTeams.length

  return (
    <div className="min-h-screen">
      <ContestHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
        {empty ? (
          <>
            <PageHeader
              title="Weekly Top Performers"
              subtitle="10–16 August · Live leaderboard for coaches, dietitians & teams"
            />
            <Panel title="No contest data yet">
              <p className="text-sm text-zinc-500 dark:text-leanr-text-secondary">
                Once sales land in the{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-leanr-graphite">Top Coaches</code> and{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-leanr-graphite">Top Leader</code> tabs
                of the contest sheet, the leaderboard will appear here automatically.
              </p>
            </Panel>
          </>
        ) : (
          <SalesContestView data={data} />
        )}
      </main>
    </div>
  )
}
