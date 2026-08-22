'use client'

import Link from 'next/link'
import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { Check, Mail, ArrowRight, ShoppingBag } from 'lucide-react'
import { CURRENCY } from '@/lib/config'

function SuccessContent() {
  const searchParams = useSearchParams()
  // session_id is forwarded by Stripe; we use it only for display — no need to fetch
  const sessionId = searchParams.get('session_id')
  const { clear } = useCart()

  // Clear the cart in case the user returns here after the redirect.
  useEffect(() => {
    clear()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center md:px-16">
      <span
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white"
        aria-hidden="true"
      >
        <Check className="h-10 w-10" />
      </span>

      <h1 className="mb-4 font-headline-display text-headline-lg-mobile text-primary md:text-headline-lg">
        Payment confirmed
      </h1>

      <p className="mb-2 font-body-lg text-body-lg text-on-surface-variant">
        Your order has been received and is now being processed.
      </p>

      {sessionId && (
        <p className="mb-6 font-body-md text-[13px] text-on-surface-variant">
          Reference: <span className="font-mono font-semibold text-on-surface">{sessionId.slice(-8).toUpperCase()}</span>
        </p>
      )}

      <p className="mx-auto mb-10 flex max-w-md items-center justify-center gap-2 rounded-xl bg-primary/10 p-4 font-body-md text-[13px] text-primary">
        <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
        A confirmation email is on its way. Check your inbox — and spam, just in case.
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          Continue Shopping
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-outline px-8 py-4 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          Back to Home
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <p className="mt-10 font-body-md text-[12px] text-on-surface-variant">
        All prices in {CURRENCY}. Questions?{' '}
        <Link href="/contact" className="underline underline-offset-2">
          Contact us
        </Link>{' '}
        or see our{' '}
        <Link href="/refund-policy" className="underline underline-offset-2">
          refund policy
        </Link>
        .
      </p>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-5 py-24" aria-busy="true" />}>
      <SuccessContent />
    </Suspense>
  )
}
