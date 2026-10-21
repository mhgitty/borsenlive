import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AuthorBar } from '@/components/AuthorBar'
import { Icon } from '@/components/Icon'
import { replaceDateVars } from '@/lib/dateVars'
import { getReviewSheetData } from '@/lib/elselskab-compare'
import styles from './ReviewHero.module.css'

const kr = (n: number, d = 2) => n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d })
const ore = (krPerKwh: number) => (krPerKwh * 100).toLocaleString('da-DK', { maximumFractionDigits: 2 })
const MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']

interface Props {
  es: any
  author: any
  slug: string
}

/**
 * Review hero. Everything price-related comes live from the Google Sheet
 * (via the review slug in column H) — so it updates with the comparison list.
 * Companies that aren't in the sheet get the plain version.
 */
export async function ReviewHero({ es, author, slug }: Props) {
  const data = await getReviewSheetData(slug).catch(() => null)
  const name = data?.company || es.name
  const logo = data?.logo || es.logo?.url
  const title = replaceDateVars(es.titel || `${es.name} anmeldelse`)
  const x = data?.extras || {}
  const trustpilot = data?.trustpilot ?? es.trustpilotScore ?? null

  const facts: { icon: string; text: string }[] = []
  if (data) facts.push({ icon: 'ranking', text: `Nr. ${data.rank} af ${data.total} elaftaler lige nu` })
  if (trustpilot != null) facts.push({ icon: 'star', text: `Trustpilot ${kr(trustpilot, 1)} / 5` })
  if (x['grundlagt'] || es.founded) facts.push({ icon: 'calendar', text: `Grundlagt ${x['grundlagt'] || es.founded}` })
  if (data?.best) facts.push({ icon: 'lock-keyhole-unlocked', text: /^ingen$/i.test(data.best.binding) ? 'Ingen binding' : `Binding: ${data.best.binding}` })
  if (data?.products.some((p) => p.intro)) facts.push({ icon: 'gift', text: 'Har introtilbud' })
  if ((x['grøn strøm'] || '').toLowerCase().startsWith('j') || es.greenEnergy) facts.push({ icon: 'leaf', text: 'Grøn strøm' })
  if ((x['app'] || '').toLowerCase().startsWith('j') || es.hasApp) facts.push({ icon: 'smartphone', text: 'App' })

  const pros = [x['fordel 1'], x['fordel 2'], x['fordel 3']].filter(Boolean)
  const cons = [x['ulempe 1'], x['ulempe 2'], x['ulempe 3']].filter(Boolean)
  const blurb = x['kort om'] || es.usp

  // Position of this company's best product on the market range (cheapest → priciest)
  let pos = 0, avgPos = 0, diffOre = 0
  if (data) {
    const span = Math.max(0.0001, data.marketMax - data.marketMin)
    pos = ((data.best.dk1.total - data.marketMin) / span) * 100
    avgPos = ((data.marketAvg - data.marketMin) / span) * 100
    diffOre = (data.marketAvg - data.best.dk1.total) * 100
  }
  const lastMonth = MONTHS[(new Date().getMonth() + 11) % 12]
  const ctaHref = data ? `/go/${data.best.ctaSlug}/` : es.url
  const others = data ? data.products.filter((p) => p.key !== data.best.key) : []

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <Breadcrumbs crumbs={[
          { label: 'Forside', href: '/' },
          { label: 'Elselskaber', href: '/elselskaber-i-danmark/' },
          { label: es.name },
        ]} />

        <div className={styles.grid}>
          <div className={styles.main}>
            <div className={styles.brand}>
              {logo && (
                <div className={styles.logo}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt={name} />
                </div>
              )}
              <span className={styles.kicker}>Anmeldelse</span>
            </div>
            <h1 className={styles.title}>{title}</h1>
            {blurb && <p className={styles.blurb}>{replaceDateVars(blurb)}</p>}

            {facts.length > 0 && (
              <ul className={styles.facts}>
                {facts.map((f) => (
                  <li key={f.text}><Icon name={f.icon} size={16} color="var(--brand)" />{f.text}</li>
                ))}
              </ul>
            )}

            {(pros.length > 0 || cons.length > 0) && (
              <div className={styles.verdict}>
                {pros.length > 0 && (
                  <ul>{pros.map((p) => <li key={p} className={styles.pro}>{p}</li>)}</ul>
                )}
                {cons.length > 0 && (
                  <ul>{cons.map((c) => <li key={c} className={styles.con}>{c}</li>)}</ul>
                )}
              </div>
            )}

            <div className={styles.meta}><AuthorBar author={author} updatedAt={es.lastUpdated} /></div>
          </div>

          {data ? (
            <aside className={styles.card} aria-label={`Pris hos ${name}`}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.product}>{data.best.title}</div>
                  <div className={styles.productSub}>{data.best.priceType} pris, {/^ingen$/i.test(data.best.binding) ? 'ingen binding' : `binding ${data.best.binding}`}</div>
                </div>
                {data.rank <= 3 && <span className={styles.rankBadge}>{data.rank === 1 ? 'Billigst lige nu' : `Nr. ${data.rank} billigst`}</span>}
              </div>

              <div className={styles.price}>
                <strong>{kr(data.best.dk1.total)}</strong><span>kr./kWh</span>
              </div>
              <div className={styles.priceSub}>ca. {kr(Math.round(data.best.dk1.monthly), 0)} kr. pr. måned ved 4.000 kWh om året i Vest. Øst: {kr(data.best.dk2.total)} kr./kWh.</div>

              <div className={styles.range} aria-hidden="true">
                <div className={styles.rangeTrack}>
                  <span className={styles.rangeAvg} style={{ left: `${avgPos}%` }} />
                  <span className={styles.rangeDot} style={{ left: `${pos}%` }} />
                </div>
                <div className={styles.rangeLabels}>
                  <span>Billigst {kr(data.marketMin)}</span>
                  <span>Dyrest {kr(data.marketMax)}</span>
                </div>
              </div>
              <p className={styles.rangeText}>
                {diffOre >= 0.05
                  ? <>{ore(diffOre / 100)} øre/kWh <b>billigere</b> end gennemsnittet af de {data.total} elaftaler vi sammenligner.</>
                  : diffOre <= -0.05
                    ? <>{ore(-diffOre / 100)} øre/kWh <b>dyrere</b> end gennemsnittet af de {data.total} elaftaler vi sammenligner.</>
                    : <>Ligger på gennemsnittet af de {data.total} elaftaler vi sammenligner.</>}
              </p>

              <dl className={styles.parts}>
                <div><dt>Tillæg</dt><dd>{ore(data.best.kwhTillaeg)} øre/kWh</dd></div>
                <div><dt>Abonnement</dt><dd>{kr(data.best.aboMonthly, 0)} kr./md.</dd></div>
                <div><dt>Spotpris ({lastMonth})</dt><dd>{kr(data.rawDk1)} kr./kWh</dd></div>
              </dl>

              {data.best.campaign && <div className={styles.campaign}>{data.best.campaign}</div>}

              <a href={ctaHref} target="_blank" rel="nofollow noopener noreferrer sponsored" className={styles.cta}>Gå til {name}</a>

              {others.length > 0 && (
                <div className={styles.others}>
                  Også fra {name}: {others.map((o, i) => (
                    <span key={o.key}>{o.title} ({kr(o.dk1.total)} kr.){i < others.length - 1 ? ', ' : ''}</span>
                  ))}
                </div>
              )}
            </aside>
          ) : es.url ? (
            <aside className={styles.card}>
              {es.offer && <div className={styles.product}>{es.offer}</div>}
              <a href={es.url} target="_blank" rel="nofollow noopener noreferrer sponsored" className={styles.cta} style={{ marginTop: '16px' }}>Gå til {name}</a>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  )
}
