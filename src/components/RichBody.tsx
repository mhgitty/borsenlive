import { PortableTextRenderer } from './PortableTextRenderer'
import { ElselskabCompare } from './elcompare/ElselskabCompare'
import { ElprisInline } from './elcompare/ElprisInline'
import { TableBlock } from './TableBlock'
import { resolvePriceTokens } from '@/lib/elselskab-compare'
import {
  LadeboksCompare, LadeboksBrand, NaturgasCompare, ElprisChart, ElprisTopkort,
  ElprisPrisudvikling, ElprisDag, ElprisNu, ElprisNetselskab,
} from './widgets'

/**
 * Server-side body renderer: PortableTextRenderer + the live widgets ported
 * from the WordPress plugins. Use this in pages (server components); the plain
 * PortableTextRenderer stays usable from client components.
 */
function Widget({ value }: { value: any }) {
  switch (value?.widget) {
    case 'elselskabCompare': return <ElselskabCompare />
    case 'elselskabBrand': return <ElselskabCompare provider={value.provider} />
    case 'ladeboksCompare': return <LadeboksCompare />
    case 'ladeboksBrand': return <LadeboksBrand brand={value.brand || ''} />
    case 'naturgasCompare': return <NaturgasCompare />
    case 'elprisChart': return <ElprisChart area={value.area} />
    case 'elprisTopkort': return <ElprisTopkort />
    case 'elprisPrisudvikling': return <ElprisPrisudvikling area={value.area} />
    case 'elprisDag': return <ElprisDag />
    case 'elprisNu': return <ElprisNu />
    case 'elprisNetselskab': return <ElprisNetselskab adresse={value.adresse} />
    default: return null
  }
}

/** Tables can contain [elpris …] shortcodes in their cells — resolve them server-side. */
async function LiveTable({ value }: { value: any }) {
  const rows = await Promise.all((value?.rows || []).map(async (r: any) => ({ ...r, cells: await Promise.all((r.cells || []).map((c: string) => resolvePriceTokens(c))) })))
  const headers = await Promise.all((value?.headers || []).map((h: string) => resolvePriceTokens(h)))
  return <TableBlock value={{ ...value, headers, rows }} />
}

const WIDGET_TYPES = {
  tableBlock: ({ value }: any) => <LiveTable value={value} />,
  widgetBlock: ({ value }: any) => <Widget value={value} />,
  elprisInline: ({ value }: any) => <ElprisInline value={value} />,
}

export function RichBody(props: { value: any[]; posts?: any[] }) {
  return <PortableTextRenderer {...props} extraTypes={WIDGET_TYPES} />
}
