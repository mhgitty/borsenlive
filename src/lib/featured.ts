// "Fremhævede elselskaber" — the four commercial partners shown above the body on
// /elpriser-time-for-time/ pages. Prices, product, campaign, tillæg, abonnement and
// binding come live from the sheet (cheapest product per company at 4.000 kWh, Vest).
// Only the editorial text below lives here. A "Trustpilot" column in the sheet
// (e.g. "4,3 (43.438)") overrides the trustpilot value below.
export interface FeaturedConfig {
  ctaSlug: string      // sheet column B
  headline: string     // bold line under the logo
  usp: string          // last check-mark line
  trustpilot?: string  // "4,3 (43.438 anmeldelser)"
  color: string        // top border
}

export const FEATURED_ELSELSKABER: FeaturedConfig[] = [
  { ctaSlug: 'ok', headline: "Meget tilfredse privatkunder i EPSI's måling 2026", usp: 'Andelsejet — kunderne ejer selskabet', trustpilot: '4,3 på Trustpilot (43.438 anmeldelser)', color: '#C8423A' },
  { ctaSlug: 'dcc', headline: 'Ingen oprettelse og ingen binding', usp: 'Ingen oprettelsesgebyr', trustpilot: '4,2 på Trustpilot (1.388 anmeldelser)', color: '#253A8E' },
  { ctaSlug: 'aura', headline: 'Ingen binding på elaftalerne', usp: 'Vælg selv kvartals- eller månedsregning', trustpilot: '4,6 på Trustpilot (6.812 anmeldelser)', color: '#E0408A' },
  { ctaSlug: 'altid', headline: 'Lavt abonnement og dansk kundeservice', usp: 'Dansk kundeservice', trustpilot: '4,5 på Trustpilot (229 anmeldelser)', color: '#3E7A4C' },
]
