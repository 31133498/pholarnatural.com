import { Quote, Star } from 'lucide-react'
import TiltCard from '@/components/animations/TiltCard'
import RevealOnScroll from '@/components/animations/RevealOnScroll'
import { TESTIMONIALS } from '@/lib/data'

/**
 * Homepage testimonials (doc §1.2.5).
 *
 * The doc specifies a gradient circle carrying the reviewer's initial rather than a photograph,
 * so that is what is rendered here — the Stitch design used stock portraits, and the doc wins.
 */
export default function Testimonials() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-5 md:px-16">
        <RevealOnScroll>
          <div className="mb-12 text-center">
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Testimonials</p>
            <h2 className="mt-2 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">
              Loved by our community
            </h2>
          </div>
        </RevealOnScroll>

        <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <RevealOnScroll as="li" key={t.id} index={i} className="h-full">
              <TiltCard maxTilt={3} className="h-full">
                <figure className="tilt-card relative flex h-full flex-col rounded-3xl bg-surface-container-low p-6">
                  <Quote className="mb-4 h-8 w-8 shrink-0 text-secondary/30" aria-hidden="true" />

                  <div className="mb-4 flex items-center gap-1" aria-label="Rated 5 out of 5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-current text-secondary" aria-hidden="true" />
                    ))}
                  </div>

                  <blockquote className="mb-6 flex-1 font-body-md text-body-md italic text-on-surface">
                    “{t.quote}”
                  </blockquote>

                  <figcaption className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container font-headline-md text-body-lg text-white"
                    >
                      {t.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block font-label-sm text-label-sm font-bold text-primary">{t.name}</span>
                      <span className="block font-label-sm text-[10px] font-bold uppercase text-secondary">
                        {t.role}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </ul>
      </div>
    </section>
  )
}
