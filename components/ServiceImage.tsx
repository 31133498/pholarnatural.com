'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SERVICE_GALLERY } from '@/lib/data'

interface ServiceImageProps {
  slug: string
  /** Fallback when the service has only one photo. */
  src: string
  alt: string
  /** `card` is the 4:3 crop on /services, `tall` is the 3:4 crop on the homepage strip. */
  variant: 'card' | 'tall'
  sizes: string
  className?: string
  priority?: boolean
}

const INTERVAL_MS = 3000
const SLIDE_SECONDS = 0.6

/**
 * Service photo. Renders a still image, or an auto-sliding loop when the client supplied more
 * than one photo for that service.
 *
 * The slide reuses the hero's wrap maths so it always travels one direction and never rewinds
 * through the set. Slides more than one place away jump instantly rather than animating, so no
 * stray image crosses the frame when the loop wraps.
 */
export default function ServiceImage({
  slug,
  src,
  alt,
  variant,
  sizes,
  className = '',
  priority = false,
}: ServiceImageProps) {
  const gallery = SERVICE_GALLERY[slug]?.[variant]
  const slides = gallery && gallery.length > 1 ? gallery : null

  if (!slides) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />
  }
  return <Slider slides={slides} alt={alt} sizes={sizes} className={className} priority={priority} />
}

function Slider({
  slides,
  alt,
  sizes,
  className,
  priority,
}: {
  slides: string[]
  alt: string
  sizes: string
  className: string
  priority: boolean
}) {
  const count = slides.length
  const [index, setIndex] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
    return () => clearInterval(t)
  }, [reduced, count])

  const half = Math.floor(count / 2)
  const offsetFor = (i: number) => ((i - index + count + half) % count) - half

  return (
    <div className="absolute inset-0 overflow-hidden">
      {slides.map((s, i) => {
        const offset = offsetFor(i)
        const animates = Math.abs(offset) <= 1
        return (
          <motion.div
            key={s}
            className="absolute inset-0"
            initial={false}
            animate={{ x: `${offset * 100}%` }}
            transition={
              reduced || !animates
                ? { duration: 0 }
                : { duration: SLIDE_SECONDS, ease: [0.32, 0.72, 0, 1] }
            }
            aria-hidden={i !== index}
          >
            <Image
              src={s}
              // Only the visible slide carries the name; the rest are decorative duplicates
              // of the same subject and would otherwise be announced repeatedly.
              alt={i === index ? alt : ''}
              fill
              sizes={sizes}
              priority={priority && i === 0}
              className={className}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
