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
  /** Optional panel shown to the right of the text (stacks below on mobile). */
  aside?: React.ReactNode
}

export function HeroSection({ title, intro, updatedAt, author, factChecker, breadcrumbs, buttons, aside }: HeroSectionProps) {
  const hasIntro = Array.isArray(intro) ? intro.length > 0 : !!intro

  return (
    <section className="page-hero">
      <div className="page-hero-inner">
        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs crumbs={breadcrumbs} />}
        <div className={aside ? 'page-hero-grid' : undefined}>
        <div>

        <h1 className="page-hero-title">{replaceDateVars(title)}</h1>

        {hasIntro && (
          <p className="page-hero-intro">
            <RichIntro value={typeof intro === 'string' ? replaceDateVars(intro) : intro} limit={60} />
          </p>
        )}

        {(author || factChecker || updatedAt) && (
          <div className="page-hero-meta">
            <AuthorBar author={author} factChecker={factChecker} updatedAt={updatedAt} />
          </div>
        )}

        {buttons && buttons.length > 0 && (
          <nav className="quicklinks" aria-label="Genveje på siden">
            {buttons.map((b) => (
              <a key={b.targetId} href={`#${b.targetId}`} className={`quicklink${b.variant === 'solid' ? ' quicklink--primary' : ''}`}>
                {replaceDateVars(b.text)}
              </a>
            ))}
          </nav>
        )}
        </div>
        {aside}
        </div>
      </div>
    </section>
  )
}
