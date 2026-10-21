// Google Sheets (the same sheet the WordPress plugins used) — read as CSV via
// the public gviz endpoint. Cached by Next's fetch cache for 30 minutes, so
// price edits in the sheet go live within half an hour without a redeploy.

export const SHEET_ID = process.env.PRICE_SHEET_ID || '12RhPm3xKVgt18B7sFlASBf4biBCCmOLQliiks-Imxbw'
export const SHEET_REVALIDATE = 1800

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, newlines in quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

/**
 * Rows of one sheet tab, header row removed and fully empty rows skipped.
 * Returns [] on any network/parse error so pages never crash on a sheet outage.
 */
export async function fetchSheetRows(tab: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`
  try {
    const res = await fetch(url, { next: { revalidate: SHEET_REVALIDATE, tags: ['price-sheet'] } })
    if (!res.ok) return []
    const rows = parseCsv(await res.text())
    return rows.slice(1).filter((r) => r.some((v) => v.trim() !== '')).map((r) => r.map((v) => v.trim()))
  } catch {
    return []
  }
}

/** "0,11112" / "25 kr" / "2.250 kr." → number (Danish formatting tolerant). */
export function parseDkNumber(raw: string | undefined | null): number {
  if (!raw) return 0
  let s = String(raw).trim()
  // "2.250,50" → thousands dot + decimal comma
  if (/\d\.\d{3}(,|$|\s)/.test(s) && s.includes(',')) s = s.replace(/\./g, '')
  else if (/^\d{1,3}(\.\d{3})+(\s|$|[^\d,])/.test(s)) s = s.replace(/\./g, '')
  s = s.replace(',', '.').replace(/[^0-9.\-]/g, '')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

/** Review slug from the sheet ("dcc-energi") → public review URL. */
export function reviewHref(slug: string | undefined | null): string | null {
  const s = (slug || '').trim().replace(/^\/+|\/+$/g, '')
  if (!s) return null
  // Already a full path (e.g. "opladning-af-elbil/ewii-ladeboks")
  if (s.includes('/')) return `/${s}/`
  return `/elselskaber-i-danmark/${s}/`
}
