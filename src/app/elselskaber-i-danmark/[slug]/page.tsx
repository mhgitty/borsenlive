import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { StickyCtaBar } from '@/components/StickyCtaBar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { RichBody } from '@/components/RichBody'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { RichIntro } from '@/components/RichIntro'
import { ProsConsBlock } from '@/components/ProsConsBlock'
import { ElaftaleTable } from '@/components/ElaftaleTable'
import { getElselskabBySlug, getPosts, getSiteSettings, client } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { areaLabel } from '@/lib/elpris'
import { notFound } from 'next/navigation'
import { Icon } from '@/components/Icon'
import { AuthorBio } from '@/components/AuthorBio'
import { AuthorBar } from '@/components/AuthorBar'
import { RelatedPages } from '@/components/RelatedPages'
import { BASE, SITE_NAME } from '@/lib/site'
import type { Metadata } from 'next'

export const revalidate = 3600

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const rows = await client.fetch<Array<{ slug: { current: string } }>>(
    `*[_type == "elselskab" && defined(slug.current)] { slug }`
  ).catch(() => [])
  return rows.map((r) => ({ slug: r.slug.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const es = await getElselskabBySlug(slug).catch(() => null)
  if (!es) return {}
  const title = replaceDateVars(es.metaTitle || `${es.name} anmeldelse — priser, vilkår og erfaringer`)
  const description = replaceDateVars(es.metaDescription || `Læs vores anmeldelse af ${es.name}. Se priser, abonnement, binding og vores samlede vurdering.`)
  const canonical = `${BASE}/elselskaber-i-danmark/${slug}/`
  const img = es.ogImage?.url ? es.ogImage : es.logo?.url ? es.logo : null
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description, url: canonical, type: 'article',
      images: img ? [{ url: img.url, alt: img.alt || title }] : [{ url: `${BASE}/og.png` }],
    },
    twitter: { title, description, ...(img ? { images: [img.url] } : {}) },
  }
}

export default async function ElselskabPage({ params }: Props) {
  const { slug } = await params
  const [es, latestPosts, settings] = await Promise.all([
    getElselskabBySlug(slug).catch(() => null),
    getPosts(6).catch(() => []),
    getSiteSettings().catch(() => null),
  ])
  if (!es) notFound()
  const author = es.author ?? settings?.defaultAuthor ?? null
  const canonical = `${BASE}/elselskaber-i-danmark/${slug}/`
  const elaftaler = (es.elaftaler || []) as any[]
  const ctaText = es.ctaText || `Gå til ${es.name}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Forside', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Elselskaber', item: `${BASE}/elselskaber-i-danmark/` },
          { '@type': 'ListItem', position: 3, name: es.name, item: canonical },
        ],
      },
      {
        '@type': 'Review',
        itemReviewed: { '@type': 'Organization', name: es.name },
        ...(es.score != null ? { reviewRating: { '@type': 'Rating', ratingValue: es.score, bestRating: 10, worstRating: 0 } } : {}),
        author: author?.name ? { '@type': 'Person', name: author.name } : { '@type': 'Organization', name: SITE_NAME },
        publisher: { '@type': 'Organization', name: SITE_NAME, url: BASE },
        datePublished: es.datePublished,
        dateModified: es.lastUpdated,
        url: canonical,
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <Breadcrumbs crumbs={[
            { label: 'Forside', href: '/' },
            { label: 'Elselskaber', href: '/elselskaber-i-danmark/' },
            { label: es.name },
          ]} />

          <div className="review-hero">
            <div className="review-hero-main">
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '18px' }}>
                {es.logo?.url && (
                  <div className="review-logo" style={{ flexShrink: 0, borderRadius: 'var(--r-lg)', background: '#fff', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={es.logo.url} alt={es.logo.alt || es.name} style={{ maxWidth: '76%', maxHeight: '70%', objectFit: 'contain' }} />
                  </div>
                )}
                <h1 className="page-hero-title" style={{ margin: 0 }}>{replaceDateVars(es.titel || `${es.name} anmeldelse`)}</h1>
              </div>
              {es.usp && <p className="page-hero-intro" style={{ marginTop: '16px' }}>{replaceDateVars(es.usp)}</p>}
              {es.intro && <div className="page-hero-intro" style={{ marginTop: '12px' }}><RichIntro value={es.intro} /></div>}
              <div className="review-facts">
                <span><Icon name="map-point" size={16} color="var(--brand)" />{areaLabel(es.priceAreas)}</span>
                {es.founded && <span><Icon name="calendar" size={16} color="var(--brand)" />Grundlagt {es.founded}</span>}
                {es.trustpilotScore != null && <span><Icon name="star" size={16} color="var(--brand)" />Trustpilot {es.trustpilotScore.toFixed(1).replace('.', ',')} / 5</span>}
                {es.greenEnergy && <span><Icon name="leaf" size={16} color="var(--brand)" />Grøn strøm</span>}
                {es.hasApp && <span><Icon name="smartphone" size={16} color="var(--brand)" />App</span>}
                {es.score != null && <span><Icon name="cup-star" size={16} color="var(--brand)" />Vores vurdering {String(es.score).replace('.', ',')} / 10</span>}
              </div>
              <div className="page-hero-meta"><AuthorBar author={author} updatedAt={es.lastUpdated} /></div>
            </div>

            {es.url && (
              <aside className="review-offer">
                {es.offer && <p className="review-offer-label">Aktuelt tilbud</p>}
                {es.offer && <p className="review-offer-text">{es.offer}</p>}
                <a href={es.url} target="_blank" rel="nofollow noopener noreferrer sponsored" className="btn btn-primary" style={{ width: '100%' }}>{ctaText}</a>
                {es.terms && <p className="review-offer-terms">{es.terms}</p>}
              </aside>
            )}
          </div>
        </div>
      </section>
      {es.url && (
        <StickyCtaBar url={es.url} name={es.name} logoUrl={es.logo?.url ?? null} logoAlt={es.logo?.alt ?? null} bonus={es.offer ?? null} terms={es.terms ?? null} ctaText={ctaText} />
      )}

      {elaftaler.length > 0 && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
            Elaftaler hos {es.name}
          </h2>
          <div id="comparison-list" style={{ scrollMarginTop: '80px' }}>
            <ElaftaleTable items={elaftaler} showFilters={elaftaler.length > 3} />
          </div>
        </div>
      )}

      {((es.pros?.length ?? 0) > 0 || (es.cons?.length ?? 0) > 0) && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <div id="pros-cons" style={{ scrollMarginTop: '80px' }}>
            <ProsConsBlock value={{ title: `Fordele og ulemper ved ${es.name}`, pros: es.pros || [], cons: es.cons || [] }} />
          </div>
        </div>
      )}

      <div className="article-layout">
        <article className="article-content">
          {es.body && <MobileToc body={es.body} />}
          {es.body && <RichBody value={es.body} posts={latestPosts as any} />}
        </article>
        {es.body && (
          <aside className="toc-sidebar">
            <TableOfContents body={es.body} />
          </aside>
        )}
      </div>

      {author && (
        <div className="section" style={{ paddingTop: '0' }}>
          <AuthorBio author={author} compact />
        </div>
      )}

      <RelatedPages docId={es._id} />
      <Footer />
    </>
  )
}
