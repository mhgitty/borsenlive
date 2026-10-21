// Energi Data Service helpers for the elpris widgets (port of the WP plugin
// "Elpris Chart" v3). Uses the DayAheadPrices dataset (15-minute resolution,
// DayAheadPriceDKK in DKK/MWh), exactly like the PHP plugin did.
//
// All functions swallow network/parse errors and return empty/null results, so
// a pricing API outage never crashes a page.

export const ELPRIS_TZ = 'Europe/Copenhagen'
export const ELPRIS_REVALIDATE = 1800 // 30 min, same as the plugin's transients

export type PriceArea = 'DK1' | 'DK2'

/** Plugin formula: total price incl. tariffs/tax/VAT = (spot + 0.88) * 1.25 (kr/kWh). */
export const TARIFFS_EXCL_VAT = 0.88
export const VAT = 1.25
export function totalFromSpot(spot: number): number {
  return (spot + TARIFFS_EXCL_VAT) * VAT
}

export function normalizeArea(area?: string | null): PriceArea {
  const a = String(area || '').trim().toUpperCase()
  return a === 'DK1' ? 'DK1' : 'DK2'
}

export interface DayAheadRecord {
  TimeUTC: string
  TimeDK: string
  PriceArea: string
  DayAheadPriceDKK: number | null
  DayAheadPriceEUR?: number | null
}

export interface HourPrice {
  /** "kl. 07" */
  time: string
  hour: number
  /** Total price incl. tariffs + VAT, kr/kWh, rounded to 2 decimals */
  price: number
  /** Spot price, kr/kWh, rounded to 2 decimals */
  spot: number
}

// ─── Date helpers (Copenhagen local time) ────────────────────────────────────

const round2 = (n: number) => Math.round(n * 100) / 100

function tzParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ELPRIS_TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour') % 24, min: get('minute'), s: get('second') }
}

/** Today's date (or today + offsetDays) in Copenhagen as YYYY-MM-DD. */
export function localYmd(offsetDays = 0, now: Date = new Date()): string {
  const p = tzParts(now)
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d + offsetDays))
  return d.toISOString().slice(0, 10)
}

/** Current hour (0-23) in Copenhagen. */
export function nowHourDk(now: Date = new Date()): number {
  return tzParts(now).h
}

/**
 * start/end query params for one local Copenhagen day. Energi Data Service
 * interprets start/end in Danish local time (TimeDK) — verified against the
 * API: start=2026-10-21T00:00 returns TimeDK 00:00 as the first record. This is
 * also what the live WP site effectively sent (its timezone was UTC).
 */
export function apiRangeForLocalDay(ymd: string): { start: string; end: string } {
  const [y, m, d] = ymd.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
  return { start: `${ymd}T00:00`, end: `${next}T00:00` }
}

const MONTHS_DA = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']

/** "2026-10-21" → "21. oktober 2026" (WP date_i18n('j. F Y')). */
export function formatDkDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return `${d}. ${MONTHS_DA[m - 1]} ${y}`
}

/** PHP number_format($n, 2, '.', '') */
export const fmtDot = (n: number) => n.toFixed(2)
/** PHP number_format($n, 2, ',', '.') */
export function fmtDk(n: number, digits = 2): string {
  const [int, dec] = Math.abs(n).toFixed(digits).split('.')
  const withThousands = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (n < 0 ? '-' : '') + withThousands + (dec ? ',' + dec : '')
}

// ─── API ─────────────────────────────────────────────────────────────────────

export async function fetchDayAheadRecords(
  area: PriceArea, startIso: string, endIso: string, revalidate = ELPRIS_REVALIDATE,
): Promise<DayAheadRecord[]> {
  const filter = encodeURIComponent(JSON.stringify({ PriceArea: [area] }))
  const url = 'https://api.energidataservice.dk/dataset/DayAheadPrices'
    + `?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`
    + `&sort=TimeUTC%20ASC&filter=${filter}&limit=10000`
  try {
    const res = await fetch(url, { next: { revalidate, tags: ['elpris'] } })
    if (!res.ok) return []
    const json = (await res.json()) as { records?: DayAheadRecord[] }
    return Array.isArray(json?.records) ? json.records : []
  } catch {
    return []
  }
}

/** All 15-min records for one local day. */
export function fetchDayRecords(area: PriceArea, ymd: string = localYmd()): Promise<DayAheadRecord[]> {
  const { start, end } = apiRangeForLocalDay(ymd)
  return fetchDayAheadRecords(area, start, end)
}

/** Mean spot price in kr/kWh of a set of records, or null. */
export function avgSpot(records: DayAheadRecord[]): number | null {
  const spots = records
    .filter((r) => r.DayAheadPriceDKK != null && Number.isFinite(Number(r.DayAheadPriceDKK)))
    .map((r) => Number(r.DayAheadPriceDKK) / 1000)
  if (!spots.length) return null
  return spots.reduce((a, b) => a + b, 0) / spots.length
}

/**
 * 24 hourly prices for a local day (hours without data are skipped), each hour
 * = average of its 15-min points. Same logic as hente_dagens_elpriser().
 */
export function hourlyFromRecords(records: DayAheadRecord[]): HourPrice[] {
  const byHour = new Map<number, number[]>()
  for (const r of records) {
    if (!r.TimeDK || r.DayAheadPriceDKK == null) continue
    const hour = Number(r.TimeDK.slice(11, 13))
    if (!Number.isFinite(hour)) continue
    const arr = byHour.get(hour) ?? []
    arr.push(Number(r.DayAheadPriceDKK) / 1000)
    byHour.set(hour, arr)
  }
  const out: HourPrice[] = []
  for (let h = 0; h < 24; h++) {
    const arr = byHour.get(h)
    if (!arr?.length) continue
    const spot = arr.reduce((a, b) => a + b, 0) / arr.length
    out.push({ time: `kl. ${String(h).padStart(2, '0')}`, hour: h, price: round2(totalFromSpot(spot)), spot: round2(spot) })
  }
  return out
}

export async function fetchHourlyPrices(area: PriceArea, ymd: string = localYmd()): Promise<HourPrice[]> {
  return hourlyFromRecords(await fetchDayRecords(area, ymd))
}

/** Day average {spot,total} in kr/kWh (rounded to 2 decimals), or null. */
export async function fetchDayAverage(area: PriceArea, ymd: string = localYmd()): Promise<{ spot: number; total: number } | null> {
  const spot = avgSpot(await fetchDayRecords(area, ymd))
  if (spot == null) return null
  return { spot: round2(spot), total: round2(totalFromSpot(spot)) }
}

/** Average for the given hour's 15-min points (from an already-fetched day). */
export function hourAverageFromRecords(records: DayAheadRecord[], hour: number): { spot: number; total: number } | null {
  const spot = avgSpot(records.filter((r) => Number(r.TimeDK?.slice(11, 13)) === hour))
  if (spot == null) return null
  return { spot: round2(spot), total: round2(totalFromSpot(spot)) }
}

/** Today's average spot vs. the day `daysAgo` days before (calendar days). */
export async function fetchPriceDevelopment(area: PriceArea, daysAgo: number): Promise<{ diffPct: number; diffKr: number } | null> {
  const [nowRecs, thenRecs] = await Promise.all([fetchDayRecords(area, localYmd()), fetchDayRecords(area, localYmd(-daysAgo))])
  const avgNow = avgSpot(nowRecs)
  const avgThen = avgSpot(thenRecs)
  if (avgNow == null || avgThen == null) return null
  const diffKr = avgNow - avgThen
  const diffPct = avgThen !== 0 ? (diffKr / avgThen) * 100 : 0
  return { diffPct: round2(diffPct), diffKr: round2(diffKr) }
}

/** Price colour bucket used by the chart (±15 % around the day average). */
export function priceColor(price: number, avg: number): 'low' | 'mid' | 'high' {
  if (price <= avg * 0.85) return 'low'
  if (price >= avg * 1.15) return 'high'
  return 'mid'
}
