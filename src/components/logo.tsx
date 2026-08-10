import Image from 'next/image'

// Official LEANR by Fitelo wordmark (public/brand/leanr-logo-crop.png — the
// source logo cropped tight to its visible content, black bg preserved). This
// is the single source of truth for the brand mark across the app; do not
// recreate it as styled text.
export default function Logo({ className = '', height = 28 }: { className?: string; height?: number }) {
  const width = Math.round(height * (727 / 254))
  return (
    <Image
      src="/brand/leanr-logo-crop.png"
      alt="LEANR by Fitelo"
      width={width}
      height={height}
      priority
      className={`h-auto shrink-0 ${className}`}
      style={{ height, width: 'auto' }}
    />
  )
}
