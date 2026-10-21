// Formatting helpers for electricity prices/agreements (Danish).

export type PriceType = 'spot' | 'fixed' | 'variable'

export const PRICE_TYPE_LABEL: Record<string, string> = {
  spot: 'Spotpris',
  fixed: 'Fastpris',
  variable: 'Variabel',
}

const nf = (digits = 2) =>
  new Intl.NumberFormat('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: digits })

export function kr(value?: number | null): string {
  if (value == null) return '–'
  return `${nf(2).format(value)} kr.`
}

export function oere(value?: number | null): string {
  if (value == null) return '–'
  return `${nf(2).format(value)} øre`
}

export function binding(months?: number | null): string {
  if (!months) return 'Ingen'
  return `${months} mdr.`
}

export function areaLabel(areas?: string[] | null): string {
  if (!areas?.length || (areas.includes('DK1') && areas.includes('DK2'))) return 'Hele landet'
  return areas.includes('DK1') ? 'Vestdanmark' : 'Østdanmark'
}

/** Price per kWh the company adds — markup for spot/variable, fixed price for fixed. */
export function kwhPriceLabel(a: { priceType?: string; markup?: number | null; fixedPrice?: number | null }): { label: string; value: string } {
  if (a.priceType === 'fixed') return { label: 'Fast kWh-pris', value: a.fixedPrice != null ? `${oere(a.fixedPrice)}/kWh` : '–' }
  return { label: 'Tillæg', value: a.markup != null ? `${oere(a.markup)}/kWh` : '–' }
}

export function elselskabHref(slug?: string | { current?: string } | null): string {
  const s = typeof slug === 'string' ? slug : slug?.current
  return s ? `/elselskaber-i-danmark/${s}/` : '/elselskaber-i-danmark/'
}
