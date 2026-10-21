'use client'
import { useEffect, useState } from 'react'
import { formatDkDate, fmtDot, localYmd, nowHourDk, priceColor, type HourPrice, type PriceArea } from '@/lib/elpris-api'
import styles from './ElprisChart.module.css'

const COLORS = { low: '#4caf50', mid: '#ffc107', high: '#f44336' } as const
type ValueType = 'total' | 'spot'

interface Bar { label: string; hour: number; value: number; total: number; color: string; isNow: boolean }

function tooltipLines(b: Bar, type: ValueType): string[] {
  if (type === 'spot') return [`Spotpris: ${b.value.toFixed(2)} kr./kWh`]
  const spot = b.value / 1.25 - 0.88
  return [
    `Spotpris: ${spot.toFixed(2)} kr./kWh`,
    'Elafgift: 0.90 kr./kWh',
    'Forsyningstilsynet: 0.19 kr./kWh',
    `Total pris: ${b.value.toFixed(2)} kr./kWh`,
  ]
}

/** Shared scale: includes 0, adds headroom for value labels. */
function scale(values: number[]) {
  const max = Math.max(0, ...values)
  const min = Math.min(0, ...values)
  const span = max - min || 1
  return { max: max + span * 0.12, min: min < 0 ? min - span * 0.12 : 0 }
}

function VerticalChart({ bars, hover, setHover }: { bars: Bar[]; hover: number | null; setHover: (i: number | null) => void }) {
  const W = 900, H = 360, top = 8, bottom = 24, left = 4, right = 4
  const plotH = H - top - bottom
  const { max, min } = scale(bars.map((b) => b.value))
  const y = (v: number) => top + ((max - v) / (max - min)) * plotH
  const slot = (W - left - right) / bars.length
  const bw = slot * 0.72
  const zero = y(0)
  return (
    <svg className={styles.svgV} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Elpris time for time (søjlediagram)">
      <line x1={left} x2={W - right} y1={zero} y2={zero} stroke="var(--border-faint)" />
      {bars.map((b, i) => {
        const x = left + i * slot + (slot - bw) / 2
        const yv = y(b.value)
        const h = Math.max(1, Math.abs(zero - yv))
        const yTop = Math.min(yv, zero)
        return (
          <g key={b.hour} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${b.label}: ${b.value.toFixed(2)} kr.`}>
            <rect x={left + i * slot} y={top} width={slot} height={plotH} fill="transparent" />
            <rect x={x} y={yTop} width={bw} height={h} rx={6} fill={b.color} opacity={hover === null || hover === i ? 1 : 0.75}
              stroke={b.isNow ? '#555' : 'none'} strokeWidth={b.isNow ? 2 : 0} strokeDasharray={b.isNow ? '4 4' : undefined} />
            <text x={x + bw / 2} y={b.value >= 0 ? yTop - 5 : yTop + h + 11} textAnchor="middle" className={styles.valueLabel}>{b.value.toFixed(2)} kr.</text>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" className={styles.axisLabel}>{b.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function HorizontalChart({ bars, hover, setHover }: { bars: Bar[]; hover: number | null; setHover: (i: number | null) => void }) {
  const W = 360, rowH = 22, labelW = 40, valueW = 48, top = 4
  const H = top * 2 + bars.length * rowH
  const plotW = W - labelW - valueW
  const { max, min } = scale(bars.map((b) => b.value))
  const x = (v: number) => labelW + ((v - min) / (max - min)) * plotW
  const zero = x(0)
  return (
    <svg className={styles.svgH} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Elpris time for time (søjlediagram)">
      <line x1={zero} x2={zero} y1={top} y2={H - top} stroke="var(--border-faint)" />
      {bars.map((b, i) => {
        const yy = top + i * rowH
        const bh = rowH * 0.62
        const xv = x(b.value)
        const xLeft = Math.min(xv, zero)
        const w = Math.max(1, Math.abs(xv - zero))
        return (
          <g key={b.hour} onClick={() => setHover(hover === i ? null : i)}>
            <text x={labelW - 6} y={yy + rowH / 2 + 3.5} textAnchor="end" className={styles.axisLabel}>{b.label}</text>
            <rect x={xLeft} y={yy + (rowH - bh) / 2} width={w} height={bh} rx={5} fill={b.color}
              stroke={b.isNow ? '#555' : 'none'} strokeWidth={b.isNow ? 1.5 : 0} strokeDasharray={b.isNow ? '4 3' : undefined} />
            <text x={b.value >= 0 ? xLeft + w + 4 : xLeft - 4} y={yy + rowH / 2 + 3.5} textAnchor={b.value >= 0 ? 'start' : 'end'} className={styles.valueLabel}>{b.value.toFixed(2)} kr.</text>
          </g>
        )
      })}
    </svg>
  )
}

export function ElprisChartClient({ data, ymd, initialArea, serverHour }: {
  data: Record<PriceArea, HourPrice[]>
  ymd: string
  initialArea: PriceArea
  serverHour: number
}) {
  const [area, setArea] = useState<PriceArea>(initialArea)
  const [type, setType] = useState<ValueType>('total')
  const [hover, setHover] = useState<number | null>(null)
  // Current hour is resolved in the browser so cached HTML still marks the right bar.
  const [nowHour, setNowHour] = useState<number | null>(serverHour)
  useEffect(() => {
    const tick = () => setNowHour(localYmd() === ymd ? nowHourDk() : null)
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [ymd])

  const rows = data[area]
  const totals = rows.map((r) => r.price)
  const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0
  const minP = totals.length ? Math.min(...totals) : 0
  const maxP = totals.length ? Math.max(...totals) : 0
  const nowRow = rows.find((r) => r.hour === nowHour)

  const bars: Bar[] = rows.map((r) => ({
    label: r.time,
    hour: r.hour,
    value: type === 'total' ? r.price : r.spot,
    total: r.price,
    color: COLORS[priceColor(r.price, avg)],
    isNow: r.hour === nowHour,
  }))
  const hovered = hover !== null ? bars[hover] : null

  const btn = (active: boolean) => `${styles.segBtn} ${active ? styles.segBtnActive : ''}`

  return (
    <div className={styles.wrapper}>
      <div className={styles.head}>
        <div className={styles.heading}>Elpris time for time i Danmark - {formatDkDate(ymd)}</div>
        <div className={styles.toggles}>
          <div className={styles.seg} role="group" aria-label="Elområde">
            <button type="button" className={btn(area === 'DK1')} aria-pressed={area === 'DK1'} onClick={() => { setArea('DK1'); setHover(null) }}>Vest</button>
            <button type="button" className={btn(area === 'DK2')} aria-pressed={area === 'DK2'} onClick={() => { setArea('DK2'); setHover(null) }}>Øst</button>
          </div>
          <div className={styles.seg} role="group" aria-label="Pristype">
            <button type="button" className={btn(type === 'total')} aria-pressed={type === 'total'} onClick={() => setType('total')}>Totalpris</button>
            <button type="button" className={btn(type === 'spot')} aria-pressed={type === 'spot'} onClick={() => setType('spot')}>Spotpris</button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>Ingen elpriser tilgængelige.</p>
      ) : (
        <>
          <div className={styles.stats}>
            <div>Gennemsnit: <strong>{fmtDot(avg)} kr.</strong></div>
            <div>Laveste pris: <strong>{fmtDot(minP)} kr.</strong></div>
            <div>Højeste pris: <strong>{fmtDot(maxP)} kr.</strong></div>
            <div>Pris lige nu: <strong>{nowRow ? fmtDot(nowRow.price) : '-'} kr.</strong></div>
          </div>

          <div className={styles.chartBox}>
            <VerticalChart bars={bars} hover={hover} setHover={setHover} />
            <HorizontalChart bars={bars} hover={hover} setHover={setHover} />
            {hovered && (
              <div className={styles.tooltip} role="status">
                <div className={styles.tooltipTitle}>{hovered.label}</div>
                {tooltipLines(hovered, type).map((l) => <div key={l}>{l}</div>)}
              </div>
            )}
          </div>
        </>
      )}

      <div className={styles.bottom}>
        <div className={styles.legend}>
          <span><i style={{ background: COLORS.low }} /> Lav pris</span>
          <span><i style={{ background: COLORS.mid }} /> Mellem pris</span>
          <span><i style={{ background: COLORS.high }} /> Høj pris</span>
        </div>
        <p className={styles.disclaimer}>
          Priser vises i kr./kWh. Dette diagram er udviklet af <a href="https://borsenlive.dk">borsenlive.dk</a>
        </p>
      </div>
    </div>
  )
}
