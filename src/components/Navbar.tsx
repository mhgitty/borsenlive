import Link from 'next/link'
import Image from 'next/image'
import { getSiteSettings } from '@/lib/sanity'
import { MobileMenu } from './MobileMenu'
import { Icon } from './Icon'
import { PriceTicker } from './site/PriceTicker'

const DEFAULT_NAV = [
  { label: 'Forside',     url: '/',             isHighlighted: false, children: [] },
  { label: 'Elselskaber', url: '/elselskaber-i-danmark/', isHighlighted: false, children: [] },
  { label: 'Guides',      url: '/guides/',      isHighlighted: false, children: [] },
  { label: 'Nyheder',     url: '/nyheder/',     isHighlighted: false, children: [] },
]

export function resolveUrl(item: {
  url?: string; pageSlug?: string; pageParentSlug?: string; pageParent2Slug?: string; pageParent3Slug?: string; pageParent4Slug?: string;
  elselskabSlug?: string; postSlug?: string; guideSlug?: string;
}): string {
  if (item.pageSlug) {
    const segments = [item.pageParent4Slug, item.pageParent3Slug, item.pageParent2Slug, item.pageParentSlug, item.pageSlug].filter(Boolean)
    return `/${segments.join('/')}/`
  }
  if (item.elselskabSlug) return `/elselskaber-i-danmark/${item.elselskabSlug}/`
  if (item.postSlug) return `/${item.postSlug}/`
  if (item.guideSlug) return `/guides/${item.guideSlug}/`
  return item.url || '/'
}

interface ResolvedNavChild { label: string; href: string; children?: ResolvedNavChild[] }
interface ResolvedNavItem { label: string; href: string; isHighlighted: boolean; icon?: string; children: ResolvedNavChild[] }

// Recursive dropdown renderer — handles any nesting depth (sub-menus of sub-menus).
function NavDropdownTree({ items }: { items: ResolvedNavChild[] }) {
  return (
    <>
      {items.map((child) =>
        child.children && child.children.length > 0 ? (
          <div key={child.href + child.label} className="nav-dropdown-sub">
            <Link href={child.href} className="nav-dropdown-item nav-dropdown-item-has-children">
              {child.label}
              <Icon name="alt-arrow-right" size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
            </Link>
            <div className="nav-dropdown nav-dropdown-flyout">
              <NavDropdownTree items={child.children} />
            </div>
          </div>
        ) : (
          <Link key={child.href + child.label} href={child.href} className="nav-dropdown-item">
            {child.label}
          </Link>
        )
      )}
    </>
  )
}

export async function Navbar({ navItems, logoHref = '/' }: { navItems?: ResolvedNavItem[]; logoHref?: string } = {}) {
  let nav = navItems
  if (!nav) {
    const settings = await getSiteSettings().catch(() => null)
    const raw: any[] = settings?.headerNav?.length ? settings.headerNav : DEFAULT_NAV
    const mapNode = (item: any): any => ({
      label: item.label,
      href: resolveUrl(item),
      isHighlighted: item.isHighlighted ?? false,
      icon: item.icon ?? undefined,
      children: (item.children || []).map(mapNode).filter((c: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.href === c.href) === i),
    })
    nav = raw.map(mapNode)
  }

  return (
    <>
      <PriceTicker />
      <header className="site-header">
        <div className="navbar">
          <div className="navbar-inner">
            <Link href={logoHref} className="navbar-logo" aria-label="Borsenlive – til forsiden">
              <Image src="/logo.webp" alt="Borsenlive" width={300} height={69} priority style={{ height: '30px', width: 'auto', display: 'block' }} />
            </Link>

            <nav className="navbar-nav" aria-label="Hovedmenu">
              {nav.map((item) => {
                if (!item.children.length) {
                  return (
                    <Link key={item.href + item.label} href={item.href} className="nav-link">{item.label}</Link>
                  )
                }
                const mega = item.children.length > 10
                return (
                  <div key={item.href + item.label} className="nav-item-dropdown">
                    <Link href={item.href} className="nav-link" aria-haspopup="true">
                      {item.label}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" style={{ opacity: .55 }}><path d="m6 9 6 6 6-6" /></svg>
                    </Link>
                    <div className={`nav-dropdown${mega ? ' nav-dropdown--mega' : ''}`}>
                      {mega && (
                        <div className="nav-dropdown-head">
                          <strong>{item.label}</strong>
                          <Link href={item.href}>Se alle {item.children.length}</Link>
                        </div>
                      )}
                      <NavDropdownTree items={mega ? [...item.children].sort((a, b) => a.label.localeCompare(b.label, 'da')) : item.children} />
                    </div>
                  </div>
                )
              })}
            </nav>

            <Link href="/#comparison-list" className="nav-cta">Sammenlign elpriser</Link>

            <MobileMenu items={nav} />
          </div>
        </div>
      </header>
    </>
  )
}
