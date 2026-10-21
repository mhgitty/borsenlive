/** Plain text from a Portable Text array (or pass-through for strings). */
export function ptToText(v: unknown): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (!Array.isArray(v)) return ''
  return v.map((b: any) => (b?.children || []).map((c: any) => c?.text || '').join('')).join(' ').replace(/\s+/g, ' ').trim()
}
