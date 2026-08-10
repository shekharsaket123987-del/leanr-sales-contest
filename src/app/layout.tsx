import type { Metadata } from 'next'
import { Geist, Geist_Mono, Rajdhani } from 'next/font/google'
import './globals.css'
import { ThemeProvider, NO_FLASH_SCRIPT } from '@/components/theme-provider'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const rajdhani = Rajdhani({ variable: '--font-rajdhani', subsets: ['latin'], weight: ['500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Sales Contest — Fitelo LeanR',
  description: 'Live leaderboard for the 10–16 August coach & dietitian sales contest.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-full bg-leanr-bg-light text-zinc-900 dark:bg-leanr-bg dark:text-leanr-white">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
