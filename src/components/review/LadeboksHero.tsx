import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AuthorBar } from '@/components/AuthorBar'
import { RichIntro } from '@/components/RichIntro'
import { Icon } from '@/components/Icon'
import { replaceDateVars } from '@/lib/dateVars'
import { getProducts } from '@/components/widgets/LadeboksCompare'
import styles from './ReviewHero.module.css'

interface Crumb { label: string; href?: string }
interface Props {
  path: string
  title: string
  intro?: string | any[]
  author?: any
  factChecker?: any
  updatedAt?: string | null
  breadcrumbs: Crumb[]
  buttons?: { text: string; targetId: string; variant?: 'solid' | 'outline' }[] | null
}

const n0 = (n: number) => n.toLocaleString('da-DK', { maximumFractionDigits: 0 })
const isLease = (p: { ownershipKey: string }) => p.ownershipKey.startsWith('leje')
const yes = (s: string) => /inkluderet/i.test(s) && !/ikke/i.test(s)

/**
 * Hero for charger reviews (/opladning-af-elbil/<brand>-ladeboks/). Products,
 * prices and terms come live from the "Ladebokse" sheet tab, matched on the
 * review link in column D. Returns null when the sheet has nothing for the page.
 */
export async function LadeboksHero({ path, title, intro, author, factChecker, updatedAt, breadcrumbs, buttons }: Props) {
  const all = await getProducts('').catch(() => [])
  const mine = all.filter((p) => p.reviewUrl === path)
  if (!mine.length) return null

  const raw = mine[0].provider.trim()
  const brand = raw === raw.toLowerCase() ? (raw.length <= 4 ? raw.toUpperCase() : raw[0].toUpperCase() + raw.slice(1)) : raw
  const logo = mine.find((p) => p.logoUrl)?.logoUrl
  const buys = mine.filter((p) => !isLease(p)).sort((a, b) => a.priceNumeric - b.priceNumeric)
  const leases = mine.filter(isLease).sort((a, b) => a.priceNumeric - b.priceNumeric)
  const featured = buys[0] || leases[0]
  const allBuys = all.filter((p) => !isLease(p)).sort((a, b) => a.priceNumeric - b.priceNumeric)
  const rank = buys[0] ? allBuys.findIndex((p) => p.id === buys[0].id) + 1 : 0
  const marketMin = allBuys[0]?.priceNumeric ?? 0
  const marketMax = allBuys[allBuys.length - 1]?.priceNumeric ?? 0
  const models = [...new Set(mine.map((p) => p.title.replace(/\s*ladeboks\s*/i, ' ').trim()))]

  const facts: { icon: string; text: string }[] = []
  facts.push({ icon: 'bolt', text: `${models.length} ${models.length === 1 ? 'model' : 'modeller'}` })
  if (buys[0]) facts.push({ icon: 'tag-price', text: `Køb fra ${buys[0].priceDisplay.replace(/\s*kr\.?$/i, '')} kr.` })
  if (leases[0]) facts.push({ icon: 'calendar', text: `Leje fra ${leases[0].priceDisplay}` })
  if (mine.some((p) => yes(p.installation))) facts.push({ icon: 'settings', text: 'Installation inkluderet' })
  facts.push(mine.every((p) => p.elaftaleFilter === 'paakraevet')
    ? { icon: 'plug-circle', text: 'Kræver elaftale' }
    : { icon: 'lock-keyhole-unlocked', text: 'Kan købes uden elaftale' })
  if (rank && rank <= 3) facts.push({ icon: 'ranking', text: `Nr. ${rank} billigst at købe` })

  let pos = 0
  if (buys[0] && marketMax > marketMin) pos = ((buys[0].priceNumeric - marketMin) / (marketMax - marketMin)) * 100
  const hasIntro = Array.isArray(intro) ? intro.length > 0 : !!intro

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <Breadcrumbs crumbs={[...breadcrumbs.slice(0, -1), { label: `${brand} ladeboks` }]} />
        <div className={styles.grid}>
          <div className={styles.main}>
            <div className={styles.brand}>
              <div className={styles.logo}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logo ? <img src={logo} alt={brand} /> : <span className={styles.monogram}>{brand.slice(0, 2).toUpperCase()}</span>}
              </div>
              <span className={styles.kicker}>Ladeboks-anmeldelse</span>
            </div>
            <h1 className={styles.title}>{replaceDateVars(title)}</h1>
            {hasIntro && (
              <p className={styles.blurb}><RichIntro value={typeof intro === 'string' ? replaceDateVars(intro) : intro} limit={60} /></p>
            )}
            <ul className={styles.facts}>
              {facts.map((f) => <li key={f.text}><Icon name={f.icon} size={16} color="var(--brand)" />{f.text}</li>)}
            </ul>
            {buttons && buttons.length > 0 && (
              <nav className="quicklinks" aria-label="Genveje på siden" style={{ marginTop: 18 }}>
                {buttons.map((b) => (
                  <a key={b.targetId} href={`#${b.targetId}`} className={`quicklink${b.variant === 'solid' ? ' quicklink--primary' : ''}`}>{replaceDateVars(b.text)}</a>
                ))}
              </nav>
            )}
            <div className={styles.meta}><AuthorBar author={author} factChecker={factChecker} updatedAt={updatedAt} /></div>
          </div>

          <aside className={styles.card} aria-label={`Ladebokse fra ${brand}`}>
            <div className={styles.cardHead}>
              <div>
                <div className={styles.product}>{featured.title}</div>
                <div className={styles.productSub}>{isLease(featured) ? 'Leje' : 'Køb'} hos {brand}</div>
              </div>
              {rank > 0 && rank <= 3 && <span className={styles.rankBadge}>{rank === 1 ? 'Billigst lige nu' : `Nr. ${rank} billigst`}</span>}
            </div>

            <div className={styles.ladeTop}>
              {featured.productImgUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.productImgUrl} alt={featured.title} className={styles.ladeImg} />
              )}
              <div>
                <div className={styles.price}><strong>{n0(featured.priceNumeric)}</strong><span>{isLease(featured) ? 'kr./md.' : 'kr.'}</span></div>
                <div className={styles.priceSub}>{isLease(featured) ? 'Månedlig leje' : 'Engangspris for ladeboksen'}</div>
              </div>
            </div>

            <dl className={styles.parts}>
              <div><dt>Installation</dt><dd>{yes(featured.installation) ? 'Inkluderet' : 'Tilkøb'}</dd></div>
              <div><dt>Elaftale</dt><dd>{featured.elaftaleFilter === 'paakraevet' ? 'Påkrævet' : 'Ikke krævet'}</dd></div>
              <div><dt>Service</dt><dd>{featured.serviceaftale.replace(/\.$/, '')}</dd></div>
            </dl>

            {buys[0] && allBuys.length > 2 && (
              <div className={styles.range} aria-hidden="true">
                <div className={styles.rangeTrack}><span className={styles.rangeDot} style={{ left: `${pos}%` }} /></div>
                <div className={styles.rangeLabels}><span>Billigst {n0(marketMin)} kr.</span><span>Dyrest {n0(marketMax)} kr.</span></div>
              </div>
            )}

            {featured.ctaUrl && (
              <a href={featured.ctaUrl} target="_blank" rel="nofollow noopener noreferrer sponsored" className={styles.cta}>Gå til {brand}</a>
            )}

            {mine.length > 1 && (
              <ul className={styles.alts}>
                {mine.filter((p) => p.id !== featured.id).slice(0, 4).map((p) => (
                  <li key={p.id} className={styles.ladeAlt}>
                    <span className={styles.altLogo}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.productImgUrl ? <img src={p.productImgUrl} alt="" loading="lazy" /> : null}
                    </span>
                    <span className={styles.altInfo}>
                      <b>{p.title}</b>
                      <small>{isLease(p) ? 'Leje' : 'Køb'} · installation {yes(p.installation) ? 'inkluderet' : 'tilkøb'}</small>
                    </span>
                    <span className={styles.altPrice}>{p.priceDisplay}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}
