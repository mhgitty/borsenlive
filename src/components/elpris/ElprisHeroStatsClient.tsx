'use client'
import { useEffect, useState } from 'react'
import styles from './ElprisHeroStats.module.css'

type Area = 'DK1' | 'DK2'
type Pt = { h: number; p: number }
const fmt = (n: number) => n.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const hh = (h: number) => `kl. ${String(h).padStart(2, '0')}`
const hourNow = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
const avg = (a: Pt[]) => (a.length ? a.reduce((s, x) => s + x.p, 0) / a.length : 0)

export function ElprisHeroStatsClient({ today, tomorrow, defaultArea = 'DK1' }: { today: Record<Area, Pt[]>; tomorrow: Record<Area, Pt[]>; defaultArea?: Area }) {
  const [area, setArea] = useState<Area>(defaultArea)
  const [hour, setHour] = useState<number | null>(null)
  useEffect(() => { setHour(hourNow()); const t = setInterval(() => setHour(hourNow()), 60_000); return () => clearInterval(t) }, [])

  const day = today[area].length ? today[area] : today.DK1
  const tmr = tomorrow[area]
  const a = avg(day)
  const min = day.reduce((m, x) => (x.p < m.p ? x : m), day[0])
  const max = day.reduce((m, x) => (x.p > m.p ? x : m), day[0])
  const now = hour != null ? day.find((x) => x.h === hour) : undefined
  const level = now ? (now.p <= a * 0.9 ? 'low' : now.p >= a * 1.1 ? 'high' : 'mid') : 'mid'
  const top = Math.max(...day.map((x) => x.p), 0.01)
  const rest = hour != null ? day.filter((x) => x.h > hour) : []
  const nextCheap = rest.length ? rest.reduce((m, x) => (x.p < m.p ? x : m), rest[0]) : null

  return (
    <aside className={styles.panel} aria-label="Elprisen i dag">
      <div className={styles.head}>
        <span className={styles.live}><span className={styles.dot} />Elprisen {now ? 'lige nu' : 'i dag'}</span>
        <div className={styles.toggle} role="group" aria-label="Prisområde">
          {(['DK1', 'DK2'] as Area[]).map((x) => (
            <button key={x} type="button" aria-pressed={area === x} className={area === x ? styles.on : ''} onClick={() => setArea(x)}>{x === 'DK1' ? 'Vest' : 'Øst'}</button>
          ))}
        </div>
      </div>

      <div className={styles.now}>
        <strong>{fmt(now ? now.p : a)}</strong><span>kr./kWh</span>
        {now && <em className={styles[level]}>{level === 'low' ? 'Lav pris' : level === 'high' ? 'Høj pris' : 'Normal pris'}</em>}
      </div>
      <div className={styles.sub}>{now ? `${hh(now.h)}–${String((now.h + 1) % 24).padStart(2, '0')} · inkl. nettarif, afgifter og moms` : 'Dagens gennemsnit inkl. nettarif, afgifter og moms'}</div>

      <div className={styles.bars} aria-hidden="true">
        {day.map((x) => (
          <span key={x.h} title={`${hh(x.h)}: ${fmt(x.p)} kr.`}
            className={[x.h === hour ? styles.barNow : '', x.h === min.h ? styles.barMin : '', x.h === max.h ? styles.barMax : ''].join(' ')}
            style={{ height: `${Math.max(12, (x.p / top) * 100)}%` }} />
        ))}
      </div>
      <div className={styles.axis} aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>

      <dl className={styles.stats}>
        <div><dt>Billigste time</dt><dd>{fmt(min.p)} <small>{hh(min.h)}</small></dd></div>
        <div><dt>Dyreste time</dt><dd>{fmt(max.p)} <small>{hh(max.h)}</small></dd></div>
        <div><dt>Gennemsnit i dag</dt><dd>{fmt(a)} <small>kr./kWh</small></dd></div>
        <div>
          <dt>I morgen</dt>
          <dd>{tmr.length ? <>{fmt(avg(tmr))} <small>{avg(tmr) < a ? '▼ billigere' : '▲ dyrere'}</small></> : <small className={styles.pending}>Kommer ca. kl. 13</small>}</dd>
        </div>
      </dl>
      {nextCheap && nextCheap.h !== hour && (
        <p className={styles.tip}>Billigste tidspunkt resten af dagen er <b>{hh(nextCheap.h)}</b> til {fmt(nextCheap.p)} kr./kWh.</p>
      )}
    </aside>
  )
}
