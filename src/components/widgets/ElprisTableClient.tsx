'use client'
import { useEffect, useState } from 'react'
import { fmtDk, localYmd, nowHourDk } from '@/lib/elpris-api'
import styles from './ElprisTable.module.css'

export interface AreaPrices { spot: number; total: number }
type Pair = { DK1: AreaPrices | null; DK2: AreaPrices | null }

type Props =
  | { mode: 'day'; ymd: string; title: string; day: Pair }
  | { mode: 'now'; ymd: string; hours: Record<number, Pair>; serverHour: number }

const pad = (h: number) => String(h).padStart(2, '0')

export function ElprisTableClient(props: Props) {
  const [hour, setHour] = useState<number>(props.mode === 'now' ? props.serverHour : 0)
  const [stale, setStale] = useState(false)
  useEffect(() => {
    if (props.mode !== 'now') return
    const tick = () => { setHour(nowHourDk()); setStale(localYmd() !== props.ymd) }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [props.mode, props.ymd])

  const pair: Pair = props.mode === 'day' ? props.day : props.hours[hour] ?? { DK1: null, DK2: null }
  const title = props.mode === 'day'
    ? props.title
    : `Elpriser nu (${pad(hour)}:00 - ${pad((hour + 1) % 24)}:00) for Danmarks 2 elområder`

  if (!pair.DK1 || !pair.DK2 || stale) return <p>Data ikke tilgængelig.</p>

  const row = (label: string, sub: string, p: AreaPrices) => (
    <tr>
      <th scope="row"><span className={styles.area}>{label}</span> <span className={styles.areaSub}>{sub}</span></th>
      <td>{fmtDk(p.spot)} <span className={styles.unit}>kr/kWh</span></td>
      <td className={styles.totalCell}>{fmtDk(p.total)} <span className={styles.unit}>kr/kWh</span></td>
    </tr>
  )

  return (
    <div className={styles.wrapper}>
      <h4 className={styles.title}>{title}</h4>
      <div className={styles.card}>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr><th scope="col">Område</th><th scope="col">Spotpris</th><th scope="col">Totalpris</th></tr>
            </thead>
            <tbody>
              {row('DK1', 'Vest', pair.DK1)}
              {row('DK2', 'Øst', pair.DK2)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
