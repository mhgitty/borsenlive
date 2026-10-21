'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Adds ?placement=<current page path> to every affiliate link (/go/<code>/),
 * so the tracker can see which page a click came from. The /go route forwards
 * the parameter to bandstrack. Re-runs on navigation and when client-side
 * lists re-render (filters, read-more, etc.).
 */
function tag(path: string) {
  document.querySelectorAll<HTMLAnchorElement>('a[href*="/go/"]').forEach((a) => {
    try {
      const url = new URL(a.href, location.origin)
      if (url.origin !== location.origin || !url.pathname.startsWith('/go/')) return
      if (url.searchParams.get('placement') === path) return
      url.searchParams.set('placement', path)
      a.href = url.pathname + url.search
    } catch { /* ignore malformed hrefs */ }
  })
}

export function PlacementTagger() {
  const pathname = usePathname()
  useEffect(() => {
    tag(pathname)
    let queued = false
    const obs = new MutationObserver(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => { queued = false; tag(pathname) })
    })
    obs.observe(document.body, { childList: true, subtree: true })
    return () => obs.disconnect()
  }, [pathname])
  return null
}
