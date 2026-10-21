import { fetchHourlyPrices, localYmd, normalizeArea, nowHourDk } from '@/lib/elpris-api'
import { ElprisChartClient } from './ElprisChartClient'

/**
 * [elpris_chart area="DK1|DK2"] — today's hourly electricity price (bar chart)
 * with Vest/Øst and Totalpris/Spotpris toggles. Default area DK2 (Øst).
 * Both areas are fetched server-side so the toggles switch instantly.
 */
export async function ElprisChart({ area }: { area?: string }) {
  const ymd = localYmd()
  const [dk1, dk2] = await Promise.all([fetchHourlyPrices('DK1', ymd), fetchHourlyPrices('DK2', ymd)])
  if (!dk1.length && !dk2.length) return <p>Ingen elpriser tilgængelige.</p>
  return <ElprisChartClient data={{ DK1: dk1, DK2: dk2 }} ymd={ymd} initialArea={normalizeArea(area)} serverHour={nowHourDk()} />
}
