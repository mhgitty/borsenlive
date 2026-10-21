import { ElprisNetselskabClient, type NetselskabResult } from './ElprisNetselskabClient'

const UA = 'borsenlive.dk (elpris-netselskab)'

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Grid company (netselskab) + coordinates for a Danish address. Server action. */
async function lookupNetselskab(address: string): Promise<NetselskabResult> {
  'use server'
  const a = String(address || '').trim().slice(0, 200)
  if (!a) return { error: 'Ingen adresse angivet.' }
  const q = encodeURIComponent(a)
  const [data, geo] = await Promise.all([
    getJson<{ name?: string; phone?: string; website?: string }>(`https://api.elnet.greenpowerdenmark.dk/api/supplierlookup/${q}`),
    getJson<{ lat: string; lon: string; display_name?: string }[]>(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=dk&accept-language=da`,
    ),
  ])
  if (!data?.name) return { error: 'Ingen netselskab fundet for adressen.' }
  const lat = geo?.[0]?.lat ? Number(geo[0].lat) : NaN
  const lon = geo?.[0]?.lon ? Number(geo[0].lon) : NaN
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { error: 'Kunne ikke finde koordinater for adressen. Prøv en mere præcis adresse.' }
  }
  const website = (data.website || '').replace(/^https?:\/\//i, '')
  return { address: a, name: String(data.name), phone: data.phone ? String(data.phone) : '', website, lat, lon }
}

/**
 * [elpris_netselskab adresse="..."] — grid company for an address, on an
 * OpenStreetMap map, with an address search box.
 */
export async function ElprisNetselskab({ adresse }: { adresse?: string }) {
  if (!adresse?.trim()) return <p>Ingen adresse angivet.</p>
  const initial = await lookupNetselskab(adresse)
  if ('error' in initial) return <p>{initial.error}</p>
  return <ElprisNetselskabClient initial={initial} lookup={lookupNetselskab} />
}
