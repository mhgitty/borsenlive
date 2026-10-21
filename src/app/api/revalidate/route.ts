import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const type = body?._type as string | undefined
    const slug = body?.slug?.current as string | undefined

    // Always bust the full layout — guarantees every page is fresh.
    // Also revalidate specific paths so ISR picks them up immediately.
    revalidatePath('/', 'layout')

    // Keep the sitemap in sync on every publish so new pages appear immediately.
    revalidatePath('/sitemap.xml')

    const specific: string[] = []
    const hit = (path: string) => { revalidatePath(path, 'page'); specific.push(path) }

    if (type === 'post') {
      if (slug) hit(`/${slug}/`)
    } else if (type === 'elselskab') {
      revalidatePath('/elselskaber-i-danmark/[slug]', 'page')
      hit('/elselskaber-i-danmark/')
      if (slug) hit(`/elselskaber-i-danmark/${slug}/`)
    } else if (type === 'elaftale') {
      // Agreements show up on company pages, the archive and any comparison table.
      revalidatePath('/elselskaber-i-danmark/[slug]', 'page')
      hit('/elselskaber-i-danmark/')
    } else if (type === 'guide') {
      revalidatePath('/guides/[slug]', 'page')
      hit('/guides/')
      if (slug) hit(`/guides/${slug}/`)
    }

    return NextResponse.json({
      revalidated: true,
      type: type ?? 'unknown',
      slug: slug ?? null,
      layout: '/',
      specific,
      ts: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ message: 'Revalidation failed', error: String(err) }, { status: 500 })
  }
}
