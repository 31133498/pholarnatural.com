'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Lock, CreditCard, AlertCircle, ArrowLeft, Loader2, Tag, X } from 'lucide-react'
import { Field, FieldSet } from '@/components/FormField'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/format'
import { CURRENCY } from '@/lib/config'
import { lastOrder, makeOrderNumber, nowISO } from '@/lib/session-store'
import { createOrder } from '@/lib/api/orders'
import { validateDiscount } from '@/lib/api/discounts'
import type { Order, OrderStatus, ShippingAddress } from '@/lib/types'

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

  // Discount code state
  const [discountCode, setDiscountCode] = useState('')
  const [discountValidating, setDiscountValidating] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string
    discount_cents: number
    message: string
  } | null>(null)

  async function applyDiscount() {
    const code = discountCode.trim()
    if (!code) return
    setDiscountValidating(true)
    setDiscountError(null)
    try {
      const result = await validateDiscount(code, subtotalCents)
      setAppliedDiscount({ code: result.code, discount_cents: result.discount_cents, message: result.message })
      setDiscountCode('')
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : 'Invalid discount code.')
    } finally {
      setDiscountValidating(false)
    }
  }

  function removeDiscount() {
    setAppliedDiscount(null)
    setDiscountError(null)
  }

  const discountedSubtotal = subtotalCents - (appliedDiscount?.discount_cents ?? 0)
  const effectiveShippingCents = discountedSubtotal >= 5000 ? 0 : shippingCents
  const effectiveTotalCents = discountedSubtotal + effectiveShippingCents

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
        discount_code: appliedDiscount?.code,
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
        status: response.status as OrderStatus,
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

          <FieldSet legend="Discount code">
            {appliedDiscount ? (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-2 font-body-md text-body-md text-primary">
                  <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>{appliedDiscount.code}</strong> — {appliedDiscount.message}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeDiscount}
                  aria-label="Remove discount code"
                  className="rounded-full p-1 text-on-surface-variant hover:text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <label htmlFor="discount-code" className="sr-only">Discount code</label>
                <input
                  id="discount-code"
                  type="text"
                  value={discountCode}
                  onChange={(e) => { setDiscountCode(e.target.value); setDiscountError(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyDiscount() } }}
                  placeholder="Enter code"
                  className="min-w-0 flex-1 rounded-xl border border-outline bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
                  aria-describedby={discountError ? 'discount-error' : undefined}
                />
                <button
                  type="button"
                  onClick={applyDiscount}
                  disabled={discountValidating || !discountCode.trim()}
                  className="flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {discountValidating ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
            )}
            {discountError && (
              <p
                id="discount-error"
                role="alert"
                className="flex items-center gap-2 font-body-md text-[13px] text-error"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {discountError}
              </p>
            )}
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
            {appliedDiscount && (
              <div className="flex justify-between font-body-md text-body-md text-primary">
                <dt className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                  {appliedDiscount.code}
                </dt>
                <dd>−{formatPrice(appliedDiscount.discount_cents)}</dd>
              </div>
            )}
            <div className="flex justify-between font-body-md text-body-md">
              <dt className="text-on-surface-variant">Shipping</dt>
              <dd className="text-on-surface">{effectiveShippingCents === 0 ? 'Free' : formatPrice(effectiveShippingCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-outline-variant pt-3 font-headline-md text-headline-md">
              <dt className="text-primary">Total</dt>
              <dd className="text-primary">{formatPrice(effectiveTotalCents)}</dd>
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
