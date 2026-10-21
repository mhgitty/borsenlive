'use client'
import { useEffect, useState } from 'react'

const COOKIE = 'elscomp_promo_dismissed'
const DELAY_MS = 10000

interface Props { name: string; title: string; logo: string | null; campaign: string; href: string; price: string }

export function PromoPopupClient({ name, title, logo, campaign, href, price }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (document.cookie.split('; ').some((c) => c.startsWith(COOKIE + '='))) return
    const t = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  function close() {
    setOpen(false)
    document.cookie = `${COOKIE}=1;max-age=86400;path=/;SameSite=Lax`
  }

  if (!open) return null
  return (
    <div className="promo-wrap" role="dialog" aria-label="Månedens tilbud">
      <div className="promo-popup">
        <button type="button" className="promo-close" aria-label="Luk" onClick={close}>×</button>
        <div className="promo-header">Månedens tilbud</div>
        <div className="promo-body">
          {logo && (
            <div className="promo-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt={name} />
            </div>
          )}
          <div className="promo-info">
            <div className="promo-name">{name}</div>
            <div className="promo-product">{title}</div>
          </div>
          <div className="promo-price">
            <div className="promo-price-label">Estimeret pris</div>
            <div className="promo-price-value">{price} <small>kr./kWh</small></div>
          </div>
        </div>
        {campaign && <div className="promo-campaign">{campaign}</div>}
        <a href={href} className="promo-cta" target="_blank" rel="nofollow sponsored noopener" onClick={close}>Gå til tilbud ›</a>
      </div>
    </div>
  )
}
