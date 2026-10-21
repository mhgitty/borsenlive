import Link from 'next/link'
import { Icon } from './Icon'
import { areaLabel, elselskabHref } from '@/lib/elpris'

export interface ElselskabCardData {
  _id: string
  name: string
  slug?: { current?: string }
  usp?: string | null
  score?: number | null
  url?: string | null
  offer?: string | null
  ctaText?: string | null
  terms?: string | null
  priceAreas?: string[]
  greenEnergy?: boolean
  hasApp?: boolean
  trustpilotScore?: number | null
  logo?: { url?: string; alt?: string }
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'var(--green)' : score >= 6 ? '#ca8a04' : '#dc2626'
  return (
    <span style={{ display: 'inline-block', background: color, color: '#fff', fontSize: '12px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px' }}>
      ★ {score.toFixed(1)}
    </span>
  )
}

/** Ranked list of electricity companies (archive page + comparison template). */
export function ElselskabList({ items }: { items: ElselskabCardData[] }) {
  if (!items?.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((es, i) => (
        <div key={es._id} style={{
          background: 'var(--bg-card)',
          border: i === 0 ? '2px solid var(--green)' : '1px solid var(--border)',
          borderRadius: '12px', overflow: 'hidden', position: 'relative',
        }}>
          {i === 0 && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--green)', color: '#fff', fontSize: '11px', fontWeight: 700, textAlign: 'center', padding: '3px 0' }}>
              ⚡ VORES TOPVALG
            </div>
          )}
          <div className="bookmaker-card-inner" style={{
            display: 'grid', gridTemplateColumns: '40px 100px 1fr auto', gap: '16px',
            padding: i === 0 ? '32px 24px 20px' : '20px 24px', alignItems: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: i < 3 ? 'var(--green)' : 'var(--text-faint)', textAlign: 'center' }}>#{i + 1}</div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {es.logo?.url ? (
                <div style={{ background: '#fff', borderRadius: '8px', padding: '6px 10px', border: '1px solid var(--border-faint)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={es.logo.url} alt={es.logo.alt || es.name} style={{ objectFit: 'contain', maxHeight: '40px', maxWidth: '80px', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '80px', height: '40px', background: 'var(--bg-raised)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-faint)' }}>{es.name}</div>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{es.name}</span>
                {es.score != null && <ScoreBadge score={es.score} />}
              </div>
              {es.usp && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.5 }}>{es.usp}</p>}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icon name="map-point" size={14} color="var(--green)" /> {areaLabel(es.priceAreas)}</span>
                {es.greenEnergy && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icon name="leaf" size={14} color="var(--green)" /> Grøn strøm</span>}
                {es.hasApp && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icon name="smartphone" size={14} color="var(--green)" /> App</span>}
                {es.trustpilotScore != null && <span>Trustpilot {es.trustpilotScore.toFixed(1)}/5</span>}
              </div>
              {es.offer && <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)', marginTop: '8px' }}>{es.offer}</div>}
              {es.terms && <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '6px', lineHeight: 1.4 }}>{es.terms}</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
              {es.url && (
                <a href={es.url} target="_blank" rel="nofollow noopener noreferrer sponsored"
                  style={{ display: 'inline-block', background: 'var(--green)', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  {es.ctaText || 'Se priser'} →
                </a>
              )}
              {es.slug?.current && (
                <Link href={elselskabHref(es.slug)} style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Læs anmeldelse
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
