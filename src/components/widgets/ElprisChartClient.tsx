'use client'
import { useEffect, useState } from 'react'
import { formatDkDate, fmtDot, localYmd, nowHourDk, priceColor, type HourPrice, type PriceArea } from '@/lib/elpris-api'
import styles from './ElprisChart.module.css'

// Semantic price colours (CSS vars with hex fallback; SVG fills use them via style).
const COLORS = {
  low: 'var(--price-low, #1F9D6B)',
  mid: 'var(--price-mid, #E8A317)',
  high: 'var(--price-high, #E0523F)',
} as const
const LEGEND: { key: keyof typeof COLORS; label: string }[] = [
  { key: 'low', label: 'Lav pris' },
  { key: 'mid', label: 'Mellem pris' },
  { key: 'high', label: 'Høj pris' },
]
type ValueType = 'total' | 'spot'
const pad = (h: number) => String(h).padStart(2, '0')

interface Bar { label: string; hour: number; value: number; total: number; color: string; isNow: boolean }

function tooltipLines(b: Bar, type: ValueType): [string, string][] {
  if (type === 'spot') return [['Spotpris', `${b.value.toFixed(2).replace(".", ",")} kr./kWh`]]
  const spot = b.value / 1.25 - 0.88
  return [
    ['Spotpris', `${spot.toFixed(2).replace(".", ",")} kr./kWh`],
    ['Elafgift', '0.90 kr./kWh'],
    ['Forsyningstilsynet', '0.19 kr./kWh'],
    ['Total pris', `${b.value.toFixed(2).replace(".", ",")} kr./kWh`],
  ]
}

/** Shared scale: includes 0, adds headroom for value labels. */
function scale(values: number[]) {
  const max = Math.max(0, ...values)
  const min = Math.min(0, ...values)
  const span = max - min || 1
  return { max: max + span * 0.12, min: min < 0 ? min - span * 0.12 : 0 }
}

/**
 * Rectangle path with only the "far" end rounded (top for positive vertical
 * bars, bottom for negative ones; right/left for horizontal bars).
 */
function barPath(x: number, y: number, w: number, h: number, r: number, end: 'top' | 'bottom' | 'right' | 'left') {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  const x2 = x + w, y2 = y + h
  switch (end) {
    case 'top':
      return `M${x},${y2}V${y + rr}Q${x},${y} ${x + rr},${y}H${x2 - rr}Q${x2},${y} ${x2},${y + rr}V${y2}Z`
    case 'bottom':
      return `M${x},${y}V${y2 - rr}Q${x},${y2} ${x + rr},${y2}H${x2 - rr}Q${x2},${y2} ${x2},${y2 - rr}V${y}Z`
    case 'right':
      return `M${x},${y}H${x2 - rr}Q${x2},${y} ${x2},${y + rr}V${y2 - rr}Q${x2},${y2} ${x2 - rr},${y2}H${x}Z`
    case 'left':
      return `M${x2},${y}H${x + rr}Q${x},${y} ${x},${y + rr}V${y2 - rr}Q${x},${y2} ${x + rr},${y2}H${x2}Z`
  }
}

function VerticalChart({ bars, hover, setHover }: { bars: Bar[]; hover: number | null; setHover: (i: number | null) => void }) {
  const W = 900, H = 340, top = 26, bottom = 26, left = 2, right = 2
  const plotH = H - top - bottom
  const { max, min } = scale(bars.map((b) => b.value))
  const y = (v: number) => top + ((max - v) / (max - min)) * plotH
  const slot = (W - left - right) / bars.length
  const bw = Math.min(28, slot * 0.66)
  const zero = y(0)
  const grid = [0.25, 0.5, 0.75, 1].map((f) => top + plotH * (1 - f))
  return (
    <svg className={styles.svgV} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Elpris time for time (søjlediagram)">
      {grid.map((gy) => <line key={gy} x1={left} x2={W - right} y1={gy} y2={gy} className={styles.gridLine} />)}
      {bars.map((b, i) => {
        const sx = left + i * slot
        const x = sx + (slot - bw) / 2
        const yv = y(b.value)
        const h = Math.max(2, Math.abs(zero - yv))
        const yTop = Math.min(yv, zero)
        const dim = hover !== null && hover !== i
        return (
          <g key={b.hour} className={styles.barGroup} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${b.label}: ${b.value.toFixed(2).replace(".", ",")} kr.${b.isNow ? ' (lige nu)' : ''}`}>
            <rect x={sx} y={0} width={slot} height={H} fill="transparent" />
            {b.isNow && (
              <>
                <rect x={sx + 1} y={2} width={slot - 2} height={H - 4} rx={8} className={styles.nowBand} />
                <rect x={sx + 4} y={5} width={slot - 8} height={15} rx={7.5} className={styles.nowPill} />
                <text x={sx + slot / 2} y={15.5} textAnchor="middle" className={styles.nowPillText}>Nu</text>
              </>
            )}
            <path d={barPath(x, yTop, bw, h, 4, b.value >= 0 ? 'top' : 'bottom')} style={{ fill: b.color }} opacity={dim ? 0.45 : 1} className={b.isNow ? styles.nowBar : undefined} />
            <text x={x + bw / 2} y={b.value >= 0 ? yTop - 6 : yTop + h + 12} textAnchor="middle" className={`${styles.valueLabel} ${b.isNow ? styles.labelNow : ''}`}>{b.value.toFixed(2).replace(".", ",")}</text>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" className={`${styles.axisLabel} ${b.isNow ? styles.labelNow : ''}`}>{pad(b.hour)}</text>
          </g>
        )
      })}
      <line x1={left} x2={W - right} y1={zero} y2={zero} className={styles.zeroLine} />
    </svg>
  )
}

function HorizontalChart({ bars, hover, setHover }: { bars: Bar[]; hover: number | null; setHover: (i: number | null) => void }) {
  const W = 340, rowH = 22, labelW = 46, valueW = 40, top = 2
  const H = top * 2 + bars.length * rowH
  const plotW = W - labelW - valueW
  const { max, min } = scale(bars.map((b) => b.value))
  const x = (v: number) => labelW + ((v - min) / (max - min)) * plotW
  const zero = x(0)
  return (
    <svg className={styles.svgH} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Elpris time for time (søjlediagram)">
      {bars.map((b, i) => {
        const yy = top + i * rowH
        const bh = 13
        const xv = x(b.value)
        const xLeft = Math.min(xv, zero)
        const w = Math.max(2, Math.abs(xv - zero))
        const dim = hover !== null && hover !== i
        return (
          <g key={b.hour} className={styles.barGroup} onClick={() => setHover(hover === i ? null : i)}>
            <rect x={0} y={yy} width={W} height={rowH} fill="transparent" />
            {b.isNow && <rect x={0} y={yy} width={W} height={rowH} rx={6} className={styles.nowBand} />}
            <text x={labelW - 8} y={yy + rowH / 2 + 3.5} textAnchor="end" className={`${styles.axisLabel} ${b.isNow ? styles.labelNow : ''}`}>{pad(b.hour)}:00</text>
            <path d={barPath(xLeft, yy + (rowH - bh) / 2, w, bh, 4, b.value >= 0 ? 'right' : 'left')} style={{ fill: b.color }} opacity={dim ? 0.45 : 1} className={b.isNow ? styles.nowBar : undefined} />
            <text x={b.value >= 0 ? xLeft + w + 5 : xLeft - 5} y={yy + rowH / 2 + 3.5} textAnchor={b.value >= 0 ? 'start' : 'end'} className={`${styles.valueLabel} ${b.isNow ? styles.labelNow : ''}`}>{b.value.toFixed(2).replace(".", ",")}</text>
          </g>
        )
      })}
      <line x1={zero} x2={zero} y1={top} y2={H - top} className={styles.zeroLine} />
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
  // Tooltip follows the hovered bar: position as % along the axis; the matching
  // negative translate keeps it inside the box at both ends.
  const tipPos = hover !== null ? ((hover + 0.5) / bars.length) * 100 : 0
  // Mobile (horizontal bars): show below the tapped row in the top half, above it in the bottom half.
  const lowerHalf = hover !== null && hover >= bars.length / 2
  const tipRow = hover !== null ? ((lowerHalf ? hover : hover + 1) / bars.length) * 100 : 0

  const stat = (label: string, value: string, now = false) => (
    <div className={`${styles.stat} ${now ? styles.statNow : ''}`}>
      <div className={styles.statLabel}>{now && <span className={styles.nowDot} aria-hidden="true" />}{label}</div>
      <div className={styles.statValue}>{value}<span className={styles.statUnit}> kr.</span></div>
    </div>
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <div className={styles.heading}>Elpris time for time i Danmark</div>
          <div className={styles.subheading}>{formatDkDate(ymd)} · {area === 'DK1' ? 'Vestdanmark (DK1)' : 'Østdanmark (DK2)'}</div>
        </div>
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
            {stat('Gennemsnit', fmtDot(avg).replace(".", ","))}
            {stat('Laveste', fmtDot(minP).replace(".", ","))}
            {stat('Højeste', fmtDot(maxP).replace(".", ","))}
            {stat('Lige nu', nowRow ? fmtDot(nowRow.price).replace(".", ",") : '-', true)}
          </div>

          <div className={styles.chartBox}>
            <VerticalChart bars={bars} hover={hover} setHover={setHover} />
            <HorizontalChart bars={bars} hover={hover} setHover={setHover} />
            {hovered && (
              <div
                className={styles.tooltip}
                role="status"
                style={{ '--tip-pos': `${tipPos}%`, '--tip-row': `${tipRow}%`, '--tip-shift': lowerHalf ? '-100%' : '0%', '--tip-gap': lowerHalf ? '-4px' : '4px' } as React.CSSProperties}
              >
                <div className={styles.tooltipTitle}>Kl. {pad(hovered.hour)}–{pad((hovered.hour + 1) % 24)}{hovered.isNow && <span className={styles.tooltipNow}>Lige nu</span>}</div>
                {tooltipLines(hovered, type).map(([k, v], idx, arr) => (
                  <div key={k} className={`${styles.tooltipRow} ${arr.length > 1 && idx === arr.length - 1 ? styles.tooltipTotal : ''}`}><span>{k}</span><span>{v}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className={styles.bottom}>
        <div className={styles.legend}>
          {LEGEND.map((l) => <span key={l.key}><i style={{ background: COLORS[l.key] }} />{l.label}</span>)}
          <span><i className={styles.legendNow} />Lige nu</span>
        </div>
        <p className={styles.disclaimer}>
          Priser i kr./kWh. Diagram fra <a href="https://borsenlive.dk">borsenlive.dk</a>
        </p>
      </div>
    </div>
  )
}
