'use client'
import { useState } from 'react'
import { PortableText } from '@portabletext/react'
import { replaceDateVarsInBlocks } from '@/lib/dateVars'

const components = {
  block: {
    normal: ({ value, children }: any) => <span className={value?._cont || value?._open ? undefined : 'intro-p'}>{children}</span>,
  },
  marks: {
    strong: ({ children }: any) => <strong>{children}</strong>,
    em:     ({ children }: any) => <em>{children}</em>,
    link:   ({ value, children }: any) => {
      const rel = [value?.nofollow ? 'nofollow' : '', value?.blank ? 'noopener noreferrer' : ''].filter(Boolean).join(' ') || undefined
      return (
        <a
          href={value?.href}
          target={value?.blank ? '_blank' : undefined}
          rel={rel}
          style={{ color: 'var(--brand-dark)', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: 'var(--brand-300)' }}
        >
          {children}
        </a>
      )
    },
  },
}

/**
 * Split Portable Text after `limit` words. The block that is cut in two is
 * continued inline in the tail (`_cont`), so the text reads as one paragraph.
 */
function splitBlocks(blocks: any[], limit: number): [any[], any[]] {
  let words = 0
  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi]
    const kids = b.children || []
    for (let ci = 0; ci < kids.length; ci++) {
      const c = kids[ci]
      if (c._type !== 'span') continue
      const parts = c.text.split(/(\s+)/)
      let n = 0
      for (let pi = 0; pi < parts.length; pi++) {
        if (!parts[pi].trim()) continue
        if (words + n + 1 > limit) {
          const head = parts.slice(0, pi).join('').replace(/\s+$/, '')
          const tail = parts.slice(pi).join('')
          const headBlock = { ...b, _open: true, children: [...kids.slice(0, ci), ...(head ? [{ ...c, text: head }] : [])] }
          const tailBlock = { ...b, _key: `${b._key}-cont`, _cont: true, children: [{ ...c, _key: `${c._key}-cont`, text: ' ' + tail }, ...kids.slice(ci + 1)] }
          return [[...blocks.slice(0, bi), headBlock], [tailBlock, ...blocks.slice(bi + 1)]]
        }
        n++
      }
      words += n
    }
  }
  return [blocks, []]
}

function ReadMore({ head, tail }: { head: React.ReactNode; tail: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {head}
      {!open && <span aria-hidden="true">… </span>}
      <span hidden={!open}>{tail}</span>
      {' '}
      <button type="button" className="intro-more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Vis mindre' : 'Læs mere'}
      </button>
    </>
  )
}

/**
 * Renders an intro field which is either:
 *   - a plain string (legacy / fallback)
 *   - a Portable Text array (new rich-text intro)
 *
 * Always renders inline (no wrapping block element) — the parent is
 * responsible for the <p> or container element and its styles.
 */
export function RichIntro({ value, limit }: { value: string | any[] | null | undefined; limit?: number }) {
  if (!value) return null
  if (typeof value === 'string') {
    const words = value.split(/\s+/)
    if (!limit || words.length <= limit) return <>{value}</>
    return <ReadMore head={words.slice(0, limit).join(' ')} tail={' ' + words.slice(limit).join(' ')} />
  }
  const blocks = replaceDateVarsInBlocks(value)
  if (!limit) return <PortableText value={blocks} components={components} />
  const [head, tail] = splitBlocks(blocks, limit)
  if (!tail.length) return <PortableText value={blocks} components={components} />
  return <ReadMore head={<PortableText value={head} components={components} />} tail={<PortableText value={tail} components={components} />} />
}
