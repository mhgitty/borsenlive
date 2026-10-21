import Link from 'next/link'
import { getSiteSettings } from '@/lib/sanity'
import { resolveUrl } from './Navbar'
import { replaceDateVars } from '@/lib/dateVars'
import { SocialLinks, type SocialLinkData } from './SocialLinks'

const DEFAULT_COLUMNS = [
  {
    title: 'Information',
    items: [
      { label: 'Om os',            url: '/om-os/' },
      { label: 'Cookiepolitik',    url: '/cookiepolitik/' },
      { label: 'Privatlivspolitik', url: '/privatlivspolitik/' },
    ],
  },
  {
    title: 'Sammenlign',
    items: [
      { label: 'Alle elselskaber', url: '/elselskaber-i-danmark/' },
    ],
  },
  {
    title: 'Guides & nyheder',
    items: [
      { label: 'Guides',  url: '/guides/' },
      { label: 'Nyheder', url: '/nyheder/' },
    ],
  },
]

interface FooterProps {
  tagline?: string
  columns?: any[]
  longDisclaimer?: string
  mediaLogos?: { alt: string; imageUrl?: string; url?: string }[]
  trustIcons?: { alt: string; imageUrl?: string; url?: string }[]
  note?: string
  disclaimer?: string
  bottomNav?: any[]
  socialLinks?: SocialLinkData | null
}

export async function Footer({
  tagline: taglineProp,
  columns: columnsProp,
  longDisclaimer: longDisclaimerProp,
  mediaLogos: mediaLogosProp,
  trustIcons: trustIconsProp,
  note: noteProp,
  disclaimer: disclaimerProp,
  bottomNav: bottomNavProp,
  socialLinks: socialLinksProp,
}: FooterProps = {}) {
  const year = new Date().getFullYear()

  const settings = await getSiteSettings().catch(() => null)
  const logoWhiteUrl = settings?.logoWhiteUrl ?? '/logo-white.webp'
  const tagline      = taglineProp      ?? settings?.footerTagline      ?? 'Borsenlive.dk sammenligner elselskaber og elpriser, så du nemt kan finde den bedste elaftale.'
  const columns      = columnsProp      ?? (settings?.footerColumns?.length ? settings.footerColumns : DEFAULT_COLUMNS)
  const longDisclaimer = longDisclaimerProp ?? settings?.footerLongDisclaimer ?? null
  const mediaLogos   = mediaLogosProp   ?? settings?.footerMediaLogos   ?? []
  const trustIcons   = trustIconsProp   ?? settings?.footerTrustIcons   ?? []
  const note         = replaceDateVars(noteProp ?? settings?.footerNote ?? `© ${year} Borsenlive.dk`)
  const cloudTitle   = settings?.footerLinkCloudTitle ?? null
  const cloud: { label: string; url: string }[] = settings?.footerLinkCloud ?? []
  const disclaimer   = disclaimerProp   ?? settings?.footerDisclaimer   ?? 'Siden indeholder affiliate-links'
  const bottomNav    = bottomNavProp    ?? settings?.footerBottomNav    ?? []
  const socialLinks  = socialLinksProp  ?? settings?.socialLinks        ?? null

  const linkHref = (item: any) => resolveUrl(item)

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoWhiteUrl} alt="Borsenlive" style={{ height: '30px', width: 'auto', display: 'block' }} />
          <p>{tagline}</p>
          <SocialLinks links={socialLinks} />
        </div>
        {(columns || []).map((col: any) => (
          <div key={col.title} className="footer-col">
            <h3>{col.title}</h3>
            <ul>
              {(col.items || []).map((item: any) => {
                const href = linkHref(item)
                return <li key={href + item.label}><Link href={href}>{item.label}</Link></li>
              })}
            </ul>
          </div>
        ))}
      </div>

      {longDisclaimer && (
        <div className="footer-about"><p>{longDisclaimer}</p></div>
      )}

      {cloud.length > 0 && (
        <div className="footer-cloud">
          <details>
            <summary>
              {cloudTitle || 'Elselskaber i din by'}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: 500, color: 'var(--text-muted)', fontSize: '13px' }}>
                {cloud.length} byer
                <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </span>
            </summary>
            <div className="footer-cloud-list">
              {[...cloud].sort((a, b) => a.label.localeCompare(b.label, 'da')).map((l, i) => (
                <Link key={l.url + i} href={l.url || '/'}>{l.label}</Link>
              ))}
            </div>
          </details>
        </div>
      )}

      {(mediaLogos.length > 0 || trustIcons.length > 0) && (
        <div className="wrap" style={{ paddingBottom: '32px', display: 'grid', gap: '24px' }}>
          {mediaLogos.length > 0 && (
            <div className="footer-logos-row">
              {mediaLogos.map((logo: any) => (
                <a key={logo.alt} href={logo.url || undefined} target="_blank" rel="noopener noreferrer" className="footer-media-logo-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {logo.imageUrl ? <img src={logo.imageUrl} alt={logo.alt} style={{ maxHeight: '26px', maxWidth: '120px', opacity: .7, filter: 'grayscale(1) brightness(2)' }} /> : logo.alt}
                </a>
              ))}
            </div>
          )}
          {trustIcons.length > 0 && (
            <div className="footer-trust-row">
              {trustIcons.map((icon: any) => (
                // eslint-disable-next-line @next/next/no-img-element
                icon.imageUrl ? <img key={icon.alt} src={icon.imageUrl} alt={icon.alt} style={{ height: '40px', width: 'auto', opacity: .8 }} /> : <span key={icon.alt}>{icon.alt}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span>{note}{disclaimer ? ` – ${disclaimer}` : ''}</span>
          {bottomNav.length > 0 && (
            <nav aria-label="Juridisk">
              {bottomNav.map((item: any) => <Link key={item.label} href={linkHref(item)}>{item.label}</Link>)}
            </nav>
          )}
        </div>
      </div>
    </footer>
  )
}
