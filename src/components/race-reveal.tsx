'use client'

import { useEffect, useState } from 'react'
import { SparkleRing } from '@/components/winner-celebration'
import type { RaceStatus } from '@/lib/sales-contest'

export type RaceLeader = { name: string; sub?: string; status: RaceStatus }

// Motivational "still racing" reveal — shown instead of a celebration when
// nobody has qualified yet. No confetti/trophy: this is encouragement, not a
// win. Self-closes via `onDone` after ~3.5s.
export default function RaceReveal({
  leader,
  onDone,
}: {
  leader: RaceLeader
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
      aria-label="The Race Is On"
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
        <div
          className="leanr-race-pulse text-6xl sm:text-7xl"
          style={{ filter: 'drop-shadow(0 0 16px rgba(255,237,0,0.5))' }}
          aria-hidden="true"
        >
          🚀
        </div>
        <h2
          className="font-brand mt-3 text-xl font-extrabold uppercase tracking-widest text-leanr-yellow sm:text-2xl"
          style={{ textShadow: '0 0 18px rgba(255,237,0,0.5)' }}
        >
          🚀 The Race Is On!
        </h2>

        <p className="font-brand mt-2 text-2xl font-bold text-white sm:text-3xl">{leader.name}</p>
        {leader.sub && <p className="text-sm text-leanr-text-secondary">{leader.sub}</p>}

        <p className="leanr-fade-up mt-4 text-base font-semibold text-white" style={{ animationDelay: '0.3s' }}>
          {leader.status.needLabel}
        </p>
        <p className="leanr-fade-up mt-3 text-sm italic text-leanr-text-secondary" style={{ animationDelay: '0.6s' }}>
          You&apos;re almost there — keep pushing! All the best! 💪
        </p>
      </div>
    </div>
  )
}
