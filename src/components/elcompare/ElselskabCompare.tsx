import { getCompareData } from '@/lib/elselskab-compare'
import { ElselskabCompareClient } from './ElselskabCompareClient'

/**
 * The comparison list ("sammenligningsliste"). Replaces the WP shortcodes
 * [elselskab_compare] (full list with filters) and [elselskab_<brand>]
 * (one company's products, no filters).
 */
export async function ElselskabCompare({ provider, showFilters = true }: { provider?: string; showFilters?: boolean }) {
  const { providers, raw } = await getCompareData()
  const slug = provider?.trim().toLowerCase()
  const list = slug ? providers.filter((p) => p.ctaSlug.toLowerCase() === slug) : providers
  if (slug && list.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>Der er ingen produkter for dette elselskab.</p>
  }
  return (
    <div id={slug ? undefined : 'comparison-list'} style={{ scrollMarginTop: '80px', margin: '24px 0' }}>
      <ElselskabCompareClient providers={list} raw={raw} showFilters={slug ? false : showFilters} />
    </div>
  )
}
