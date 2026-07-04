import type { Metadata } from 'next'
import { Playfair_Display, Montserrat } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['600', '700'],
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Pholar Natural | Nature\'s Finest for Your Crown',
  description: 'Elevate your haircare routine with our premium organic solutions, blending traditional African wisdom with clinical-grade botanical ingredients.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${montserrat.variable} scroll-smooth`}>
      <body className="bg-background text-on-surface font-body-md overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}