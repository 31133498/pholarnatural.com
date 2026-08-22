'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useHydrated } from '@/lib/use-hydrated'
import { motion, useReducedMotion } from 'motion/react'
import { Check, CalendarDays, Mail, Clock, ArrowRight, AlertCircle, Loader2, XCircle } from 'lucide-react'
import { lastBooking } from '@/lib/session-store'
import { cancelBooking } from '@/lib/api/bookings'
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

  const [cancelStatus, setCancelStatus] = useState<'idle' | 'confirming' | 'cancelling' | 'cancelled'>('idle')
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [refundMessage, setRefundMessage] = useState<string | null>(null)

  async function handleCancel() {
    if (!booking) return
    setCancelStatus('cancelling')
    setCancelError(null)
    try {
      const result = await cancelBooking(booking.id, 'Customer requested cancellation')
      setRefundMessage(result.refund_policy_message || null)
      setCancelStatus('cancelled')
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel the booking. Please contact us directly.')
      setCancelStatus('idle')
    }
  }

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

      {/* Cancel booking */}
      {cancelStatus === 'cancelled' ? (
        <div
          role="status"
          className="mt-8 rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center"
        >
          <XCircle className="mx-auto mb-3 h-10 w-10 text-on-surface-variant" aria-hidden="true" />
          <p className="font-body-md text-body-md font-semibold text-on-surface">Booking cancelled</p>
          <p className="mt-1 font-body-md text-[13px] text-on-surface-variant">
            {refundMessage
              ? refundMessage
              : <>We&apos;ve recorded the cancellation. Refund eligibility is subject to the{' '}<Link href="/refund-policy" className="underline underline-offset-2">refund policy</Link>.</>
            }
          </p>
        </div>
      ) : cancelStatus === 'confirming' ? (
        <div className="mt-8 rounded-2xl border border-outline-variant bg-surface-container-low p-6">
          <p className="mb-4 font-body-md text-body-md font-semibold text-on-surface">
            Cancel this booking?
          </p>
          <p className="mb-6 font-body-md text-[13px] text-on-surface-variant">
            Cancel within {CANCELLATION_POLICY.fullRefundWithinMinutes} min of booking for a full
            refund. After that, the deposit may be forfeited — see the{' '}
            <Link href="/refund-policy" className="underline underline-offset-2">refund policy</Link>.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 rounded-full bg-error px-6 py-3 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90"
            >
              Yes, cancel booking
            </button>
            <button
              type="button"
              onClick={() => setCancelStatus('idle')}
              className="rounded-full border border-outline px-6 py-3 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Keep booking
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center">
          {cancelError && (
            <p
              role="alert"
              className="mb-4 flex items-center justify-center gap-2 font-body-md text-[13px] text-error"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {cancelError}
            </p>
          )}
          <button
            type="button"
            onClick={() => setCancelStatus('confirming')}
            disabled={cancelStatus === 'cancelling'}
            className="inline-flex items-center gap-2 font-body-md text-[13px] text-on-surface-variant underline underline-offset-2 hover:text-primary disabled:opacity-50"
          >
            {cancelStatus === 'cancelling' && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            )}
            Need to cancel?
          </button>
        </div>
      )}

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
