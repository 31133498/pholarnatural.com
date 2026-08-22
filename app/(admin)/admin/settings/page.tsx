'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Save,
  Send,
  MessageCircle,
  Mail,
  Clock,
  Loader2,
  Smartphone,
  RefreshCw,
  LogOut,
  ShoppingBag,
  CalendarDays,
  CalendarX,
  MessageSquare,
  PackageOpen,
  TicketPercent,
  CreditCard,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader, AdminButton } from '@/components/admin/ui'
import { Field } from '@/components/FormField'
import { useToast } from '@/context/ToastContext'
import {
  loadAdminSettings,
  saveAdminSettings,
  getWhatsAppStatus,
  getWhatsAppQR,
  logoutWhatsApp,
  sendTestWhatsApp,
  type AdminSettingsData,
  type WhatsAppStatus,
} from '@/lib/api/admin-settings'

// ─── Toggle switch ────────────────────────────────────────────────────────────

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

// ─── WhatsApp connection panel (self-contained with its own polling) ───────────

function WhatsAppConnectionPanel() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  /** Tracks whether we've already dispatched a QR fetch for the current disconnected state. */
  const qrFetchedRef = useRef(false)
  const { toast } = useToast()

  async function fetchQR() {
    setQrLoading(true)
    try {
      const data = await getWhatsAppQR()
      setQrData(data.base64 ?? null)
    } catch {
      // silently ignored — user can hit Refresh QR manually
    } finally {
      setQrLoading(false)
    }
  }

  // Status polling — 10-second cadence.
  // When not connected: fetches QR once per "disconnected session" (qrFetchedRef guard).
  // When newly connected: clears QR so the panel flips to the badge view.
  useEffect(() => {
    let mounted = true

    async function poll() {
      try {
        const s = await getWhatsAppStatus()
        if (!mounted) return
        setStatus(s)
        if (s.connected) {
          qrFetchedRef.current = false
          setQrData(null)
        } else if (!qrFetchedRef.current) {
          qrFetchedRef.current = true
          fetchQR()
        }
      } catch {
        // network error during poll — ignore, try again next tick
      }
    }

    poll()
    const id = setInterval(poll, 10_000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function disconnect() {
    setDisconnecting(true)
    try {
      await logoutWhatsApp()
      setStatus({ connected: false, state: 'disconnected', phone: null })
      setQrData(null)
      qrFetchedRef.current = false
      await fetchQR()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Disconnect failed', 'error')
    } finally {
      setDisconnecting(false)
    }
  }

  async function refreshQR() {
    setQrData(null)
    qrFetchedRef.current = true // already fetching — don't double-fire from next poll
    await fetchQR()
  }

  const isConnected = status?.connected ?? false

  return (
    <section
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6"
      aria-label="WhatsApp connection"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-primary">
          <Smartphone className="h-5 w-5" aria-hidden="true" />
          WhatsApp connection
        </h2>

        {status === null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            Checking…
          </span>
        ) : isConnected ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-error-container px-3 py-1 font-label-sm text-label-sm text-on-error-container">
            <span className="h-2 w-2 rounded-full bg-error" aria-hidden="true" />
            Not connected
          </span>
        )}
      </div>

      {/* Connected state */}
      {isConnected && (
        <div className="space-y-4">
          {status?.phone && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Linked number:{' '}
              <span className="font-semibold text-on-surface">+{status.phone}</span>
            </p>
          )}
          <p className="font-body-md text-body-md text-on-surface-variant">
            The instance is live and ready to deliver notifications.
          </p>
          <AdminButton
            variant="secondary"
            onClick={disconnect}
            disabled={disconnecting}
            type="button"
          >
            {disconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            Disconnect
          </AdminButton>
        </div>
      )}

      {/* Not connected — show QR */}
      {!isConnected && (
        <div className="space-y-4">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Open WhatsApp on your phone → Linked devices → Link a device, then scan:
          </p>

          <div
            className="flex min-h-[220px] items-center justify-center rounded-xl border border-outline-variant bg-white p-4"
            aria-label="QR code"
          >
            {qrLoading && (
              <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading QR code" />
            )}
            {!qrLoading && qrData && (
              /* base64 comes from backend as a full data URI */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrData}
                alt="WhatsApp QR code — scan with your phone to connect"
                className="h-48 w-48 object-contain"
              />
            )}
            {!qrLoading && !qrData && (
              <p className="text-center font-body-md text-[13px] text-on-surface-variant">
                Could not load QR code.
                <br />
                Tap Refresh QR to try again.
              </p>
            )}
          </div>

          <p className="font-body-md text-[12px] text-on-surface-variant">
            QR codes expire after ~30 seconds. The panel will update automatically once
            your phone confirms the link.
          </p>

          <AdminButton variant="secondary" onClick={refreshQR} disabled={qrLoading} type="button">
            {qrLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            Refresh QR
          </AdminButton>
        </div>
      )}
    </section>
  )
}

// ─── Notification event definitions ──────────────────────────────────────────

const NOTIFICATION_EVENTS: {
  key: keyof AdminSettingsData
  label: string
  description: string
  Icon: LucideIcon
  note?: string
}[] = [
  { key: 'notify_new_order', label: 'New order', description: 'Customer places a shop order', Icon: ShoppingBag },
  { key: 'notify_new_booking', label: 'New booking', description: 'Customer books a service appointment', Icon: CalendarDays },
  { key: 'notify_booking_cancelled', label: 'Booking cancelled', description: 'Customer or admin cancels an appointment', Icon: CalendarX },
  { key: 'notify_new_contact_message', label: 'New contact message', description: 'Customer submits the contact form', Icon: MessageSquare },
  { key: 'notify_low_stock', label: 'Low stock', description: 'A product variant drops below the threshold', Icon: PackageOpen },
  { key: 'notify_discount_maxed_out', label: 'Discount maxed out', description: 'A promo code reaches its usage limit', Icon: TicketPercent },
  {
    key: 'notify_payment_failed',
    label: 'Payment failed',
    description: 'Stripe reports a payment failure (Phase 9)',
    Icon: CreditCard,
    note: 'Enable once Stripe is connected in Phase 9. Default stays OFF until then.',
  },
]

// ─── Main settings page ───────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAdminSettings()
      .then(setSettings)
      .catch(() => toast('Failed to load settings', 'error'))
      .finally(() => setLoading(false))
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
        <PageHeader title="Settings" description="Notifications, WhatsApp connection, and business config." />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading settings" />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Settings" description="Notifications, WhatsApp connection, and business config." />

      <div className="max-w-2xl space-y-6">
        {/* WhatsApp connection — link/unlink, QR code, status */}
        <WhatsAppConnectionPanel />

        <form onSubmit={save} className="space-y-6">
          {/* WhatsApp notification toggles */}
          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-1 flex items-center gap-2 font-headline-md text-headline-md text-primary">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              WhatsApp notifications
            </h2>
            <p className="mb-5 font-body-md text-body-md text-on-surface-variant">
              Choose which events send a message to the number below. The instance above must
              be connected for any alert to deliver.
            </p>

            <Field
              label="Notifier WhatsApp number"
              type="tel"
              value={settings.notifier_whatsapp_number}
              hint="Include country code, e.g. +1 416 555 0142. Alerts go here."
              placeholder="+1 416 555 0142"
              onChange={(e) => set('notifier_whatsapp_number', e.target.value)}
            />

            <fieldset className="mt-5 space-y-1" aria-label="Notification events">
              <legend className="mb-3 font-label-sm text-label-sm font-bold uppercase text-on-surface-variant">
                Events
              </legend>
              {NOTIFICATION_EVENTS.map((ev) => (
                <div
                  key={ev.key}
                  className="flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-surface-container-low"
                >
                  <Toggle
                    id={`toggle-${ev.key}`}
                    checked={settings[ev.key] as boolean}
                    onChange={(v) => set(ev.key, v as AdminSettingsData[typeof ev.key])}
                  />
                  <label htmlFor={`toggle-${ev.key}`} className="flex-1 cursor-pointer">
                    <span className="flex items-center gap-2 font-body-md text-body-md font-semibold text-on-surface">
                      <ev.Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
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

            <div className="mt-5 max-w-xs">
              <Field
                label="Low-stock threshold"
                type="number"
                min={1}
                max={999}
                value={settings.low_stock_threshold}
                hint="Alert fires when variant stock_count ≤ this."
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

          {/* Email — future phase */}
          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-1 flex items-center gap-2 font-headline-md text-headline-md text-primary">
              <Mail className="h-5 w-5" aria-hidden="true" />
              Email notifications
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Admin email alerts are planned for a future phase (Resend integration).
            </p>
          </section>

          {/* Business hours — informational */}
          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-1 flex items-center gap-2 font-headline-md text-headline-md text-primary">
              <Clock className="h-5 w-5" aria-hidden="true" />
              Business hours
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Mon–Sat, 10:00–17:00. Sundays closed. Slot times are fixed in{' '}
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
      </div>
    </>
  )
}
