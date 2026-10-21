import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { getRelatedContent, relatedItemHref, getSiteSettings } from '@/lib/sanity'

interface RelatedPagesProps {
  /** The current document's _id. Everything else is resolved from it. */
  docId?: string
  limit?: number
}

/**
 * "Other pages you may like" — bottom-of-page internal linking.
 * Uses hand-picked references when set, otherwise falls back to sibling pages
 * under the same parent (or other entries of the same type + market).
 * Resolves its own data so page templates need no GROQ changes.
 */
export async function RelatedPages({ docId, limit = 1000 }: RelatedPagesProps) {
  if (!docId) return null

  let data: { title?: string; items: any[] } = { items: [] }
  let settings: any = null
  try {
    ;[data, settings] = await Promise.all([
      getRelatedContent(docId, limit),
      getSiteSettings().catch(() => null),
    ])
  } catch {
    return null
  }

  const items = data?.items ?? []
  if (items.length === 0) return null

  const heading =
    data.title || settings?.relatedPagesTitle || 'Andre sider du måske kan lide'

  return (
    <div className="section" style={{ paddingTop: '0' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(20px, 2.5vw, 26px)',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '18px',
        }}
      >
        {heading}
      </h2>

      <div className="related-grid">
        {items.map((item) => {
          const label = item.label || item.title || item.name || 'Læs mere'
          return (
            <Link
              key={item._id}
              href={relatedItemHref(item)}
              className="related-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  fontSize: '14.5px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  lineHeight: 1.35,
                }}
              >
                {label}
              </span>
              <Icon name="arrow-right" size={17} color="var(--green)" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
