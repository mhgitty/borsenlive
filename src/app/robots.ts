import type { MetadataRoute } from 'next'
import { BASE } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/studio/', '/api/', '/go/'] }],
    sitemap: [`${BASE}/sitemap.xml`],
  }
}
