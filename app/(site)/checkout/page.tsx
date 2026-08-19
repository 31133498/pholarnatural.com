'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Lock, CreditCard, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Field, FieldSet } from '@/components/FormField'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/format'
import { CURRENCY } from '@/lib/config'
import { lastOrder, makeOrderNumber, nowISO } from '@/lib/session-store'
import { createOrder } from '@/lib/api/orders'
import type { Order, ShippingAddress } from '@/lib/types'

type Errors = Partial<Record<keyof ShippingAddress | 'email', string>>

const EMPTY: ShippingAddress = {
  full_name: '',
  address_line1: '',
  address_line2: '',
  city: '',
  province: '',
  postal_code: '',
  country: 'Canada',
}

/**
 * Checkout (doc §1.8). Guest checkout — no account, email only for the confirmation.
 *
 * The payment step is a Stripe *placeholder*: doc §5.1 puts real Stripe in week 3 and the client
 * is still completing KYC. The card fields here are inert and the UI says so — it must never
 * look like it is taking a real payment.
 */
export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotalCents, shippingCents, totalCents, hydrated, clear } = useCart()

  const [address, setAddress] = useState<ShippingAddress>(EMPTY)
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const set = (key: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((a) => ({ ...a, [key]: e.target.value }))

  function validate(): boolean {
    const next: Errors = {}
    if (!email.trim()) next.email = 'Enter an email so we can send your confirmation.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.'
    if (!address.full_name.trim()) next.full_name = 'Enter the recipient name.'
    if (!address.address_line1.trim()) next.address_line1 = 'Enter the street address.'
    if (!address.city.trim()) next.city = 'Enter a city.'
    if (!address.province.trim()) next.province = 'Enter a province or state.'
    if (!address.postal_code.trim()) next.postal_code = 'Enter a postal or ZIP code.'
    if (!address.country.trim()) next.country = 'Enter a country.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!validate()) {
      setFormError('Please correct the highlighted fields.')
      return
    }
    setSubmitting(true)

    try {
      const response = await createOrder({
        customer_name: address.full_name,
        customer_email: email,
        shipping_address: {
          full_name: address.full_name,
          address_line1: address.address_line1,
          address_line2: address.address_line2 || undefined,
          city: address.city,
          province: address.province,
          postal_code: address.postal_code,
          country: address.country,
        },
        items: items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
      })

      const orderId = response.id
      const order: Order = {
        id: orderId,
        order_number: makeOrderNumber(),
        customer_name: address.full_name,
        customer_email: email,
        shipping_address: address,
        subtotal_cents: response.subtotal_cents,
        shipping_cents: response.shipping_cents,
        total_cents: response.total_cents,
        status: response.status,
        stripe_payment_intent_id: null,
        created_at: nowISO(),
        items: items.map((i, idx) => ({
          id: `oi_${idx}`,
          order_id: orderId,
          product_variant_id: i.variant_id,
          product_name: i.product_name,
          variant_label: i.variant_label,
          quantity: i.quantity,
          unit_price_cents: i.unit_price_cents,
          image_url: i.image_url,
        })),
      }

      lastOrder.set(order)
      clear()
      router.push('/order-confirmation')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center md:px-16">
        <h1 className="mb-3 font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
          Nothing to check out
        </h1>
        <p className="mb-8 font-body-lg text-body-lg text-on-surface-variant">
          Your cart is empty, so there is nothing to pay for yet.
        </p>
        <Link
          href="/shop"
          className="inline-flex rounded-full bg-primary px-8 py-4 font-label-sm text-label-sm text-white"
        >
          Browse the shop
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 md:px-16">
      <Link
        href="/cart"
        className="mb-6 inline-flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to cart
      </Link>

      <h1 className="mb-10 font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
        Checkout
      </h1>

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          {formError && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-error-container p-4 font-body-md text-body-md text-on-error-container"
            >
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              {formError}
            </p>
          )}

          <FieldSet legend="Contact">
            <Field
              label="Email address"
              type="email"
              required
              value={email}
              error={errors.email}
              hint="We only use this to send your order confirmation. No account needed."
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </FieldSet>

          <FieldSet legend="Shipping address">
            <Field label="Full name" required value={address.full_name} error={errors.full_name} onChange={set('full_name')} autoComplete="name" />
            <Field label="Address line 1" required value={address.address_line1} error={errors.address_line1} onChange={set('address_line1')} autoComplete="address-line1" />
            <Field label="Address line 2" value={address.address_line2} onChange={set('address_line2')} autoComplete="address-line2" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City" required value={address.city} error={errors.city} onChange={set('city')} autoComplete="address-level2" />
              <Field label="Province / State" required value={address.province} error={errors.province} onChange={set('province')} autoComplete="address-level1" />
              <Field label="Postal / ZIP code" required value={address.postal_code} error={errors.postal_code} onChange={set('postal_code')} autoComplete="postal-code" />
              <Field label="Country" required value={address.country} error={errors.country} onChange={set('country')} autoComplete="country-name" />
            </div>
          </FieldSet>

          <FieldSet legend="Shipping method">
            <div className="rounded-xl border-2 border-primary bg-surface-container-lowest p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-body-md text-body-md font-semibold text-on-surface">
                    {shippingCents === 0 ? 'Free shipping' : 'Standard shipping'}
                  </p>
                  <p className="font-body-md text-[13px] text-on-surface-variant">
                    Processing 1–2 business days, then 3–7 business days in transit.
                  </p>
                </div>
                <p className="whitespace-nowrap font-body-md text-body-md font-bold text-primary">
                  {shippingCents === 0 ? 'Free' : formatPrice(shippingCents)}
                </p>
              </div>
              <p className="mt-2 font-body-md text-[12px] text-on-surface-variant">
                International rates are being finalised — see our{' '}
                <Link href="/shipping-policy" className="underline underline-offset-2">
                  shipping policy
                </Link>
                .
              </p>
            </div>
          </FieldSet>

          <FieldSet legend="Payment">
            {/*
              Placeholder only. Stripe Elements is mounted here in week 3 (doc §5.1) once the
              client's account clears KYC. Nothing on this screen touches a payment network.
            */}
            <div className="rounded-xl border border-dashed border-outline bg-surface-container-low p-6 text-center">
              <CreditCard className="mx-auto mb-3 h-8 w-8 text-outline" aria-hidden="true" />
              <p className="font-body-md text-body-md font-semibold text-on-surface">
                Stripe payment form loads here
              </p>
              <p className="mx-auto mt-2 max-w-md font-body-md text-[13px] text-on-surface-variant">
                Card payment is not connected yet — the client&apos;s Stripe account is still in
                onboarding. Placing an order now records it without charging anything.
              </p>
            </div>
          </FieldSet>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-outline-variant bg-surface-container-low p-6 lg:sticky lg:top-28">
          <h2 className="mb-6 font-headline-md text-headline-md text-primary">Order summary</h2>

          <ul className="mb-6 space-y-4">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                  {i.image_url && <Image src={i.image_url} alt="" fill sizes="64px" className="object-cover" />}
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {i.quantity}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-between gap-2">
                  <div>
                    <p className="font-body-md text-[13px] font-semibold text-on-surface">{i.product_name}</p>
                    <p className="font-body-md text-[12px] text-on-surface-variant">{i.variant_label}</p>
                  </div>
                  <p className="whitespace-nowrap font-body-md text-[13px] font-bold text-primary">
                    {formatPrice(i.unit_price_cents * i.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="space-y-3 border-t border-outline-variant pt-4">
            <div className="flex justify-between font-body-md text-body-md">
              <dt className="text-on-surface-variant">Subtotal</dt>
              <dd className="text-on-surface">{formatPrice(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between font-body-md text-body-md">
              <dt className="text-on-surface-variant">Shipping</dt>
              <dd className="text-on-surface">{shippingCents === 0 ? 'Free' : formatPrice(shippingCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-outline-variant pt-3 font-headline-md text-headline-md">
              <dt className="text-primary">Total</dt>
              <dd className="text-primary">{formatPrice(totalCents)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Placing order…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden="true" />
                Place Order
              </>
            )}
          </button>

          <p className="mt-4 text-center font-body-md text-[12px] text-on-surface-variant">
            All prices in {CURRENCY}. By placing this order you agree to our{' '}
            <Link href="/terms-of-service" className="underline underline-offset-2">
              terms
            </Link>
            .
          </p>
        </aside>
      </form>
    </div>
  )
}
