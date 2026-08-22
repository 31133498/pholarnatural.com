import Link from 'next/link'
import RevealOnScroll from '@/components/animations/RevealOnScroll'
import { ParallaxBlob } from '@/components/animations/ParallaxSection'
import { CURRENCY } from '@/lib/config'

/** Closing call to action (doc §1.2.6). */
export default function CTA() {
  return (
    <section className="relative overflow-hidden py-16">
      <div className="relative z-10 mx-auto max-w-7xl px-5 text-center md:px-16">
        <RevealOnScroll>
          <div className="rounded-[40px] bg-primary px-6 py-16 text-white">
            <h2 className="mb-6 font-headline-display text-headline-lg-mobile md:text-headline-display">
              Your hair deserves the best
            </h2>
            <p className="mx-auto mb-8 max-w-xl font-body-lg text-body-lg opacity-90">
              Join the thousands who have transformed their crown with our organic rituals. Start your
              journey today.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/shop"
                className="rounded-full bg-secondary px-10 py-4 font-label-sm text-label-sm text-white transition-transform hover:scale-105"
              >
                Shop Now
              </Link>
              <Link
                href="/book"
                className="rounded-full bg-white px-10 py-4 font-label-sm text-label-sm text-primary transition-transform hover:scale-105"
              >
                Book a Service
              </Link>
            </div>

            <p className="mt-8 font-body-md text-body-md opacity-90">
              All prices in {CURRENCY}
            </p>
          </div>
        </RevealOnScroll>
      </div>

      <ParallaxBlob className="absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 bg-secondary/10" offset={36} />
      <ParallaxBlob
        className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 bg-primary-container/10"
        offset={-36}
        delay="-10s"
      />
    </section>
  )
}
