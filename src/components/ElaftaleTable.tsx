'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Icon } from './Icon'
import { PRICE_TYPE_LABEL, kr, binding, kwhPriceLabel, elselskabHref } from '@/lib/elpris'

export interface Elaftale {
  _id: string
  name: string
  priceType?: 'spot' | 'fixed' | 'variable'
  priceAreas?: string[]
  monthlyFee?: number | null
  markup?: number | null
  fixedPrice?: number | null
  bindingMonths?: number | null
  noticePeriod?: string | null
  introOffer?: string | null
  greenPower?: boolean
  highlight?: string | null
  notes?: string | null
  url?: string | null
  elselskab?: {
    _id: string
    name: string
    slug?: { current?: string }
    score?: number | null
    usp?: string | null
    ctaText?: string | null
    logo?: { url?: string; alt?: string }
  }
}

const LABEL: React.CSSProperties = {
  fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase',
  letterSpacing: '0.5px', fontWeight: 600, marginBottom: '3px',
}
const VALUE: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: 'var(--text)' }

type Area = 'all' | 'DK1' | 'DK2'

/**
 * Comparison list of electricity agreements with simple client-side filters
 * (price area, price type, intro offers). Order = editor's order in the template.
 */
export function ElaftaleTable({ items, showFilters = true }: { items: Elaftale[]; showFilters?: boolean }) {
  const [area, setArea] = useState<Area>('all')
  const [type, setType] = useState<string>('all')
  const [introOnly, setIntroOnly] = useState(false)

  const types = useMemo(() => Array.from(new Set(items.map((i) => i.priceType).filter(Boolean))) as string[], [items])

  const shown = items.filter((a) => {
    if (area !== 'all' && a.priceAreas?.length && !a.priceAreas.includes(area)) return false
    if (type !== 'all' && a.priceType !== type) return false
    if (introOnly && !a.introOffer) return false
    return true
  })

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--green)' : 'var(--border)'}`,
    background: active ? 'var(--green)' : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text)',
  })

  return (
    <div>
      {showFilters && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px', alignItems: 'center' }}>
          <button type="button" style={pill(area === 'all')} onClick={() => setArea('all')}>Hele landet</button>
          <button type="button" style={pill(area === 'DK1')} onClick={() => setArea('DK1')}>Vest (DK1)</button>
          <button type="button" style={pill(area === 'DK2')} onClick={() => setArea('DK2')}>Øst (DK2)</button>
          {types.length > 1 && (
            <>
              <span style={{ width: '1px', height: '22px', background: 'var(--border)', margin: '0 4px' }} />
              <button type="button" style={pill(type === 'all')} onClick={() => setType('all')}>Alle typer</button>
              {types.map((t) => (
                <button key={t} type="button" style={pill(type === t)} onClick={() => setType(t)}>{PRICE_TYPE_LABEL[t] || t}</button>
              ))}
            </>
          )}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginLeft: 'auto', cursor: 'pointer' }}>
            <input type="checkbox" checked={introOnly} onChange={(e) => setIntroOnly(e.target.checked)} />
            Kun introtilbud
          </label>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {shown.map((a, i) => {
          const es = a.elselskab
          const kwh = kwhPriceLabel(a)
          return (
            <div key={a._id} style={{
              position: 'relative', background: 'var(--bg-card)',
              border: i === 0 ? '2px solid var(--green)' : '1px solid var(--border)',
              borderRadius: '12px', padding: '18px 20px',
            }}>
              {a.highlight && (
                <span style={{
                  position: 'absolute', top: '-11px', left: '20px',
                  background: 'var(--green)', color: '#fff', fontSize: '11.5px', fontWeight: 600,
                  padding: '3px 12px', borderRadius: '20px',
                }}>{a.highlight}</span>
              )}
              <div className="elaftale-row">
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{ width: '64px', height: '48px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '8px', border: '1px solid var(--border-faint)' }}>
                    {es?.logo?.url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={es.logo.url} alt={es.logo.alt || es.name} style={{ maxWidth: '88%', maxHeight: '80%', objectFit: 'contain' }} />
                      : <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{es?.name}</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {es?.slug?.current
                      ? <Link href={elselskabHref(es.slug)} style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>{es.name}</Link>
                      : <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700 }}>{es?.name}</span>}
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {a.name}{PRICE_TYPE_LABEL[a.priceType || 'spot'] !== a.name && ` · ${PRICE_TYPE_LABEL[a.priceType || 'spot']}`}
                      {a.greenPower && <span title="Grøn strøm" style={{ marginLeft: '6px', color: 'var(--green)' }}>🌱</span>}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div><div style={LABEL}>Abonnement</div><div style={VALUE}>{a.monthlyFee != null ? `${kr(a.monthlyFee)}/md.` : '–'}</div></div>
                <div><div style={LABEL}>{kwh.label}</div><div style={VALUE}>{kwh.value}</div></div>
                <div><div style={LABEL}>Binding</div><div style={VALUE}>{binding(a.bindingMonths)}</div></div>

                {/* CTA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="nofollow noopener noreferrer sponsored"
                      style={{ background: 'var(--green)', color: '#fff', padding: '11px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {es?.ctaText || 'Se tilbud'} →
                    </a>
                  )}
                  {es?.slug?.current && (
                    <Link href={elselskabHref(es.slug)} style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', textDecoration: 'none' }}>
                      Læs anmeldelse
                    </Link>
                  )}
                </div>
              </div>

              {(a.introOffer || a.notes) && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-faint)', display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '13px' }}>
                  {a.introOffer && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--green)', fontWeight: 600 }}>
                      <Icon name="gift" size={15} color="var(--green)" /> {a.introOffer}
                    </span>
                  )}
                  {a.notes && <span style={{ color: 'var(--text-faint)' }}>{a.notes}</span>}
                </div>
              )}
            </div>
          )
        })}
        {shown.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
            Ingen elaftaler matcher dine filtre.
          </div>
        )}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '12px', lineHeight: 1.5 }}>
        Priserne er elselskabets egne tillæg og abonnement inkl. moms. Spotpris, transport, afgifter og nettarif kommer oveni. Siden indeholder affiliate-links.
      </p>
    </div>
  )
}
