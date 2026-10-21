import { fetchSheetRows, reviewHref } from '@/lib/sheet'
import styles from './NaturgasCompare.module.css'

interface GasProvider {
  name: string
  ctaSlug: string
  gasPrice: number
  aboPrice: number
  logo: string
  title: string
  binding: string
  reviewUrl: string | null
}

/** PHP: str_replace(',', '.') then strip everything but [0-9.-] → (float) */
function phpFloat(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, '.').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const nf = (digits: number) => new Intl.NumberFormat('da-DK', { minimumFractionDigits: digits, maximumFractionDigits: digits })

async function getProviders(): Promise<GasProvider[]> {
  const rows = await fetchSheetRows('Naturgas')
  const out: GasProvider[] = []
  for (const r of rows) {
    const [name = '', cta = '', pris = '', abo = '', logo = '', title = '', binding = '', review = ''] = r
    if (!name || !cta) continue
    const slug = review.replace(/^\/+|\/+$/g, '')
    out.push({
      name,
      ctaSlug: cta.replace(/^\/+|\/+$/g, ''),
      gasPrice: phpFloat(pris),
      aboPrice: phpFloat(abo),
      logo: logo ? `/elselskaber/logos/${logo.replace(/\.webp$/i, '')}.webp` : '',
      title,
      binding,
      reviewUrl: slug ? reviewHref(slug) : null,
    })
  }
  return out.sort((a, b) => a.gasPrice - b.gasPrice)
}

/** [naturgas_compare] — natural gas offers from the "Naturgas" sheet tab, cheapest first. */
export async function NaturgasCompare() {
  const providers = await getProviders()
  if (!providers.length) return <p>Ingen naturgastilbud fundet.</p>

  return (
    <div className={styles.root}>
      <div className={styles.list}>
        {providers.map((p, i) => {
          const top = i === 0
          return (
            <article key={`${p.name}-${p.ctaSlug}-${i}`} className={`${styles.card} ${top ? styles.cardTop : ''}`}>
              {top && <div className={styles.pill}>Billigst</div>}
              <div className={styles.inner}>
                <div className={styles.colLogo}>
                  {p.logo ? (
                    <div className={styles.logo}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.logo} alt={p.name} loading="lazy" />
                    </div>
                  ) : (
                    <div className={`${styles.logo} ${styles.logoText}`}>{p.name}</div>
                  )}
                  {p.reviewUrl && <a href={p.reviewUrl} className={styles.reviewLink}>Læs anmeldelse</a>}
                </div>

                <div className={styles.colInfo}>
                  <div className={styles.title}>{p.title}</div>
                  <div className={styles.tags}>
                    {p.binding && (
                      <div className={styles.tag}><span className={styles.tagLabel}>Binding:</span> <span>{p.binding}</span></div>
                    )}
                    <div className={styles.tag}><span className={styles.tagLabel}>Pristype:</span> <span>Variabel</span></div>
                    <div className={styles.tag}>
                      <span className={styles.tagLabel}>Abonnement:</span>{' '}
                      <span>{p.aboPrice > 0 ? `${nf(0).format(p.aboPrice)} kr./md.` : '0 kr./md.'}</span>
                    </div>
                    <div className={styles.tag}><span className={styles.tagLabel}>Betaling:</span> <span>Månedsbetaling</span></div>
                  </div>
                </div>

                <div className={styles.colPrice}>
                  <div className={styles.priceLabel}>Gaspris</div>
                  <div className={styles.priceValue}>
                    <span className={styles.priceNumber}>{nf(2).format(p.gasPrice)}</span>
                    <span className={styles.priceUnit}>kr./m³</span>
                  </div>
                </div>

                <div className={styles.colCta}>
                  <a href={`/go/${p.ctaSlug}/`} className={styles.cta} target="_blank" rel="nofollow sponsored noopener">
                    Gå til udbyder
                    <svg className={styles.ctaIcon} viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <p className={styles.disclaimer}>
        Gaspriser er hentet fra udbyderens hjemmeside og opdateres løbende. Priserne er ekskl. moms og eventuelle netomkostninger. Tjek altid prisen direkte hos udbyderen.
      </p>
    </div>
  )
}
