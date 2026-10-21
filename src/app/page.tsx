import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { JsonLd } from '@/components/JsonLd'
import { Icon } from '@/components/Icon'
import { RichIntro } from '@/components/RichIntro'
import { RichBody } from '@/components/RichBody'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { ComparisonTable } from '@/components/ComparisonTable'
import { getPosts, getHomepage } from '@/lib/sanity'
import { getCompareData, priceFor } from '@/lib/elselskab-compare'
import { replaceDateVars } from '@/lib/dateVars'
import type { Metadata } from 'next'
import { BASE, SITE_NAME, SITE_DOMAIN, LANG } from '@/lib/site'

export const revalidate = 1800

export async function generateMetadata(): Promise<Metadata> {
  const hp = await getHomepage().catch(() => null)
  const title = replaceDateVars(hp?.metaTitle || 'Sammenlign elselskaber og elpriser')
  const description = replaceDateVars(hp?.metaDescription || 'Find det billigste elselskab. Vi sammenligner spotpriser, abonnementer og tillæg hos de danske elselskaber.')
  return {
    title,
    description,
    alternates: { canonical: BASE + '/' },
    openGraph: { title, description, url: BASE + '/', type: 'website', images: hp?.featuredImage?.url ? [{ url: hp.featuredImage.url }] : [{ url: `${BASE}/og.png` }] },
    twitter: { title, description },
  }
}

const fmt = (n: number, d = 2) => n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d })
const MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']

const TRUST = [
  { icon: 'graph-new-up', title: 'Priser fra i dag', body: 'Listen regnes ud fra den aktuelle spotpris, nettarif og hvert selskabs tillæg og abonnement — ikke fra en tabel, der blev skrevet sidste år.' },
  { icon: 'scale', title: 'Samme regnestykke for alle', body: 'Alle elaftaler sammenlignes på samlet pris pr. kWh ved dit forbrug, så du kan se forskellen på tværs af selskaber.' },
  { icon: 'hand-money', title: 'Gratis at bruge', body: 'Det koster ikke noget at bruge Borsenlive. Vi kan få provision, når du skifter via vores links — det ændrer ikke din pris.' },
]

export default async function HomePage() {
  const [posts, hp, compare] = await Promise.all([
    getPosts(6).catch(() => []),
    getHomepage().catch(() => null),
    getCompareData().catch(() => ({ providers: [], raw: { DK1: 0, DK2: 0 } as const })),
  ])

  const heroHeading = replaceDateVars(hp?.heroHeading || 'Find det billigste elselskab')
  const heroIntro = hp?.intro ?? 'Se hvad strømmen koster hos de danske elselskaber lige nu — med spotpris, tillæg og abonnement regnet sammen til én pris pr. kWh.'

  // "Billigst lige nu" board: Vest, 4.000 kWh/år, cheapest product per company
  const ranked = compare.providers
    .map((p) => ({ p, price: priceFor(p, compare.raw.DK1, 'DK1') }))
    .sort((a, b) => a.price.total - b.price.total)
  const seen = new Set<string>()
  const top = ranked.filter(({ p }) => (seen.has(p.name) ? false : (seen.add(p.name), true))).slice(0, 5)
  const now = new Date()
  const lastMonth = MONTHS[(now.getMonth() + 11) % 12]

  const body: any[] = hp?.body ?? []
  const faqs = body.filter((b: any) => b._type === 'faqBlock').flatMap((b: any) => b.items ?? []).filter((f: any) => f.question && f.answer)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${BASE}/#website`, url: BASE, name: SITE_DOMAIN, inLanguage: LANG },
      { '@type': 'Organization', '@id': `${BASE}/#organization`, name: SITE_NAME, url: BASE, logo: { '@type': 'ImageObject', url: `${BASE}/logo.webp` } },
      ...(faqs.length > 0 ? [{
        '@type': 'FAQPage',
        mainEntity: faqs.map((f: any) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
      }] : []),
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      <section className="home-hero">
        <div className="home-hero-inner">
          <div>
            <h1>{heroHeading}</h1>
            <p className="lead">{typeof heroIntro === 'string' ? replaceDateVars(heroIntro) : <RichIntro value={heroIntro} />}</p>
            <div className="home-hero-actions">
              <a href="#comparison-list" className="btn btn-primary">Sammenlign alle elaftaler</a>
              <Link href="/elpriser-time-for-time/" className="btn btn-secondary">Elprisen time for time</Link>
            </div>
            <div className="home-proof">
              <span><Icon name="check-circle" size={18} color="var(--brand)" />{compare.providers.length || 'Alle'} elaftaler sammenlignet</span>
              <span><Icon name="check-circle" size={18} color="var(--brand)" />Opdateret med spotprisen</span>
              <span><Icon name="check-circle" size={18} color="var(--brand)" />Uafhængigt og gratis</span>
            </div>
          </div>

          {top.length > 0 && (
            <div className="board">
              <div className="board-head">
                <h2>Billigst lige nu</h2>
                <small>Vest, 4.000 kWh om året</small>
              </div>
              {top.map(({ p, price }, i) => (
                <a key={p.key} href={`/go/${p.ctaSlug}/`} target="_blank" rel="nofollow sponsored noopener" className="board-row">
                  <span className="board-rank">{i + 1}</span>
                  <span className="board-logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.logo ? <img src={p.logo} alt="" /> : null}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="board-name" style={{ display: 'block' }}>{p.name}</span>
                    <span className="board-sub" style={{ display: 'block' }}>{p.campaign || p.title}</span>
                  </span>
                  <span className="board-price">
                    <strong>{fmt(price.total)}</strong>
                    <small>kr./kWh</small>
                  </span>
                </a>
              ))}
              <div className="board-foot">
                <span>Spotpris: gennemsnit for {lastMonth}</span>
                <a href="#comparison-list">Se hele listen</a>
              </div>
            </div>
          )}
        </div>
      </section>

      {hp?.showComparisonTable && hp?.comparisonTable && (
        <div className="section" style={{ paddingBottom: 0 }}>
          {hp.comparisonTableTitle && <h2 style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', marginBottom: '20px' }}>{replaceDateVars(hp.comparisonTableTitle)}</h2>}
          <ComparisonTable data={hp.comparisonTable} />
        </div>
      )}

      {body.length > 0 && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={body} />
            <RichBody value={body} posts={posts as any} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={body} />
          </aside>
        </div>
      )}

      <section className="trust-strip" aria-label="Om Borsenlive">
        {(hp?.trustItems?.length ? hp.trustItems : TRUST).map((item: any, i: number) => (
          <div key={item._key || i}>
            <div className="trust-icon"><Icon name={item.icon || 'shield-check'} size={22} color="var(--brand)" /></div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        ))}
      </section>

      <Footer />
    </>
  )
}
