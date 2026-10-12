'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { formatINR } from '@/lib/format'

export type Champion = { name: string; sub: string; plansSold: number; amount: number }

// Gold/white/off-white only — matches the confetti to the brand, no rainbow.
const COLORS = ['#FFD700', '#FFED00', '#FFFFFF', '#F5C400', '#FFF6B0']

const rand = (min: number, max: number) => min + Math.random() * (max - min)

type Particle = {
  id: number
  side: 'left' | 'right'
  bottom: number
  tx: number
  ty: number
  rot: number
  width: number
  height: number
  color: string
  delay: number
  duration: number
}

// Two symmetric bursts (left + right edge, alternating) rather than a single
// top-down rain, per the "confetti burst from both sides" brief.
export function makeConfettiParticles(count: number): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < count; i++) {
    const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right'
    const dir = side === 'left' ? 1 : -1
    out.push({
      id: i,
      side,
      bottom: rand(5, 35),
      tx: dir * rand(35, 95),
      ty: rand(-70, 10),
      rot: rand(360, 1080) * (Math.random() < 0.5 ? -1 : 1),
      width: rand(6, 12),
      height: rand(3, 6),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: rand(0, 0.5),
      duration: rand(2.2, 3.2),
    })
  }
  return out
}

// Shared confetti layer — reused by both the single-winner spotlight below
// and the sequential Top-3 reveal (top-individuals-reveal.tsx).
export function ConfettiBurst({ count = 70 }: { count?: number }) {
  const particles = useMemo(() => makeConfettiParticles(count), [count])
  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((p) => (
        <span
          key={p.id}
          className="leanr-confetti-piece absolute"
          style={
            {
              [p.side]: '-2%',
              bottom: `${p.bottom}%`,
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              '--tx': `${p.tx}vw`,
              '--ty': `${p.ty}vh`,
              '--rot': `${p.rot}deg`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

const SPARKLE_POSITIONS = [
  { top: '2%', left: '15%' },
  { top: '8%', left: '82%' },
  { top: '52%', left: '3%' },
  { top: '58%', left: '92%' },
  { top: '-4%', left: '48%' },
  { top: '72%', left: '28%' },
  { top: '68%', left: '68%' },
  { top: '32%', left: '96%' },
]

// Sparkle ring — also shared with the Top-3 reveal's final (#1) step.
export function SparkleRing() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {SPARKLE_POSITIONS.map((s, i) => (
        <span
          key={i}
          className="leanr-sparkle absolute text-leanr-yellow"
          style={{ top: s.top, left: s.left, animationDelay: `${i * 0.15}s` }}
          aria-hidden="true"
        >
          ✨
        </span>
      ))}
    </div>
  )
}

// Premium, brand-matched victory overlay: trophy pop + sparkles + a
// gold/white confetti burst from both edges + the winner's stats fading in.
// Mounted only when triggered and self-removes via `onDone` after ~4s — never
// loops or runs in the background. Reused for both the "Weekly Champion"
// (top individual) and "Top Leader" reveals — `heading` / `incentive` vary.
export default function WinnerCelebration({
  champion,
  heading = '🏆 Weekly Champion',
  incentive,
  onDone,
}: {
  champion: Champion
  heading?: string
  incentive?: number
  onDone: () => void
}) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 3800)
    const doneTimer = setTimeout(onDone, 4300)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      role="dialog"
      aria-label={heading}
      onClick={onDone}
      className={`fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-hidden bg-black/90 backdrop-blur-sm transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <ConfettiBurst />

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

      <div className="relative flex flex-col items-center px-6 text-center">
        <SparkleRing />

        <div
          className="leanr-trophy-pop text-7xl sm:text-8xl"
          style={{ filter: 'drop-shadow(0 0 24px rgba(255,215,0,0.7))' }}
          aria-hidden="true"
        >
          🏆
        </div>

        <h2
          className="leanr-fade-up font-brand mt-4 text-2xl font-extrabold uppercase tracking-widest text-leanr-yellow sm:text-3xl"
          style={{ animationDelay: '0.5s', textShadow: '0 0 20px rgba(255,215,0,0.6)' }}
        >
          {heading}
        </h2>

        <div className="leanr-fade-up mt-3" style={{ animationDelay: '0.8s' }}>
          <div className="font-brand text-3xl font-bold text-white sm:text-4xl">{champion.name}</div>
          {champion.sub && <div className="mt-1 text-sm text-leanr-text-secondary">{champion.sub}</div>}
        </div>

        <div className="leanr-fade-up mt-5 flex items-center gap-6" style={{ animationDelay: '1.1s' }}>
          <div>
            <div className="font-brand text-2xl font-extrabold text-leanr-yellow">{champion.plansSold}</div>
            <div className="text-xs uppercase tracking-wide text-leanr-text-secondary">Plans sold</div>
          </div>
          <div className="h-8 w-px bg-leanr-border" aria-hidden="true" />
          <div>
            <div className="font-brand text-2xl font-extrabold text-leanr-yellow">{formatINR(champion.amount)}</div>
            <div className="text-xs uppercase tracking-wide text-leanr-text-secondary">Revenue</div>
          </div>
        </div>

        {incentive != null && incentive > 0 && (
          <div
            className="leanr-fade-up mt-4 rounded-full border border-leanr-yellow/40 bg-leanr-yellow/10 px-4 py-1.5 text-sm font-bold text-leanr-yellow"
            style={{ animationDelay: '1.4s' }}
          >
            🎁 {formatINR(incentive)} incentive
          </div>
        )}
      </div>
    </div>
  )
}
