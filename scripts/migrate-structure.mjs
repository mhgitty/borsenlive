#!/usr/bin/env node
/**
 * Body clean-up after the WordPress import:
 *  1. "Fordele | Ulemper" tables            → prosConsBlock
 *  2. Numbered "Title: text" step lists under a "Sådan…/Trin…/skift…" heading → howToBlock
 *     (heading + intro paragraph stay; the block gets the heading as schema name, hideTitle)
 *  3. Single-company comparison widgets right after an elselskab card are removed
 *
 *   node scripts/migrate-structure.mjs --dry [--only=slug,slug] [--verbose]
 *   node scripts/migrate-structure.mjs
 *   node scripts/migrate-structure.mjs --restore=scripts/.structure-backup-XXXX.json
 */
import { createClient } from '@sanity/client'
import { readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true] }))
const client = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', apiVersion: '2026-04-22', token: process.env.SANITY_WRITE_TOKEN, useCdn: false })
const key = () => randomBytes(6).toString('hex')

if (args.restore) {
  const b = JSON.parse(readFileSync(args.restore, 'utf8'))
  for (let k = 0; k < b.length; k += 50) { let tx = client.transaction(); for (const d of b.slice(k, k + 50)) tx = tx.patch(d._id, (p) => p.set({ body: d.body })); await tx.commit() }
  console.log(`Restored ${b.length}`); process.exit(0)
}

const text = (b) => (b.children || []).filter((c) => c._type === 'span').map((c) => c.text).join('')
const isHeading = (b) => b?._type === 'block' && /^h[1-4]$/.test(b.style || '')
const HOWTO_HEAD = /(sådan|trin|skift|guide til)/i

/** Split "Bold title: rest" list item → { title, body block } or null. */
function splitStep(b) {
  const kids = b.children || []
  let title = ''
  for (let i = 0; i < kids.length; i++) {
    const c = kids[i]
    if (c._type !== 'span') return null
    const at = c.text.indexOf(':')
    if (at === -1) { title += c.text; continue }
    title += c.text.slice(0, at)
    title = title.trim()
    if (!title || title.length > 70) return null
    const restFirst = c.text.slice(at + 1).replace(/^\s+/, '')
    const rest = [...(restFirst ? [{ ...c, _key: key(), text: restFirst, marks: (c.marks || []).filter((m) => m !== 'strong') }] : []), ...kids.slice(i + 1)]
    const defs = (b.markDefs || []).filter((d) => d._type === 'link' && d.href)
    const keep = new Set(defs.map((d) => d._key))
    const bodyKids = rest.filter((x) => x._type === 'span').map((x) => ({ ...x, marks: (x.marks || []).filter((m) => m === 'strong' || m === 'em' || keep.has(m)) }))
    if (!bodyKids.length) return null
    return { title, body: [{ _type: 'block', _key: key(), style: 'normal', markDefs: defs, children: bodyKids }] }
  }
  return null
}

/** Paragraph/list item → plain step paragraph (lists become "• " lines). */
function toStepBlock(b) {
  const defs = (b.markDefs || []).filter((d) => d._type === 'link' && d.href)
  const keep = new Set(defs.map((d) => d._key))
  const kids = (b.children || []).filter((c) => c._type === 'span').map((c) => ({ ...c, marks: (c.marks || []).filter((m) => m === 'strong' || m === 'em' || keep.has(m)) }))
  if (b.listItem && kids[0]) kids[0] = { ...kids[0], text: '• ' + kids[0].text }
  return { _type: 'block', _key: b._key || key(), style: 'normal', markDefs: defs, children: kids }
}

function convert(body) {
  const out = []
  const stats = { proscons: 0, howto: 0, brand: 0 }
  let lastHeading = null
  let lastHeadingStyle = null
  let sinceHeading = 0
  for (let i = 0; i < body.length; i++) {
    const b = body[i]
    // 2b. how-to as numbered H3 steps ("1. Kortlæg dit kørselsbehov" + paragraphs) under a how-to H2
    if (b._type === 'block' && b.style === 'h3' && lastHeadingStyle === 'h2' && lastHeading && HOWTO_HEAD.test(lastHeading)) {
      const items = []
      let j = i, n = 1
      while (j < body.length && body[j]._type === 'block' && body[j].style === 'h3') {
        const m = text(body[j]).trim().match(/^(\d{1,2})\s*[.)]\s*(.+)$/)
        if (!m || +m[1] !== n) break
        const paras = []
        let k = j + 1
        while (k < body.length && body[k]._type === 'block' && (body[k].style || 'normal') === 'normal') { paras.push(body[k]); k++ }
        if (!paras.length) break
        items.push({ _type: 'howToItem', _key: body[j]._key || key(), title: m[2].trim(), body: paras.map(toStepBlock) })
        j = k; n++
      }
      const endsClean = j >= body.length || body[j]._type !== 'block' || /^h[12]$/.test(body[j].style || '')
      if (items.length >= 3 && endsClean) {
        out.push({ _type: 'howToBlock', _key: key(), title: lastHeading, hideTitle: true, items })
        stats.howto++; i = j - 1; sinceHeading = 99; continue
      }
    }

    if (isHeading(b)) { lastHeading = text(b).trim(); lastHeadingStyle = b.style; sinceHeading = 0; out.push(b); continue }

    // 3. brand widget right after a card
    if (b._type === 'widgetBlock' && b.widget === 'elselskabBrand' && out[out.length - 1]?._type === 'elselskabKortBlock') { stats.brand++; continue }

    // 1. Fordele/Ulemper table
    if (b._type === 'tableBlock' && b.headers?.length === 2 && /^fordel/i.test(b.headers[0]?.trim() || '') && /^ulemp/i.test(b.headers[1]?.trim() || '')) {
      const pros = [], cons = []
      for (const r of b.rows || []) {
        const [p, c] = r.cells || []
        if (p?.trim()) pros.push(p.trim())
        if (c?.trim()) cons.push(c.trim())
      }
      if (pros.length || cons.length) {
        out.push({ _type: 'prosConsBlock', _key: b._key, ...(b.title ? { title: b.title } : {}), pros, cons })
        stats.proscons++; continue
      }
    }

    // 2. how-to step list
    if (b._type === 'block' && b.listItem === 'number' && lastHeading && HOWTO_HEAD.test(lastHeading) && sinceHeading <= 3) {
      let j = i
      const items = []
      while (j < body.length && body[j]._type === 'block' && body[j].listItem === 'number') {
        const s = splitStep(body[j]); if (!s) break
        items.push({ _type: 'howToItem', _key: body[j]._key || key(), title: s.title, body: s.body }); j++
      }
      const runEnd = (() => { let k = i; while (k < body.length && body[k]._type === 'block' && body[k].listItem === 'number') k++; return k })()
      if (items.length >= 3 && j === runEnd) {
        out.push({ _type: 'howToBlock', _key: key(), title: lastHeading, hideTitle: true, items })
        stats.howto++; i = j - 1; sinceHeading = 99; continue
      }
    }

    sinceHeading++
    out.push(b)
  }
  return { out, stats }
}

const only = args.only ? String(args.only).split(',') : null
const docs = await client.fetch(`*[_type in ["page", "homepage", "guide", "elselskab"] && defined(body)]{ _id, _type, "slug": slug.current, body }`)
const changes = []
const tot = { proscons: 0, howto: 0, brand: 0 }
for (const d of docs) {
  const slug = d.slug || d._id
  if (only && !only.includes(slug)) continue
  const { out, stats } = convert(d.body)
  if (!stats.proscons && !stats.howto && !stats.brand) continue
  for (const k in tot) tot[k] += stats[k]
  changes.push({ d, slug, out, stats })
}
console.log(`${changes.length} documents · ${tot.proscons} pros/cons · ${tot.howto} how-to · ${tot.brand} brand widgets removed${args.dry ? ' (dry run)' : ''}`)
for (const c of changes.slice(0, args.verbose ? 1e9 : 12)) console.log(`  ${c.slug}  ${JSON.stringify(c.stats)}`)
if (args.dry) process.exit(0)
const file = `scripts/.structure-backup-${Date.now()}.json`
writeFileSync(file, JSON.stringify(changes.map((c) => ({ _id: c.d._id, body: c.d.body }))))
for (let k = 0; k < changes.length; k += 50) {
  let tx = client.transaction()
  for (const c of changes.slice(k, k + 50)) tx = tx.patch(c.d._id, (p) => p.set({ body: c.out }))
  await tx.commit({ visibility: 'async' })
}
console.log(`Backup: ${file}\nDone.`)
