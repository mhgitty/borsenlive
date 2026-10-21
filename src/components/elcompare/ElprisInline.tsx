import { inlinePrice } from '@/lib/elselskab-compare'

/** Inline live price in body text — replaces [elpris ...] and [elpris_month ...]. */
export async function ElprisInline({ value }: { value: { provider?: string; area?: string; decimals?: number; kind?: 'kwh' | 'month' } }) {
  if (!value?.provider) return null
  const txt = await inlinePrice({ provider: value.provider, area: value.area, decimals: value.decimals, kind: value.kind })
  return <>{txt}</>
}
