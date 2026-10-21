import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { JsonLd } from '@/components/JsonLd'
import { Icon } from '@/components/Icon'
import { RichIntro } from '@/components/RichIntro'
import { getPosts, getHomepage, getElselskaber } from '@/lib/sanity'
import { ComparisonTable } from '@/components/ComparisonTable'
import { ElselskabList } from '@/components/ElselskabList'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { heroButtonsFor } from '@/lib/heroButtons'
import { replaceDateVars } from '@/lib/dateVars'
import type { Metadata } from 'next'
import { BASE, SITE_NAME, SITE_DOMAIN, LANG, DATE_LOCALE } from '@/lib/site'

export const revalidate = 3600


export async function generateMetadata(): Promise<Metadata> {
  const hp = await getHomepage().catch(() => null)
  const title = replaceDateVars(hp?.metaTitle || 'Sammenlign elselskaber og elpriser')
  const description = replaceDateVars(hp?.metaDescription || 'Find det billigste elselskab. Vi sammenligner spotpriser, fastpriser og abonnementer hos de danske elselskaber.')
  return {
    title,
    description,
    alternates: { canonical: BASE + '/' },
    openGraph: { title, description, url: BASE + '/', type: 'website', images: hp?.featuredImage?.url ? [{ url: hp.featuredImage.url }] : [{ url: `${BASE}/og.png` }] },
    twitter: { title, description },
  }
}

export default async function HomePage() {
  const [posts, hp, elselskaber] = await Promise.all([
    getPosts(20).catch(() => []),
    getHomepage().catch(() => null),
    getElselskaber().catch(() => []),
  ])

  const heroHeading = replaceDateVars(hp?.heroHeading || 'Find det billigste elselskab')
  const heroIntro = hp?.intro ?? 'Vi sammenligner priser, abonnementer og vilkår hos de danske elselskaber, så du nemt kan finde den bedste elaftale.'

  const latestSectionTitle = hp?.latestSectionTitle || 'Seneste artikler'
  const elselskaberTitle   = hp?.elselskaberTitle   || 'Populære elselskaber'
  const showElselskaber    = hp?.showElselskaber !== false && !(hp?.showComparisonTable && hp?.comparisonTable)

  const trustItems: { _key: string; icon?: string; title: string; body: string }[] = hp?.trustItems?.length > 0
    ? hp.trustItems
    : [
        { _key: 'trust-1', icon: 'bolt',         title: 'Opdaterede priser',      body: 'Vi holder øje med elselskabernes tillæg, abonnementer og introtilbud, så sammenligningen altid er aktuel.' },
        { _key: 'trust-2', icon: 'scale',        title: 'Uafhængig sammenligning', body: 'Vi sammenligner elaftaler på de samme parametre, så du kan se forskellen på spotpris, fastpris og binding.' },
        { _key: 'trust-3', icon: 'wallet-money', title: 'Gratis at bruge',         body: 'Det koster ingenting at bruge Bosonlife. Vi kan modtage provision, når du skifter via vores links.' },
      ]

  const faqs = (hp?.body ?? [])
    .filter((b: any) => b._type === 'faqBlock')
    .flatMap((b: any) => b.items ?? [])
    .filter((f: any) => f.question && f.answer)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE}/#website`,
        url: BASE,
        name: SITE_DOMAIN,
        inLanguage: LANG,
      },
      {
        '@type': 'Organization',
        '@id': `${BASE}/#organization`,
        name: SITE_NAME,
        url: BASE,
        logo: { '@type': 'ImageObject', url: `${BASE}/logo.webp` },
      },
      ...(faqs.length > 0 ? [{
        '@type': 'FAQPage',
        mainEntity: faqs.map((f: any) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }] : []),
    ],
  }


  const postList = posts as any[]

  const featuredPost = postList[0] ?? null
  const sidebarPosts = postList.slice(1, 5)

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />

      {/* Hero */}
      <section className="hero-section">
        <div style={{ maxWidth: '1250px', margin: '0 auto' }}>
          <h1 className="hero-heading">
            {heroHeading}
          </h1>
          <p className="hero-subtext">
            {typeof heroIntro === 'string' ? replaceDateVars(heroIntro) : <RichIntro value={heroIntro} />}
          </p>

          {heroButtonsFor(hp).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
              {heroButtonsFor(hp).map((b) => (
                <a key={b.targetId} href={`#${b.targetId}`} style={{
                  display: 'inline-block', padding: '11px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                  ...(b.variant === 'solid'
                    ? { background: 'var(--green)', color: '#fff' }
                    : { border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--bg-card)' }),
                }}>{b.text}</a>
              ))}
            </div>
          )}
        </div>
      </section>

      <div style={{ maxWidth: '1250px', margin: '0 auto', padding: '0 15px' }}>

        {/* ── Comparison table (configured on the homepage in Studio) ───── */}
        {hp?.showComparisonTable && hp?.comparisonTable && (
          <section style={{ marginTop: '40px' }}>
            {hp.comparisonTableTitle && (
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
                {replaceDateVars(hp.comparisonTableTitle)}
              </h2>
            )}
            <ComparisonTable data={hp.comparisonTable} />
          </section>
        )}

        {/* ── Elselskaber (fallback when no comparison template is set) ── */}
        {showElselskaber && (elselskaber as any[]).length > 0 && (
          <section style={{ marginTop: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {elselskaberTitle}
            </h2>
            <ElselskabList items={(elselskaber as any[]).slice(0, 10)} />
            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <a href="/elselskaber/" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)' }}>Se alle elselskaber →</a>
            </div>
          </section>
        )}

        {/* ── Body content from Studio ──────────────────────────────────── */}
        {hp?.body?.length > 0 && (
          <section className="article-content" style={{ marginTop: '40px', maxWidth: '860px' }}>
            <PortableTextRenderer value={hp.body} posts={posts as any} />
          </section>
        )}

        {/* ── 1. LATEST SECTION ───────────────────────────────────────────── */}
        {postList.length > 0 && (
          <section style={{ marginTop: '48px' }}>
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              padding: '28px',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '24px',
              }}>{latestSectionTitle}</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
                gap: '24px',
              }}
                className="latest-grid"
              >
                {/* Featured post */}
                {featuredPost && (
                  <a href={`/${featuredPost.slug?.current ?? ''}/`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {featuredPost.featuredImage?.url && (
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                          <Image
                            src={featuredPost.featuredImage.url}
                            alt={featuredPost.featuredImage.alt ?? featuredPost.title ?? ''}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, 560px"
                          />
                        </div>
                      )}
                      {featuredPost.category?.name && (
                        <span style={{
                          display: 'inline-block',
                          background: 'var(--green)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          marginBottom: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          width: 'fit-content',
                        }}>
                          {featuredPost.category.name}
                        </span>
                      )}
                      <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        marginBottom: '10px',
                        lineHeight: 1.3,
                      }}>{featuredPost.title}</h3>
                      {featuredPost.excerpt && (
                        <p style={{ fontSize: '14px', color: 'var(--text-muted, #888)', lineHeight: 1.6, marginBottom: '10px' }}>
                          {featuredPost.excerpt}
                        </p>
                      )}
                      {featuredPost.publishedAt && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                          {new Date(featuredPost.publishedAt).toLocaleDateString(DATE_LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </a>
                )}

                {/* Sidebar posts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sidebarPosts.map((post: any) => (
                    <a key={post._id} href={`/${post.slug?.current ?? ''}/`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        {post.featuredImage?.url && (
                          <div style={{ position: 'relative', width: '80px', minWidth: '80px', height: '56px', borderRadius: '6px', overflow: 'hidden' }}>
                            <Image
                              src={post.featuredImage.url}
                              alt={post.featuredImage.alt ?? post.title ?? ''}
                              fill
                              style={{ objectFit: 'cover' }}
                              sizes="80px"
                            />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {post.category?.name && (
                            <span style={{
                              display: 'inline-block',
                              background: 'var(--green)',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '3px',
                              marginBottom: '5px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}>
                              {post.category.name}
                            </span>
                          )}
                          <p style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text)',
                            lineHeight: 1.35,
                            marginBottom: '4px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          } as React.CSSProperties}>{post.title}</p>
                          {post.publishedAt && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>
                              {new Date(post.publishedAt).toLocaleDateString(DATE_LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* View all button */}
              <div style={{ textAlign: 'center', marginTop: '28px' }}>
                <a href="/nyheder/" style={{
                  display: 'inline-block',
                  padding: '10px 28px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  textDecoration: 'none',
                  background: 'transparent',
                }}>Se alle artikler</a>
              </div>
            </div>
          </section>
        )}

        {/* ── 4. TRUST SECTION ────────────────────────────────────────────── */}
        <section style={{ marginTop: '48px', marginBottom: '64px' }}>
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            padding: '36px 28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '28px',
          }}
            className="trust-grid"
          >
            {trustItems.map((item, i) => (
              <div key={item._key} style={{
                textAlign: 'center',
                padding: '0 8px',
                ...(i === 1 ? { borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' } : {}),
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <Icon name={item.icon || 'shield-check'} size={36} color="var(--green)" />
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: '10px',
                }}>{item.title}</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>

      <Footer />

      <style>{`
        @media (max-width: 700px) {
          .latest-grid { grid-template-columns: 1fr !important; }
          .rankings-grid { grid-template-columns: 1fr !important; }
          .featured-cat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .trust-grid { grid-template-columns: 1fr !important; }
          .trust-grid > div { border-left: none !important; border-right: none !important; border-top: 1px solid var(--border); padding-top: 24px; }
          .trust-grid > div:first-child { border-top: none; padding-top: 0; }
        }
      `}</style>
    </>
  )
}
