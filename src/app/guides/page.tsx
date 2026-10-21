import { Navbar } from '@/components/Navbar'
import { ptToText } from '@/lib/ptText'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { AuthorBio } from '@/components/AuthorBio'
import { ComparisonTable } from '@/components/ComparisonTable'
import { GuidesArchive } from '@/components/GuidesArchive'
import { RichBody } from '@/components/RichBody'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { getPageBySlug, getGuides, getSiteSettings } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import type { Metadata } from 'next'
import { RelatedPages } from '@/components/RelatedPages'
import { heroButtonsFor } from '@/lib/heroButtons'
import { BASE, SITE_NAME, LANG } from '@/lib/site'

export const revalidate = 3600

const CANONICAL = `${BASE}/guides/`

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('guides').catch(() => null)
  const title = replaceDateVars(page?.metaTitle || page?.title || 'Guides')
  const description = replaceDateVars(page?.metaDescription || ptToText(page?.intro) || 'Guides om elpriser, elselskaber og hvordan du sparer på strømmen.')
  return { title, description, alternates: { canonical: CANONICAL } }
}

export default async function CasinoGuidesPage() {
  const [page, guides, settings] = await Promise.all([
    getPageBySlug('guides').catch(() => null),
    getGuides().catch(() => []),
    getSiteSettings().catch(() => null),
  ])
  const author = (page as any)?.author ?? settings?.defaultAuthor ?? null
  const title = page?.title || 'Guides'
  const intro = page?.intro || 'Guides om elpriser, elselskaber og hvordan du sparer på strømmen.'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Forside', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: CANONICAL },
        ],
      },
      {
        '@type': 'WebPage', '@id': `${CANONICAL}#webpage`, url: CANONICAL,
        name: title, inLanguage: LANG,
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
        factChecker={(page as any)?.factChecker ?? null}
        breadcrumbs={[{ label: 'Forside', href: '/' }, { label: 'Guides' }]}
      />

      {(page as any)?.showComparisonTable && (page as any)?.comparisonTable && (
        <div className="section" style={{ paddingBottom: '0' }}>
          {(page as any)?.comparisonTableTitle && (
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {replaceDateVars((page as any).comparisonTableTitle)}
            </h2>
          )}
          <ComparisonTable data={(page as any).comparisonTable} />
        </div>
      )}

      <GuidesArchive guides={guides as any[]} hrefPrefix="/guides" />

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
