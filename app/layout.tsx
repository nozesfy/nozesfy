import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/components/AuthProvider';
import { Inter } from 'next/font/google';
import CookieBanner from '@/components/CookieBanner';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Nozesfy - Controle de Estoque',
  description: 'Nozesfy é uma plataforma de gestão de estoque profissional, focada em pequenos comércios, supermercados e grandes redes.',
  icons: {
    icon: '/favicon.webp',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable}`}>
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
