import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { Icon } from '@/components/Icon'
import { elselskabHref } from '@/lib/elpris'

const bodyComponents = {
  block: { normal: ({ children }: any) => <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.65 }}>{children}</p> },
  list: {
    bullet: ({ children }: any) => <ul style={{ paddingLeft: '18px', margin: '0 0 8px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65 }}>{children}</ul>,
    number: ({ children }: any) => <ol style={{ paddingLeft: '18px', margin: '0 0 8px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65 }}>{children}</ol>,
  },
  listItem: { bullet: ({ children }: any) => <li>{children}</li>, number: ({ children }: any) => <li>{children}</li> },
  marks: {
    strong: ({ children }: any) => <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
  },
}

interface ElselskabKortData {
  customTitle?: string
  customBody?: any[]
  imageUrl?: string | null
  pros?: string[]
  cons?: string[]
  elselskab?: {
    name: string
    slug?: string
    score?: number | null
    usp?: string | null
    offer?: string | null
    ctaText?: string | null
    terms?: string | null
    logoUrl?: string | null
    logoAlt?: string | null
    url?: string | null
  }
}

/** Body block: a card for one electricity company. */
export function ElselskabKort({ value }: { value: ElselskabKortData }) {
  const es = value.elselskab
  if (!es) return null

  const name = value.customTitle || es.name
  const stars = es.score ? Math.round(es.score / 2) : null
  const hasPros = (value.pros?.length ?? 0) > 0
  const hasCons = (value.cons?.length ?? 0) > 0

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', margin: '24px 0' }}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
          {es.logoUrl && (
            <div style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid var(--border-faint)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={es.logoUrl} alt={es.logoAlt || name} style={{ width: '60px', height: '60px', objectFit: 'contain', display: 'block' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 3px' }}>{name}</h3>
            {stars !== null && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                <span style={{ marginLeft: '4px' }}>{es.score?.toFixed(1)}/10</span>
              </div>
            )}
            {es.usp && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{es.usp}</div>}
          </div>
        </div>

        {value.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.imageUrl} alt={name} style={{ width: '100%', borderRadius: '8px', display: 'block', marginBottom: '14px', maxHeight: '260px', objectFit: 'cover' }} />
        )}

        {value.customBody && value.customBody.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <PortableText value={value.customBody} components={bodyComponents} />
          </div>
        )}

        {(hasPros || hasCons) && (
          <div className="pros-cons-grid">
            {hasPros && (
              <div style={{ flex: 1, minWidth: '140px', border: '1px solid rgba(46,123,214,0.35)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Icon name="check-circle" size={14} color="var(--green)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)' }}>Fordele</span>
                </div>
                {value.pros!.map((pro, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.5 }}>
                    <Icon name="check-circle" size={14} color="var(--green)" style={{ flexShrink: 0, marginTop: '1px' }} /><span>{pro}</span>
                  </div>
                ))}
              </div>
            )}
            {hasCons && (
              <div style={{ flex: 1, minWidth: '140px', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Icon name="close-circle" size={14} color="#ef4444" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>Ulemper</span>
                </div>
                {value.cons!.map((con, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.5 }}>
                    <Icon name="close-circle" size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} /><span>{con}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {es.offer && (
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)', margin: '14px 0 10px', textAlign: 'center' }}>{es.offer}</div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
          {es.url && (
            <a href={es.url} target="_blank" rel="nofollow noopener noreferrer sponsored"
              style={{ flex: '1 1 200px', display: 'block', background: 'var(--green-dark)', color: '#fff', padding: '13px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              {es.ctaText || `Gå til ${es.name}`} →
            </a>
          )}
          {es.slug && (
            <Link href={elselskabHref(es.slug)}
              style={{ flex: '0 1 auto', display: 'block', border: '1px solid var(--border)', color: 'var(--text)', padding: '13px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              Læs anmeldelse
            </Link>
          )}
        </div>
        {es.terms && <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '10px 0 0', lineHeight: 1.5 }}>{es.terms}</p>}
      </div>
    </div>
  )
}
