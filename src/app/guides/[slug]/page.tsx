import { Navbar } from '@/components/Navbar'
import { ptToText } from '@/lib/ptText'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { AuthorBio } from '@/components/AuthorBio'
import { ComparisonTable } from '@/components/ComparisonTable'
import { RichBody } from '@/components/RichBody'
import { TableOfContents } from '@/components/TableOfContents'
import { MobileToc } from '@/components/MobileToc'
import { JsonLd } from '@/components/JsonLd'
import { getGuideBySlug, getSiteSettings, client } from '@/lib/sanity'
import { replaceDateVars } from '@/lib/dateVars'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RelatedPages } from '@/components/RelatedPages'
import { heroButtonsFor } from '@/lib/heroButtons'
import { BASE, SITE_NAME, LANG } from '@/lib/site'

export const revalidate = 3600


interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const guides = await client.fetch<Array<{ slug: { current: string } }>>(
    `*[_type == "guide" && defined(slug.current)] { slug }`
  ).catch(() => [])
  return guides.map((g) => ({ slug: g.slug.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = await getGuideBySlug(slug).catch(() => null)
  if (!guide) return {}
  const canonical = `${BASE}/guides/${slug}/`
  const title = replaceDateVars(guide.metaTitle || guide.title)
  const description = replaceDateVars(guide.metaDescription || ptToText(guide.intro))
  const ogImg = (guide as any).featuredImage
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'article', images: ogImg?.url ? [{ url: ogImg.url }] : [{ url: `${BASE}/og.png` }] },
  }
}

export default async function CasinoGuidePage({ params }: Props) {
  const { slug } = await params
  const [guide, settings] = await Promise.all([
    getGuideBySlug(slug).catch(() => null),
    getSiteSettings().catch(() => null),
  ])
  if (!guide) notFound()

  const canonical = `${BASE}/guides/${slug}/`
  const hideAuthor = (guide as any).hideAuthor ?? false
  const author = hideAuthor ? null : ((guide as any).author ?? settings?.defaultAuthor ?? null)
  const factChecker = hideAuthor ? null : ((guide as any).factChecker ?? null)

  const breadcrumbs = [
    { label: 'Forside', href: '/' },
    { label: 'Guides', href: '/guides/' },
    { label: guide.title },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((c, i) => ({
          '@type': 'ListItem', position: i + 1, name: c.label,
          ...(c.href ? { item: `${BASE}${c.href}` } : {}),
        })),
      },
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: replaceDateVars(guide.title), inLanguage: LANG, publisher: { '@type': 'Organization', name: SITE_NAME, url: BASE } },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />
      <HeroSection
        buttons={heroButtonsFor(guide)}
        title={guide.title}
        intro={(guide as any).intro ?? undefined}
        author={author}
        factChecker={factChecker}
        updatedAt={(guide as any).lastUpdated ?? null}
        breadcrumbs={breadcrumbs}
      />

      {(guide as any).showComparisonTable && (guide as any).comparisonTable && (
        <div className="section" style={{ paddingBottom: guide.body ? '0' : undefined }}>
          {(guide as any).comparisonTableTitle && (
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {replaceDateVars((guide as any).comparisonTableTitle)}
            </h2>
          )}
          <ComparisonTable data={(guide as any).comparisonTable} />
        </div>
      )}

      {guide.body && (
        <div className="article-layout">
          <article className="article-content">
            <MobileToc body={guide.body} />
            <RichBody value={guide.body} />
          </article>
          <aside className="toc-sidebar">
            <TableOfContents body={guide.body} />
          </aside>
        </div>
      )}

      {author && (
        <div className="section" style={{ paddingTop: '0' }}>
          <AuthorBio author={author} compact />
        </div>
      )}
      <RelatedPages docId={guide?._id} />
      <Footer />

    </>
  )
}
