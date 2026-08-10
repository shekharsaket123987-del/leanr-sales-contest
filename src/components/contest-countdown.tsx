'use client'

import { useEffect, useState } from 'react'

// Contest window: 10–16 August 2026, IST. Deadline is end-of-day on the 16th.
const CONTEST_END = new Date('2026-08-16T23:59:59+05:30')
const LAST_DAY_YEAR = 2026
const LAST_DAY_MONTH = 8 // August
const LAST_DAY_DATE = 16

// Calendar date (Y/M/D) "now" in IST, independent of the viewer's own
// timezone — the day-vs-hour mode switch must be based on IST, not local time.
function istDateParts(date: Date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  return { y: Number(parts.year), mo: Number(parts.month), d: Number(parts.day) }
}

type CountdownState =
  | { mode: 'days'; daysLeft: number }
  | { mode: 'hours'; h: number; m: number; s: number }
  | { mode: 'ended' }

// Days 10–15 Aug (IST): whole-day countdown. Day of 16 Aug (IST): switches to
// a live HH:MM:SS countdown to the end-of-day deadline.
function computeState(now: Date): CountdownState {
  const msLeft = CONTEST_END.getTime() - now.getTime()
  if (msLeft <= 0) return { mode: 'ended' }

  const { y, mo, d } = istDateParts(now)
  const todayUTC = Date.UTC(y, mo - 1, d)
  const lastDayUTC = Date.UTC(LAST_DAY_YEAR, LAST_DAY_MONTH - 1, LAST_DAY_DATE)
  const daysLeft = Math.round((lastDayUTC - todayUTC) / 86_400_000)

  if (daysLeft >= 1) return { mode: 'days', daysLeft }

  const h = Math.floor(msLeft / 3_600_000)
  const m = Math.floor((msLeft % 3_600_000) / 60_000)
  const s = Math.floor((msLeft % 60_000) / 1000)
  return { mode: 'hours', h, m, s }
}

const pad = (n: number) => String(n).padStart(2, '0')

const badgeCls =
  'inline-flex items-center gap-1.5 rounded-full border border-leanr-yellow/50 bg-amber-50 px-3 py-1 text-xs font-semibold tabular-nums text-amber-800 dark:border-leanr-yellow/40 dark:bg-leanr-yellow/10 dark:text-leanr-yellow'

export default function ContestCountdown() {
  // null until mounted — avoids an SSR/client mismatch, since "now" only
  // exists client-side. First paint after mount fills it in.
  const [state, setState] = useState<CountdownState | null>(null)

  useEffect(() => {
    const tick = () => setState(computeState(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!state) return null

  if (state.mode === 'ended') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-leanr-border dark:bg-leanr-graphite dark:text-leanr-text-secondary">
        Contest ended
      </span>
    )
  }

  if (state.mode === 'days') {
    return (
      <span className={badgeCls}>
        ⏳ {state.daysLeft} day{state.daysLeft === 1 ? '' : 's'} left
      </span>
    )
  }

  return (
    <span className={badgeCls}>
      ⏳ {pad(state.h)}:{pad(state.m)}:{pad(state.s)} left — final day!
    </span>
  )
}
