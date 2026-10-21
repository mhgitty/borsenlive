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
      <div className={styles.date}>Gennemsnitlig elpris i dag · {formatDkDate(ymd)}</div>
      <div className={styles.cards}>
        {cards.map((z) => {
          const p = prices[z.zone]!
          return (
            <div key={z.city} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.city}>{z.city}</span>
                <span className={styles.zone}>{z.zone}</span>
              </div>
              <div className={styles.label}>Totalpris</div>
              <div className={styles.total}>{fmtDk(p.total)}<span className={styles.unit}> kr/kWh</span></div>
              <div className={styles.spot}>Spotpris <span>{fmtDk(p.spot)} kr/kWh</span></div>
            </div>
          )
        })}
      </div>
      {cards.length === 0 && <p>Ingen elpriser tilgængelige.</p>}
    </div>
  )
}
