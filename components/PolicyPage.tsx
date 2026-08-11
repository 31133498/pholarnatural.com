import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { BUSINESS } from '@/lib/config'

/**
 * Shared shell for the four policy pages (doc §1.13).
 *
 * Keeps the four consistent and constrains the measure — long legal copy at full container width
 * is unreadable. `lastUpdated` is passed in per page rather than computed, so the date reflects
 * when the text actually changed instead of when the site was last built.
 */
export default function PolicyPage({
  title,
  intro,
  lastUpdated,
  children,
}: {
  title: string
  intro: string
  lastUpdated: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-16">
      <header className="mb-10 border-b border-outline-variant pb-8">
        <h1 className="font-headline-display text-headline-lg-mobile text-primary md:text-headline-display">
          {title}
        </h1>
        <p className="mt-4 font-body-lg text-body-lg text-on-surface-variant">{intro}</p>
        <p className="mt-4 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          Last updated {lastUpdated}
        </p>
      </header>

      {/*
        `[&_h2]` style hooks rather than a prose plugin: the project has no typography plugin
        installed, and these pages are the only place raw long-form copy appears.
      */}
      <div
        className="space-y-6 font-body-md text-body-md text-on-surface-variant
          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
          [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:font-headline-md [&_h2]:text-headline-md [&_h2]:text-primary
          [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-body-md [&_h3]:text-body-lg [&_h3]:font-semibold [&_h3]:text-on-surface
          [&_li]:mb-1
          [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6"
      >
        {children}
      </div>

      <section className="mt-16 rounded-2xl bg-surface-container-low p-8 text-center">
        <h2 className="font-headline-md text-headline-md text-primary">Questions about this policy?</h2>
        <p className="mx-auto mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
          Email us at{' '}
          <a href={`mailto:${BUSINESS.email}`} className="text-primary underline underline-offset-2">
            {BUSINESS.email}
          </a>{' '}
          and we&apos;ll come back to you within 24 hours.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90"
        >
          Contact us
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  )
}
