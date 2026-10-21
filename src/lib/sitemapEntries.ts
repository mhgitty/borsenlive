import { client } from '@/lib/sanity'
import { BASE } from '@/lib/site'

export type SitemapEntry = { url: string; lastModified?: Date }

function lastMod(date?: string): { lastModified: Date } | Record<string, never> {
  return date ? { lastModified: new Date(date) } : {}
}

type SlugRow = { slug: { current: string }; _updatedAt?: string }
type PageRow = SlugRow & { a1?: string; a2?: string; a3?: string; a4?: string }
type PostRow = { slug: { current: string }; publishedAt?: string; _updatedAt?: string }

// Static index routes that always exist.
const INDEX_PATHS = ['/', '/elselskaber/', '/guides/', '/nyheder/']

export async function sitemapEntries(): Promise<SitemapEntry[]> {
  const [pages, elselskaber, guides, posts, authors] = await Promise.all([
    client.fetch<PageRow[]>(
      `*[_type == "page" && defined(slug.current)] {
        slug, _updatedAt,
        "a1": parent->slug.current, "a2": parent->parent->slug.current,
        "a3": parent->parent->parent->slug.current, "a4": parent->parent->parent->parent->slug.current
      }`
    ).catch(() => []),
    client.fetch<SlugRow[]>(`*[_type == "elselskab" && defined(slug.current)] { slug, _updatedAt }`).catch(() => []),
    client.fetch<SlugRow[]>(`*[_type == "guide" && defined(slug.current)] { slug, _updatedAt }`).catch(() => []),
    client.fetch<PostRow[]>(`*[_type == "post" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc) { slug, publishedAt, _updatedAt }`).catch(() => []),
    client.fetch<SlugRow[]>(`*[_type == "author" && defined(slug.current)] { slug, _updatedAt }`).catch(() => []),
  ])

  // Pages whose slug collides with an index route (e.g. the "elselskaber" CMS page
  // that feeds the archive's hero) are already covered by INDEX_PATHS.
  const indexSet = new Set(INDEX_PATHS)

  return [
    ...INDEX_PATHS.map((p) => ({ url: `${BASE}${p}` })),
    ...pages
      .map((p) => ({ path: `/${[p.a4, p.a3, p.a2, p.a1, p.slug.current].filter(Boolean).join('/')}/`, p }))
      .filter(({ path }) => !indexSet.has(path))
      .map(({ path, p }) => ({ url: `${BASE}${path}`, ...lastMod(p._updatedAt) })),
    ...elselskaber.map((e) => ({ url: `${BASE}/elselskaber/${e.slug.current}/`, ...lastMod(e._updatedAt) })),
    ...guides.map((g) => ({ url: `${BASE}/guides/${g.slug.current}/`, ...lastMod(g._updatedAt) })),
    ...posts.map((p) => ({ url: `${BASE}/${p.slug.current}/`, ...lastMod(p._updatedAt ?? p.publishedAt) })),
    ...authors.map((a) => ({ url: `${BASE}/forfatter/${a.slug.current}/`, ...lastMod(a._updatedAt) })),
  ]
}
