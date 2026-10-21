import { replaceDateVars } from '@/lib/dateVars'

/**
 * "Jump to comparison list" hero button, shown on any page type that renders a
 * comparison table and has the per-page toggle enabled. Anchors to the
 * #comparison-list target rendered by the ComparisonTable component.
 */
export function ComparisonJumpButton({ data }: { data: any }) {
  if (!data?.showComparisonTable || !data?.comparisonTable || !data?.heroCompareButton) return null
  const text = data.heroCompareButtonText || 'Se alle elaftaler'
  return (
    <div className="section" style={{ paddingTop: '4px', paddingBottom: '0' }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: 'var(--text-faint)', marginBottom: '8px',
      }}>
        Genveje
      </div>
      <a
        href="#comparison-list"
        className="hero-compare-btn"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: 'var(--green)', color: '#fff',
          border: '1.5px solid var(--green)',
          fontSize: '14.5px', fontWeight: 700,
          padding: '10.5px 18px', borderRadius: '10px',
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(46,123,214,0.28)',
        }}
      >
        {replaceDateVars(text)}
        <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>↓</span>
      </a>
    </div>
  )
}
