import { PortableText } from '@portabletext/react'

interface HowToItem {
  title?: string
  body?: string | any[]
}

// Plain-text extraction from a Portable Text array (or a plain string) for
// use in the HowTo structured data.
function toPlainText(body?: string | any[]): string {
  if (!body) return ''
  if (typeof body === 'string') return body
  return body
    .map((blk) => (blk?.children || []).map((c: any) => c?.text || '').join(''))
    .join(' ')
    .trim()
}

const stepBodyComponents = {
  block: {
    normal: ({ children }: any) => (
      <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{children}</p>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong style={{ fontWeight: 600, color: 'var(--text)' }}>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    link: ({ value, children }: any) => {
      const rel = ['noopener', 'noreferrer', value?.nofollow ? 'nofollow' : ''].filter(Boolean).join(' ')
      return (
        <a href={value?.href} target={value?.blank ? '_blank' : undefined} rel={rel}
          style={{ color: 'var(--green)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          {children}
        </a>
      )
    },
  },
}

interface HowToBlockProps {
  value: {
    title?: string
    intro?: string
    totalMinutes?: number
    items?: HowToItem[]
  }
}

export function HowToBlock({ value }: HowToBlockProps) {
  if (!value?.items?.length) return null

  const mins = typeof value.totalMinutes === 'number' && value.totalMinutes > 0 ? value.totalMinutes : null

  // Emit HowTo structured data from the steps we already collect.
  const steps = value.items.filter((s) => s?.title || s?.body)
  const howToSchema = steps.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: value.title || 'Sådan gør du',
    ...(value.intro ? { description: value.intro } : {}),
    ...(mins ? { totalTime: `PT${mins}M` } : {}),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      ...(s.title ? { name: s.title } : {}),
      text: toPlainText(s.body) || s.title,
    })),
  } : null

  return (
    <div style={{ margin: '32px 0' }}>
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      {(value.title || mins) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: value.intro ? '10px' : '16px' }}>
          {value.title && (
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px, 2.5vw, 24px)',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}>
              {value.title}
            </h2>
          )}
          {mins && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(26,122,60,0.1)', color: 'var(--green)',
              fontSize: '13px', fontWeight: 700,
              padding: '5px 12px', borderRadius: '20px', flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              ≈ {mins} min
            </span>
          )}
        </div>
      )}

      {value.intro && (
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 18px', maxWidth: '760px' }}>
          {value.intro}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {value.items.map((item, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr',
            columnGap: '18px',
            rowGap: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '26px 28px',
            alignItems: 'center',
          }}>
            {/* Number badge */}
            <div style={{
              width: '36px',
              height: '36px',
              background: 'var(--green)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '15px',
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1,
              }}>
                {i + 1}
              </span>
            </div>

            {/* Title (aligned next to the badge) */}
            {item.title && (
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(18px, 2.2vw, 21px)',
                fontWeight: 700,
                color: 'var(--text)',
                margin: 0,
                letterSpacing: '-0.02em',
                alignSelf: 'center',
              }}>
                {item.title}
              </h3>
            )}

            {/* Body (spans under the title, indented past the badge) */}
            {item.body && (Array.isArray(item.body) ? item.body.length > 0 : true) && (
              <div style={{ gridColumn: '2' }}>
                {Array.isArray(item.body) ? (
                  <PortableText value={item.body} components={stepBodyComponents} />
                ) : (
                  <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                    {item.body}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
