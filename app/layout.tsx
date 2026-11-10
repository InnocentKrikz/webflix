import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Sora } from 'next/font/google'
import { Providers } from '@/components/providers'
import { AdguardBanner } from '@/components/adguard-banner'
import { SITE_DESCRIPTION, SITE_NAME, SITE_SOCIAL_IMAGE } from '@/lib/site-metadata'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
const metadataBase = configuredSiteUrl ? new URL(configuredSiteUrl) : undefined

export const metadata: Metadata = {
  metadataBase,
  title: `${SITE_NAME} — Stream Movies & TV Shows`,
  description: SITE_DESCRIPTION,
  keywords: [SITE_NAME, 'movies', 'TV shows', 'anime', 'streaming'],
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/sceneflix/sceneflix-icon-logo.ico', type: 'image/x-icon' },
      { url: '/sceneflix/sceneflix-icon-logo.png', type: 'image/png' },
    ],
    apple: '/sceneflix/sceneflix-icon-logo.png',
  },
  openGraph: {
    type: 'website',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [{ url: SITE_SOCIAL_IMAGE, alt: `${SITE_NAME} logo` }],
  },
  twitter: {
    card: 'summary',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [SITE_SOCIAL_IMAGE],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-image-preview': 'none',
      'max-video-preview': 0,
      'max-snippet': 0,
    },
  },
  other: {
    bingbot: 'noindex, nofollow, noarchive',
    slurp: 'noindex, nofollow, noarchive',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
  themeColor: '#0a0708',
  userScalable: false,
}

const effectsPreferenceScript = `try{if(localStorage.getItem('sceneflix:reduce-effects')==='true'){document.documentElement.setAttribute('data-reduce-effects','')}}catch{}`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <head>
        <meta name="clickaine-site-verification" content="88d5e600bf60872482872a014f12a9bbd2e8f7225da0866c34a58d4a0a0f04a4085eb6d4d7b450d077ee876a52203365b6e213028c7bf165f0e199bddd67249f" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <script dangerouslySetInnerHTML={{ __html: effectsPreferenceScript }} />
      </head>
      <body className="bg-background text-foreground antialiased">
        <AdguardBanner />
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
