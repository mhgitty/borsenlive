'use client'

import { useEffect, useRef, useState } from 'react'
import { headingId } from '@/lib/headingId'

interface Heading {
  id: string
  text: string
}

function extractHeadings(body: any[]): Heading[] {
  if (!body?.length) return []
  return body
    .filter((block: any) => block._type === 'block' && block.style === 'h2')
    .map((block: any) => {
      const text = block.children?.map((c: any) => c.text).join('') || ''
      return { id: headingId(text), text }
    })
    .filter((h) => h.text.length > 0)
}

export function TableOfContents({ body }: { body: any[] }) {
  const [activeId, setActiveId] = useState<string>('')
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const headings = extractHeadings(body)

  // Observe h2s in the page and update activeId
  useEffect(() => {
    if (!headings.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) setActiveId(visible[0].target.id)
      },
      { rootMargin: '0px 0px -60% 0px' }
    )
    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings.length])

  // Auto-scroll the TOC so the active item stays visible
  useEffect(() => {
    if (!activeId || !navRef.current) return
    const activeEl = itemRefs.current[activeId]
    if (!activeEl) return
    const nav = navRef.current
    const navTop = nav.scrollTop
    const navBottom = navTop + nav.clientHeight
    const elTop = activeEl.offsetTop
    const elBottom = elTop + activeEl.offsetHeight
    if (elTop < navTop || elBottom > navBottom) {
      nav.scrollTo({ top: elTop - nav.clientHeight / 2 + activeEl.offsetHeight / 2, behavior: 'smooth' })
    }
  }, [activeId])

  if (!headings.length) return null

  return (
    <div style={{ padding: '4px 0 0', marginBottom: '32px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px', letterSpacing: 0 }}>
        På denne side
      </h4>

      <nav ref={navRef} style={{ overflowY: 'auto', maxHeight: '60vh' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {headings.map(({ id, text }) => (
            <li key={id} ref={(el) => { itemRefs.current[id] = el }}>
              <a
                href={`#${id}`}
                style={{
                  display: 'block',
                  fontSize: '14px',
                  lineHeight: 1.45,
                  color: activeId === id ? 'var(--brand-dark)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  padding: '6px 0 6px 14px',
                  borderLeft: activeId === id ? '2px solid var(--brand)' : '2px solid var(--line)',
                  transition: 'color 0.15s, border-color 0.15s',
                  fontWeight: activeId === id ? 600 : 400,
                }}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
