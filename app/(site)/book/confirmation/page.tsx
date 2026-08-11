'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useHydrated } from '@/lib/use-hydrated'
import { motion, useReducedMotion } from 'motion/react'
import { Check, CalendarDays, Mail, Clock, ArrowRight } from 'lucide-react'
import { lastBooking } from '@/lib/session-store'
import { formatPrice, formatDateLong, formatTime } from '@/lib/format'
import { CANCELLATION_POLICY, BUSINESS, CURRENCY } from '@/lib/config'
import type { Booking } from '@/lib/types'

type StoredBooking = Booking & { service_name: string }

/** Booking confirmation (doc §1.6.5). */
export default function BookingConfirmationPage() {
  // Read once on the first client render; `loaded` stays false through hydration so the server
  // HTML and the hydration render agree.
  const [booking] = useState<StoredBooking | null>(() =>
    typeof window === 'undefined' ? null : lastBooking.get<StoredBooking>(),
  )
  const loaded = useHydrated()
  const reduced = useReducedMotion()

  if (!loaded) return <div className="mx-auto max-w-3xl px-5 py-24" aria-busy="true" />

  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center md:px-16">
        <CalendarDays className="mx-auto mb-6 h-14 w-14 text-outline" aria-hidden="true" />
        <h1 className="mb-3 font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
          No recent booking to show
        </h1>
        <p className="mb-8 font-body-lg text-body-lg text-on-surface-variant">
          Booking confirmations are shown once, in the tab where the appointment was made. Check
          your email for the details.
        </p>
        <Link href="/book" className="inline-flex rounded-full bg-primary px-8 py-4 font-label-sm text-label-sm text-white">
          Book an appointment
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 md:px-16">
      <div className="text-center">
        <motion.span
          initial={reduced ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white"
        >
          <Check className="h-10 w-10" aria-hidden="true" />
        </motion.span>

        <h1 className="mb-3 font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
          Your appointment is confirmed
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Booking reference{' '}
          <strong className="font-semibold text-primary">{booking.reference}</strong>
        </p>

        <p className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-xl bg-primary/10 p-4 font-body-md text-[13px] text-primary">
          <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
          A confirmation email is on its way to {booking.customer_email}.
        </p>
      </div>

      <section className="mt-10 rounded-2xl border border-outline-variant bg-surface-container-low p-6">
        <h2 className="mb-6 font-headline-md text-headline-md text-primary">Appointment details</h2>
        <dl className="space-y-4 font-body-md text-body-md">
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">Service</dt>
            <dd className="text-right font-semibold text-on-surface">{booking.service_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">Date</dt>
            <dd className="text-right font-semibold text-on-surface">
              {formatDateLong(booking.booking_date)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-on-surface-variant">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Time
            </dt>
            <dd className="text-right font-semibold text-on-surface">
              {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">Name</dt>
            <dd className="text-right font-semibold text-on-surface">{booking.customer_name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-outline-variant pt-4">
            <dt className="text-on-surface-variant">Deposit paid</dt>
            <dd className="text-right font-semibold text-primary">{formatPrice(booking.deposit_cents)}</dd>
          </div>
        </dl>

        <p className="mt-6 rounded-xl bg-surface-container-lowest p-4 font-body-md text-[13px] text-on-surface-variant">
          Find us at {BUSINESS.addressLines.join(', ')}. Please arrive five minutes early. Cancel
          within {CANCELLATION_POLICY.fullRefundWithinMinutes} minutes of booking for a full refund;
          the deposit is non-refundable within {CANCELLATION_POLICY.forfeitWithinHours} hours of the
          appointment. All prices in {CURRENCY}. Full terms are in our{' '}
          <Link href="/refund-policy" className="underline underline-offset-2">
            refund policy
          </Link>
          .
        </p>
      </section>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90"
        >
          Back to Home
        </Link>
        <Link
          href="/book"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-outline px-8 py-4 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          Book Another
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
