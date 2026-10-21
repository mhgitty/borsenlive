import { avgSpot, fetchDayRecords, formatDkDate, hourAverageFromRecords, localYmd, nowHourDk, totalFromSpot } from '@/lib/elpris-api'
import { ElprisTableClient, type AreaPrices } from './ElprisTableClient'

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * [elpris_dag] → <ElprisTable type="day" />  (today's average, DK1 + DK2)
 * [elpris_nu]  → <ElprisTable type="now" />  (current hour, DK1 + DK2)
 *
 * For "now" all 24 hourly averages are sent to the client, which picks the
 * current Copenhagen hour — so cached HTML never shows a stale hour.
 */
export async function ElprisTable({ type = 'day' }: { type?: 'day' | 'now' }) {
  const ymd = localYmd()
  const [r1, r2] = await Promise.all([fetchDayRecords('DK1', ymd), fetchDayRecords('DK2', ymd)])

  if (type === 'now') {
    const hours: Record<number, { DK1: AreaPrices | null; DK2: AreaPrices | null }> = {}
    for (let h = 0; h < 24; h++) hours[h] = { DK1: hourAverageFromRecords(r1, h), DK2: hourAverageFromRecords(r2, h) }
    return <ElprisTableClient mode="now" ymd={ymd} hours={hours} serverHour={nowHourDk()} />
  }

  const day = (recs: typeof r1): AreaPrices | null => {
    const s = avgSpot(recs)
    return s == null ? null : { spot: round2(s), total: round2(totalFromSpot(s)) }
  }
  return <ElprisTableClient mode="day" ymd={ymd} title={`Elpriser i dag (${formatDkDate(ymd)}) for Danmarks 2 elområder:`} day={{ DK1: day(r1), DK2: day(r2) }} />
}

/** [elpris_dag] */
export const ElprisDag = () => <ElprisTable type="day" />
/** [elpris_nu] */
export const ElprisNu = () => <ElprisTable type="now" />
