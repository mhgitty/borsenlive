'use client'
import { useState, useTransition } from 'react'
import styles from './ElprisNetselskab.module.css'

export type NetselskabResult =
  | { address: string; name: string; phone: string; website: string; lat: number; lon: number }
  | { error: string }

type Found = Extract<NetselskabResult, { name: string }>

function mapSrc(lat: number, lon: number) {
  const dLon = 0.02, dLat = 0.01
  const bbox = [lon - dLon, lat - dLat, lon + dLon, lat + dLat].map((n) => n.toFixed(5)).join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)},${lon.toFixed(5)}`
}

export function ElprisNetselskabClient({ initial, lookup }: {
  initial: Found
  lookup: (address: string) => Promise<NetselskabResult>
}) {
  const [result, setResult] = useState<Found>(initial)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q.length < 3) return
    startTransition(async () => {
      const r = await lookup(q)
      if ('error' in r) setError(r.error)
      else { setResult(r); setError(null) }
    })
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.search} onSubmit={search} role="search">
        <label className={styles.searchLabel} htmlFor="netselskab-adresse">Find netselskab for en adresse</label>
        <div className={styles.searchRow}>
          <input
            id="netselskab-adresse"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg adresse i Danmark"
            autoComplete="street-address"
          />
          <button type="submit" disabled={pending}>{pending ? 'Søger…' : 'Søg'}</button>
        </div>
      </form>
      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.result}>
        <div className={styles.box}>
          <div className={styles.label}>Netselskab</div>
          <div className={styles.name}>{result.name}</div>
          <div className={styles.address}>{result.address}</div>
          {(result.phone || result.website) && (
            <div className={styles.meta}>
              {result.phone && (
                <span>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                  </svg>
                  {result.phone}
                </span>
              )}
              {result.website && (
                <span>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <a href={`https://${result.website}`} target="_blank" rel="nofollow noopener">{result.website}</a>
                </span>
              )}
            </div>
          )}
        </div>

        <iframe
          key={`${result.lat},${result.lon}`}
          className={styles.map}
          src={mapSrc(result.lat, result.lon)}
          title={`Kort: ${result.address}`}
          loading="lazy"
        />
      </div>
    </div>
  )
}
