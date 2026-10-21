// Data for the electricity comparison list — a 1:1 port of the WordPress
// plugin "Elselskab Compare" (includes/class-elselskab-compare.php).
//
//   total kr/kWh = raw spot (last month's average, energidataservice.dk)
//                + kWh-tillæg (sheet col C)
//                + abonnement (sheet col D, kr/md) × 12 / yearly kWh
//                + netselskab (N1 vest / Radius øst, incl. net-abo per kWh)
//                + Energinet (transmission + system + yearly abo per kWh)
//                + staten
//
// Prices live in the Google Sheet tab "Elselskaber"; edits show up within 30 min.

import { cache } from 'react'
import { fetchSheetRows, parseDkNumber, reviewHref } from './sheet'
import { fetchDayAheadRecords, type PriceArea } from './elpris-api'

import { REFERENCE_KWH_ANNUAL, priceFor, type ElselskabProvider } from './elselskab-price'
export * from './elselskab-price'

// ── Sheet ─────────────────────────────────────────────────────────────────────
//  A name · B cta slug · C kWh tillæg · D abonnement kr/md · E logo · F produkt
//  G kampagne · H anmeldelse (review slug) · I introtilbud (Ja/Nej) · J promo (x)
export const getElselskabProviders = cache(async (): Promise<ElselskabProvider[]> => {
  const rows = await fetchSheetRows('Elselskaber')
  const out: ElselskabProvider[] = []
  rows.forEach((c, i) => {
    const name = c[0] || ''
    const ctaSlug = c[1] || ''
    if (!name || !ctaSlug) return
    const logoBase = (c[4] || '').replace(/\.(webp|png|jpe?g|svg)$/i, '')
    out.push({
      key: `${ctaSlug.toLowerCase()}_${i}`,
      name,
      ctaSlug,
      kwhTillaeg: parseDkNumber(c[2]),
      aboMonthly: parseDkNumber(c[3]),
      logo: logoBase ? `/elselskaber/logos/${logoBase}.webp` : null,
      title: c[5] || name,
      campaign: c[6] || '',
      reviewUrl: reviewHref(c[7]),
      intro: (c[8] || '').toLowerCase() === 'ja',
      promo: (c[9] || '').toLowerCase() === 'x',
    })
  })
  return out
})

// ── Raw spot price: last calendar month's average (Copenhagen time) ───────────
function lastMonthRange(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit' }).formatToParts(now)
  const y = Number(parts.find((p) => p.type === 'year')!.value)
  const m = Number(parts.find((p) => p.type === 'month')!.value) // 1-12, current month
  const pad = (n: number) => String(n).padStart(2, '0')
  const prevY = m === 1 ? y - 1 : y
  const prevM = m === 1 ? 12 : m - 1
  return { start: `${prevY}-${pad(prevM)}-01T00:00`, end: `${y}-${pad(m)}-01T00:00` }
}

export const getRawPrice = cache(async (area: PriceArea): Promise<number> => {
  const { start, end } = lastMonthRange()
  const records = await fetchDayAheadRecords(area, start, end, 3600)
  const vals = records.map((r) => Number(r.DayAheadPriceDKK)).filter((v) => Number.isFinite(v))
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length / 1000
})

export interface CompareData {
  providers: ElselskabProvider[]
  raw: Record<PriceArea, number>
}

export const getCompareData = cache(async (): Promise<CompareData> => {
  const [providers, dk1, dk2] = await Promise.all([getElselskabProviders(), getRawPrice('DK1'), getRawPrice('DK2')])
  return { providers, raw: { DK1: dk1, DK2: dk2 } }
})

/** For inline text prices: [elpris provider="dcc" area="DK1"] / [elpris_month ...]. */
export async function inlinePrice(opts: { provider: string; area?: string; decimals?: number; kind?: 'kwh' | 'month' }): Promise<string> {
  const area: PriceArea = String(opts.area || 'DK1').toUpperCase() === 'DK2' ? 'DK2' : 'DK1'
  const { providers, raw } = await getCompareData()
  const slug = opts.provider.trim().toLowerCase()
  const p = providers.find((x) => x.ctaSlug.toLowerCase() === slug)
  if (!p) return ''
  const price = priceFor(p, raw[area], area)
  if (opts.kind === 'month') {
    return new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(Math.round(price.monthly))
  }
  const d = Math.max(0, opts.decimals ?? 2)
  return new Intl.NumberFormat('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d }).format(price.total)
}
