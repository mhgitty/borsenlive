'use client'
import { useEffect, type ReactNode } from 'react'

export function WideStudioLayout({ renderDefault, ...props }: { renderDefault: (p: any) => ReactNode; [key: string]: any }) {
  // The Studio document editor renders fields inside a native <form>. Studio
  // autosaves via the API and never needs a real form submit, but a toolbar
  // button that defaults to type="submit" (e.g. the Portable Text "add link"
  // button) submits the form → full page reload + jump to top. Block any
  // native submit that originates from inside the document editor.
  useEffect(() => {
    const onSubmit = (e: Event) => {
      const se = e as SubmitEvent
      const origin = (se.submitter as HTMLElement | null) ?? (e.target as HTMLElement | null)
      if (origin?.closest?.('[data-testid="document-panel-document-view"]')) {
        e.preventDefault()
      }
    }
    document.addEventListener('submit', onSubmit, true)
    return () => document.removeEventListener('submit', onSubmit, true)
  }, [])

  return (
    <>
      <style>{`
        /* ── Widen document/form panels ────────────────────────────── */
        [data-testid="document-panel-scroller"] > div,
        [data-testid="document-panel-document-view"] > div {
          max-width: none !important;
        }
        /* Field rows inside the form */
        [class*="FormField__Root"],
        [class*="FormFieldSet"],
        [class*="documentView"] > div {
          max-width: none !important;
        }
        /* Portable Text wrapper */
        [data-testid="pt-editor-box"] {
          max-width: none !important;
        }

        /* ── PTE heading colours (make visible on dark bg) ──────────── */
        [data-slate-editor="true"] h1,
        [data-slate-editor="true"] h2,
        [data-slate-editor="true"] h3,
        [data-slate-editor="true"] h4,
        [data-slate-editor="true"] h5,
        [data-slate-editor="true"] h6 {
          color: #ffffff !important;
        }
      `}</style>
      {/* display:contents keeps this wrapper out of the layout/height chain —
          a plain block div here collapses the document list's scroll height,
          which caps virtualized lists at ~14 visible rows. */}
      <div style={{ display: 'contents', '--sanity-sidebar-width': '260px' } as React.CSSProperties}>
        {renderDefault(props)}
      </div>
    </>
  )
}
