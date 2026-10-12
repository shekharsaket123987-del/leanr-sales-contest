'use client'

import { useEffect, useState } from 'react'
import { CONTEST_LABEL } from '@/lib/sales-contest'
import { SparkleRing } from '@/components/winner-celebration'

// Recognition only — no rank/name figures, no incentive, no revenue. Per the
// leader display rule this section exists purely to celebrate, not to report
// numbers (those live in the Overall Performance table instead).
export type LeaderWinner = { name: string }

const MEDALS = ['🥇', '🥈', '🥉']

// Lighter, "subtle recognition" reveal for the Top Performing Leader(s) —
// deliberately smaller and shorter than the individual celebration (no
// sequential build-up, no confetti burst), matching the brief's distinction
// between the two moments. Self-closes via `onDone` after ~3.5s.
export default function TopLeaderReveal({
  leaders, // up to 3, ranked — [1st, 2nd, 3rd]
  onDone,
}: {
  leaders: LeaderWinner[]
  onDone: () => void
}) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 3000)
    const doneTimer = setTimeout(onDone, 3500)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      role="dialog"
      aria-label="Top Performing Leader"
      onClick={onDone}
      className={`fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-hidden bg-black/85 px-6 text-center backdrop-blur-sm transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <SparkleRing />

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDone()
        }}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xl text-zinc-400 hover:bg-white/10 hover:text-white"
      >
        ×
      </button>

      <div className="leanr-fade-up relative flex flex-col items-center">
        <p className="font-brand text-xs font-bold uppercase tracking-[0.3em] text-leanr-text-secondary">
          {CONTEST_LABEL}
        </p>
        <div
          className="leanr-trophy-pop mt-2 text-6xl sm:text-7xl"
          style={{ filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.6))' }}
          aria-hidden="true"
        >
          🏆
        </div>
        <h2
          className="font-brand mt-3 text-xl font-extrabold uppercase tracking-widest text-leanr-yellow sm:text-2xl"
          style={{ textShadow: '0 0 18px rgba(255,237,0,0.5)' }}
        >
          Top Performing Leader{leaders.length > 1 ? 's' : ''}
        </h2>

        <div className="leanr-fade-up mt-5 flex flex-col items-center gap-2" style={{ animationDelay: '0.4s' }}>
          {leaders.map((l, i) => (
            <div key={`${l.name}-${i}`} className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">{MEDALS[i]}</span>
              <span className="font-brand text-2xl font-bold text-white sm:text-3xl">{l.name}</span>
            </div>
          ))}
        </div>

        <p className="leanr-fade-up mt-4 text-xs italic text-leanr-text-secondary" style={{ animationDelay: '0.7s' }}>
          Lead from the front. Motivate your team.
        </p>
      </div>
    </div>
  )
}
