import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { BASE } from '@/lib/site'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const redirect = await client.fetch<{ destination: string; active: boolean } | null>(
    `*[_type == "redirect" && code.current == $code][0] { destination, active }`,
    { code },
    { next: { revalidate: 60 } }
  )

  if (!redirect || !redirect.active) {
    return NextResponse.redirect(new URL('/', BASE), 302)
  }

  // Pass every query param on /go/<code>/?… through to the tracker (e.g. placement=/bedste-elselskab/).
  // Without a placement param (JS off, link opened directly) fall back to the referring page's path.
  let dest: URL
  try { dest = new URL(redirect.destination) } catch { return NextResponse.redirect(redirect.destination, 302) }
  req.nextUrl.searchParams.forEach((value, key) => { dest.searchParams.set(key, value) })
  if (!dest.searchParams.has('placement')) {
    const ref = req.headers.get('referer')
    try {
      const r = ref ? new URL(ref) : null
      if (r && r.host === req.nextUrl.host) dest.searchParams.set('placement', r.pathname)
    } catch { /* ignore bad referer */ }
  }

  const res = NextResponse.redirect(dest.toString(), 302)
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}
