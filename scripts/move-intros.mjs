#!/usr/bin/env node
/**
 * Moves the opening paragraphs of each body (normal paragraphs before the first
 * H2 / table / image / widget) into the document's `intro` field, so they show
 * in the hero. Documents that already have an intro are skipped.
 *
 *   node scripts/move-intros.mjs --dry
 *   node scripts/move-intros.mjs
 *   node scripts/move-intros.mjs --restore=scripts/.intro-backup-XXXX.json
 */
import { createClient } from '@sanity/client'
import { readFileSync, writeFileSync } from 'node:fs'

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true] }))
const client = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', apiVersion: '2026-04-22', token: process.env.SANITY_WRITE_TOKEN, useCdn: false })

if (args.restore) {
  const b = JSON.parse(readFileSync(args.restore, 'utf8'))
  for (let k = 0; k < b.length; k += 50) {
    let tx = client.transaction()
    for (const d of b.slice(k, k + 50)) tx = tx.patch(d._id, (p) => p.set({ body: d.body }).unset(['intro']))
    await tx.commit()
  }
  console.log(`Restored ${b.length}`); process.exit(0)
}

const OK_DECOR = new Set(['strong', 'em'])
function toIntroBlock(b) {
  const defs = (b.markDefs || []).filter((d) => d._type === 'link' && d.href)
  const keep = new Set(defs.map((d) => d._key))
  return {
    _type: 'block', _key: b._key, style: 'normal',
    markDefs: defs.map((d) => ({ _type: 'link', _key: d._key, href: d.href, ...(d.blank ? { blank: true } : {}), ...(d.nofollow ? { nofollow: true } : {}) })),
    children: (b.children || []).filter((c) => c._type === 'span').map((c) => ({ ...c, marks: (c.marks || []).filter((m) => OK_DECOR.has(m) || keep.has(m)) })),
  }
}

const docs = await client.fetch(`*[_type in ["page", "homepage", "guide", "elselskab"] && defined(body) && !(_id in path("drafts.**")) && (!defined(intro) || count(intro) == 0)]{ _id, _type, "slug": slug.current, body }`)
const changes = []
for (const d of docs) {
  const body = d.body || []
  if (!body.some((b) => b._type === 'block' && (b.style === 'h2' || b.style === 'h1'))) continue
  let n = 0
  while (n < body.length && body[n]._type === 'block' && (body[n].style || 'normal') === 'normal' && !body[n].listItem) n++
  if (!n) continue
  const intro = body.slice(0, n).map(toIntroBlock).filter((b) => b.children.some((c) => c.text.trim()))
  if (!intro.length) continue
  changes.push({ d, intro, body: body.slice(n) })
}
console.log(`${changes.length} documents${args.dry ? ' (dry run)' : ''}`)
for (const c of changes.slice(0, 5)) console.log(' ', c.d.slug || c.d._id, `${c.intro.length} paragraph(s):`, c.intro.map((b) => b.children.map((x) => x.text).join('')).join(' ').slice(0, 100))
if (args.dry) process.exit(0)
const file = `scripts/.intro-backup-${Date.now()}.json`
writeFileSync(file, JSON.stringify(changes.map((c) => ({ _id: c.d._id, body: c.d.body }))))
for (let k = 0; k < changes.length; k += 50) {
  let tx = client.transaction()
  for (const c of changes.slice(k, k + 50)) tx = tx.patch(c.d._id, (p) => p.set({ intro: c.intro, body: c.body }))
  await tx.commit({ visibility: 'async' })
}
console.log(`Backup: ${file}\nDone.`)
