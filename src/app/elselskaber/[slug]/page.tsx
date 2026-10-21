import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { StickyCtaBar } from '@/components/StickyCtaBar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
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
import { ScoreMeter } from '@/components/ScoreMeter'
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
  const canonical = `${BASE}/elselskaber/${slug}/`
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

function Stat({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Icon name={icon} size={22} color="var(--green)" style={{ flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '1px' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{value}</div>
      </div>
    </div>
  )
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
  const canonical = `${BASE}/elselskaber/${slug}/`
  const elaftaler = (es.elaftaler || []) as any[]
  const ctaText = es.ctaText || `Gå til ${es.name}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Forside', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Elselskaber', item: `${BASE}/elselskaber/` },
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
      <div style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border)', padding: '40px 15px 32px' }}>
        <div style={{ maxWidth: '1250px', margin: '0 auto' }}>
          <Breadcrumbs crumbs={[
            { label: 'Forside', href: '/' },
            { label: 'Elselskaber', href: '/elselskaber/' },
            { label: es.name },
          ]} />

          <div className="bm-hero">
            {es.logo?.url && (
              <div className="bm-hero-logo" style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', background: '#fff', border: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={es.logo.url} alt={es.logo.alt || es.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', display: 'block' }} />
              </div>
            )}

            <div className="bm-hero-title" style={{ minWidth: 0, alignSelf: 'center' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 34px)', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                {replaceDateVars(es.titel || `${es.name} anmeldelse`)}
              </h1>
              {es.usp && <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{replaceDateVars(es.usp)}</p>}
            </div>

            {es.score != null && (
              <div className="bm-hero-score" style={{ display: 'flex' }}>
                <ScoreMeter score={es.score} />
              </div>
            )}

            <div className="bm-hero-stats">
              <Stat icon="map-point" label="Dækker" value={areaLabel(es.priceAreas)} />
              {es.founded && <Stat icon="calendar" label="Grundlagt" value={es.founded} />}
              {es.trustpilotScore != null && (
                <Stat icon="star" label="Trustpilot" value={
                  es.trustpilotUrl
                    ? <a href={es.trustpilotUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{es.trustpilotScore.toFixed(1)} / 5</a>
                    : `${es.trustpilotScore.toFixed(1)} / 5`
                } />
              )}
              {es.greenEnergy && <Stat icon="leaf" label="Grøn strøm" value="Ja" />}
              {es.hasApp && <Stat icon="smartphone" label="App" value="Ja" />}
              {es.customerService && <Stat icon="chat-round-dots" label="Kundeservice" value={es.customerService} />}
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
            <AuthorBar author={author} updatedAt={es.lastUpdated} />
          </div>

          {es.intro && (
            <div style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '760px', marginTop: '8px' }}>
              <RichIntro value={es.intro} />
            </div>
          )}

          {(es.offer || es.url) && (
            <div style={{ marginTop: '24px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {es.offer && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aktuelt tilbud</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{es.offer}</div>
                </div>
              )}
              {es.url && (
                <a href={es.url} target="_blank" rel="nofollow noopener noreferrer sponsored"
                  style={{ display: 'block', background: 'var(--green-dark)', color: '#fff', padding: '13px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
                  {ctaText} →
                </a>
              )}
              {es.terms && <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: 0, lineHeight: 1.5 }}>{es.terms}</p>}
            </div>
          )}
        </div>
      </div>

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
          {es.body && <PortableTextRenderer value={es.body} posts={latestPosts as any} />}
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

      <Footer />
      <RelatedPages docId={es._id} />
    </>
  )
}
