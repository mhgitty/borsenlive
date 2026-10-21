import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import { draftMode } from 'next/headers'
import { AdminBar } from '@/components/AdminBar'
import { PreviewBanner } from '@/components/PreviewBanner'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { PromoPopup } from '@/components/elcompare/PromoPopup'
import { getSiteSettings } from '@/lib/sanity'
import './globals.css'
import { BASE, SITE_DOMAIN } from '@/lib/site'

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-figtree',
  display: 'swap',
})


export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'Borsenlive — Sammenlign elselskaber og elpriser',
    template: '%s',
  },
  description: 'Find det billigste elselskab. Vi sammenligner spotpriser, fastpriser og abonnementer hos de danske elselskaber.',
  keywords: ['elselskab', 'elpris', 'sammenlign elselskaber', 'billig strøm', 'spotpris', 'fastpris', 'skift elselskab'],
  alternates: { canonical: BASE + '/' },
  openGraph: {
    siteName: SITE_DOMAIN,
    locale: 'da_DK',
    type: 'website',
    url: BASE + '/',
    title: 'Borsenlive — Sammenlign elselskaber og elpriser',
    description: 'Find det billigste elselskab og den bedste elaftale.',
    images: [{ url: `${BASE}/og.png`, width: 1200, height: 630, alt: SITE_DOMAIN }],
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
  icons: {
    icon: [{ url: '/favicon.webp', type: 'image/webp' }],
    apple: '/favicon.webp',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled: isPreview } = await draftMode()
  const settings = await getSiteSettings().catch(() => null)
  return (
    <html lang="da" className={figtree.variable}>
      <body>
        {isPreview && <PreviewBanner />}
        <AdminBar />
        {children}
        {settings?.showPromoPopup && <PromoPopup />}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
