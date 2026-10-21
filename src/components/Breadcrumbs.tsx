import Link from 'next/link'
import { replaceDateVars } from '@/lib/dateVars'

interface Crumb { label: string; href?: string }

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Brødkrumme">
      <ol className="breadcrumbs" style={{ listStyle: 'none' }}>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          const label = replaceDateVars(crumb.label)
          return (
            <li key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              {isLast || !crumb.href
                ? <span aria-current={isLast ? 'page' : undefined} style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60ch' }}>{label}</span>
                : <Link href={crumb.href} className="breadcrumb-link">{label}</Link>}
              {!isLast && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ opacity: .5 }}><path d="m9 6 6 6-6 6" /></svg>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
