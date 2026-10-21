import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { AuthorBio } from '@/components/AuthorBio'
import { ComparisonTable } from '@/components/ComparisonTable'
import { ElselskabList } from '@/components/ElselskabList'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { RelatedPages } from '@/components/RelatedPages'
import { getPageBySlug, getElselskaber, getSiteSettings } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { heroButtonsFor } from '@/lib/heroButtons'
import { elselskabHref } from '@/lib/elpris'
import { BASE, SITE_NAME, LANG } from '@/lib/site'
import type { Metadata } from 'next'

export const revalidate = 3600

const CANONICAL = `${BASE}/elselskaber/`

// Optional CMS page with slug "elselskaber" supplies the hero text, an optional
// comparison table and body content for this archive.
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('elselskaber').catch(() => null)
  const title = replaceDateVars(page?.metaTitle || page?.title || 'Elselskaber — sammenlign alle danske elselskaber')
  const description = replaceDateVars(page?.metaDescription || 'Se og sammenlign alle danske elselskaber. Læs vores anmeldelser og find det bedste elselskab til dig.')
  return {
    title, description,
    alternates: { canonical: CANONICAL },
    openGraph: { title, description, url: CANONICAL, type: 'website', images: [{ url: `${BASE}/og.png` }] },
  }
}

export default async function ElselskaberPage() {
  const [page, elselskaber, settings] = await Promise.all([
    getPageBySlug('elselskaber').catch(() => null),
    getElselskaber().catch(() => []),
    getSiteSettings().catch(() => null),
  ])
  const hideAuthor = (page as any)?.hideAuthor ?? false
  const author = hideAuthor ? null : ((page as any)?.author ?? settings?.defaultAuthor ?? null)
  const title = page?.title || 'Elselskaber'
  const intro = page?.intro || 'Her finder du alle de elselskaber, vi har anmeldt. Sammenlign priser, vilkår og vores vurdering.'
  const list = elselskaber as any[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Forside', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: title, item: CANONICAL },
        ],
      },
      {
        '@type': 'ItemList',
        name: title,
        itemListElement: list.map((es, i) => ({
          '@type': 'ListItem', position: i + 1, name: es.name, url: `${BASE}${elselskabHref(es.slug)}`,
        })),
      },
      {
        '@type': 'WebPage', '@id': `${CANONICAL}#webpage`, url: CANONICAL, name: title, inLanguage: LANG,
        publisher: { '@type': 'Organization', name: SITE_NAME, url: BASE },
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />
      <HeroSection
        buttons={heroButtonsFor(page)}
        title={title}
        intro={intro}
        author={author}
        updatedAt={(page as any)?.lastUpdated ?? null}
        factChecker={hideAuthor ? null : ((page as any)?.factChecker ?? null)}
        breadcrumbs={[{ label: 'Forside', href: '/' }, { label: title }]}
      />

      {(page as any)?.showComparisonTable && (page as any)?.comparisonTable ? (
        <div className="section" style={{ paddingBottom: page?.body ? '0' : undefined }}>
          {(page as any).comparisonTableTitle && (
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {replaceDateVars((page as any).comparisonTableTitle)}
            </h2>
          )}
          <ComparisonTable data={(page as any).comparisonTable} />
        </div>
      ) : list.length > 0 && (
        <div className="section" style={{ paddingBottom: page?.body ? '0' : undefined }}>
          <div id="comparison-list" style={{ scrollMarginTop: '80px' }}>
            <ElselskabList items={list} />
          </div>
        </div>
      )}

      {page?.body && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={page.body} />
            <PortableTextRenderer value={page.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={page.body} />
          </aside>
        </div>
      )}

      {author && (
        <div className="section" style={{ paddingTop: '0' }}>
          <AuthorBio author={author} compact />
        </div>
      )}

      <Footer />
      <RelatedPages docId={page?._id} />
    </>
  )
}
