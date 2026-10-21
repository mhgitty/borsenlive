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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søg adresse i Danmark..."
          aria-label="Adresse"
          autoComplete="street-address"
        />
        <button type="submit" disabled={pending}>{pending ? 'Søger…' : 'Søg'}</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.box}>
        <div className={styles.name}>{result.name}</div>
        <div className={styles.meta}>
          {result.phone && <span>📞 {result.phone}</span>}
          {result.website && (
            <span>🌐 <a href={`https://${result.website}`} target="_blank" rel="nofollow noopener">{result.website}</a></span>
          )}
        </div>
        <div className={styles.address}>{result.address}</div>
      </div>

      <iframe
        key={`${result.lat},${result.lon}`}
        className={styles.map}
        src={mapSrc(result.lat, result.lon)}
        title={`Kort: ${result.address}`}
        loading="lazy"
      />
    </div>
  )
}
