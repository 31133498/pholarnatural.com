'use client'

import { useCallback, useEffect, useState } from 'react'
import { Save, Send, MessageCircle, Mail, Clock, Loader2, Wifi, WifiOff } from 'lucide-react'
import { PageHeader, AdminButton } from '@/components/admin/ui'
import { Field } from '@/components/FormField'
import { useToast } from '@/context/ToastContext'
import {
  loadAdminSettings,
  saveAdminSettings,
  getWhatsAppStatus,
  sendTestWhatsApp,
  type AdminSettingsData,
  type WhatsAppStatus,
} from '@/lib/api/admin-settings'

/** Toggle switch — accessible, keyboard-operable. */
function Toggle({
  id,
  checked,
  onChange,
  disabled = false,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? 'bg-primary' : 'bg-surface-container-highest'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

const NOTIFICATION_EVENTS: {
  key: keyof AdminSettingsData
  label: string
  description: string
  emoji: string
  note?: string
}[] = [
  {
    key: 'notify_new_order',
    label: 'New order',
    description: 'Customer places a shop order',
    emoji: '🛍️',
  },
  {
    key: 'notify_new_booking',
    label: 'New booking',
    description: 'Customer books a service appointment',
    emoji: '📅',
  },
  {
    key: 'notify_booking_cancelled',
    label: 'Booking cancelled',
    description: 'Customer or admin cancels an appointment',
    emoji: '❌',
  },
  {
    key: 'notify_new_contact_message',
    label: 'New contact message',
    description: 'Customer submits the contact form',
    emoji: '💬',
  },
  {
    key: 'notify_low_stock',
    label: 'Low stock',
    description: 'A product variant drops below the threshold',
    emoji: '⚠️',
  },
  {
    key: 'notify_discount_maxed_out',
    label: 'Discount maxed out',
    description: 'A promo code reaches its usage limit',
    emoji: '🎟️',
  },
  {
    key: 'notify_payment_failed',
    label: 'Payment failed',
    description: 'Stripe reports a payment failure (Phase 9)',
    emoji: '💳',
    note: 'Enable once Stripe is connected in Phase 9. Default stays OFF until then.',
  },
]

/** Notification settings — wired to GET/PUT /api/v1/admin/settings. */
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAdminSettings()
      .then(setSettings)
      .catch(() => toast('Failed to load settings', 'error'))
      .finally(() => setLoading(false))

    getWhatsAppStatus()
      .then(setWhatsappStatus)
      .catch(() => setWhatsappStatus({ connected: false, state: 'error' }))
      .finally(() => setStatusLoading(false))
  }, [toast])

  const set = useCallback(<K extends keyof AdminSettingsData>(key: K, value: AdminSettingsData[K]) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    try {
      await saveAdminSettings(settings)
      toast('Settings saved')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function sendTest() {
    setTesting(true)
    try {
      await sendTestWhatsApp()
      toast('Test message sent — check your WhatsApp')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test send failed', 'error')
    } finally {
      setTesting(false)
    }
  }

  if (loading || !settings) {
    return (
      <>
        <PageHeader title="Settings" description="How you get told about new orders and bookings." />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading settings" />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Settings" description="How you get told about new orders and bookings." />

      <form onSubmit={save} className="max-w-2xl space-y-6">
        {/* WhatsApp notifications */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-primary">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              WhatsApp notifications
            </h2>

            {/* Connection status badge */}
            {statusLoading ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Checking…
              </span>
            ) : whatsappStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary">
                <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-error-container px-3 py-1 font-label-sm text-label-sm text-on-error-container">
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                {whatsappStatus?.state === 'unconfigured' ? 'API key not set' : 'Disconnected'}
              </span>
            )}
          </div>

          <p className="mb-5 font-body-md text-body-md text-on-surface-variant">
            Alerts are delivered to the number below via the &ldquo;pholar-notifier&rdquo; Evolution
            API instance. Toggle each event independently.
          </p>

          <Field
            label="Notifier WhatsApp number"
            type="tel"
            value={settings.notifier_whatsapp_number}
            hint="Include country code, e.g. +1 416 555 0142. This is the number that receives alerts."
            placeholder="+1 416 555 0142"
            onChange={(e) => set('notifier_whatsapp_number', e.target.value)}
          />

          {/* Per-event toggles */}
          <fieldset className="mt-5 space-y-1" aria-label="Notification events">
            <legend className="mb-3 font-label-sm text-label-sm font-bold uppercase text-on-surface-variant">
              Events
            </legend>
            {NOTIFICATION_EVENTS.map((ev) => (
              <div key={ev.key} className="flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-surface-container-low">
                <Toggle
                  id={`toggle-${ev.key}`}
                  checked={settings[ev.key] as boolean}
                  onChange={(v) => set(ev.key, v as AdminSettingsData[typeof ev.key])}
                />
                <label htmlFor={`toggle-${ev.key}`} className="flex-1 cursor-pointer">
                  <span className="flex items-center gap-2 font-body-md text-body-md font-semibold text-on-surface">
                    <span aria-hidden="true">{ev.emoji}</span>
                    {ev.label}
                  </span>
                  <span className="block font-body-md text-[12px] text-on-surface-variant">
                    {ev.description}
                  </span>
                  {ev.note && (
                    <span className="mt-1 block font-body-md text-[11px] italic text-on-surface-variant">
                      {ev.note}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Field
              label="Low-stock threshold"
              type="number"
              min={1}
              max={999}
              value={settings.low_stock_threshold}
              hint="Alert fires when stock_count drops to or below this."
              onChange={(e) => set('low_stock_threshold', Number(e.target.value))}
            />
          </div>

          <AdminButton
            variant="secondary"
            className="mt-5"
            onClick={sendTest}
            disabled={testing}
            type="button"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Send test message
          </AdminButton>
        </section>

        {/* Email — not yet wired; placeholder retained from original design */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="mb-1 flex items-center gap-2 font-headline-md text-headline-md text-primary">
            <Mail className="h-5 w-5" aria-hidden="true" />
            Email notifications
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Admin email alerts are planned for a future phase (Resend integration).
          </p>
        </section>

        {/* Business hours — informational until settings API lands */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="mb-1 flex items-center gap-2 font-headline-md text-headline-md text-primary">
            <Clock className="h-5 w-5" aria-hidden="true" />
            Business hours
          </h2>
          <p className="mb-2 font-body-md text-body-md text-on-surface-variant">
            We are closed Sundays. Booking slots are Mon–Sat 10:00–17:00, fixed in{' '}
            <code className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[12px]">
              lib/config.ts
            </code>
            .
          </p>
        </section>

        <AdminButton type="submit" disabled={saving}>
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
