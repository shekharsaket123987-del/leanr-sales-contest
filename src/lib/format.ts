export function formatINR(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}
