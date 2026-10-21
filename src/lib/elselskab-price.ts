// Pure price math for the comparison list (safe to import in client components).
// Port of the WP plugin "Elselskab Compare" — see elselskab-compare.ts.

import type { PriceArea } from './elpris-api'

export const REFERENCE_KWH_ANNUAL = 4000
export const KWH_PRESETS = [1000, 2000, 4000, 6000, 8000, 10000]

// ── Tariffs (2025 values from the plugin — update here when they change) ──────
export const TARIFFS = {
  staten: 0.01,
  energinet: { transmission: 0.0537, system: 0.09, aboYear: 233.75 },
  netselskab: {
    DK1: { name: 'N1', kwh: 0.3844, aboMonth: 35.15 },
    DK2: { name: 'Radius', kwh: 0.4272, aboMonth: 45.97 },
  },
} as const

export interface ElselskabProvider {
  key: string
  name: string
  ctaSlug: string
  kwhTillaeg: number
  aboMonthly: number
  logo: string | null
  title: string
  campaign: string
  reviewUrl: string | null
  intro: boolean
  promo: boolean
}

/**
 * Per-kWh components that do not depend on the provider. The fixed yearly/
 * monthly subscriptions (Energinet + net company) are spread over `annualKwh`.
 * NB: the plugin always spread these over the 4,000 kWh reference, also when
 * the slider moved — we keep that so the numbers match the old site.
 */
export function commonComponents(area: PriceArea, annualKwh = REFERENCE_KWH_ANNUAL) {
  const ns = TARIFFS.netselskab[area]
  const netselskab = ns.kwh + (ns.aboMonth * 12) / annualKwh
  const energinet = TARIFFS.energinet.transmission + TARIFFS.energinet.system + TARIFFS.energinet.aboYear / annualKwh
  return { netselskab, energinet, staten: TARIFFS.staten }
}

/** Full price breakdown for one provider. */
export function priceFor(
  p: Pick<ElselskabProvider, 'kwhTillaeg' | 'aboMonthly'>,
  raw: number,
  area: PriceArea,
  annualKwh = REFERENCE_KWH_ANNUAL,
) {
  const common = commonComponents(area)
  const aboPerKwh = annualKwh > 0 ? (p.aboMonthly * 12) / annualKwh : 0
  const staticSum = p.kwhTillaeg + aboPerKwh + common.netselskab + common.energinet + common.staten
  const total = raw + staticSum
  return { raw, kwhTillaeg: p.kwhTillaeg, aboPerKwh, ...common, staticSum, total, monthly: total * (annualKwh / 12) }
}

