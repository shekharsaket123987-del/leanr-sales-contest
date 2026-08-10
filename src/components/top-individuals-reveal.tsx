'use client'

import { useEffect, useState } from 'react'
import { formatINR } from '@/lib/format'
import { CONTEST_LABEL } from '@/lib/sales-contest'
import { ConfettiBurst, SparkleRing } from '@/components/winner-celebration'

// No sales amount / revenue field here by design — the individual reveal is
// recognition + incentive only, per the weekly-drive display rules (the full
// figures still live in the Overall Performance table).
export type RevealWinner = { name: string; sub: string; incentive: number }

type Step = 'intro' | 'third' | 'second' | 'first' | 'leaving'
const ORDER: Step[] = ['intro', 'third', 'second', 'first', 'leaving']
const STEP_MS: Record<Step, number> = { intro: 800, third: 900, second: 900, first: 1700, leaving: 400 }

const RANK_STYLE: Record<'first' | 'second' | 'third', string> = {
  first: 'border-leanr-yellow bg-leanr-yellow/10 scale-105',
  second: 'border-zinc-400 bg-white/5',
  third: 'border-orange-400 bg-orange-400/10',
}
const RANK_MEDAL: Record<'first' | 'second' | 'third', string> = { first: '🥇', second: '🥈', third: '🥉' }

function PodiumCard({
  rank,
  winner,
  visible,
}: {
  rank: 'first' | 'second' | 'third'
  winner: RevealWinner
  visible: boolean
}) {
  return (
    <div
      className={`w-40 shrink-0 rounded-2xl border-2 p-4 text-center transition-all duration-500 sm:w-48 ${
        RANK_STYLE[rank]
      } ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${rank === 'first' ? 'leanr-trophy-pop' : ''}`}
    >
      <div className="text-3xl leading-none" aria-hidden="true">
        {RANK_MEDAL[rank]}
      </div>
      <div className="font-brand mt-2 truncate text-base font-bold text-white">{winner.name}</div>
      {winner.sub && <div className="truncate text-xs text-leanr-text-secondary">{winner.sub}</div>}
      <div className="font-brand mt-3 text-xl font-extrabold text-leanr-yellow">{formatINR(winner.incentive)}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-leanr-text-secondary">Incentive earned</div>
    </div>
  )
}

// Sequential podium reveal (darken → #3 bronze → #2 silver → #1 gold with
// confetti) for the qualified Top-3 individual performers. Self-closes via
// `onDone`; total runtime ~4.9s across the four steps.
export default function TopIndividualsReveal({
  winners, // [1st, 2nd, 3rd] — may have fewer than 3 entries
  onDone,
}: {
  winners: RevealWinner[]
  onDone: () => void
}) {
  const [step, setStep] = useState<Step>('intro')

  useEffect(() => {
    const idx = ORDER.indexOf(step)
    const t = setTimeout(
      () => (idx === ORDER.length - 1 ? onDone() : setStep(ORDER[idx + 1])),
      STEP_MS[step],
    )
    return () => clearTimeout(t)
  }, [step, onDone])

  const [first, second, third] = winners
  const thirdVisible = step === 'third' || step === 'second' || step === 'first'
  const secondVisible = step === 'second' || step === 'first'
  const firstVisible = step === 'first'

  return (
    <div
      role="dialog"
      aria-label="Weekly Top 3 Individual Performers"
      onClick={onDone}
      className={`fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-black/90 px-6 text-center backdrop-blur-sm transition-opacity duration-500 ${
        step === 'leaving' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {firstVisible && (
        <>
          <ConfettiBurst />
          <SparkleRing />
        </>
      )}

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

      <div className="leanr-fade-up relative">
        <p className="font-brand text-xs font-bold uppercase tracking-[0.3em] text-leanr-text-secondary">
          {CONTEST_LABEL}
        </p>
        <h2
          className="font-brand mt-1 text-xl font-extrabold uppercase tracking-widest text-leanr-yellow sm:text-2xl"
          style={{ textShadow: '0 0 20px rgba(255,237,0,0.5)' }}
        >
          🏆 Weekly Top 3 Individual Performers
        </h2>
        {step === 'intro' && <p className="mt-4 text-sm text-zinc-300">🚀 Counting down the podium…</p>}
        {firstVisible && (
          <p
            className="leanr-fade-up mt-3 font-brand text-sm font-extrabold uppercase tracking-[0.25em] text-white"
            style={{ animationDelay: '0.2s' }}
          >
            🏆 Weekly Champion
          </p>
        )}
      </div>

      {(third || second || first) && (
        <div className="relative mt-8 flex flex-wrap items-end justify-center gap-4">
          {second && <PodiumCard rank="second" winner={second} visible={secondVisible} />}
          {first && <PodiumCard rank="first" winner={first} visible={firstVisible} />}
          {third && <PodiumCard rank="third" winner={third} visible={thirdVisible} />}
        </div>
      )}
    </div>
  )
}
