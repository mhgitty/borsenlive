'use client'

import { Icon } from '@/components/Icon'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavNode { label: string; href: string; isHighlighted?: boolean; children?: NavNode[] }

// Recursive accordion node — handles any nesting depth (sub-menus of sub-menus).
function MobileNavNode({ node, depth, onNavigate }: { node: NavNode; depth: number; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)
  const hasChildren = !!(node.children && node.children.length > 0)
  const linkClass = depth === 0
    ? `mobile-menu-link${node.isHighlighted ? ' mobile-menu-link-cta' : ''}`
    : 'mobile-menu-sublink'

  return (
    <div className={depth === 0 ? 'mobile-menu-group' : undefined}>
      {hasChildren ? (
        <div className="mobile-menu-link-row">
          <Link href={node.href} className={linkClass} onClick={onNavigate}>
            {node.label}
          </Link>
          <button
            className="mobile-menu-chevron-btn"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Luk undermenu' : 'Åbn undermenu'}
          >
            <Icon name="alt-arrow-down" size={depth === 0 ? 16 : 15} className={`mobile-menu-chevron${open ? ' open' : ''}`} />
          </button>
        </div>
      ) : (
        <Link href={node.href} className={linkClass} onClick={onNavigate}>
          {node.label}
        </Link>
      )}

      {hasChildren && open && (
        <div className={`mobile-menu-children${depth >= 1 ? ' mobile-menu-children-nested' : ''}`}>
          {node.children!.map((c) => (
            <MobileNavNode key={c.href + c.label} node={c} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MobileMenu({ items }: { items: NavNode[] }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  useEffect(() => { setMounted(true) }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Close menu on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Luk menu' : 'Åbn menu'}
        aria-expanded={open}
      >
        <span className={`burger-icon${open ? ' open' : ''}`}>
          <span /><span /><span />
        </span>
      </button>

      {/* The drawer is portalled to <body>: the header uses backdrop-filter, which
          makes position:fixed children size to the header instead of the screen
          (Safari/iOS), so the menu would be cut off or invisible. */}
      {mounted && createPortal(
        <>
        <div className={`mobile-menu-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

        <nav className={`mobile-menu-drawer${open ? ' open' : ''}`} aria-hidden={!open} aria-label="Menu">
          <button className="mobile-menu-btn mobile-menu-close" style={{ display: 'flex' }} onClick={() => setOpen(false)} aria-label="Luk menu">
            <span className="burger-icon open"><span /><span /><span /></span>
          </button>
          {items.map((item) => (
            <MobileNavNode key={item.href + item.label} node={item} depth={0} onNavigate={() => setOpen(false)} />
          ))}
          <Link href="/#comparison-list" className="btn btn-primary mobile-menu-cta" onClick={() => setOpen(false)}>Sammenlign elpriser</Link>
        </nav>
        </>,
        document.body,
      )}
    </>
  )
}
