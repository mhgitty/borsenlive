'use client'

import { useState } from 'react'
import { PortableTextRenderer } from './PortableTextRenderer'

const LIMIT = 60

function toPlain(value: any[]): string {
  if (!Array.isArray(value)) return ''
  return value
    .filter((b) => b?._type === 'block' && Array.isArray(b.children))
    .map((b: any) => b.children.map((c: any) => c?.text || '').join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function HeroIntro({ value }: { value: any[] }) {
  const [open, setOpen] = useState(false)
  const words = toPlain(value).split(' ').filter(Boolean)

  // Short intro — no toggle needed.
  if (words.length <= LIMIT) return <PortableTextRenderer value={value} />

  if (open) {
    return (
      <div>
        <PortableTextRenderer value={value} />
        <button type="button" className="hero-readmore" onClick={() => setOpen(false)}>Vis mindre</button>
      </div>
    )
  }

  return (
    <p style={{ margin: 0 }}>
      {words.slice(0, LIMIT).join(' ')}…{' '}
      <button type="button" className="hero-readmore" onClick={() => setOpen(true)}>Læs mere</button>
    </p>
  )
}
