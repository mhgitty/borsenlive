import Link from 'next/link'
import { draftMode } from 'next/headers'

export default async function NotFound() {
  let isPreview = false
  try {
    isPreview = (await draftMode()).isEnabled
  } catch {
    isPreview = false
  }

  return (
    <div
      style={{
        minHeight: '70vh',
        background: 'var(--bg-hero)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '560px', textAlign: 'center' }}>
        {isPreview ? (
          <>
            <div style={{
              display: 'inline-block',
              background: 'rgba(46,123,214,0.1)', color: 'var(--green)',
              fontSize: '12px', fontWeight: 700,
              padding: '4px 12px', borderRadius: '20px', marginBottom: '18px',
            }}>
              Kladde-preview
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 34px)',
              fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em',
              lineHeight: 1.15, margin: '0 0 14px',
            }}>
              Kladden kunne ikke indlæses til preview
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 24px' }}>
              The page isn&rsquo;t published yet, and the unpublished draft could not be read.
              This usually means the site is missing a valid <strong>SANITY_API_READ_TOKEN</strong>{' '}
              (a Viewer token for the Sanity project). Once that environment variable is set and the
              site is redeployed, previewing unpublished drafts will work.
            </p>
          </>
        ) : (
          <>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 34px)',
              fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em',
              lineHeight: 1.15, margin: '0 0 14px',
            }}>
              Siden blev ikke fundet
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 24px' }}>
              Siden du leder efter findes ikke eller er flyttet.
            </p>
          </>
        )}
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            background: 'var(--green)', color: '#fff',
            fontSize: '15px', fontWeight: 700,
            padding: '12px 22px', borderRadius: '10px', textDecoration: 'none',
          }}
        >
          Gå til forsiden
        </Link>
      </div>
    </div>
  )
}
