'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, Clock, CreditCard, Loader2, AlertCircle, CalendarDays } from 'lucide-react'
import BookingCalendar from '@/components/BookingCalendar'
import { Field } from '@/components/FormField'
import { type Slot } from '@/lib/data'
import { getAvailableSlots, createBooking } from '@/lib/api/bookings'
import { formatPrice, formatDuration, formatTime, formatDateLong, depositFor, addMinutes } from '@/lib/format'
import { CANCELLATION_POLICY, CURRENCY, DEPOSIT_RATE } from '@/lib/config'
import { lastBooking, makeBookingReference, nowISO } from '@/lib/session-store'
import type { Booking, BookingStatus, Service } from '@/lib/types'

const STEP_LABELS = ['Service', 'Date', 'Time'] as const

interface BookingFlowProps {
  services: Service[]
  blockedDates: string[]
}

/**
 * Multi-step booking (doc §1.6): service → date → time → deposit → confirmation.
 *
 * Progress is shown for the first three steps, matching the doc's "3 progress steps then
 * payment". Each step validates before it will advance, and moving back never discards a later
 * choice unless that choice has become invalid (changing the service can change which slots fit).
 */
export default function BookingFlow({ services, blockedDates }: BookingFlowProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const preselected = searchParams.get('service')
  const initialService = services.find((s) => s.slug === preselected) ?? null

  const [step, setStep] = useState(initialService ? 1 : 0)
  const [service, setService] = useState<Service | null>(initialService)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  /*
   * Availability is keyed by date + service. Holding the key alongside the result lets "loading"
   * be derived — the results simply do not match the current selection yet — instead of being a
   * second piece of state that has to be flipped on synchronously before the fetch starts.
   */
  const slotsKey = date && service ? `${date}|${service.id}` : null
  const [slotsFor, setSlotsFor] = useState<{ key: string; slots: Slot[] } | null>(null)
  const slots = slotsFor?.key === slotsKey ? slotsFor.slots : []
  const loadingSlots = slotsKey !== null && slotsFor?.key !== slotsKey

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const deposit = service ? depositFor(service.price_cents) : 0

  // Fetch availability whenever the date or service changes — this is GET /api/bookings/slots.
  useEffect(() => {
    if (!date || !service || !slotsKey) return
    let cancelled = false
    getAvailableSlots(date, service.id).then((s) => {
      if (cancelled) return
      setSlotsFor({ key: slotsKey, slots: s })
      // A previously chosen time may no longer fit the newly chosen service.
      setTime((t) => (t && s.find((x) => x.time === t)?.available ? t : null))
    })
    return () => {
      cancelled = true
    }
  }, [date, service, slotsKey])

  const canContinue = useMemo(() => {
    if (step === 0) return service !== null
    if (step === 1) return date !== null
    if (step === 2) return time !== null
    return true
  }, [step, service, date, time])

  function validateDetails() {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Enter your full name.'
    if (!email.trim()) next.email = 'Enter an email so we can confirm your booking.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!service || !date || !time || !validateDetails()) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await createBooking({
        service_id: service.id,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || null,
        booking_date: date,
        start_time: time,
      })

      const booking: Booking & { service_name: string } = {
        id: response.id,
        reference: makeBookingReference(),
        service_id: service.id,
        service_name: service.name,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || null,
        booking_date: date,
        start_time: time,
        end_time: addMinutes(time, service.duration_minutes),
        status: response.status as BookingStatus,
        deposit_cents: response.deposit_cents,
        stripe_payment_intent_id: null,
        cancellation_reason: null,
        created_at: nowISO(),
      }

      lastBooking.set(booking)
      router.push('/book/confirmation')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 md:px-16">
      {/* Progress (doc §1.6.1–3) */}
      <ol className="mb-12 flex items-center justify-center gap-2 sm:gap-4">
        {STEP_LABELS.map((label, i) => {
          const done = step > i
          const current = step === i
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-4">
              <span
                aria-current={current ? 'step' : undefined}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-label-sm text-label-sm transition-colors sm:px-4 ${
                  done
                    ? 'bg-primary/10 text-primary'
                    : current
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
                  {done ? <Check className="h-3 w-3" aria-hidden="true" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sr-only-live">
                  Step {i + 1} of 3: {label}
                  {done ? ' — complete' : current ? ' — current' : ''}
                </span>
              </span>
              {i < STEP_LABELS.length - 1 && (
                <span className="h-px w-4 bg-outline-variant sm:w-8" aria-hidden="true" />
              )}
            </li>
          )
        })}
        <li className="flex items-center gap-2 sm:gap-4">
          <span className="h-px w-4 bg-outline-variant sm:w-8" aria-hidden="true" />
          <span
            aria-current={step === 3 ? 'step' : undefined}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-label-sm text-label-sm sm:px-4 ${
              step === 3 ? 'bg-secondary text-white' : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Payment</span>
          </span>
        </li>
      </ol>

      {/* Step 1 — service */}
      {step === 0 && (
        <section>
          <h1 className="font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
            Select Your Experience
          </h1>
          <p className="mt-3 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
            Rooted in tradition, crafted for your natural beauty. Choose the service that speaks to
            your hair&apos;s journey.
          </p>

          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {services.map((s) => {
              const selected = service?.id === s.id
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setService(s)}
                    aria-pressed={selected}
                    className={`flex w-full gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant bg-surface-container-lowest hover:border-primary/40'
                    }`}
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                      <Image src={s.image_url} alt="" fill sizes="96px" className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-headline-md text-body-lg text-on-surface">{s.name}</h2>
                      <p className="mt-1 font-body-md text-[13px] text-on-surface-variant">{s.description}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-body-md text-body-md font-bold text-primary">
                          {formatPrice(s.price_cents)}
                        </span>
                        <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatDuration(s.duration_minutes)}
                        </span>
                      </p>
                    </div>
                    {selected && (
                      <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Step 2 — date */}
      {step === 1 && (
        <section>
          <h1 className="font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
            Choose Your Date
          </h1>
          <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant">
            {service?.name} · {formatDuration(service?.duration_minutes ?? 0)}
          </p>
          <div className="mx-auto mt-8 max-w-lg">
            <BookingCalendar selected={date} onSelect={setDate} blockedDates={blockedDates} />
          </div>
        </section>
      )}

      {/* Step 3 — time */}
      {step === 2 && (
        <section>
          <h1 className="font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
            Choose Your Time
          </h1>
          <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant">
            {date && formatDateLong(date)} · {service?.name}
          </p>

          <h2 className="mb-4 mt-8 font-headline-md text-headline-md text-primary">Available Slots</h2>

          {loadingSlots ? (
            <p className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Checking availability…
            </p>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {slots.map((slot) => (
                  <li key={slot.time}>
                    <button
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setTime(slot.time)}
                      aria-pressed={time === slot.time}
                      aria-label={
                        slot.available
                          ? formatTime(slot.time)
                          : `${formatTime(slot.time)} — unavailable, ${
                              slot.reason === 'too-late'
                                ? 'not enough time before closing'
                                : 'already booked'
                            }`
                      }
                      className={`w-full rounded-xl border-2 py-3 font-body-md text-body-md transition-colors ${
                        time === slot.time
                          ? 'border-primary bg-primary font-bold text-white'
                          : slot.available
                            ? 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary'
                            : 'cursor-not-allowed border-outline-variant/40 bg-surface-container text-outline line-through'
                      }`}
                    >
                      {formatTime(slot.time)}
                    </button>
                  </li>
                ))}
              </ul>

              {slots.every((s) => !s.available) && (
                <p className="mt-6 flex items-center gap-2 rounded-xl bg-secondary-container/40 p-4 font-body-md text-body-md text-on-surface">
                  <AlertCircle className="h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
                  No slots left on this date for {service?.name}. Try another day.
                </p>
              )}
            </>
          )}
        </section>
      )}

      {/* Step 4 — details + deposit */}
      {step === 3 && service && date && time && (
        <form onSubmit={submit} noValidate>
          <h1 className="font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
            Finalize Your Booking
          </h1>
          <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant">
            Please provide your details and secure your slot with a {Math.round(DEPOSIT_RATE * 100)}%
            deposit.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <fieldset className="space-y-4">
                <legend className="mb-2 font-headline-md text-headline-md text-primary">
                  Customer Information
                </legend>
                <Field
                  label="Full name"
                  required
                  value={name}
                  error={errors.name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
                <Field
                  label="Email address"
                  type="email"
                  required
                  value={email}
                  error={errors.email}
                  hint="Your confirmation and any changes are sent here."
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <Field
                  label="Phone number"
                  type="tel"
                  value={phone}
                  hint="For WhatsApp or SMS updates about your appointment."
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </fieldset>

              {/*
                Placeholder only — doc §5.1 schedules the real Stripe Payment Element for week 3,
                and the client's account is still in KYC. No deposit is charged here.
              */}
              <fieldset>
                <legend className="mb-4 font-headline-md text-headline-md text-primary">Deposit payment</legend>
                <div className="rounded-xl border border-dashed border-outline bg-surface-container-low p-6 text-center">
                  <CreditCard className="mx-auto mb-3 h-8 w-8 text-outline" aria-hidden="true" />
                  <p className="font-body-md text-body-md font-semibold text-on-surface">
                    Stripe payment element loads here
                  </p>
                  <p className="mx-auto mt-2 max-w-sm font-body-md text-[13px] text-on-surface-variant">
                    Card payment is not connected yet. Confirming now reserves the slot without
                    charging the deposit.
                  </p>
                </div>
              </fieldset>
            </div>

            {/* Summary */}
            <aside className="h-fit rounded-2xl border border-outline-variant bg-surface-container-low p-6">
              <h2 className="mb-6 font-headline-md text-headline-md text-primary">Booking Summary</h2>
              <dl className="space-y-3 font-body-md text-body-md">
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant">Service</dt>
                  <dd className="text-right font-semibold text-on-surface">{service.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant">Date</dt>
                  <dd className="text-right font-semibold text-on-surface">{formatDateLong(date)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant">Time</dt>
                  <dd className="text-right font-semibold text-on-surface">
                    {formatTime(time)} – {formatTime(addMinutes(time, service.duration_minutes))}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-outline-variant pt-3">
                  <dt className="text-on-surface-variant">Total cost</dt>
                  <dd className="text-right font-semibold text-on-surface">
                    {formatPrice(service.price_cents)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 font-headline-md text-headline-md">
                  <dt className="text-primary">Deposit ({Math.round(DEPOSIT_RATE * 100)}%)</dt>
                  <dd className="text-primary">{formatPrice(deposit)}</dd>
                </div>
              </dl>

              <p className="mt-4 font-body-md text-[12px] text-on-surface-variant">
                The remaining {formatPrice(service.price_cents - deposit)} is payable in the studio.
                All prices in {CURRENCY}.
              </p>

              {submitError && (
                <p
                  role="alert"
                  className="mt-4 flex items-center gap-2 rounded-xl bg-error-container p-3 font-body-md text-[13px] text-on-error-container"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Confirming…
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Confirm Booking
                  </>
                )}
              </button>

              {/*
                The middle cancellation window is still unconfirmed by the client (doc §8.6), so
                this states only the two rules that ARE settled and points elsewhere for the rest.
              */}
              <p className="mt-4 font-body-md text-[12px] text-on-surface-variant">
                Cancel within {CANCELLATION_POLICY.fullRefundWithinMinutes} minutes of booking for a
                full refund. The deposit is non-refundable within{' '}
                {CANCELLATION_POLICY.forfeitWithinHours} hours of the appointment. See the{' '}
                <Link href="/refund-policy" className="underline underline-offset-2">
                  refund policy
                </Link>
                .
              </p>
            </aside>
          </div>
        </form>
      )}

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between gap-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="inline-flex items-center gap-2 rounded-full border border-outline px-6 py-3 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        ) : (
          <span />
        )}

        {step < 3 && (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((s) => s + 1)}
            className="rounded-full bg-primary px-8 py-3 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === 0 ? 'Select Service' : 'Next'}
          </button>
        )}
      </div>
    </div>
  )
}
