'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Lock, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react'
import { Field } from '@/components/FormField'
import { useAdminAuth, DEMO_PASSPHRASE } from '@/context/AdminAuthContext'

/** Admin sign-in (doc §1.14.1 / §2.0 task 4.2). */
export default function AdminLoginPage() {
  const router = useRouter()
  const { signIn, authenticated, ready } = useAdminAuth()
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Already signed in — do not make them do it twice.
  useEffect(() => {
    if (ready && authenticated) router.replace('/admin')
  }, [ready, authenticated, router])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (signIn(passphrase)) {
      router.replace('/admin')
    } else {
      setError('That passphrase is not correct.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-low p-5">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to storefront
        </Link>

        <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-8">
          <div className="mb-8 text-center">
            <Image src="/logo.svg" alt="" width={48} height={48} className="mx-auto mb-4 h-12 w-12" />
            <h1 className="font-headline-display text-headline-md text-primary">Pholar Natural Admin</h1>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Sign in to manage products, services, bookings and orders.
            </p>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            {error && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-xl bg-error-container p-4 font-body-md text-body-md text-on-error-container"
              >
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            <Field
              label="Passphrase"
              type="password"
              required
              value={passphrase}
              onChange={(e) => {
                setPassphrase(e.target.value)
                setError(null)
              }}
              autoComplete="current-password"
              placeholder="Enter your passphrase"
            />

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-sm text-label-sm text-white transition-opacity hover:opacity-90"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              Sign In
            </button>
          </form>

          {/*
            The demo passphrase is printed here on purpose. It is already readable in the JS
            bundle, so hiding it would only mislead whoever is reviewing the build.
          */}
          <p className="mt-6 flex items-start gap-2 rounded-xl bg-secondary-container/40 p-4 font-body-md text-[12px] text-on-surface">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            <span>
              <strong>Demo gate, not real security.</strong> The passphrase is{' '}
              <code className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono">
                {DEMO_PASSPHRASE}
              </code>
              . It is checked in the browser and protects nothing. Real authentication arrives with
              the API in week 2.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
