import type { MetadataRoute } from 'next'
import { sitemapEntries } from '@/lib/sitemapEntries'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries()
}
