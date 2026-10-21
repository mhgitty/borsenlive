import { fetchDayAverage, fmtDk, formatDkDate, localYmd, type PriceArea } from '@/lib/elpris-api'
import styles from './ElprisTopkort.module.css'

const ZONES: { city: string; zone: PriceArea }[] = [
  { city: 'København', zone: 'DK2' },
  { city: 'Århus', zone: 'DK1' },
  { city: 'Odense', zone: 'DK1' },
  { city: 'Esbjerg', zone: 'DK1' },
]

/** [elpris_topkort] — today's average spot/total price for 4 cities (DK1/DK2). No attributes. */
export async function ElprisTopkort() {
  const ymd = localYmd()
  const [dk1, dk2] = await Promise.all([fetchDayAverage('DK1', ymd), fetchDayAverage('DK2', ymd)])
  const prices = { DK1: dk1, DK2: dk2 }
  const cards = ZONES.filter((z) => prices[z.zone])

  return (
    <div className={styles.wrapper}>
      <div className={styles.date}>{formatDkDate(ymd)}</div>
      <div className={styles.cards}>
        {cards.map((z) => {
          const p = prices[z.zone]!
          return (
            <div key={z.city} className={styles.card}>
              <div className={styles.zone}>{z.zone}</div>
              <div>
                <div className={styles.city}>{z.city}</div>
                <div className={styles.spot}>Spotpris: {fmtDk(p.spot)} kr/kWh</div>
                <div className={styles.total}>Totalpris: {fmtDk(p.total)} kr/kWh</div>
              </div>
            </div>
          )
        })}
      </div>
      {cards.length === 0 && <p>Ingen elpriser tilgængelige.</p>}
    </div>
  )
}
