import { fetchPriceDevelopment, normalizeArea } from '@/lib/elpris-api'
import styles from './ElprisPrisudvikling.module.css'

const PERIODS: { label: string; days: number }[] = [
  { label: 'I dag vs. i går', days: 1 },
  { label: 'Seneste uge', days: 7 },
  { label: 'Seneste måned', days: 30 },
  { label: 'I år', days: 365 },
]

/** PHP echoes the rounded float as-is: 12.5 → "12.5", -3 → "-3". */
const phpNum = (n: number) => String(n)

/**
 * [elpris_prisudvikling] — today's average spot price vs. 1/7/30/365 days ago.
 * The plugin hard-coded DK2; `area` is an optional extension (default DK2).
 */
export async function ElprisPrisudvikling({ area }: { area?: string }) {
  const a = normalizeArea(area)
  const results = await Promise.all(PERIODS.map(async (p) => ({ ...p, data: await fetchPriceDevelopment(a, p.days) })))
  const shown = results.filter((r) => r.data)

  return (
    <div className={styles.wrapper}>
      <div className={styles.cards}>
        {shown.map(({ label, data }) => {
          const d = data!
          const down = d.diffPct < 0
          return (
            <div key={label} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.label}>{label}</span>
                <span className={`${styles.icon} ${down ? styles.iconDown : styles.iconUp}`} role="img" aria-label={down ? 'Faldende' : 'Stigende'}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
              </div>
              <div className={`${styles.pct} ${down ? styles.down : styles.up}`}>{d.diffPct > 0 ? '+' : ''}{phpNum(d.diffPct)} %</div>
              <div className={styles.diff}>{d.diffKr > 0 ? '+' : ''}{phpNum(d.diffKr)} kr/kWh</div>
            </div>
          )
        })}
      </div>
      {shown.length === 0 && <p>Ingen elpriser tilgængelige.</p>}
    </div>
  )
}
