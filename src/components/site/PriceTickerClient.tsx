'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const fmt = (n: number) => n.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function hourInCopenhagen() {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
}

export function PriceTickerClient({ dk1, dk2 }: { dk1: number[]; dk2: number[] }) {
  // Render with no "now" on the server (pages are cached); fill in on the client.
  const [hour, setHour] = useState<number | null>(null)
  useEffect(() => {
    setHour(hourInCopenhagen())
    const t = setInterval(() => setHour(hourInCopenhagen()), 60_000)
    return () => clearInterval(t)
  }, [])

  const series = dk1.length ? dk1 : dk2
  const max = Math.max(...series, 0.01)
  const min = Math.min(...series)
  const cheapestHour = series.indexOf(min)
  const now = hour ?? -1

  return (
    <div className="ticker" role="region" aria-label="Elprisen lige nu">
      <div className="ticker-inner">
        <span className="ticker-live"><span className="ticker-dot" aria-hidden="true" />Elprisen {hour === null ? 'i dag' : 'lige nu'}</span>
        {dk1.length > 0 && (
          <span className="ticker-item">Vest <strong>{fmt(now >= 0 ? dk1[now] ?? dk1[0] : avg(dk1))}</strong> <span className="ticker-unit">kr./kWh</span></span>
        )}
        {dk2.length > 0 && (
          <span className="ticker-item">Øst <strong>{fmt(now >= 0 ? dk2[now] ?? dk2[0] : avg(dk2))}</strong> <span className="ticker-unit">kr./kWh</span></span>
        )}
        <span className="ticker-sep ticker-hide-sm" aria-hidden="true" />
        <span className="ticker-spark ticker-hide-sm" aria-hidden="true">
          {series.map((v, i) => (
            <span key={i} className={i === now ? 'now' : undefined} style={{ height: `${Math.max(18, (v / max) * 100)}%` }} />
          ))}
        </span>
        <span className="ticker-item ticker-hide-sm">Billigst i dag kl. {String(cheapestHour).padStart(2, '0')} <strong>{fmt(min)}</strong> kr.</span>
        <Link href="/elpriser-time-for-time/" className="ticker-link ticker-hide-sm">Elpris time for time</Link>
      </div>
    </div>
  )
}

function avg(a: number[]) { return a.reduce((s, v) => s + v, 0) / (a.length || 1) }
