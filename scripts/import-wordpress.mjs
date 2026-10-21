#!/usr/bin/env node
/**
 * WordPress (WXR export) → Sanity importer for borsenlive.dk.
 *
 *   SANITY_WRITE_TOKEN=… NEXT_PUBLIC_SANITY_PROJECT_ID=txr6xzd6 \
 *     node scripts/import-wordpress.mjs path/to/export.xml [--dry] [--only=slug,slug] [--skip-images]
 *
 * What it does
 *  - Published pages → `page` (parent/child kept, so every URL stays identical)
 *  - Children of /elselskaber-i-danmark/ → `elselskab` (company reviews)
 *  - The front page ("forside") → `homepage`
 *  - Gutenberg blocks → Portable Text: paragraphs, headings, lists, tables,
 *    images (uploaded to Sanity), quotes, Yoast FAQ → FAQ block
 *  - Plugin shortcodes → live widgets: reusable block "el liste" / [elselskab_compare]
 *    → comparison list, [elselskab_<brand>] → company list, [elpris …] → inline
 *    live price, [ladeboks_*], [naturgas_compare], [elpris_chart] …
 *  - Yoast title/description → metaTitle/metaDescription
 *  - Header menu → siteSettings.headerNav, footer → siteSettings
 *  - /go/ codes → `redirect` docs pointing at the live destinations
 *
 * Idempotent: document ids are derived from WP ids (wp-page-123 …), images are
 * cached by URL in scripts/.wp-image-cache.json. Re-running replaces the docs.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { parse as parseHtml, NodeType } from 'node-html-parser'
import { createClient } from '@sanity/client'

// ── Config ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const XML = args.find((a) => !a.startsWith('--'))
const DRY = args.includes('--dry')
const SKIP_IMAGES = args.includes('--skip-images')
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean)
const SITE = 'https://borsenlive.dk'
const SITE_HOSTS = ['borsenlive.dk', 'www.borsenlive.dk']
const SITE_NAME = 'Borsenlive'
const REVIEW_PARENT = 'elselskaber-i-danmark'
const FRONT_PAGE = 'forside'
const EL_LISTE_BLOCK = '1627' // reusable block containing [elselskab_compare]
const SHEET_ID = '12RhPm3xKVgt18B7sFlASBf4biBCCmOLQliiks-Imxbw'
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const CACHE_FILE = path.join(ROOT, 'scripts/.wp-image-cache.json')

if (!XML) { console.error('Usage: node scripts/import-wordpress.mjs export.xml [--dry]'); process.exit(1) }
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const token = process.env.SANITY_WRITE_TOKEN
if (!DRY && (!projectId || !token)) { console.error('Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN'); process.exit(1) }
const client = projectId ? createClient({ projectId, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', apiVersion: '2026-04-22', token, useCdn: false }) : null

const key = () => crypto.randomBytes(6).toString('hex')
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&hellip;/g, '…')
  .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
  .replace(/&rdquo;/g, '”').replace(/&ldquo;/g, '“').replace(/&aelig;/g, 'æ').replace(/&oslash;/g, 'ø').replace(/&aring;/g, 'å')
  .replace(/&AElig;/g, 'Æ').replace(/&Oslash;/g, 'Ø').replace(/&Aring;/g, 'Å')

// ── WXR parsing ────────────────────────────────────────────────────────────────
const xml = fs.readFileSync(XML, 'utf8')
const cdata = (s) => (s ?? '').replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')
function tag(item, t) {
  const m = item.match(new RegExp(`<${t.replace(':', '\\:')}>([\\s\\S]*?)</${t.replace(':', '\\:')}>`))
  return m ? cdata(m[1]) : ''
}
function metas(item) {
  const out = {}
  for (const m of item.matchAll(/<wp:meta_key><!\[CDATA\[(.*?)\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_value>/g)) out[m[1]] = m[2]
  return out
}
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1])
const posts = items.map((it) => ({
  id: tag(it, 'wp:post_id'),
  type: tag(it, 'wp:post_type'),
  status: tag(it, 'wp:status'),
  slug: decodeURIComponent(tag(it, 'wp:post_name')),
  parent: tag(it, 'wp:post_parent'),
  title: decode(tag(it, 'title')),
  link: tag(it, 'link'),
  content: tag(it, 'content:encoded'),
  date: tag(it, 'wp:post_date_gmt') || tag(it, 'wp:post_date'),
  menuOrder: +tag(it, 'wp:menu_order') || 0,
  attachmentUrl: tag(it, 'wp:attachment_url'),
  meta: metas(it),
  menus: [...it.matchAll(/<category domain="nav_menu" nicename="(.*?)"/g)].map((m) => m[1]),
}))
const byId = new Map(posts.map((p) => [p.id, p]))
const pages = posts.filter((p) => p.type === 'page' && p.status === 'publish')
const pageById = new Map(pages.map((p) => [p.id, p]))
const reviewParent = pages.find((p) => p.slug === REVIEW_PARENT)
const isReview = (p) => reviewParent && p.parent === reviewParent.id
const docIdFor = (p) => (p.slug === FRONT_PAGE ? 'homepage' : isReview(p) ? `wp-elselskab-${p.id}` : `wp-page-${p.id}`)
const pathFor = (p) => {
  if (p.slug === FRONT_PAGE) return '/'
  const segs = []
  let cur = p
  while (cur) { segs.unshift(cur.slug); cur = cur.parent !== '0' ? pageById.get(cur.parent) : null }
  return `/${segs.join('/')}/`
}
const pageByPath = new Map(pages.map((p) => [pathFor(p), p]))
// attachments: id → url/alt
const attachments = new Map(posts.filter((p) => p.type === 'attachment').map((p) => [p.id, { url: p.attachmentUrl, alt: p.meta._wp_attachment_image_alt || '' }]))
const altByUrl = new Map([...attachments.values()].map((a) => [a.url.replace(/^http:/, 'https:'), a.alt]))

// ── Helpers ────────────────────────────────────────────────────────────────────
function localPath(href) {
  if (!href) return href
  try {
    const u = new URL(href, SITE)
    if (SITE_HOSTS.includes(u.hostname) && !u.pathname.startsWith('/wp-content/')) {
      let p = u.pathname
      if (!p.endsWith('/') && !/\.[a-z0-9]{2,4}$/i.test(p)) p += '/'
      return p + u.search + u.hash
    }
  } catch {}
  return href
}

function yoast(str, title) {
  if (!str) return undefined
  const out = str
    .replace(/%%title%%/g, title)
    .replace(/%%sitename%%/g, SITE_NAME)
    .replace(/%%sep%%/g, '-')
    .replace(/%%page%%|%%primary_category%%|%%category%%|%%excerpt%%/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return out || undefined
}

function parseShortcodeAttrs(s) {
  const attrs = {}
  for (const m of (s || '').matchAll(/([a-z_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/gi)) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4]
  return attrs
}

// Brand shortcode → sheet cta slug. Each [elselskab_<x>] rendered cta_slug === <x>.
const BRAND_SHORTCODE = /^elselskab_(aura|dcc|evdk|modstrom|sefenergi|ok|goenergi|jyskenergi|nettopower|norlys|velkommen|energidrift|cheapenergy|altid|ewii|trygenergi|enkel)$/

/** Shortcode (block-level) → widgetBlock, or null if not a widget. */
function shortcodeToWidget(name, attrString) {
  const a = parseShortcodeAttrs(attrString)
  const w = (widget, extra = {}) => ({ _type: 'widgetBlock', _key: key(), widget, ...extra })
  if (name === 'elselskab_compare') return w('elselskabCompare')
  const brand = name.match(BRAND_SHORTCODE)
  if (brand) return w('elselskabBrand', { provider: brand[1] })
  if (name === 'ladeboks_compare') return a.brand ? w('ladeboksBrand', { brand: a.brand }) : w('ladeboksCompare')
  if (name === 'ladeboks_brand') return w('ladeboksBrand', { brand: a.brand || '' })
  if (name === 'naturgas_compare') return w('naturgasCompare')
  if (name === 'elpris_chart') return w('elprisChart', a.area ? { area: a.area.toUpperCase() } : {})
  if (name === 'elpris_topkort') return w('elprisTopkort')
  if (name === 'elpris_prisudvikling') return w('elprisPrisudvikling', a.area ? { area: a.area.toUpperCase() } : {})
  if (name === 'elpris_dag') return w('elprisDag')
  if (name === 'elpris_nu') return w('elprisNu')
  if (name === 'elpris_netselskab') return w('elprisNetselskab', a.adresse ? { adresse: a.adresse } : {})
  if (name === 'elselskab_promo') return null // global popup, see siteSettings
  return undefined
}
const BLOCK_SHORTCODE_RE = /\[([a-z_]+)((?:\s+[^\]]*)?)\]/gi

// ── Image upload (cached) ─────────────────────────────────────────────────────
const imageCache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {}
const stats = { images: 0, imageFails: [], unknownBlocks: {}, unknownShortcodes: {}, goCodes: new Set() }
async function uploadImage(src) {
  if (!src) return null
  const url = src.startsWith('//') ? 'https:' + src : new URL(src, SITE).toString().replace(/^http:/, 'https:')
  // prefer the original upload over WP's resized variants (-300x200)
  const original = url.replace(/-\d{2,4}x\d{2,4}(\.[a-z]{3,4})$/i, '$1')
  for (const candidate of [original, url]) {
    if (imageCache[candidate]) return imageCache[candidate]
  }
  if (SKIP_IMAGES || DRY) return `image-dry-${crypto.createHash('md5').update(original).digest('hex').slice(0, 12)}`
  for (const candidate of original === url ? [url] : [original, url]) {
    try {
      const res = await fetch(candidate)
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())
      const asset = await client.assets.upload('image', buf, { filename: path.basename(new URL(candidate).pathname), source: { name: 'wordpress', id: candidate, url: candidate } })
      imageCache[candidate] = asset._id
      imageCache[url] = asset._id
      fs.writeFileSync(CACHE_FILE, JSON.stringify(imageCache, null, 1))
      stats.images++
      return asset._id
    } catch (e) { /* try next */ }
  }
  stats.imageFails.push(url)
  return null
}
async function imageField(src, alt) {
  const ref = await uploadImage(src)
  if (!ref) return null
  return { _type: 'image', asset: { _type: 'reference', _ref: ref }, ...(alt ? { alt } : {}) }
}

// ── Gutenberg block tree ──────────────────────────────────────────────────────
function parseGutenberg(content) {
  const re = /<!--\s+(\/)?wp:([a-z0-9\/-]+)(\s+(\{[\s\S]*?\}))?\s+(\/)?-->/g
  const root = { name: 'root', children: [], parts: [] }
  const stack = [root]
  let last = 0
  let m
  while ((m = re.exec(content))) {
    const top = stack[stack.length - 1]
    const between = content.slice(last, m.index)
    if (between.trim()) top.parts.push({ html: between })
    last = re.lastIndex
    const [, closing, name, , json, selfClosing] = m
    if (closing) {
      const node = stack.pop()
      if (node && node.name !== name) console.warn('  ! mismatched block', node.name, name)
      continue
    }
    let attrs = {}
    try { attrs = json ? JSON.parse(json) : {} } catch {}
    const node = { name, attrs, children: [], parts: [] }
    top.parts.push({ node })
    if (!selfClosing) stack.push(node)
  }
  const tail = content.slice(last)
  if (tail.trim()) stack[stack.length - 1].parts.push({ html: tail })
  return root
}
const innerHtml = (node) => node.parts.map((p) => (p.html ?? innerHtml(p.node))).join('')

// ── HTML → Portable Text ──────────────────────────────────────────────────────
const INLINE_TAGS = new Set(['a', 'strong', 'b', 'em', 'i', 'span', 'u', 'br', 'sup', 'sub', 'code', 'mark', 'small', 'abbr', 'time', 's', 'del', 'ins', 'label'])

/** Inline nodes → { children, markDefs }. Shortcodes [elpris] become inline objects. */
function inlineToSpans(nodes, marks = [], ctx = { markDefs: [] }) {
  const children = []
  const pushText = (text, m) => {
    if (!text) return
    // inline price shortcodes
    const re = /\[(elpris_month|elpris)\b([^\]]*)\]/g
    let last = 0, mm
    while ((mm = re.exec(text))) {
      if (mm.index > last) children.push({ _type: 'span', _key: key(), text: text.slice(last, mm.index), marks: [...m] })
      const a = parseShortcodeAttrs(mm[2])
      children.push({
        _type: 'elprisInline', _key: key(),
        provider: (a.provider || '').toLowerCase(),
        kind: mm[1] === 'elpris_month' ? 'month' : 'kwh',
        area: (a.area || 'DK1').toUpperCase(),
        ...(a.decimals ? { decimals: +a.decimals } : {}),
      })
      last = re.lastIndex
    }
    if (last < text.length) children.push({ _type: 'span', _key: key(), text: text.slice(last), marks: [...m] })
  }
  for (const n of nodes) {
    if (n.nodeType === NodeType.TEXT_NODE) {
      pushText(decode(n.rawText).replace(/\s+/g, ' '), marks)
      continue
    }
    if (n.nodeType !== NodeType.ELEMENT_NODE) continue
    const t = n.rawTagName?.toLowerCase()
    if (t === 'br') { children.push({ _type: 'span', _key: key(), text: '\n', marks: [...marks] }); continue }
    if (t === 'img') continue
    let m = marks
    if (t === 'strong' || t === 'b') m = [...marks, 'strong']
    else if (t === 'em' || t === 'i') m = [...marks, 'em']
    else if (t === 'a') {
      const href = n.getAttribute('href')
      if (href) {
        const rel = (n.getAttribute('rel') || '').toLowerCase()
        const def = { _type: 'link', _key: key(), href: localPath(href) }
        if (n.getAttribute('target') === '_blank') def.blank = true
        if (rel.includes('nofollow') || rel.includes('sponsored')) def.nofollow = true
        if (/\/go\/([^/]+)/.test(def.href)) stats.goCodes.add(def.href.match(/\/go\/([^/?#]+)/)[1])
        ctx.markDefs.push(def)
        m = [...marks, def._key]
      }
    }
    const sub = inlineToSpans(n.childNodes, m, ctx)
    children.push(...sub.children)
  }
  return { children, markDefs: ctx.markDefs }
}

function tidyBlock(block) {
  // merge adjacent spans with identical marks, trim edges
  const out = []
  for (const c of block.children) {
    const prev = out[out.length - 1]
    if (c._type === 'span' && prev?._type === 'span' && prev.marks.join() === c.marks.join()) prev.text += c.text
    else out.push(c)
  }
  if (out[0]?._type === 'span') out[0].text = out[0].text.replace(/^\s+/, '')
  const lastSpan = out[out.length - 1]
  if (lastSpan?._type === 'span') lastSpan.text = lastSpan.text.replace(/\s+$/, '')
  block.children = out.filter((c) => c._type !== 'span' || c.text !== '' )
  // drop unused markDefs
  const used = new Set(block.children.flatMap((c) => c.marks || []))
  block.markDefs = block.markDefs.filter((d) => used.has(d._key))
  return block.children.some((c) => c._type !== 'span' || c.text.trim()) ? block : null
}

function textBlock(nodes, style = 'normal', extra = {}) {
  const ctx = { markDefs: [] }
  const { children } = inlineToSpans(nodes, [], ctx)
  return tidyBlock({ _type: 'block', _key: key(), style, markDefs: ctx.markDefs, children, ...extra })
}

const textOf = (el) => decode(el.textContent || el.rawText || '').replace(/\s+/g, ' ').trim()

/** Generic HTML → PT blocks (handles nested containers). */
async function htmlToBlocks(html, opts = {}) {
  const out = []
  // block-level shortcodes on their own
  const sc = html.trim().match(/^\[([a-z_]+)((?:\s+[^\]]*)?)\]$/i)
  if (sc) {
    const w = shortcodeToWidget(sc[1].toLowerCase(), sc[2])
    if (w) return [w]
    if (w === null) return []
  }
  const root = parseHtml(html, { comment: false, blockTextElements: { script: false, style: false, noscript: false } })
  let inlineRun = []
  const flush = () => {
    if (!inlineRun.length) return
    const text = inlineRun.map((n) => n.textContent ?? n.rawText).join('')
    // stand-alone shortcodes inside a paragraph-ish run
    const trimmed = decode(text).trim()
    const only = trimmed.match(/^\[([a-z_]+)((?:\s+[^\]]*)?)\]$/i)
    if (only) {
      const w = shortcodeToWidget(only[1].toLowerCase(), only[2])
      if (w) out.push(w)
      else if (w === undefined) stats.unknownShortcodes[only[1]] = (stats.unknownShortcodes[only[1]] || 0) + 1
    } else {
      const b = textBlock(inlineRun)
      if (b) out.push(b)
    }
    inlineRun = []
  }
  async function walk(nodes, listCtx) {
    for (const n of nodes) {
      if (n.nodeType === NodeType.TEXT_NODE) { if (n.rawText.trim() || inlineRun.length) inlineRun.push(n); continue }
      if (n.nodeType !== NodeType.ELEMENT_NODE) continue
      const t = n.rawTagName?.toLowerCase()
      if (INLINE_TAGS.has(t)) {
        // an <a> wrapping only an image → image
        const img = t === 'a' && n.querySelector('img') && !textOf(n) ? n.querySelector('img') : null
        if (img) { flush(); const im = await imageField(img.getAttribute('src'), img.getAttribute('alt')); if (im) out.push({ ...im, _key: key() }); continue }
        inlineRun.push(n); continue
      }
      flush()
      if (/^h[1-6]$/.test(t)) {
        const lvl = Math.min(4, Math.max(2, +t[1]))
        const b = textBlock(n.childNodes, `h${lvl}`)
        if (b) out.push(b)
      } else if (t === 'p') {
        const imgs = n.querySelectorAll('img')
        for (const img of imgs) { const im = await imageField(img.getAttribute('src'), img.getAttribute('alt')); if (im) out.push({ ...im, _key: key() }) }
        const inner = decode(n.textContent).trim()
        const only = inner.match(/^\[([a-z_]+)((?:\s+[^\]]*)?)\]$/i)
        if (only) { const w = shortcodeToWidget(only[1].toLowerCase(), only[2]); if (w) { out.push(w); continue } if (w === null) continue }
        const b = textBlock(n.childNodes)
        if (b) out.push(b)
      } else if (t === 'ul' || t === 'ol') {
        await listToBlocks(n, t === 'ol' ? 'number' : 'bullet', (listCtx?.level || 0) + 1)
      } else if (t === 'table') {
        out.push(tableToBlock(n))
      } else if (t === 'img') {
        const im = await imageField(n.getAttribute('src'), n.getAttribute('alt') || altByUrl.get((n.getAttribute('src') || '').replace(/^http:/, 'https:')))
        if (im) out.push({ ...im, _key: key() })
      } else if (t === 'blockquote') {
        const paras = n.querySelectorAll('p')
        const nodesList = paras.length ? paras : [n]
        for (const p of nodesList) { const b = textBlock(p.childNodes, 'blockquote'); if (b) out.push(b) }
      } else if (t === 'hr' || t === 'script' || t === 'style' || t === 'svg' || t === 'iframe' || t === 'noscript' || t === 'button' || t === 'input' || t === 'form') {
        // drop
      } else {
        // containers: div, figure, section, figcaption, details …
        if (t === 'figcaption') { const b = textBlock(n.childNodes); if (b) { b.style = 'normal'; out.push(b) } continue }
        await walk(n.childNodes, listCtx)
        flush()
      }
    }
  }
  async function listToBlocks(listEl, kind, level) {
    for (const li of listEl.childNodes) {
      if (li.nodeType !== NodeType.ELEMENT_NODE || li.rawTagName?.toLowerCase() !== 'li') continue
      const inlineNodes = li.childNodes.filter((c) => !(c.nodeType === NodeType.ELEMENT_NODE && ['ul', 'ol'].includes(c.rawTagName?.toLowerCase())))
      const b = textBlock(inlineNodes, 'normal', { listItem: kind, level })
      if (b) out.push(b)
      for (const sub of li.childNodes) {
        if (sub.nodeType === NodeType.ELEMENT_NODE && ['ul', 'ol'].includes(sub.rawTagName?.toLowerCase())) {
          await listToBlocks(sub, sub.rawTagName.toLowerCase() === 'ol' ? 'number' : 'bullet', level + 1)
        }
      }
    }
  }
  await walk(root.childNodes)
  flush()
  return out
}

function tableToBlock(table) {
  const rows = table.querySelectorAll('tr')
  const cells = (tr) => tr.childNodes.filter((c) => c.nodeType === NodeType.ELEMENT_NODE && ['td', 'th'].includes(c.rawTagName?.toLowerCase())).map(textOf)
  let headers = []
  let body = rows
  const theadRow = table.querySelector('thead tr')
  if (theadRow) { headers = cells(theadRow); body = rows.filter((r) => r !== theadRow && r.parentNode?.rawTagName?.toLowerCase() !== 'thead') }
  else if (rows[0] && rows[0].querySelectorAll('th').length) { headers = cells(rows[0]); body = rows.slice(1) }
  return {
    _type: 'tableBlock', _key: key(),
    headers,
    rows: body.map((r) => ({ _type: 'tableRow', _key: key(), cells: cells(r) })).filter((r) => r.cells.some((c) => c)),
  }
}

function faqToBlock(node) {
  const html = innerHtml(node)
  const root = parseHtml(html)
  const items = []
  const questions = node.attrs?.questions
  if (Array.isArray(questions) && questions.length) {
    for (const q of questions) {
      const qText = textOf(parseHtml(Array.isArray(q.question) ? q.question.map((x) => (typeof x === 'string' ? x : '')).join('') : String(q.jsonQuestion || q.question || '')))
      const aText = textOf(parseHtml(String(q.jsonAnswer || (Array.isArray(q.answer) ? q.answer.map((x) => (typeof x === 'string' ? x : '')).join('') : q.answer) || '')))
      if (qText) items.push({ _type: 'faqItem', _key: key(), question: qText, answer: aText })
    }
  }
  if (!items.length) {
    for (const sec of root.querySelectorAll('.schema-faq-section')) {
      const q = sec.querySelector('.schema-faq-question'); const a = sec.querySelector('.schema-faq-answer')
      if (q) items.push({ _type: 'faqItem', _key: key(), question: textOf(q), answer: a ? textOf(a) : '' })
    }
  }
  return items.length ? { _type: 'faqBlock', _key: key(), items } : null
}

const SKIP_BLOCKS = new Set(['ht/block-toc', 'spacer', 'separator', 'more', 'nextpage'])

async function convertNode(node) {
  const n = node.name
  if (SKIP_BLOCKS.has(n)) return []
  if (n === 'block') {
    if (String(node.attrs?.ref) === EL_LISTE_BLOCK) return [{ _type: 'widgetBlock', _key: key(), widget: 'elselskabCompare' }]
    const ref = byId.get(String(node.attrs?.ref))
    return ref ? convertContent(ref.content) : []
  }
  if (n === 'yoast/faq-block') { const b = faqToBlock(node); return b ? [b] : [] }
  if (n === 'shortcode' || n === 'html' || n === 'paragraph' || n === 'heading' || n === 'list' || n === 'table' || n === 'image' || n === 'quote' || n === 'pullquote' || n === 'freeform' || n === 'core/freeform') {
    return htmlToBlocks(innerHtml(node))
  }
  if (node.children?.length || node.parts.some((p) => p.node)) {
    // container blocks (columns, group, generateblocks …): convert children in order
    const out = []
    for (const part of node.parts) {
      if (part.node) out.push(...(await convertNode(part.node)))
      else out.push(...(await htmlToBlocks(part.html)))
    }
    return out
  }
  if (!['generateblocks/element', 'generateblocks/media', 'generateblocks/text', 'list-item', 'column', 'columns', 'group'].includes(n)) {
    stats.unknownBlocks[n] = (stats.unknownBlocks[n] || 0) + 1
  }
  return htmlToBlocks(innerHtml(node))
}

async function convertContent(content) {
  const tree = parseGutenberg(content)
  const out = []
  for (const part of tree.parts) {
    if (part.node) out.push(...(await convertNode(part.node)))
    else if (part.html.trim()) out.push(...(await htmlToBlocks(part.html)))
  }
  // a run of list items needs nothing special; drop empty normal blocks
  return out.filter(Boolean)
}

// ── Sheet (for elselskab logos / affiliate links) ─────────────────────────────
async function sheetRows(tab) {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`)
  const text = await res.text()
  const rows = []; let row = [], f = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = '' }
    else if (c !== '\r') f += c
  }
  if (f || row.length) { row.push(f); rows.push(row) }
  return rows.slice(1)
}

// ── Build documents ───────────────────────────────────────────────────────────
async function buildPage(p) {
  const body = await convertContent(p.content)
  const thumb = p.meta._thumbnail_id && attachments.get(p.meta._thumbnail_id)
  const featuredImage = thumb ? await imageField(thumb.url, thumb.alt) : null
  const base = {
    metaTitle: yoast(p.meta._yoast_wpseo_title, p.title),
    metaDescription: yoast(p.meta._yoast_wpseo_metadesc, p.title),
  }
  return { body, featuredImage, base }
}

async function main() {
  console.log(`Pages: ${pages.length} published (${pages.filter(isReview).length} reviews)`)
  let todo = pages
  if (ONLY.length) todo = pages.filter((p) => ONLY.includes(p.slug))

  const sheet = await sheetRows('Elselskaber').catch(() => [])
  const sheetByReview = new Map()
  for (const r of sheet) if (r[7]) sheetByReview.set(r[7].trim().replace(/^\/|\/$/g, ''), r)

  const docs = []
  let n = 0
  for (const p of todo) {
    n++
    process.stdout.write(`\r[${n}/${todo.length}] ${pathFor(p).padEnd(70).slice(0, 70)}`)
    const { body, featuredImage, base } = await buildPage(p)
    const _id = docIdFor(p)
    if (p.slug === FRONT_PAGE) {
      docs.push({
        _id, _type: 'homepage',
        heroHeading: p.title,
        body,
        showElselskaber: false,
        showComparisonTable: false,
        ...base,
        ...(featuredImage ? { featuredImage } : {}),
      })
    } else if (isReview(p)) {
      const name = p.title.split(/\s+Anmeldelse/i)[0].trim()
      const row = sheetByReview.get(p.slug)
      let logo = null
      const logoBase = row?.[4]?.replace(/\.(webp|png)$/i, '')
      if (logoBase && !DRY) {
        const file = path.join(ROOT, 'public/elselskaber/logos', `${logoBase}.webp`)
        if (fs.existsSync(file)) {
          const cacheKey = `local:${logoBase}`
          let ref = imageCache[cacheKey]
          if (!ref) { ref = (await client.assets.upload('image', fs.readFileSync(file), { filename: `${logoBase}.webp` }))._id; imageCache[cacheKey] = ref; fs.writeFileSync(CACHE_FILE, JSON.stringify(imageCache, null, 1)) }
          logo = { _type: 'image', asset: { _type: 'reference', _ref: ref }, alt: name }
        }
      }
      if (row?.[1]) stats.goCodes.add(row[1])
      docs.push({
        _id, _type: 'elselskab',
        name,
        titel: p.title,
        slug: { _type: 'slug', current: p.slug },
        priceAreas: ['DK1', 'DK2'],
        ...(row?.[1] ? { url: `/go/${row[1]}/`, ctaText: 'Gå til tilbud' } : {}),
        ...(row?.[6] ? { offer: row[6] } : {}),
        ...(logo ? { logo } : {}),
        body,
        ...base,
        ...(featuredImage ? { ogImage: featuredImage } : {}),
      })
    } else {
      const parentPage = p.parent !== '0' ? pageById.get(p.parent) : null
      docs.push({
        _id, _type: 'page',
        title: p.title,
        slug: { _type: 'slug', current: p.slug },
        ...(parentPage ? { parent: { _type: 'reference', _ref: docIdFor(parentPage), _weak: true } } : {}),
        body,
        ...base,
        ...(featuredImage ? { featuredImage } : {}),
      })
    }
  }
  process.stdout.write('\n')

  // ── Menus → siteSettings.headerNav ──────────────────────────────────────────
  const menuItems = posts.filter((p) => p.type === 'nav_menu_item' && p.status === 'publish' && p.menus.includes('header'))
  const navNode = (mi) => {
    const m = mi.meta
    const target = m._menu_item_type === 'post_type' ? pageById.get(m._menu_item_object_id) : null
    const label = mi.title || target?.title || 'Link'
    const node = { _key: key(), label }
    if (target) {
      if (target.slug === FRONT_PAGE) node.url = '/'
      else if (isReview(target)) node.elselskabRef = { _type: 'reference', _ref: docIdFor(target) }
      else node.pageRef = { _type: 'reference', _ref: docIdFor(target) }
    } else node.url = localPath(m._menu_item_url) || '/'
    const kids = menuItems.filter((c) => c.meta._menu_item_menu_item_parent === mi.id).sort((a, b) => a.menuOrder - b.menuOrder)
    if (kids.length) node.children = kids.map(navNode)
    return node
  }
  const headerNav = menuItems.filter((mi) => mi.meta._menu_item_menu_item_parent === '0').sort((a, b) => a.menuOrder - b.menuOrder).map(navNode)
  // sub-menu items need _type for nested object arrays
  const typeNav = (nodes, depth) => nodes.map((x) => ({
    ...x, _type: depth === 0 ? 'navItem' : depth === 1 ? 'subNavItem' : depth === 2 ? 'subSubNavItem' : 'subSubSubNavItem',
    ...(x.children ? { children: typeNav(x.children, depth + 1) } : {}),
  }))

  // ── Footer (from the live site — the WP footer uses navigation blocks) ─────
  const footer = await scrapeFooter()

  const settings = {
    _id: 'siteSettings', _type: 'siteSettings',
    headerNav: typeNav(headerNav, 0),
    ...footer,
    showPromoPopup: false,
  }

  // ── /go/ redirects (resolve live destinations) ───────────────────────────────
  for (const tab of ['Ladebokse', 'Naturgas']) {
    const rows = await sheetRows(tab).catch(() => [])
    for (const r of rows) {
      const code = tab === 'Ladebokse' ? r[4] : r[1]
      if (code?.trim()) stats.goCodes.add(code.trim())
    }
  }
  for (const r of sheet) if (r[1]) stats.goCodes.add(r[1].trim())
  const redirects = []
  for (const code of [...stats.goCodes].sort()) {
    try {
      const res = await fetch(`${SITE}/go/${code}/`, { redirect: 'manual' })
      const dest = res.headers.get('location')
      if (dest && !SITE_HOSTS.includes(new URL(dest).hostname)) {
        redirects.push({ _id: `wp-go-${code.replace(/[^a-z0-9_-]/gi, '')}`, _type: 'redirect', title: code, code: { _type: 'slug', current: code }, destination: dest, active: true })
      } else console.warn(`  ! /go/${code}/ → ${dest || res.status} (skipped)`)
    } catch (e) { console.warn(`  ! /go/${code}/ failed`, e.message) }
  }

  const all = [...docs, ...(ONLY.length ? [] : [settings, ...redirects])]
  fs.writeFileSync(path.join(ROOT, 'scripts/.wp-import-preview.ndjson'), all.map((d) => JSON.stringify(d)).join('\n'))
  console.log(`Built ${docs.length} docs, ${redirects.length} redirects. Images uploaded: ${stats.images}, failed: ${stats.imageFails.length}`)
  if (stats.imageFails.length) console.log('  failed images:', stats.imageFails.slice(0, 20))
  console.log('Unknown blocks:', stats.unknownBlocks)
  console.log('Unknown shortcodes:', stats.unknownShortcodes)
  if (DRY) { console.log('Dry run — nothing written. Preview: scripts/.wp-import-preview.ndjson'); return }

  // write in batches
  for (let i = 0; i < all.length; i += 40) {
    const tx = client.transaction()
    for (const d of all.slice(i, i + 40)) {
      if (d._id === 'siteSettings' || d._id === 'homepage') {
        // merge into singletons so manual Studio settings (logo etc.) survive re-runs
        tx.createIfNotExists({ _id: d._id, _type: d._type })
        const { _id, _type, ...rest } = d
        tx.patch(d._id, (p) => p.set(rest))
      } else tx.createOrReplace(d)
    }
    await tx.commit({ visibility: 'async' })
    process.stdout.write(`\rWritten ${Math.min(i + 40, all.length)}/${all.length}`)
  }
  process.stdout.write('\nDone.\n')
}

async function scrapeFooter() {
  try {
    const html = await (await fetch(SITE + '/')).text()
    const root = parseHtml(html)
    const footerEl = root.querySelector('.site-footer') || root.querySelector('footer')
    if (!footerEl) return {}
    const cols = []
    // column titles are .gb-text paragraphs followed by navigation link lists
    let current = null
    for (const el of footerEl.querySelectorAll('p.gb-text, a')) {
      if (el.rawTagName === 'p') {
        const t = textOf(el)
        if (t.length < 60) { current = { _type: 'footerColumn', _key: key(), title: t, items: [] }; cols.push(current) } else break
      } else if (current && el.getAttribute('href')) {
        current.items.push({ _type: 'navItem', _key: key(), label: textOf(el), url: localPath(el.getAttribute('href')) })
      }
    }
    const tagline = footerEl.querySelectorAll('p.gb-text').map(textOf).find((t) => t.length > 120)
    const cloudHeading = footerEl.querySelector('h2')
    const cloudPara = cloudHeading?.nextElementSibling
    const cloud = cloudPara ? cloudPara.querySelectorAll('a').map((a) => ({ _type: 'cloudLink', _key: key(), label: textOf(a), url: localPath(a.getAttribute('href')) })) : []
    const copyright = footerEl.querySelectorAll('p.gb-text').map(textOf).find((t) => /copyright/i.test(t))
    return {
      footerColumns: cols.filter((c) => c.items.length),
      ...(tagline ? { footerLongDisclaimer: tagline } : {}),
      ...(cloud.length ? { footerLinkCloudTitle: textOf(cloudHeading), footerLinkCloud: cloud } : {}),
      ...(copyright ? { footerNote: copyright.replace(/20\d\d/, '[year]') } : {}),
    }
  } catch (e) {
    console.warn('footer scrape failed', e.message)
    return {}
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
