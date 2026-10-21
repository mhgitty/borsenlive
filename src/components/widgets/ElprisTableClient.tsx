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
    : `Elpriser nu (${pad(hour)}:00 - ${pad((hour + 1) % 24)}:00) for Danmarks 2 elområder:`

  if (!pair.DK1 || !pair.DK2 || stale) return <p>Data ikke tilgængelig.</p>

  return (
    <div className={styles.wrapper}>
      <h4 className={styles.title}>{title}</h4>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr><th>Område</th><th>Spotpris</th><th>Totalpris</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>DK1 (Vest):</strong></td><td>{fmtDk(pair.DK1.spot)} kr/kWh</td><td>{fmtDk(pair.DK1.total)} kr/kWh</td></tr>
            <tr><td><strong>DK2 (Øst):</strong></td><td>{fmtDk(pair.DK2.spot)} kr/kWh</td><td>{fmtDk(pair.DK2.total)} kr/kWh</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
