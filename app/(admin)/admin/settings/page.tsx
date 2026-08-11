'use client'

import { useState } from 'react'
import { Save, Send, MessageCircle, Mail, Clock, Loader2 } from 'lucide-react'
import { PageHeader, AdminButton } from '@/components/admin/ui'
import { Field } from '@/components/FormField'
import { useToast } from '@/context/ToastContext'
import { ADMIN_SETTINGS } from '@/lib/data'
import type { AdminSettings } from '@/lib/types'

/** Notification settings (doc §1.14.7). Mirrors `GET`/`PUT /api/admin/settings`. */
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(ADMIN_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<'whatsapp' | 'email' | null>(null)
  const { toast } = useToast()

  const set = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    toast('Settings saved')
  }

  async function sendTest(channel: 'whatsapp' | 'email') {
    setTesting(channel)
    await new Promise((r) => setTimeout(r, 700))
    setTesting(null)
    toast(
      `Test ${channel === 'whatsapp' ? 'WhatsApp message' : 'email'} will send once the integration is connected in week 3.`,
      'info',
    )
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="How you get told about new orders and bookings."
      />

      <form onSubmit={save} className="max-w-2xl space-y-6">
        {/* WhatsApp (doc §1.14.7 / §5.3) */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="mb-1 flex items-center gap-2 font-headline-md text-headline-md text-primary">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            WhatsApp notifications
          </h2>
          <p className="mb-5 font-body-md text-body-md text-on-surface-variant">
            Get a WhatsApp message whenever an order or booking comes in.
          </p>

          <div className="mb-4 flex items-start gap-3 rounded-xl bg-surface-container-low p-4">
            <input
              id="whatsapp-enabled"
              type="checkbox"
              checked={settings.whatsapp_enabled}
              onChange={(e) => set('whatsapp_enabled', e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
            />
            <label htmlFor="whatsapp-enabled" className="font-body-md text-body-md text-on-surface">
              Enable WhatsApp notifications
            </label>
          </div>

          <Field
            label="Business WhatsApp number"
            type="tel"
            value={settings.whatsapp_number}
            disabled={!settings.whatsapp_enabled}
            hint="Include the country code, e.g. +1 416 555 0142"
            placeholder="+1 416 555 0142"
            onChange={(e) => set('whatsapp_number', e.target.value)}
          />

          <AdminButton
            variant="secondary"
            className="mt-4"
            onClick={() => sendTest('whatsapp')}
          >
            {testing === 'whatsapp' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Send test message
          </AdminButton>
        </section>

        {/* Email (doc §1.14.7 / §5.2) */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="mb-1 flex items-center gap-2 font-headline-md text-headline-md text-primary">
            <Mail className="h-5 w-5" aria-hidden="true" />
            Email notifications
          </h2>
          <p className="mb-5 font-body-md text-body-md text-on-surface-variant">
            Get an email copy of every new order and booking.
          </p>

          <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4">
            <input
              id="email-enabled"
              type="checkbox"
              checked={settings.email_notifications_enabled}
              onChange={(e) => set('email_notifications_enabled', e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
            />
            <label htmlFor="email-enabled" className="font-body-md text-body-md text-on-surface">
              Enable admin email notifications
            </label>
          </div>

          <AdminButton variant="secondary" className="mt-4" onClick={() => sendTest('email')}>
            {testing === 'email' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Send test email
          </AdminButton>
        </section>

        {/* Business hours */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="mb-1 flex items-center gap-2 font-headline-md text-headline-md text-primary">
            <Clock className="h-5 w-5" aria-hidden="true" />
            Business hours
          </h2>
          <p className="mb-5 font-body-md text-body-md text-on-surface-variant">
            These bound the slots offered on the customer booking calendar. We are closed Sundays.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Opens"
              type="time"
              value={settings.business_hours_start}
              onChange={(e) => set('business_hours_start', e.target.value)}
            />
            <Field
              label="Closes"
              type="time"
              value={settings.business_hours_end}
              onChange={(e) => set('business_hours_end', e.target.value)}
            />
          </div>

          <p className="mt-4 font-body-md text-[12px] text-on-surface-variant">
            Changing these here does not yet move the slot grid — the booking slots are fixed in
            <code className="mx-1 rounded bg-surface-container-high px-1.5 py-0.5 font-mono">lib/config.ts</code>
            until the settings API lands in week 2.
          </p>
        </section>

        <AdminButton type="submit">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          Save settings
        </AdminButton>
      </form>
    </>
  )
}
