'use client'
import { useState } from 'react'
import styles from './LadeboksCompare.module.css'

export interface Ladeboks {
  id: string
  provider: string
  ownership: string
  ownershipKey: string
  logoUrl: string
  productImgUrl: string
  reviewUrl: string | null
  ctaUrl: string | null
  title: string
  elaftale: string
  serviceaftale: string
  installation: string
  ladestik: string
  priceDisplay: string
  priceNumeric: number
  installFilter: 'inkluderet' | 'ikke'
  elaftaleFilter: 'paakraevet' | 'ikke'
  isCampaign: boolean
}

type Filters = { ownership: 'ejer' | 'leje'; installation: 'alle' | 'inkluderet'; elaftale: 'alle' | 'ikke' }

// Icons from the plugin (assets/icons/*.svg), inlined so they can be tinted via CSS.
const ICONS = {
  bolt: <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" />,
  service: (
    <>
      <polygon points="18,16 16,16 16,15 8,15 8,16 6,16 6,15 2,15 2,20 22,20 22,15 18,15" />
      <path d="M20,8h-3V6c0-1.1-0.9-2-2-2H9C7.9,4,7,4.9,7,6v2H4c-1.1,0-2,0.9-2,2v4h4v-2h2v2h8v-2h2v2h4v-4C22,8.9,21.1,8,20,8z M15,8 H9V6h6V8z" />
    </>
  ),
  installation: (
    <>
      <path d="M21.67,18.17l-5.3-5.3h-0.99l-2.54,2.54v0.99l5.3,5.3c0.39,0.39,1.02,0.39,1.41,0l2.12-2.12 C22.06,19.2,22.06,18.56,21.67,18.17z" />
      <path d="M17.34,10.19l1.41-1.41l2.12,2.12c1.17-1.17,1.17-3.07,0-4.24l-3.54-3.54l-1.41,1.41V1.71L15.22,1l-3.54,3.54l0.71,0.71 h2.83l-1.41,1.41l1.06,1.06l-2.89,2.89L7.85,6.48V5.06L4.83,2.04L2,4.87l3.03,3.03h1.41l4.13,4.13l-0.85,0.85H7.6l-5.3,5.3 c-0.39,0.39-0.39,1.02,0,1.41l2.12,2.12c0.39,0.39,1.02,0.39,1.41,0l5.3-5.3v-2.12l5.15-5.15L17.34,10.19z" />
    </>
  ),
  kabel: <path d="M20,5V4c0-0.55-0.45-1-1-1h-2c-0.55,0-1,0.45-1,1v1h-1v4c0,0.55,0.45,1,1,1h1v7c0,1.1-0.9,2-2,2s-2-0.9-2-2V7 c0-2.21-1.79-4-4-4S5,4.79,5,7v7H4c-0.55,0-1,0.45-1,1v4h1v1c0,0.55,0.45,1,1,1h2c0.55,0,1-0.45,1-1v-1h1v-4c0-0.55-0.45-1-1-1H7 V7c0-1.1,0.9-2,2-2s2,0.9,2,2v10c0,2.21,1.79,4,4,4s4-1.79,4-4v-7h1c0.55,0,1-0.45,1-1V5H20z" />,
}

function Toggle<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: [{ value: T; label: string }, { value: T; label: string }]
  onChange: (v: T) => void
}) {
  const second = value === options[1].value
  return (
    <div className={styles.filterGroup} role="group" aria-label={label}>
      <span className={styles.filterLabel}>{label}</span>
      <div className={styles.toggle}>
        <span className={styles.thumb} style={{ transform: second ? 'translateX(100%)' : undefined }} />
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            className={`${styles.toggleBtn} ${value === o.value ? styles.toggleBtnActive : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Feature({ icon, label, value }: { icon: keyof typeof ICONS; label: string; value: string }) {
  return (
    <div className={styles.feature}>
      <div className={styles.featureLabel}>
        <svg className={styles.featureIcon} viewBox="0 0 24 24" aria-hidden="true">{ICONS[icon]}</svg>
        {label}
      </div>
      <div className={styles.featureValue}>{value}</div>
    </div>
  )
}

export function LadeboksCompareClient({ products }: { products: Ladeboks[] }) {
  const [filters, setFilters] = useState<Filters>({ ownership: 'ejer', installation: 'alle', elaftale: 'alle' })
  const [mobileOpen, setMobileOpen] = useState(false)
  const set = <K extends keyof Filters>(k: K) => (v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }))

  const shown = products.filter((p) => {
    if (p.ownershipKey !== filters.ownership) return false
    if (filters.installation === 'inkluderet' && p.installFilter !== 'inkluderet') return false
    if (filters.elaftale === 'ikke' && p.elaftaleFilter !== 'ikke') return false
    return true
  })

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={`${styles.mobileToggle} ${mobileOpen ? styles.mobileToggleOpen : ''}`}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Filter
      </button>

      <div className={`${styles.filters} ${mobileOpen ? styles.filtersOpen : ''}`}>
        <Toggle label="Ejerskab" value={filters.ownership} onChange={set('ownership')}
          options={[{ value: 'ejer', label: 'Køb' }, { value: 'leje', label: 'Leje' }]} />
        <Toggle label="Installation" value={filters.installation} onChange={set('installation')}
          options={[{ value: 'alle', label: 'Alle' }, { value: 'inkluderet', label: 'Inkluderet' }]} />
        <Toggle label="Elaftale" value={filters.elaftale} onChange={set('elaftale')}
          options={[{ value: 'alle', label: 'Alle' }, { value: 'ikke', label: 'Ikke påkrævet' }]} />
      </div>

      <div className={styles.list}>
        {shown.length === 0 && (
          <p className={styles.empty}>Ingen ladebokse matcher de valgte filtre.</p>
        )}
        {shown.map((p) => (
          <article key={p.id} className={styles.card}>
            {p.isCampaign && <div className={styles.ribbon}>Kampagnepris</div>}
            <div className={styles.inner}>
              <div className={styles.colLeft}>
                {p.logoUrl && (
                  <div className={styles.logo}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.logoUrl} alt={p.provider} loading="lazy" />
                  </div>
                )}
                {p.productImgUrl && (
                  <div className={styles.productImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.productImgUrl} alt={p.title} loading="lazy" />
                  </div>
                )}
                {p.reviewUrl && <a className={styles.reviewLink} href={p.reviewUrl}>Læs anmeldelse</a>}
              </div>

              <div className={styles.colMiddle}>
                <div className={styles.titleRow}>
                  <span className={styles.title}>{p.title}</span>
                  {p.ownership && <span className={styles.tag}>{p.ownership}-løsning</span>}
                </div>
                <div className={styles.grid}>
                  <Feature icon="bolt" label="El-aftale" value={p.elaftale} />
                  <Feature icon="service" label="Serviceaftale" value={p.serviceaftale} />
                  <Feature icon="installation" label="Installation" value={p.installation} />
                  <Feature icon="kabel" label="Ladekabel/stik" value={p.ladestik} />
                </div>
              </div>

              <div className={styles.colRight}>
                <div className={styles.priceBlock}>
                  <div className={styles.priceLabel}>Pris for ladeboks</div>
                  <div className={styles.priceNumber}>{p.priceDisplay}</div>
                </div>
                {p.ctaUrl && (
                  <a className={styles.cta} href={p.ctaUrl} target="_blank" rel="nofollow sponsored noopener">Gå til udbyder</a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
