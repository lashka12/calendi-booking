import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import ThemeSwitcher from './components/ThemeSwitcher'
import LanguageSwitcher from './components/LanguageSwitcher'
import { LanguageProvider } from './lib/i18n'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Book Appointment',
  description: 'Schedule your appointment',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#fafaf9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Theme - default to wine
                  var theme = localStorage.getItem('theme') || 'wine';
                  document.documentElement.setAttribute('data-theme', theme);
                  // Language & RTL - default to English
                  var lang = localStorage.getItem('language') || 'en';
                  if (lang && ['en', 'he', 'ar'].includes(lang)) {
                    document.documentElement.setAttribute('lang', lang);
                    if (lang === 'he' || lang === 'ar') {
                      document.documentElement.setAttribute('dir', 'rtl');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-main text-primary">
        <LanguageProvider>
        {children}
          <LanguageSwitcher />
          <ThemeSwitcher />
        </LanguageProvider>
      </body>
    </html>
  )
}
