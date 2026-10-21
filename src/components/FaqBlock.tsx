'use client'
import { useState } from 'react'
import { Icon } from '@/components/Icon'

interface FaqBlockProps { value: { items?: { question: string; answer: string }[] } }

export function FaqBlock({ value }: FaqBlockProps) {
  const { items = [] } = value
  const [open, setOpen] = useState<number | null>(0)

  // Emit FAQPage structured data for any FAQ block, on any page that renders it.
  const faqs = items.filter((i) => i?.question && i?.answer)
  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null

  return (
    <div style={{ margin: '32px 0' }}>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: '#fff' }}>
        {items.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '20px 24px',
                  background: isOpen ? '#fff' : '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '16.5px',
                  fontWeight: 650 as any,
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                  lineHeight: 1.4,
                }}
              >
                <span>{item.question}</span>

                {/* question-circle icon */}
                <span aria-hidden="true" style={{
                  flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: isOpen ? 'var(--brand)' : 'var(--brand-50)', color: isOpen ? '#fff' : 'var(--brand-dark)',
                  transition: 'background .15s, transform .2s', transform: isOpen ? 'rotate(45deg)' : 'none',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </button>

              {isOpen && (
                <div style={{
                  padding: '0 24px 20px',
                  fontSize: '16px',
                  color: 'var(--text)',
                  lineHeight: 1.7,
                  maxWidth: '72ch',
                  background: '#fff',
                }}>
                  {item.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
