import { getCompareData, priceFor } from '@/lib/elselskab-compare'
import { PromoPopupClient } from './PromoPopupClient'

/** "Månedens tilbud" popup — the provider marked "x" in the sheet's Promo column (J). */
export async function PromoPopup() {
  const { providers, raw } = await getCompareData()
  const p = providers.find((x) => x.promo)
  if (!p) return null
  const total = priceFor(p, raw.DK1, 'DK1').total
  return (
    <PromoPopupClient
      name={p.name}
      title={p.title}
      logo={p.logo}
      campaign={p.campaign}
      href={`/go/${p.ctaSlug}/`}
      price={total.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    />
  )
}
