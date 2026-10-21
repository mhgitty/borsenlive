import { fetchSheetRows, reviewHref } from '@/lib/sheet'
import { LadeboksCompareClient, type Ladeboks } from './LadeboksCompareClient'

/**
 * WP review slugs that the old site 301-redirected to a differently named
 * review page (WordPress guessed the closest permalink). We link straight to
 * the final URL.
 */
const REVIEW_SLUG_ALIASES: Record<string, string> = {
  nrgi: 'nrgi-zapp',
}

/** Brands that have their own charger review under /opladning-af-elbil/<slug>-ladeboks/. */
const LADEBOKS_REVIEWS = new Set(['ewii', 'norlys', 'nrgi-zapp', 'nettopower', 'modstroem', 'evdk', 'ok', 'looad', 'aura', 'dcc-energi'])
function ladeboksReviewHref(slug: string): string | null {
  const s = REVIEW_SLUG_ALIASES[slug.toLowerCase()] ?? slug.toLowerCase()
  if (LADEBOKS_REVIEWS.has(s)) return `/opladning-af-elbil/${s}-ladeboks/`
  return reviewHref(s)
}

const stripWebp = (s: string) => s.replace(/\.webp$/i, '').trim()
const trimSlashes = (s: string) => s.trim().replace(/^\/+|\/+$/g, '')

/** PHP: strip "kr."/"kr"/spaces/commas/dots, then (float) → "2.250 kr." = 2250, "159 kr./md." = 159 */
function priceNumeric(raw: string): number {
  const clean = raw.toLowerCase().replace(/kr\.|kr| |,/g, '').replace(/\./g, '')
  const n = parseFloat(clean)
  return Number.isFinite(n) ? n : 0
}

async function getProducts(brand: string): Promise<Ladeboks[]> {
  const rows = await fetchSheetRows('Ladebokse')
  const wanted = brand.trim().toLowerCase()
  const out: Ladeboks[] = []

  rows.forEach((r, i) => {
    const [provider = '', ownership = '', logo = '', review = '', cta = '', img = '', title = '',
      elaftale = '', serviceaftale = '', installation = '', ladestik = '', price = ''] = r
    if (wanted && provider.trim().toLowerCase() !== wanted) return
    if (!title || !price) return

    const logoSlug = stripWebp(logo)
    const imgSlug = stripWebp(img)
    const reviewSlug = trimSlashes(review)
    const ctaSlug = trimSlashes(cta)

    const installRaw = installation.trim().toLowerCase()
    const elRaw = elaftale.trim().toLowerCase()

    out.push({
      id: `${i}-${provider}-${title}`,
      provider,
      ownership,
      ownershipKey: ownership.trim().toLowerCase(),
      logoUrl: logoSlug ? `/ladebokse/logos/${logoSlug}.webp` : '',
      productImgUrl: imgSlug ? `/ladebokse/products/${imgSlug}.webp` : '',
      reviewUrl: reviewSlug ? ladeboksReviewHref(reviewSlug) : null,
      ctaUrl: ctaSlug ? `/go/${ctaSlug}/` : null,
      title,
      elaftale,
      serviceaftale,
      installation,
      ladestik,
      priceDisplay: price,
      priceNumeric: priceNumeric(price),
      installFilter: installRaw === 'inkluderet' ? 'inkluderet' : 'ikke',
      elaftaleFilter: elRaw.includes('påkrævet') && !elRaw.includes('ikke') ? 'paakraevet' : 'ikke',
      isCampaign: false,
    })
  })

  // Stable sort by numeric price (PHP usort with <=>)
  return out.sort((a, b) => a.priceNumeric - b.priceNumeric)
}

/**
 * [ladeboks_compare] and [ladeboks_brand brand="..."] — EV charger comparison
 * from the "Ladebokse" sheet tab, with Køb/Leje, installation and elaftale filters.
 */
export async function LadeboksCompare({ brand = '' }: { brand?: string }) {
  const products = await getProducts(brand)
  if (!products.length) {
    return (
      <p>{brand.trim() ? 'Der er ingen ladebokse at vise for dette brand lige nu.' : 'Der er ingen ladebokse at vise lige nu.'}</p>
    )
  }
  return <LadeboksCompareClient products={products} />
}

/** [ladeboks_brand brand="evdk"] */
export function LadeboksBrand({ brand }: { brand: string }) {
  if (!brand?.trim()) return <p>Mangler brand.</p>
  return <LadeboksCompare brand={brand} />
}
