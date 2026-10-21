import { ElaftaleTable } from './ElaftaleTable'
import { ElselskabList } from './ElselskabList'

// Data comes from the comparisonTableTemplate document (expanded by the query)
interface ComparisonTableData {
  tableType?: 'elaftale' | 'elselskab'
  elaftaler?: any[]
  elselskaber?: any[]
}

export function ComparisonTable({ data }: { data?: ComparisonTableData | null }) {
  if (!data) return null

  let inner: React.ReactNode = null
  if (data.tableType === 'elselskab') {
    const items = data.elselskaber || []
    if (!items.length) return null
    inner = <ElselskabList items={items} />
  } else {
    const items = (data.elaftaler || []).filter(Boolean)
    if (!items.length) return null
    inner = <ElaftaleTable items={items} />
  }

  // Scroll target for the hero "jump to comparison list" button, on every page.
  return <div id="comparison-list" style={{ scrollMarginTop: '80px' }}>{inner}</div>
}
