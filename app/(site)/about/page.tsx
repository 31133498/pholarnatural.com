import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import RevealOnScroll from '@/components/animations/RevealOnScroll'
import ParallaxSection from '@/components/animations/ParallaxSection'
import { VALUES } from '@/components/About'
import { BUSINESS } from '@/lib/config'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Pholar Natural bridges raw African tradition and premium clinical-grade organic beauty. Read our story, our sourcing, and the values behind every small-batch formulation.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About | Pholar Natural',
    description: 'Haircare rooted in nature and tradition.',
    url: '/about',
    images: [{ url: '/images/about/forest-botanicals.webp', alt: 'Lush forest botanicals' }],
  },
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex h-[60vh] min-h-[420px] items-center overflow-hidden">
        <Image
          src="/images/about/forest-botanicals.webp"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-7xl px-5 md:px-16">
          <h1 className="max-w-2xl font-headline-display text-headline-lg-mobile text-white md:text-headline-display">
            Haircare rooted in nature and tradition
          </h1>
          <p className="mt-4 max-w-xl font-body-lg text-body-lg text-white/90">
            Bridging the gap between raw African tradition and premium, clinical-grade organic beauty
            for your most radiant self.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <RevealOnScroll>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                Our Heritage
              </p>
              <h2 className="mb-6 mt-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">
                Botanical Elegance, Scientifically Perfected
              </h2>

              <div className="space-y-4 font-body-lg text-body-lg text-on-surface-variant">
                <p>
                  At Pholar Natural, we believe that the secrets to healthy, thriving hair have always
                  existed in the earth. Our journey began with a deep respect for ancestral African
                  beauty rituals — the oils, the butters, the threading and braiding techniques passed
                  between generations without ever being written down.
                </p>
                <p>
                  We&apos;ve taken those time-honoured ingredients and elevated them through modern
                  science. Each formula is a precise balance of traditional wisdom and clinical
                  efficacy, tested on real texture rather than assumed to work.
                </p>
                <p>
                  Sustainability is not a buzzword for us; it is our foundation. From our sourcing
                  practices to our glass packaging, every choice is made with the planet and your
                  wellbeing in mind. We buy directly from growers, blend in small batches, and refuse
                  to make more than we can sell fresh.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll>
              <p className="mt-8 flex items-start gap-3 rounded-2xl bg-surface-container-low p-5 font-body-md text-body-md text-on-surface-variant">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-on-surface">A note from the founder</strong> —
                  the full founder story is being written with the client and will appear here before
                  launch.
                </span>
              </p>
            </RevealOnScroll>
          </div>

          <ParallaxSection offset={24}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl">
              <Image
                src="/images/about/oil-pour.webp"
                alt="Thick organic hair oil being poured, photographed close up in the studio"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </ParallaxSection>
        </div>
      </section>

      {/* Values */}
      <section className="bg-surface-container py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-16">
          <RevealOnScroll>
            <h2 className="mb-10 text-center font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">
              What we hold ourselves to
            </h2>
          </RevealOnScroll>

          <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, description }, i) => (
              <RevealOnScroll as="li" key={title} index={i}>
                <div className="h-full rounded-2xl bg-surface-container-lowest p-8 text-center">
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <h3 className="mb-2 font-headline-md text-headline-md text-primary">{title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </ul>

          <RevealOnScroll>
            <div className="mt-12 text-center">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90"
              >
                Shop the Collection
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
                Or visit us — {BUSINESS.addressLines.join(', ')}. {BUSINESS.hours}.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  )
}
