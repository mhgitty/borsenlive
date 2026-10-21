import { createClient } from '@sanity/client'
import { NextResponse, type NextRequest } from 'next/server'

// Fixes documents written by the Make automations that occasionally wrap their
// Portable Text output in a container object like { "p1blocks": [ ...blocks ] }.
// Such an element has no `_type`, which makes Sanity Studio show
// "missing a type name" / "missing keys". This endpoint flattens any such
// wrapper back into real body blocks. Triggered by a Sanity webhook on
// create/update, so it repairs the doc within seconds — before an editor opens it.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

const PORTABLE_TEXT_FIELDS = ['body', 'intro']

// Diagnostic: GET /api/normalize-blocks/?secret=... reports which env vars the
// live deployment actually has (names only, never values), to catch a missing
// var, a naming typo, or a wrong-environment scope.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return new Response('Invalid secret', { status: 401 })
  }

  // If ?id= is supplied, run the actual flatten on that document and report the
  // result — same code path the webhook uses. Lets us trigger/verify manually.
  const id = req.nextUrl.searchParams.get('id')
  if (id) return await normalizeDoc(id)

  return NextResponse.json({
    ok: true,
    runtime: 'nodejs',
    hasWriteToken: !!process.env.SANITY_WRITE_TOKEN,
    hasReadToken: !!process.env.SANITY_API_READ_TOKEN,
    hasRevalidateSecret: !!process.env.REVALIDATE_SECRET,
    hasProjectId: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    sanityOrTokenEnvNames: Object.keys(process.env).filter((k) => /SANITY|TOKEN/i.test(k)).sort(),
  })
}

async function normalizeDoc(id: string) {
  const token = process.env.SANITY_WRITE_TOKEN
  if (!token) return NextResponse.json({ ok: false, error: 'SANITY_WRITE_TOKEN not set' }, { status: 500 })
  const client = createClient({ projectId, dataset, apiVersion: '2026-04-22', useCdn: false, token, perspective: 'raw' })
  const doc = await client.fetch<Record<string, any> | null>(`*[_id == $id][0]`, { id })
  if (!doc) return NextResponse.json({ ok: false, error: 'document not found', id }, { status: 404 })

  const patch: Record<string, Block[]> = {}
  const report: Record<string, string> = {}
  for (const field of PORTABLE_TEXT_FIELDS) {
    const { changed, out, bad } = flatten(doc[field])
    if (changed && bad === 0) {
      patch[field] = out
      report[field] = `flattened to ${out.length} blocks`
    } else if (changed && bad > 0) {
      report[field] = `skipped — ${bad} blocks still missing _type/_key`
    }
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true, id, changed: false })
  await client.patch(id).set(patch).commit()
  return NextResponse.json({ ok: true, id, changed: true, report })
}

type Block = Record<string, any>

function flatten(arr: unknown): { changed: boolean; out: Block[]; bad: number } {
  if (!Array.isArray(arr)) return { changed: false, out: [], bad: 0 }
  let changed = false
  const out: Block[] = []
  for (const el of arr as Block[]) {
    if (el && typeof el === 'object' && !el._type) {
      const wrapKey = Object.keys(el).find((k) => /blocks$/i.test(k) && Array.isArray(el[k]))
      if (wrapKey) {
        changed = true
        for (const b of el[wrapKey]) out.push(b)
        continue
      }
    }
    out.push(el)
  }
  const bad = out.filter((b) => !b?._type || !b?._key).length
  return { changed, out, bad }
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return new Response('Invalid secret', { status: 401 })
  }
  let payload: any = {}
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 })
  }

  // Sanity webhook payload shapes vary by projection — accept the common ones.
  const id: string | undefined =
    payload?._id || payload?.documentId || payload?.ids?.[0] || payload?.result?._id
  if (!id) {
    return NextResponse.json(
      { ok: false, error: 'no document _id in payload', payloadKeys: Object.keys(payload || {}) },
      { status: 400 }
    )
  }

  return await normalizeDoc(id)
}
