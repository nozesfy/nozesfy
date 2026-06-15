import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Inter } from 'next/font/google';
import CookieBanner from '@/components/CookieBanner';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nozesfy.com.br';
const siteName = 'Nozesfy';
const defaultTitle = 'Nozesfy - Controle de Estoque';
const defaultDescription = 'Nozesfy é uma plataforma de gestão de estoque profissional, focada em pequenos comércios, supermercados e grandes redes.';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: {
    default: defaultTitle,
    template: '%s | Nozesfy',
  },
  description: defaultDescription,
  metadataBase: new URL(siteUrl),
  icons: {
    icon: '/favicon.webp',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [{url: '/logo.webp', width: 512, height: 512}],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: ['/logo.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Windows, macOS, Linux',
    description: defaultDescription,
    url: siteUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
  };

  return (
    <html lang="pt-BR" className={`${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
        />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased pb-20 md:pb-12">
        <AuthProvider>
          {children}
          <CookieBanner />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
