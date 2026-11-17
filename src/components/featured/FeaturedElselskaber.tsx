import { getCompareData, priceFor, REFERENCE_KWH_ANNUAL } from '@/lib/elselskab-compare'
import { FEATURED_ELSELSKABER } from '@/lib/featured'
import styles from './FeaturedElselskaber.module.css'

const n0 = (n: number) => Math.round(n).toLocaleString('da-DK')
const dk = (n: number, d = 0) => n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d })

/** Four highlighted partner cards (ad-labelled), live prices from the sheet. */
export async function FeaturedElselskaber({ area = 'DK1' }: { area?: 'DK1' | 'DK2' }) {
  const { providers, raw } = await getCompareData().catch(() => ({ providers: [], raw: { DK1: 0, DK2: 0 } }))
  if (!providers.length || !raw[area]) return null

  const cards = FEATURED_ELSELSKABER.map((cfg) => {
    const mine = providers.filter((p) => p.ctaSlug.toLowerCase() === cfg.ctaSlug)
      .map((p) => ({ p, price: priceFor(p, raw[area], area, REFERENCE_KWH_ANNUAL) }))
      .sort((a, b) => a.price.total - b.price.total)
    if (!mine.length) return null
    const { p, price } = mine[0]
    const ore = p.kwhTillaeg * 100
    const tp = p.trustpilot != null ? `${dk(p.trustpilot, 1)} på Trustpilot` : cfg.trustpilot
    const bullets = [
      `${dk(ore, ore % 1 ? 1 : 0)} øre i tillæg til spotprisen`,
      p.aboMonthly > 0 ? `${dk(p.aboMonthly)} kr./md. i abonnement` : 'Intet abonnement',
      ...(tp ? [tp] : []),
      /^ingen$/i.test(p.binding) ? 'Ingen binding' : `Binding: ${p.binding}`,
      cfg.usp,
    ]
    return { cfg, p, kwh: price.total, monthly: price.monthly, bullets }
  }).filter(Boolean) as { cfg: (typeof FEATURED_ELSELSKABER)[number]; p: any; kwh: number; monthly: number; bullets: string[] }[]
  if (!cards.length) return null

  return (
    <section className={styles.wrap} aria-labelledby="featured-title">
      <div className={styles.head}>
        <h2 id="featured-title" className={styles.title}>Fremhævede elselskaber</h2>
        <span className={styles.note}>Priser ved {n0(REFERENCE_KWH_ANNUAL)} kWh om året i {area === 'DK2' ? 'Radius (Østdanmark)' : 'N1 A/S (Vestdanmark)'}</span>
      </div>
      <div className={styles.grid}>
        {cards.map(({ cfg, p, kwh, monthly, bullets }) => (
          <article key={cfg.ctaSlug} className={styles.card} style={{ ['--accent' as any]: cfg.color }}>
            <span className={styles.ad}>Annonce</span>
            <div className={styles.logo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.logo ? <img src={p.logo} alt={p.name} loading="lazy" /> : <strong>{p.name}</strong>}
            </div>
            <h3 className={styles.headline}>{cfg.headline}</h3>
            <div className={styles.price}><strong>{dk(kwh, 2)}</strong> <span>kr./kWh</span><small>ca. {n0(monthly)} kr. pr. måned</small></div>
            <div className={styles.product}>{p.title}{p.campaign ? ` – ${p.campaign.trim()}` : ''}</div>
            <ul className={styles.bullets}>
              {bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
            <a href={`/go/${p.ctaSlug}/`} target="_blank" rel="nofollow sponsored noopener" className={styles.cta}>
              Se tilbud <span aria-hidden="true">→</span>
            </a>
          </article>
        ))}
      </div>
      <p className={styles.disclaimer}>
        Annonce: De fire fremhævede selskaber er kommercielle samarbejder. Rækkefølgen i sammenligningen længere nede afhænger ikke af det — dér er alle elaftaler sorteret efter samlet pris, også dem vi ikke tjener noget på.
        {' '}Priserne er inkl. spotpris (sidste måneds gennemsnit), nettarif, afgifter og moms.
      </p>
    </section>
  )
}
