import Link from 'next/link'
import Image from 'next/image'
import { Home, ShoppingBag, CalendarDays } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

/**
 * 404 page (doc §1.1.4).
 *
 * `not-found.tsx` at the app root catches both unmatched URLs and any `notFound()` call — the
 * product page throws one for an unknown slug.
 *
 * It sits above the `(site)` route group, so it renders the storefront chrome itself rather
 * than inheriting it — a 404 with no way to navigate out is a dead end.
 */
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-24 pt-40 text-center md:px-16">
      <div className="relative mb-8 h-40 w-40 overflow-hidden rounded-full">
        <Image
          src="/images/about/raw-ingredients.webp"
          alt=""
          fill
          sizes="160px"
          className="object-cover opacity-80"
        />
      </div>

      <p className="font-headline-display text-headline-display text-secondary">404</p>
      <h1 className="mt-2 font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
        This page has gone back to nature
      </h1>
      <p className="mt-4 max-w-md font-body-lg text-body-lg text-on-surface-variant">
        The page you were looking for doesn&apos;t exist, or has moved. Let&apos;s get you back to
        something that does.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to Home
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-outline px-8 py-4 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          Shop
        </Link>
        <Link
          href="/book"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-outline px-8 py-4 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Book
        </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
