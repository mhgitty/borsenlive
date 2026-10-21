import { headingId } from './headingId'
import { replaceDateVars } from './dateVars'

type HeroButton = { text: string; targetId: string; variant?: 'solid' | 'outline' }

const COMPARE_LABELS: Record<string, string> = {
  elselskabCompare: 'Se de billigste elselskaber',
  ladeboksCompare: 'Se de billigste ladebokse',
  ladeboksBrand: 'Se priser på ladebokse',
  naturgasCompare: 'Se de billigste gasaftaler',
}

// Full hero "Quick links" set for a document: the comparison-list button (solid)
// plus outline buttons for Pros & Cons / How-to / FAQ blocks found in the body,
// plus any custom hero quick links. Shared by every page template so the hero
// buttons are consistent everywhere.
export function heroButtonsFor(doc: any): HeroButton[] {
  const out: HeroButton[] = []

  if (doc?.showComparisonTable && doc?.comparisonTable && doc?.heroCompareButton) {
    out.push({ text: doc.heroCompareButtonText || 'Se alle elaftaler', targetId: 'comparison-list', variant: 'solid' })
  }

  const body = ((doc?.body as any[]) || [])
  const types = new Set(body.map((b: any) => b?._type))
  // Jump button to the first comparison list on the page (electricity, chargers or gas)
  if (!out.length) {
    const first = body.find((b: any) => b?._type === 'widgetBlock' && COMPARE_LABELS[b?.widget])
    if (first) out.push({ text: COMPARE_LABELS[first.widget], targetId: `w-${first._key}`, variant: 'solid' })
  }
  if (types.has('prosConsBlock')) out.push({ text: 'Fordele & ulemper', targetId: 'pros-cons', variant: 'outline' })
  if (types.has('howToBlock'))    out.push({ text: 'Sådan gør du',      targetId: 'how-to',    variant: 'outline' })
  if (types.has('faqBlock'))      out.push({ text: 'FAQ',         targetId: 'faq',       variant: 'outline' })

  for (const ql of ((doc?.heroQuickLinks as any[]) || [])) {
    if (ql?.label && ql?.headingText) {
      out.push({ text: ql.label, targetId: headingId(replaceDateVars(ql.headingText)), variant: 'outline' })
    }
  }

  return out
}

// Comparison-only variant (kept for callers that only want the jump button).
export function compareButtonList(doc: any): HeroButton[] {
  if (doc?.showComparisonTable && doc?.comparisonTable && doc?.heroCompareButton) {
    return [{ text: doc.heroCompareButtonText || 'Se alle elaftaler', targetId: 'comparison-list', variant: 'solid' }]
  }
  return []
}
