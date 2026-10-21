import { ReviewHero } from '@/components/review/ReviewHero'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { StickyCtaBar } from '@/components/StickyCtaBar'
import { RichBody } from '@/components/RichBody'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { ProsConsBlock } from '@/components/ProsConsBlock'
import { ElaftaleTable } from '@/components/ElaftaleTable'
import { getElselskabBySlug, getPosts, getSiteSettings, client } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import { AuthorBio } from '@/components/AuthorBio'
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

      <ReviewHero es={es} author={author} slug={slug} />
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
