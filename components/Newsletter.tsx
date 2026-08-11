'use client'

import { useId, useState } from 'react'
import { Send } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

/**
 * Newsletter signup ("Join the Natural Ritual" in the Stitch shop screen).
 *
 * There is no mailing-list backend this sprint, so the submit resolves locally and says so
 * honestly rather than implying a subscription was recorded. Wire this to the email provider
 * in week 3 (doc §5.2).
 */
export default function Newsletter() {
  const id = useId()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  return (
    <section className="relative mt-20 overflow-hidden rounded-2xl bg-surface-container-low p-8 text-center md:p-16">
      <h2 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">
        Join the Natural Ritual
      </h2>
      <p className="mx-auto mt-4 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
        Subscribe for exclusive early access to new botanical formulations and hair wellness rituals.
      </p>

      <form
        className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitting(true)
          setTimeout(() => {
            setSubmitting(false)
            setEmail('')
            toast("Thanks — we'll be in touch when the journal launches.", 'info')
          }, 500)
        }}
      >
        <div className="flex-1 text-left">
          <label htmlFor={id} className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">
            Email address
          </label>
          <input
            id={id}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-full border border-outline-variant bg-surface-container-lowest px-5 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 self-end rounded-full bg-primary px-8 py-3 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
    </section>
  )
}
