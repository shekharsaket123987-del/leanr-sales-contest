import { DashboardSkeleton } from '@/components/skeletons'

// Sales contest: filter-tab bar, 4 KPIs, a podium panel, one leaderboard table.
export default function Loading() {
  return <DashboardSkeleton kpis={4} panels={1} table />
}
