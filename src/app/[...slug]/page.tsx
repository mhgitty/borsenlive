import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { ComparisonTable } from '@/components/ComparisonTable'
import { AuthorBio } from '@/components/AuthorBio'
import { RichBody } from '@/components/RichBody'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { getPageByPath, getSiteSettings } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { heroButtonsFor } from '@/lib/heroButtons'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RelatedPages } from '@/components/RelatedPages'
import { BASE, SITE_NAME, LANG } from '@/lib/site'

export const revalidate = 3600


interface Props { params: Promise<{ slug: string[] }> }

function buildPath(segments: string[]) {
  return '/' + segments.join('/') + '/'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageByPath(slug).catch(() => null)
  if (!page) return {}
  const title = replaceDateVars(page.metaTitle || page.title)
  const description = replaceDateVars(page.metaDescription || page.intro || '')
  const canonical = `${BASE}${buildPath(slug)}`
  const ogUrl = (page as any).ogImage?.url || (page as any).featuredImage?.url || `${BASE}/og.png`
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical, type: 'article', images: [{ url: ogUrl }] }, twitter: { card: 'summary_large_image', images: [ogUrl] } }
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params
  const [page, settings] = await Promise.all([
    getPageByPath(slug).catch(() => null),
    getSiteSettings().catch(() => null),
  ])
  if (!page) notFound()
  const author = page.author ?? settings?.defaultAuthor ?? null

  const canonical = `${BASE}${buildPath(slug)}`

  const slugLabel = (s: string) => s.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())
  const breadcrumbItems = [
    { name: 'Forside', item: BASE },
    ...slug.slice(0, -1).map((seg, idx) => ({
      name: slugLabel(seg),
      item: `${BASE}/${slug.slice(0, idx + 1).join('/')}/`,
    })),
    { name: slugLabel(slug[slug.length - 1]), item: canonical },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((item, i) => ({
          '@type': 'ListItem', position: i + 1, name: item.name, item: item.item,
        })),
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        description: page.intro || '',
        inLanguage: LANG,
        ...(page.datePublished ? { datePublished: page.datePublished } : {}),
        ...(page.dateModified ? { dateModified: page.dateModified } : {}),
        publisher: { '@type': 'Organization', name: SITE_NAME, url: BASE },
      },
    ],
  }

  const heroButtons = heroButtonsFor(page)

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />
      <HeroSection
        title={page.title}
        intro={page.intro}
        author={author}
        factChecker={page.factChecker}
        updatedAt={page.lastUpdated}
        buttons={heroButtons}
        breadcrumbs={[
          { label: 'Forside', href: '/' },
          ...slug.slice(0, -1).map((seg, idx) => ({
            label: slugLabel(seg),
            href: `/${slug.slice(0, idx + 1).join('/')}/`,
          })),
          { label: slugLabel(slug[slug.length - 1]) },
        ]}
      />

      {/* Comparison table — configured per page in Sanity Studio */}
      {page.showComparisonTable && page.comparisonTable && (
        <div className="section" style={{ paddingBottom: page.body ? '0' : undefined }}>
          {page.comparisonTableTitle && (
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {page.comparisonTableTitle}
            </h2>
          )}
          <ComparisonTable data={page.comparisonTable} />
        </div>
      )}

      {page.body && (
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
