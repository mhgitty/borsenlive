#!/usr/bin/env node
/**
 * Turn company sections in page bodies into "elselskabKortBlock" cards.
 *
 * A section is an H3 whose head (text before " – ", " - ", ":" …, after an optional
 * "1." number) names an elselskab document, plus the paragraphs/lists/first image
 * below it up to the next heading, table, widget, quote or second image.
 * Pages need at least 2 such sections. Gas and charger pages are skipped, because
 * the card shows live electricity prices.
 *
 *   node scripts/migrate-elselskab-cards.mjs --dry            # report only
 *   node scripts/migrate-elselskab-cards.mjs                  # apply (backs up first)
 *   node scripts/migrate-elselskab-cards.mjs --only=bedste-elselskab
 *   node scripts/migrate-elselskab-cards.mjs --restore=scripts/.cards-backup-XXXX.json
 *
 * Env: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_WRITE_TOKEN
 */
import { createClient } from '@sanity/client'
import { readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true] }))
const DRY = !!args.dry
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-04-22', token: process.env.SANITY_WRITE_TOKEN, useCdn: false,
})
const key = () => randomBytes(6).toString('hex')

if (args.restore) {
  const backup = JSON.parse(readFileSync(args.restore, 'utf8'))
  let tx = client.transaction()
  for (const d of backup) tx = tx.patch(d._id, (p) => p.set({ body: d.body }))
  await tx.commit()
  console.log(`Restored ${backup.length} documents`)
  process.exit(0)
}

// ── Company matching ─────────────────────────────────────────────────────────
const norm = (s) => String(s || '').toLowerCase()
  .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').replace(/ä/g, 'a').replace(/ö/g, 'o')
  .replace(/[^a-z0-9]/g, '')
const core = (s) => { const n = norm(s); const c = n.replace(/(energi|energy|el)$/, ''); return c.length >= 2 ? c : n }

const companies = await client.fetch(`*[_type == "elselskab" && !(_id in path("drafts.**"))]{ _id, name, "slug": slug.current }`)
const byKey = new Map()
for (const e of companies) for (const k of [norm(e.name), norm(e.slug), core(e.name), core(e.slug)]) if (k && !byKey.has(k)) byKey.set(k, e)
byKey.set('andel', companies.find((e) => e.slug === 'andel-energi'))
byKey.set('nrgi', companies.find((e) => e.slug === 'nrgi-zapp'))
byKey.set('jyskenergi', companies.find((e) => e.slug === 'jysk-enegri'))
byKey.set('jysk', companies.find((e) => e.slug === 'jysk-enegri'))
byKey.set('forsyningen', companies.find((e) => e.slug === 'forsygningen'))

const spanText = (b) => (b.children || []).filter((c) => c._type === 'span').map((c) => c.text).join('')
const hasInline = (b) => (b.children || []).some((c) => c._type !== 'span')

function matchHeading(b) {
  if (b._type !== 'block' || b.style !== 'h3') return null
  const text = spanText(b).replace(/\s+/g, ' ').trim()
  const m = text.match(/^(\d{1,2})\s*[.)]\s*(.+)$/)
  const rest = m ? m[2] : text
  const head = rest.split(/\s[-–—|:]\s|:\s|\s\(/)[0].trim()
  if (head.length > 40) return null
  const e = byKey.get(norm(head)) || byKey.get(core(head))
  if (!e) return null
  const title = hasInline(b) ? e.name : rest
  return { e, num: m ? +m[1] : null, title }
}

// ── Card body: plain blocks with links + inline prices only ──────────────────
const OK_DECOR = new Set(['strong', 'em'])
function toCardBlock(b) {
  const defs = (b.markDefs || []).filter((d) => d._type === 'link' && d.href)
  const keep = new Set(defs.map((d) => d._key))
  return {
    _type: 'block', _key: b._key || key(), style: 'normal',
    ...(b.listItem ? { listItem: b.listItem === 'number' ? 'number' : 'bullet', level: b.level || 1 } : {}),
    markDefs: defs.map((d) => ({ _type: 'link', _key: d._key, href: d.href, ...(d.blank ? { blank: true } : {}), ...(d.nofollow ? { nofollow: true } : {}) })),
    children: (b.children || [])
      .filter((c) => c._type === 'span' || c._type === 'elprisInline')
      .map((c) => c._type === 'span' ? { ...c, marks: (c.marks || []).filter((m) => OK_DECOR.has(m) || keep.has(m)) } : c),
  }
}

const isBoldLabel = (b) => b._type === 'block' && !b.listItem && (b.style || 'normal') === 'normal' &&
  spanText(b).trim().length > 0 && spanText(b).trim().length < 80 &&
  (b.children || []).filter((c) => c._type === 'span' && c.text.trim()).every((c) => (c.marks || []).includes('strong'))

function convert(body) {
  const out = []
  const cards = []
  let i = 0
  // Count candidate headings first (need >= 2 on the page)
  if (body.filter((b) => matchHeading(b)).length < 2) return null
  let run = 0
  while (i < body.length) {
    const b = body[i]
    const hit = matchHeading(b)
    if (!hit) { if (b._type === 'block' && /^h[1-4]$/.test(b.style || '')) run = 0; out.push(b); i++; continue }
    run++
    const sec = []
    let image = null
    let j = i + 1
    for (; j < body.length; j++) {
      const n = body[j]
      if (n._type === 'image') { if (image) break; image = n; continue }
      if (n._type !== 'block') break
      if ((n.style || 'normal') !== 'normal') break
      sec.push(n)
    }
    // A bold label left right before a table/widget belongs to that, not the card
    let end = j
    while (sec.length && isBoldLabel(sec[sec.length - 1]) && body[end] && body[end]._type !== 'block') { sec.pop(); end-- }
    // "Fordele …" / "Ulemper" bold paragraph + bullets → pros / cons
    const pros = [], cons = [], text = []
    for (let k = 0; k < sec.length; k++) {
      const n = sec[k]
      const kind = isBoldLabel(n) ? (/^(fordele|plus)/i.test(spanText(n).trim()) ? pros : /^(ulemper|minus)/i.test(spanText(n).trim()) ? cons : null) : null
      if (kind && sec[k + 1]?.listItem) {
        while (sec[k + 1]?.listItem) { kind.push(spanText(sec[k + 1]).trim()); k++ }
        continue
      }
      text.push(n)
    }
    const card = {
      _type: 'elselskabKortBlock', _key: b._key || key(),
      elselskab: { _type: 'reference', _ref: hit.e._id, _weak: true },
      rank: hit.num ?? run,
      customTitle: hit.title,
      ...(image ? { image: { _type: 'image', asset: image.asset, ...(image.alt ? { alt: image.alt } : {}) } } : {}),
      customBody: text.map(toCardBlock),
      ...(pros.length ? { pros } : {}),
      ...(cons.length ? { cons } : {}),
    }
    cards.push({ rank: card.rank, company: hit.e.name, title: hit.title, paragraphs: text.length, pros: pros.length, cons: cons.length, image: !!image })
    out.push(card)
    i = end
  }
  return { body: out, cards }
}

const SKIP = /(naturgas|^gas|-gas|opladning|ladeboks|ladestander|ladeboks)/
const only = args.only ? String(args.only).split(',') : null
const docs = await client.fetch(`*[_type in ["page", "homepage", "guide"] && count(body[style == "h3"]) >= 2]{ _id, _type, title, "slug": slug.current, body }`)
const changes = []
for (const d of docs) {
  const slug = d.slug || (d._type === 'homepage' ? '/' : d._id)
  if (only && !only.includes(slug)) continue
  if (SKIP.test(slug) && !/ladeplads/.test(slug)) continue
  const res = convert(d.body || [])
  if (!res || res.cards.length < 2) continue
  changes.push({ d, slug, ...res })
}

const total = changes.reduce((s, c) => s + c.cards.length, 0)
console.log(`${changes.length} documents, ${total} cards${DRY ? ' (dry run)' : ''}`)
for (const c of changes.slice(0, args.verbose ? 1e9 : 15)) {
  console.log(`\n${c.slug}${c.d._id.startsWith('drafts.') ? ' [draft]' : ''}`)
  for (const k of c.cards) console.log(`  ${k.rank}. ${k.company.padEnd(16)} ${k.paragraphs}p${k.pros ? ` +${k.pros}/${k.cons}` : ''}${k.image ? ' +img' : ''}  "${k.title.slice(0, 70)}"`)
}
if (changes.length > 15 && !args.verbose) console.log(`\n… and ${changes.length - 15} more (--verbose to list all)`)
if (DRY) process.exit(0)

const file = `scripts/.cards-backup-${Date.now()}.json`
writeFileSync(file, JSON.stringify(changes.map((c) => ({ _id: c.d._id, body: c.d.body }))))
console.log(`\nBackup: ${file}`)
for (let k = 0; k < changes.length; k += 50) {
  let tx = client.transaction()
  for (const c of changes.slice(k, k + 50)) tx = tx.patch(c.d._id, (p) => p.set({ body: c.body }))
  await tx.commit({ visibility: 'async' })
  process.stdout.write(`  patched ${Math.min(k + 50, changes.length)}/${changes.length}\r`)
}
console.log('\nDone.')
