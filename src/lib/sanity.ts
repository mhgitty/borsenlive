import { createClient } from 'next-sanity'
import { cache } from 'react'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!
const apiVersion = '2026-04-22'

const publishedClient = createClient({ projectId, dataset, apiVersion, useCdn: true })
const publishedNoCdnClient = createClient({ projectId, dataset, apiVersion, useCdn: false })

// Draft (preview) client — reads unpublished drafts. Only active when a token
// is set AND Next.js Draft Mode is enabled for the request. Falls back to the
// write token (which also has read access) so preview works without needing a
// separate dedicated read token. This token is server-only (never NEXT_PUBLIC),
// so it is never exposed to the browser.
// Prefer the write token for the draft client: it reliably has permission to
// read draft (unpublished) documents, whereas a "Viewer"-role read token often
// does NOT — which silently breaks preview of never-published pages.
const readToken =
  process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN
const draftClient = readToken
  ? createClient({ projectId, dataset, apiVersion, useCdn: false, token: readToken, perspective: 'drafts' })
  : null

async function isPreview(): Promise<boolean> {
  if (!draftClient) return false
  try {
    const { draftMode } = await import('next/headers')
    return (await draftMode()).isEnabled
  } catch {
    return false // no request scope (e.g. build-time generateStaticParams)
  }
}

// Draft-aware clients. When Draft Mode is on they read drafts (fresh, no cache);
// otherwise they behave exactly like the published clients. Call sites use
// `.fetch(...)` unchanged.
//
// The draft fetch is fault-tolerant: if it throws (missing/invalid read token,
// insufficient permissions, transient API error), we log the real cause and
// fall back to the published client so preview never hard-crashes the page.
async function draftAwareFetch<R>(
  fallback: (q: string, p: any, o: any) => Promise<R>,
  query: string,
  params: any,
  options: any
): Promise<R> {
  if (await isPreview()) {
    try {
      return await draftClient!.fetch<R>(query, params, { cache: 'no-store' })
    } catch (err) {
      console.error('[preview] draft fetch failed, falling back to published:', err)
      return fallback(query, params, options)
    }
  }
  return fallback(query, params, options)
}

export const client = {
  fetch: <R = any>(query: string, params: any = {}, options: any = {}): Promise<R> =>
    draftAwareFetch<R>((q, p, o) => publishedClient.fetch<R>(q, p, o), query, params, options),
}

export const clientNoCdn = {
  fetch: <R = any>(query: string, params: any = {}, options: any = {}): Promise<R> =>
    draftAwareFetch<R>((q, p, o) => publishedNoCdnClient.fetch<R>(q, p, o), query, params, options),
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getPosts(limit = 20, categorySlug?: string) {
  const filter = categorySlug
    ? `*[_type == "post" && defined(publishedAt) && category->slug.current == $categorySlug]`
    : `*[_type == "post" && defined(publishedAt)]`

  return client.fetch(
    `${filter} | order(publishedAt desc) [0...$limit] {
      _id, title, slug, excerpt, publishedAt, readingTime,
      "featuredImage": featuredImage { "url": asset->url, alt },
      category-> { name, slug, emoji }
    }`,
    { limit, categorySlug: categorySlug ?? '' }
  )
}

export async function getPostBySlug(slug: string) {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id, title, slug, excerpt, publishedAt, readingTime,
      "lastUpdated": _updatedAt,
      "dateModified": _updatedAt,
      "datePublished": coalesce(publishedAt, _createdAt),
      "body": body[] {
    ...,
    _type == "elselskabKortBlock" => {
      ...,
      customTitle, customBody, pros, cons,
      "imageUrl": image.asset->url,
      "elselskab": elselskab-> {
        name, score, url, usp, offer, ctaText, terms,
        "slug": slug.current,
        "logoUrl": logo.asset->url,
        "logoAlt": logo.alt,
      }
    }
  },
      "featuredImage": featuredImage { "url": asset->url, alt },
      "ogImage": ogImage { "url": asset->url, alt },
      metaTitle, metaDescription,
      category-> { name, slug, emoji },
      author-> { name, slug, bio, linkedin, "imageUrl": image.asset->url }
    }`,
    { slug }
  )
}

// ─── Shared body projection (expands custom block references) ────────────────
export const BODY_PROJECTION = `"body": body[] {
    ...,
    _type == "elselskabKortBlock" => {
      ...,
      customTitle, customBody, pros, cons,
      "imageUrl": image.asset->url,
      "elselskab": elselskab-> {
        name, score, url, usp, offer, ctaText, terms,
        "slug": slug.current,
        "logoUrl": logo.asset->url,
        "logoAlt": logo.alt,
      }
    }
  }`

// ─── Comparison table fragment ─────────────────────────────────────────────────
// Pages store showComparisonTable (bool) + comparisonTemplate (reference).
// We expand the reference inline so the frontend gets the same data shape.
export const ELSELSKAB_CARD_FIELDS = `
  _id, name, slug, usp, score, url, offer, ctaText, terms, priceAreas,
  greenEnergy, hasApp, trustpilotScore,
  "logo": logo { "url": asset->url, alt }
`

export const ELAFTALE_FIELDS = `
  _id, name, priceType, priceAreas, monthlyFee, markup, fixedPrice,
  bindingMonths, noticePeriod, introOffer, greenPower, highlight, notes,
  "url": coalesce(url, elselskab->url),
  "elselskab": elselskab-> { ${ELSELSKAB_CARD_FIELDS} }
`

const COMPARISON_TABLE_FRAGMENT = `
  showComparisonTable, comparisonTableTitle,
  heroCompareButton, heroCompareButtonText,
  "comparisonTable": comparisonTemplate-> {
    tableType,
    "elaftaler": elaftaler[@->active != false]-> { ${ELAFTALE_FIELDS} },
    "elselskaber": elselskaber[]-> { ${ELSELSKAB_CARD_FIELDS} }
  }
`

// ─── Pages ────────────────────────────────────────────────────────────────────

// Page fields shared by single and nested lookups
const PAGE_FIELDS = `
  _id, title, slug, intro, metaTitle, metaDescription,
  ${BODY_PROJECTION},
  "a1Slug": parent->slug.current,
  "a1Title": parent->title,
  "a2Slug": parent->parent->slug.current,
  "a2Title": parent->parent->title,
  "a3Slug": parent->parent->parent->slug.current,
  "a3Title": parent->parent->parent->title,
  "a4Slug": parent->parent->parent->parent->slug.current,
  "a4Title": parent->parent->parent->parent->title,
  "featuredImage": featuredImage { "url": asset->url, alt },
  "lastUpdated": _updatedAt,
  "dateModified": _updatedAt,
  "datePublished": coalesce(publishedAt, _createdAt),
  "heroQuickLinks": heroQuickLinks[] { label, headingText },
  hideAuthor,
  "author": author-> {
    name, slug, bio, linkedin, x, facebook,
    "imageUrl": image.asset->url
  },
  "factChecker": factChecker-> {
    name, slug, linkedin,
    "imageUrl": image.asset->url
  },
  ${COMPARISON_TABLE_FRAGMENT}
`

export async function getPageBySlug(slug: string) {
  return client.fetch(
    `*[_type == "page" && slug.current == $slug && !defined(parent)][0] { ${PAGE_FIELDS} }`,
    { slug }
  )
}

/** Build a dynamic ancestor filter for any path depth (up to 5 levels) */
function buildAncestorFilter(segments: string[]): { conditions: string; params: Record<string, string> } {
  const reversed = [...segments].reverse() // [child, parent, grandparent, ...]
  const params: Record<string, string> = {}
  const conditions = reversed.map((seg, i) => {
    const key = `seg${i}`
    params[key] = seg
    return `${'parent->'.repeat(i)}slug.current == $${key}`
  })
  // Anchor the chain to the root: the topmost matched segment must itself have
  // no parent. Without this, a partial path matches a deeper page — e.g.
  // /spotpris/ would match a page that actually lives at /elpriser/spotpris/,
  // since only the immediate parent is checked.
  conditions.push(`!defined(${'parent->'.repeat(segments.length - 1)}parent)`)
  return { conditions: conditions.join(' && '), params }
}

/** Resolve a page by its full URL path — supports any depth up to 5 segments */
export async function getPageByPath(segments: string[]) {
  if (segments.length === 1) return getPageBySlug(segments[0])
  const { conditions, params } = buildAncestorFilter(segments)
  return client.fetch(
    `*[_type == "page" && ${conditions}][0] { ${PAGE_FIELDS} }`,
    params
  )
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories() {
  return client.fetch(
    `*[_type == "category"] | order(name asc) { _id, name, slug, emoji, description }`
  )
}

// ─── Elselskaber ──────────────────────────────────────────────────────────────

export async function getElselskaber() {
  return client.fetch(
    `*[_type == "elselskab" && defined(slug.current)] | order(coalesce(score, 0) desc, lower(name) asc) {
      ${ELSELSKAB_CARD_FIELDS},
      "cheapest": *[_type == "elaftale" && active != false && elselskab._ref == ^._id] | order(coalesce(monthlyFee, 999) asc)[0] { ${ELAFTALE_FIELDS} }
    }`
  )
}

export async function getElselskabBySlug(slug: string) {
  return client.fetch(
    `*[_type == "elselskab" && slug.current == $slug][0] {
      ${ELSELSKAB_CARD_FIELDS},
      titel, intro, pros, cons, founded, trustpilotUrl, evCharging, customerService,
      ${BODY_PROJECTION},
      "ogImage": ogImage { "url": asset->url, alt },
      metaTitle, metaDescription,
      "lastUpdated": _updatedAt,
      "datePublished": _createdAt,
      "author": author-> {
        name, slug, bio, linkedin, x, facebook,
        "imageUrl": image.asset->url
      },
      "elaftaler": *[_type == "elaftale" && active != false && elselskab._ref == ^._id] | order(coalesce(monthlyFee, 999) asc) { ${ELAFTALE_FIELDS} }
    }`,
    { slug }
  )
}

export async function getElaftaler(opts: { priceType?: string; area?: string } = {}) {
  const conds = ['_type == "elaftale"', 'active != false', 'defined(elselskab)']
  if (opts.priceType) conds.push('priceType == $priceType')
  if (opts.area) conds.push('$area in priceAreas')
  return client.fetch(
    `*[${conds.join(' && ')}] | order(coalesce(monthlyFee, 999) asc, coalesce(markup, fixedPrice, 999) asc) { ${ELAFTALE_FIELDS} }`,
    { priceType: opts.priceType ?? '', area: opts.area ?? '' }
  )
}

// ─── Site settings (menus) ────────────────────────────────────────────────────
// Wrapped in React cache() so Navbar + Footer share one fetch per page render.

// ── Nav link projection (nested children → multi-level sub-menus) ───────────────
const navSlugFields = `"pageSlug": pageRef->slug.current, "pageParentSlug": pageRef->parent->slug.current, "pageParent2Slug": pageRef->parent->parent->slug.current, "pageParent3Slug": pageRef->parent->parent->parent->slug.current, "pageParent4Slug": pageRef->parent->parent->parent->parent->slug.current, "elselskabSlug": elselskabRef->slug.current, "postSlug": postRef->slug.current, "guideSlug": guideRef->slug.current`
const navChildren = (depth: number): string =>
  depth <= 0 ? '' : `, children[] { label, url, ${navSlugFields}${navChildren(depth - 1)} }`
const headerNavProjection = `headerNav[] { label, url, isHighlighted, icon, ${navSlugFields}${navChildren(3)} }`

export const getSiteSettings = cache(async () => {
  return client.fetch(
    `*[_type == "siteSettings"][0] {
      "logoUrl": logo.asset->url,
      "logoWhiteUrl": logoWhite.asset->url,
      "defaultAuthor": defaultAuthor-> {
        name, slug, bio, linkedin, x, facebook,
        "imageUrl": image.asset->url
      },
      ${headerNavProjection},
      footerTagline,
      relatedPagesTitle,
      showPromoPopup,
      socialLinks,
      footerColumns[] {
        title,
        items[] { label, url, ${navSlugFields} }
      },
      footerLongDisclaimer,
      footerLinkCloudTitle,
      footerLinkCloud[] { label, url },
      footerMediaLogos[] { alt, url, "imageUrl": image.asset->url },
      footerTrustIcons[] { alt, url, "imageUrl": image.asset->url },
      footerNote,
      footerDisclaimer,
      footerBottomNav[] { label, url, ${navSlugFields} }
    }`,
    {},
    { next: { revalidate: 3600 } }
  )
})

// ─── Homepage ─────────────────────────────────────────────────────────────────

export async function getHomepage() {
  return client.fetch(
    `*[_type == "homepage" && _id == "homepage"][0] {
      heroHeading, heroGreenText, intro,
      ${BODY_PROJECTION},
      howItWorksTitle, showHowItWorks, howItWorksItems,
      latestSectionTitle, elselskaberTitle, showElselskaber,
      "trustItems": trustItems[] { _key, icon, title, body },
      metaTitle, metaDescription,
      "featuredImage": featuredImage { "url": asset->url, alt },
      ${COMPARISON_TABLE_FRAGMENT}
    }`
  )
}

// ─── Related pages (bottom-of-page internal linking) ──────────────────────────

export type RelatedItem = {
  _id: string
  _type: string
  title?: string
  name?: string
  /** Editor-supplied link text that overrides the target's own title. */
  label?: string
  slug?: { current?: string }
  a1?: string
  a2?: string
  a3?: string
  a4?: string
}

const RELATED_PROJECTION = `
  _id, _type, title, name, slug,
  "a1": parent->slug.current,
  "a2": parent->parent->slug.current,
  "a3": parent->parent->parent->slug.current,
  "a4": parent->parent->parent->parent->slug.current
`

/** Builds the public URL for a related item, based on its own type. */
export function relatedItemHref(item: RelatedItem): string {
  const slug = item.slug?.current
  if (!slug) return '/'
  switch (item._type) {
    case 'page': {
      const segments = [item.a4, item.a3, item.a2, item.a1, slug].filter(Boolean)
      return `/${segments.join('/')}/`
    }
    case 'guide':
      return `/guides/${slug}/`
    case 'elselskab':
      return `/elselskaber-i-danmark/${slug}/`
    case 'post':
      return `/${slug}/`
    default:
      return `/${slug}/`
  }
}

/**
 * Resolves the "Related pages" block for a document.
 * Hand-picked only — nothing is shown unless an editor adds entries.
 * Each entry may carry a custom `label` that overrides the target's own title.
 * Fetches everything it needs from the document id, so page templates don't
 * need any GROQ changes.
 */
export const getRelatedContent = cache(async (
  docId: string,
  limit = 12
): Promise<{ title?: string; items: RelatedItem[] }> => {
  if (!docId) return { items: [] }

  const self = await client.fetch<{
    relatedTitle?: string
    related?: { ref?: string; label?: string }[]
  } | null>(
    // `coalesce(page._ref, _ref)` supports both the current object shape
    // ({ page, label }) and any entries saved as plain references before.
    `*[_id == $docId][0] {
      relatedTitle,
      "related": relatedPages[] {
        "ref": coalesce(page._ref, _ref),
        label
      }
    }`,
    { docId }
  )

  if (!self) return { items: [] }

  const title = self.relatedTitle
  const picked = (self.related || []).filter((r) => r?.ref)
  if (picked.length === 0) return { title, items: [] }

  const ids = picked.map((r) => r.ref!) as string[]
  const labelById = new Map(picked.map((r) => [r.ref!, r.label]))

  const rows: RelatedItem[] = await client.fetch(
    `*[_id in $ids && defined(slug.current)] { ${RELATED_PROJECTION} }`,
    { ids }
  )
  const byId = new Map(rows.map((r) => [r._id, r]))

  const items = ids
    .map((id) => {
      const row = byId.get(id)
      if (!row) return null
      const label = labelById.get(id)
      return label ? { ...row, label } : row
    })
    .filter(Boolean)
    .slice(0, Math.max(1, limit)) as RelatedItem[]

  return { title, items }
})

/**
 * Resolves a hand-picked list of documents for the "Page links" body block.
 * Order is preserved; missing/unpublished targets are dropped.
 */
export const getLinkedPages = cache(async (ids: string[]): Promise<RelatedItem[]> => {
  const clean = (ids || []).filter(Boolean)
  if (clean.length === 0) return []

  const rows: RelatedItem[] = await client.fetch(
    `*[_id in $ids && defined(slug.current)] { ${RELATED_PROJECTION} }`,
    { ids: clean }
  )
  const byId = new Map(rows.map((r) => [r._id, r]))
  return clean.map((id) => byId.get(id)).filter(Boolean) as RelatedItem[]
})

// ─── Author lookup (for the callout / quote body block) ───────────────────────

export type QuoteAuthor = {
  _id: string
  name?: string
  role?: string
  slug?: { current?: string }
  imageUrl?: string
}

export const getAuthorById = cache(async (id: string): Promise<QuoteAuthor | null> => {
  if (!id) return null
  return client.fetch(
    `*[_type == "author" && _id == $id][0] {
      _id, name, role, slug, "imageUrl": image.asset->url
    }`,
    { id }
  )
})

// ─── Guides ───────────────────────────────────────────────────────────────────

export async function getGuideBySlug(slug: string) {
  return client.fetch(
    `*[_type == "guide" && slug.current == $slug][0] { ${PAGE_FIELDS} }`,
    { slug }
  )
}

/** List of guides for the archive grid (light projection). */
export async function getGuides() {
  return client.fetch(
    `*[_type == "guide" && defined(slug.current)] | order(title asc) {
      _id, title, "slug": slug.current, metaDescription, "lastUpdated": _updatedAt,
      "featuredImage": featuredImage { "url": asset->url, alt }
    }`
  )
}

// ─── Authors ──────────────────────────────────────────────────────────────────

export async function getAuthorBySlug(slug: string) {
  return clientNoCdn.fetch(
    `*[_type == "author" && slug.current == $slug][0] {
      _id, name, slug, role, bio, intro, education, expertise, linkedin, x, facebook,
      "imageUrl": image.asset->url,
      metaTitle, metaDescription,
      "body": body[] {
        ...,
        _type == "image" => { ..., "url": asset->url }
      }
    }`,
    { slug }
  )
}

export async function getElselskaberByAuthor(authorId: string, limit = 20) {
  return client.fetch(
    `*[_type == "elselskab" && defined(slug.current) && author._ref == $authorId] | order(_createdAt desc) [0...$limit] {
      _id, name, slug, usp, score,
      "logo": logo { "url": asset->url, alt }
    }`,
    { authorId, limit }
  )
}

export async function getPostsByAuthor(authorId: string, limit = 20) {
  return client.fetch(
    `*[_type == "post" && defined(publishedAt) && author._ref == $authorId]
     | order(publishedAt desc) [0...$limit] {
      _id, title, slug, excerpt, publishedAt, readingTime,
      "featuredImage": featuredImage { "url": asset->url, alt },
      category-> { name, slug, emoji }
    }`,
    { authorId, limit }
  )
}

export async function getAuthorPaths() {
  return clientNoCdn.fetch<Array<{ slug: { current: string } }>>(
    `*[_type == "author" && defined(slug.current)] { slug }`
  ).catch(() => [])
}

