import { PortableText } from '@portabletext/react'
import { Icon } from '@/components/Icon'
import { replaceDateVarsInBlocks } from '@/lib/dateVars'
import { CalloutBlock } from './CalloutBlock'
import { FaqBlock } from './FaqBlock'
import { ProsConsBlock } from './ProsConsBlock'
import { PageLinksBlock } from './PageLinksBlock'
import { LatestPostsBlock } from './LatestPostsBlock'
import { TableBlock } from './TableBlock'
import { headingId } from '@/lib/headingId'
import { ElselskabKort } from './ElselskabKort'
import { HowToBlock } from './HowToBlock'
import { DropdownBlock } from './DropdownBlock'

type Post = {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  publishedAt?: string
  readingTime?: number
  category?: { name: string; emoji?: string; slug: { current: string } }
}

export function PortableTextRenderer({ value, posts, extraTypes }: { value: any[]; posts?: Post[]; extraTypes?: Record<string, (props: any) => any> }) {
  const pid = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''

  // First occurrence _key of each block type — used to give hero "Quick links"
  // buttons a single, stable scroll target (avoids duplicate ids).
  const firstKeyByType: Record<string, string> = {}
  for (const b of value || []) {
    if (b?._type && b?._key && !(b._type in firstKeyByType)) firstKeyByType[b._type] = b._key
  }
  const anchorFor: Record<string, string> = {
    prosConsBlock: 'pros-cons',
    howToBlock: 'how-to',
    faqBlock: 'faq',
  }
  const withAnchor = (type: string, key: string, node: any) =>
    key && firstKeyByType[type] === key && anchorFor[type]
      ? <div id={anchorFor[type]} style={{ scrollMarginTop: '80px' }}>{node}</div>
      : node

  const components = {
    block: {
      h2: ({ children, value: v }: any) => {
        const text = v?.children?.map((c: any) => c.text).join('') || ''
        return (
          <h2 id={headingId(text)} style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', margin: '36px 0 14px', scrollMarginTop: '72px' }}>
            {children}
          </h2>
        )
      },
      h3: ({ children, value: v }: any) => {
        const text = v?.children?.map((c: any) => c.text).join('') || ''
        return (
          <h3 id={headingId(text)} style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: '28px 0 10px', scrollMarginTop: '72px' }}>
            {children}
          </h3>
        )
      },
      h4: ({ children, value: v }: any) => {
        const text = v?.children?.map((c: any) => c.text).join('') || ''
        return (
          <h4 id={headingId(text)} style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: '20px 0 8px', scrollMarginTop: '72px' }}>
            {children}
          </h4>
        )
      },
      normal: ({ children }: any) => (
        <p style={{ fontSize: '15.5px', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '18px' }}>
          {children}
        </p>
      ),
      blockquote: ({ children }: any) => (
        <blockquote style={{ margin: '28px 0', padding: 0, border: 'none' }}>
          <div style={{
            position: 'relative',
            background: 'rgba(26,122,60,0.06)',
            border: '1px solid rgba(26,122,60,0.18)',
            borderRadius: '10px',
            padding: '20px 22px 18px 52px',
          }}>
            <span style={{
              position: 'absolute',
              top: '10px',
              left: '18px',
              fontFamily: 'Georgia, serif',
              fontSize: '44px',
              lineHeight: 1,
              color: 'var(--green)',
              opacity: 0.4,
              userSelect: 'none',
            }}>&ldquo;</span>
            <div style={{
              fontSize: '15px',
              fontStyle: 'italic',
              color: 'var(--text)',
              lineHeight: 1.75,
            }}>
              {children}
            </div>
          </div>
        </blockquote>
      ),
    },
    marks: {
      strong: ({ children }: any) => <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{children}</strong>,
      em: ({ children }: any) => <em>{children}</em>,
      link: ({ value, children }: any) => {
        const rel = ['noopener', 'noreferrer', value.nofollow ? 'nofollow' : ''].filter(Boolean).join(' ')
        return (
          <a href={value.href} target={value.blank ? '_blank' : '_self'} rel={rel}
            style={{ color: 'var(--green)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            {children}
          </a>
        )
      },
    },
    list: {
      bullet: ({ children }: any) => <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</ul>,
      number: ({ children }: any) => <ol style={{ paddingLeft: '24px', margin: '16px 0 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>{children}</ol>,
    },
    listItem: {
      bullet: ({ children }: any) => (
        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
          <Icon name="alt-arrow-right" size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: '4px' }} />
          <span>{children}</span>
        </li>
      ),
      number: ({ children }: any) => (
        <li style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.65 }}>{children}</li>
      ),
    },
    types: {
      ctaButton: ({ value }: any) => {
        if (!value?.url) return null
        return (
          <div style={{ margin: '28px 0' }}>
            <a
              href={value.url}
              target="_blank"
              rel="nofollow noopener noreferrer sponsored"
              style={{
                display: 'block',
                width: '100%',
                padding: '15px 24px',
                background: 'linear-gradient(135deg, var(--green) 0%, #16a34a 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '16px',
                textAlign: 'center',
                borderRadius: '12px',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
                boxShadow: '0 4px 14px rgba(34,197,94,0.25)',
                transition: 'opacity .15s',
              }}
            >
              {value.text || 'Se tilbud'}
            </a>
          </div>
        )
      },
      dropdownBlock: ({ value }: any) => <DropdownBlock value={value} />,
      calloutBlock: ({ value }: any) => <CalloutBlock value={value} />,
      faqBlock: ({ value }: any) => withAnchor('faqBlock', value._key, <FaqBlock value={value} />),
      prosConsBlock: ({ value }: any) => withAnchor('prosConsBlock', value._key, <ProsConsBlock value={value} />),
      pageLinksBlock: ({ value }: any) => <PageLinksBlock value={value} />,
      tableBlock: ({ value }: any) => <TableBlock value={value} />,
      elselskabKortBlock: ({ value }: any) => <ElselskabKort value={value} />,
      howToBlock: ({ value }: any) => withAnchor('howToBlock', value._key, <HowToBlock value={value} />),
      latestPostsBlock: ({ value: blockValue }: any) =>
        posts ? <LatestPostsBlock value={blockValue} posts={posts} /> : null,
      ...(extraTypes || {}),
      image: ({ value }: any) => {
        if (!value?.asset?._ref || !pid) return null
        const ref = value.asset._ref.replace('image-', '').replace(/-(\w+)$/, '.$1')
        return (
          <img
            src={`https://cdn.sanity.io/images/${pid}/${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}/${ref}`}
            alt={value.alt || ''}
            style={{ width: '100%', borderRadius: '8px', margin: '24px 0', display: 'block' }}
          />
        )
      },
    },
  }

  return <PortableText value={replaceDateVarsInBlocks(value)} components={components} />
}
