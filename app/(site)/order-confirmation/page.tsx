'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useHydrated } from '@/lib/use-hydrated'
import { motion, useReducedMotion } from 'motion/react'
import { Check, Mail, Package, Truck, ArrowRight } from 'lucide-react'
import { lastOrder } from '@/lib/session-store'
import { formatPrice, formatDateLong } from '@/lib/format'
import { CURRENCY } from '@/lib/config'
import type { Order } from '@/lib/types'

/** Order confirmation (doc §1.9). */
export default function OrderConfirmationPage() {
  // Read once on the first client render; `loaded` stays false through hydration so the server
  // HTML and the hydration render agree.
  const [order] = useState<Order | null>(() =>
    typeof window === 'undefined' ? null : lastOrder.get<Order>(),
  )
  const loaded = useHydrated()
  const reduced = useReducedMotion()

  if (!loaded) {
    return <div className="mx-auto max-w-3xl px-5 py-24" aria-busy="true" />
  }

  // Reached directly, or in a new tab — there is no order to show.
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center md:px-16">
        <Package className="mx-auto mb-6 h-14 w-14 text-outline" aria-hidden="true" />
        <h1 className="mb-3 font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
          No recent order to show
        </h1>
        <p className="mb-8 font-body-lg text-body-lg text-on-surface-variant">
          Order confirmations are only shown once, in the tab where the order was placed. Check
          your email for the details.
        </p>
        <Link
          href="/shop"
          className="inline-flex rounded-full bg-primary px-8 py-4 font-label-sm text-label-sm text-white"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-16">
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
          Thank you for your order!
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Order{' '}
          <strong className="font-semibold text-primary">{order.order_number}</strong> · placed{' '}
          {formatDateLong(order.created_at.slice(0, 10))}
        </p>

        <p className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-xl bg-primary/10 p-4 font-body-md text-[13px] text-primary">
          <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
          A confirmation email is on its way to {order.customer_email}.
        </p>
      </div>

      <section className="mt-12 rounded-2xl border border-outline-variant bg-surface-container-low p-6">
        <h2 className="mb-6 font-headline-md text-headline-md text-primary">Your order</h2>

        <ul className="space-y-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                {item.image_url && <Image src={item.image_url} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-body-md text-body-md font-semibold text-on-surface">{item.product_name}</p>
                <p className="font-body-md text-[13px] text-on-surface-variant">
                  {item.variant_label} · Qty {item.quantity}
                </p>
              </div>
              <p className="whitespace-nowrap font-body-md text-body-md font-bold text-primary">
                {formatPrice(item.unit_price_cents * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-3 border-t border-outline-variant pt-4">
          <div className="flex justify-between font-body-md text-body-md">
            <dt className="text-on-surface-variant">Subtotal</dt>
            <dd className="text-on-surface">{formatPrice(order.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between font-body-md text-body-md">
            <dt className="text-on-surface-variant">Shipping</dt>
            <dd className="text-on-surface">
              {order.shipping_cents === 0 ? 'Free' : formatPrice(order.shipping_cents)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-outline-variant pt-3 font-headline-md text-headline-md">
            <dt className="text-primary">Total</dt>
            <dd className="text-primary">{formatPrice(order.total_cents)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-outline-variant p-6">
          <h2 className="mb-3 font-label-sm text-label-sm font-bold uppercase text-primary">Shipping to</h2>
          <address className="font-body-md text-body-md not-italic text-on-surface-variant">
            <span className="block text-on-surface">{order.shipping_address.full_name}</span>
            <span className="block">{order.shipping_address.address_line1}</span>
            {order.shipping_address.address_line2 && (
              <span className="block">{order.shipping_address.address_line2}</span>
            )}
            <span className="block">
              {order.shipping_address.city}, {order.shipping_address.province}{' '}
              {order.shipping_address.postal_code}
            </span>
            <span className="block">{order.shipping_address.country}</span>
          </address>
        </section>

        <section className="rounded-2xl border border-outline-variant p-6">
          <h2 className="mb-3 font-label-sm text-label-sm font-bold uppercase text-primary">Delivery</h2>
          <p className="flex items-start gap-2 font-body-md text-body-md text-on-surface-variant">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            Orders are processed in 1–2 business days. You will receive an email when the parcel is
            handed to the carrier.
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90"
        >
          Continue Shopping
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-outline px-8 py-4 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          Back to Home
        </Link>
      </div>

      <p className="mt-8 text-center font-body-md text-[12px] text-on-surface-variant">
        All prices in {CURRENCY}. Questions? See our{' '}
        <Link href="/refund-policy" className="underline underline-offset-2">
          refund policy
        </Link>{' '}
        or{' '}
        <Link href="/contact" className="underline underline-offset-2">
          contact us
        </Link>
        .
      </p>
    </div>
  )
}
