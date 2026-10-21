interface ProsConsBlockProps { value: { title?: string; pros?: string[]; cons?: string[] } }

const col = (kind: 'pro' | 'con'): React.CSSProperties => ({
  background: '#fff', border: '1px solid var(--line)', borderTop: `3px solid ${kind === 'pro' ? 'var(--price-low)' : 'var(--price-high)'}`,
  borderRadius: 'var(--r-md)', padding: '16px 18px',
})
const mark = (kind: 'pro' | 'con'): React.CSSProperties => ({
  flexShrink: 0, width: 18, height: 18, borderRadius: '50%', marginTop: 2,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, fontWeight: 800, lineHeight: 1, color: '#fff',
  background: kind === 'pro' ? 'var(--price-low)' : 'var(--price-high)',
})

function Column({ kind, items }: { kind: 'pro' | 'con'; items: string[] }) {
  if (!items.length) return null
  return (
    <div style={col(kind)}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>{kind === 'pro' ? 'Fordele' : 'Ulemper'}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
        {items.map((t, i) => (
          <li key={i} style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--text)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span aria-hidden="true" style={mark(kind)}>{kind === 'pro' ? '+' : '−'}</span>{t}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ProsConsBlock({ value }: ProsConsBlockProps) {
  const { title, pros = [], cons = [] } = value
  return (
    <div style={{ margin: '24px 0' }}>
      {title && <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>{title}</h3>}
      <div className="pros-cons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        <Column kind="pro" items={pros} />
        <Column kind="con" items={cons} />
      </div>
    </div>
  )
}
