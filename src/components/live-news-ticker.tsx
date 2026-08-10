'use client'

function Sep() {
  return (
    <span className="mx-5 text-leanr-yellow/40" aria-hidden="true">
      |
    </span>
  )
}

// Continuous right-to-left news ticker (TV-news broadcast style), permanently
// running while the page is open. Seamless loop via the classic "duplicate
// the content, scroll exactly one copy-width" CSS trick — no JS-driven
// reset, no visible jump. Hover pauses it (desktop) so it's readable on
// demand. Fixed, short queue by design — LIVE badge, drive title, date.
export default function LiveNewsTicker() {
  const queue = (
    <>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.6)]" aria-hidden="true" />
        <span className="font-extrabold text-white">LIVE</span>
      </span>
      <Sep />
      <span className="font-brand font-extrabold text-leanr-yellow">🚀 LEANR WEEKLY SALES DRIVE</span>
      <Sep />
      <span className="font-bold text-white">10 AUGUST – 16 AUGUST</span>
      <Sep />
    </>
  )

  return (
    <div
      className="leanr-ticker-glow relative mb-4 h-14 overflow-hidden border-y-2 border-leanr-yellow/70 bg-leanr-bg sm:h-16 md:h-[72px]"
      role="marquee"
      aria-label="Live weekly sales drive announcements"
    >
      <div className="leanr-ticker-track flex h-full w-max items-center whitespace-nowrap text-base font-semibold leading-none hover:[animation-play-state:paused] sm:text-lg md:text-xl">
        <div className="flex items-center px-4">{queue}</div>
        <div className="flex items-center px-4" aria-hidden="true">
          {queue}
        </div>
      </div>
    </div>
  )
}
