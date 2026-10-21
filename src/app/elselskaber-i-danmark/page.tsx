import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { AuthorBio } from '@/components/AuthorBio'
import { ComparisonTable } from '@/components/ComparisonTable'
import { ElselskabList } from '@/components/ElselskabList'
import { RichBody } from '@/components/RichBody'
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
import Link from 'next/link'

export const revalidate = 3600

const CANONICAL = `${BASE}/elselskaber-i-danmark/`

// Optional CMS page with slug "elselskaber-i-danmark" supplies the hero text, an optional
// comparison table and body content for this archive.
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('elselskaber-i-danmark').catch(() => null)
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
    getPageBySlug('elselskaber-i-danmark').catch(() => null),
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
      ) : list.length > 0 && !page?.body && (
        <div className="section">
          <div id="comparison-list" style={{ scrollMarginTop: '80px' }}>
            <ElselskabList items={list} />
          </div>
        </div>
      )}

      {page?.body && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={page.body} />
            <RichBody value={page.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={page.body} />
          </aside>
        </div>
      )}

      {page?.body && list.length > 0 && (
        <div className="section" style={{ paddingTop: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: 'var(--text)', marginBottom: '18px' }}>
            Alle elselskaber vi har anmeldt
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {list.map((es) => (
              <Link key={es._id} href={elselskabHref(es.slug)} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px',
                textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '14px',
              }}>
                {es.logo?.url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={es.logo.url} alt="" style={{ width: '40px', height: '28px', objectFit: 'contain', flexShrink: 0 }} />
                  : <span style={{ width: '40px', height: '28px', borderRadius: '6px', background: 'var(--bg-raised)', flexShrink: 0 }} />}
                {es.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {author && (
        <div className="section" style={{ paddingTop: '0' }}>
          <AuthorBio author={author} compact />
        </div>
      )}

      <RelatedPages docId={page?._id} />
      <Footer />
    </>
  )
}
