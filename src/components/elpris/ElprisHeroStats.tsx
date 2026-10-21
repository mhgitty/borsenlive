import { fetchHourlyPrices, localYmd } from '@/lib/elpris-api'
import { ElprisHeroStatsClient } from './ElprisHeroStatsClient'

/** Live price panel for the hero of elpris pages (today + tomorrow, Vest/Øst). */
export async function ElprisHeroStats({ area = 'DK1' }: { area?: 'DK1' | 'DK2' }) {
  const [dk1, dk2, dk1t, dk2t] = await Promise.all([
    fetchHourlyPrices('DK1').catch(() => []),
    fetchHourlyPrices('DK2').catch(() => []),
    fetchHourlyPrices('DK1', localYmd(1)).catch(() => []),
    fetchHourlyPrices('DK2', localYmd(1)).catch(() => []),
  ])
  if (!dk1.length && !dk2.length) return null
  const pick = (a: { hour: number; price: number }[]) => a.map((h) => ({ h: h.hour, p: h.price }))
  return <ElprisHeroStatsClient today={{ DK1: pick(dk1), DK2: pick(dk2) }} tomorrow={{ DK1: pick(dk1t), DK2: pick(dk2t) }} defaultArea={area} />
}

const ELPRIS_WIDGETS = new Set(['elprisChart', 'elprisTopkort', 'elprisDag', 'elprisNu', 'elprisPrisudvikling'])
/** Price area of the first live elpris widget in a page body, or null when there is none. */
export function elprisArea(body?: any[] | null, title = ''): 'DK1' | 'DK2' | null {
  const w = body?.find((b) => b?._type === 'widgetBlock' && ELPRIS_WIDGETS.has(b.widget))
  if (!w) return null
  const a = String(w.area || '').toUpperCase()
  if (a === 'DK1' || a === 'DK2') return a
  return /\bDK2\b|østdanmark|sjælland|københavn|bornholm/i.test(title) ? 'DK2' : 'DK1'
}
