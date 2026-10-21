import { replaceDateVars } from '@/lib/dateVars'
import { Breadcrumbs } from './Breadcrumbs'
import { AuthorBar } from './AuthorBar'
import { RichIntro } from './RichIntro'

interface Crumb { label: string; href?: string }

interface HeroSectionProps {
  title: string
  intro?: string | any[]
  eyebrow?: string
  updatedAt?: string | null
  narrow?: boolean
  author?: { name: string; slug?: { current: string } | null; linkedin?: string | null; imageUrl?: string | null } | null
  factChecker?: { name: string; slug?: { current: string } | null; linkedin?: string | null; imageUrl?: string | null } | null
  breadcrumbs?: Crumb[]
  /** Optional anchor buttons below the text that scroll to sections on the page. */
  buttons?: { text: string; targetId: string; variant?: 'solid' | 'outline' }[] | null
}

export function HeroSection({ title, intro, eyebrow, updatedAt, narrow = false, author, factChecker, breadcrumbs, buttons }: HeroSectionProps) {
  const maxWidth = narrow ? '760px' : '1250px'
  const hasAuthorBar = author || factChecker || updatedAt
  const hasIntro = Array.isArray(intro) ? intro.length > 0 : !!intro

  return (
    <section className="hero-section" style={{
      background: 'var(--bg-hero)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth, margin: '0 auto' }}>

        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs crumbs={breadcrumbs} />}

        {eyebrow && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(34,197,94,0.12)', color: 'var(--green)',
            fontSize: '12px', fontWeight: 600,
            padding: '4px 12px', borderRadius: '20px',
            marginBottom: '16px',
          }}>
            {eyebrow}
          </div>
        )}

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(24px, 3.5vw, 40px)',
          fontWeight: 800, color: 'var(--text)',
          lineHeight: 1.15, letterSpacing: '-0.03em',
          marginBottom: hasAuthorBar ? '20px' : hasIntro ? '16px' : '0',
          width: '100%',
        }}>
          {replaceDateVars(title)}
        </h1>

        <AuthorBar author={author} factChecker={factChecker} updatedAt={updatedAt} />

        {hasIntro && (
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, width: '100%', margin: 0 }}>
            {typeof intro === 'string' ? replaceDateVars(intro) : <RichIntro value={intro} />}
          </p>
        )}

        {buttons && buttons.length > 0 && (
          <div style={{ marginTop: hasIntro || hasAuthorBar ? '20px' : '16px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px',
              textTransform: 'uppercase', color: 'var(--text-faint)',
              marginBottom: '8px',
            }}>
              Genveje
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {buttons.map((b) => {
                const outline = b.variant === 'outline'
                return (
                  <a
                    key={b.targetId}
                    href={`#${b.targetId}`}
                    className="hero-compare-btn"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '7px',
                      background: outline ? 'transparent' : 'var(--green)',
                      color: outline ? 'var(--green)' : '#fff',
                      border: outline ? '1.5px solid var(--green)' : '1.5px solid var(--green)',
                      fontSize: '14.5px', fontWeight: 700,
                      padding: outline ? '10.5px 18px' : '10.5px 18px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      boxShadow: outline ? 'none' : '0 4px 14px rgba(26,122,60,0.28)',
                    }}
                  >
                    {replaceDateVars(b.text)}
                    <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>↓</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
