import { apiClient } from './client'

export interface WhatsAppStatus {
  connected: boolean
  state: string
  /** Linked phone number (e.g. "14165550142") — present when state is "open" on some Evolution API versions. */
  phone?: string | null
}

export interface WhatsAppQR {
  /** Full data URI: "data:image/png;base64,..." — pass directly to <img src>. */
  base64: string | null
  /** Raw QR string, not needed for display. */
  code: string | null
  error?: string
}

export interface AdminSettingsData {
  notifier_whatsapp_number: string
  low_stock_threshold: number
  notify_new_order: boolean
  notify_new_booking: boolean
  notify_booking_cancelled: boolean
  notify_payment_failed: boolean
  notify_new_contact_message: boolean
  notify_low_stock: boolean
  notify_discount_maxed_out: boolean
}

/** Matches _DEFAULT_ON in server/app/services/whatsapp.py. */
const BOOL_DEFAULTS: Record<string, boolean> = {
  notify_new_order: true,
  notify_new_booking: true,
  notify_booking_cancelled: true,
  notify_payment_failed: false,
  notify_new_contact_message: true,
  notify_low_stock: true,
  notify_discount_maxed_out: false,
}

function parseBool(raw: string | undefined, key: string): boolean {
  if (raw === undefined) return BOOL_DEFAULTS[key] ?? false
  return raw === 'true'
}

export async function loadAdminSettings(): Promise<AdminSettingsData> {
  const raw = await apiClient<Record<string, string>>('/api/v1/admin/settings', { auth: true })
  return {
    notifier_whatsapp_number: raw.notifier_whatsapp_number ?? '',
    low_stock_threshold: Number(raw.low_stock_threshold ?? '5'),
    notify_new_order: parseBool(raw.notify_new_order, 'notify_new_order'),
    notify_new_booking: parseBool(raw.notify_new_booking, 'notify_new_booking'),
    notify_booking_cancelled: parseBool(raw.notify_booking_cancelled, 'notify_booking_cancelled'),
    notify_payment_failed: parseBool(raw.notify_payment_failed, 'notify_payment_failed'),
    notify_new_contact_message: parseBool(raw.notify_new_contact_message, 'notify_new_contact_message'),
    notify_low_stock: parseBool(raw.notify_low_stock, 'notify_low_stock'),
    notify_discount_maxed_out: parseBool(raw.notify_discount_maxed_out, 'notify_discount_maxed_out'),
  }
}

export async function saveAdminSettings(data: AdminSettingsData): Promise<void> {
  const payload: Record<string, string> = {
    notifier_whatsapp_number: data.notifier_whatsapp_number,
    low_stock_threshold: String(data.low_stock_threshold),
    notify_new_order: String(data.notify_new_order),
    notify_new_booking: String(data.notify_new_booking),
    notify_booking_cancelled: String(data.notify_booking_cancelled),
    notify_payment_failed: String(data.notify_payment_failed),
    notify_new_contact_message: String(data.notify_new_contact_message),
    notify_low_stock: String(data.notify_low_stock),
    notify_discount_maxed_out: String(data.notify_discount_maxed_out),
  }
  await apiClient('/api/v1/admin/settings', { method: 'PUT', body: payload, auth: true })
}

export function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  return apiClient<WhatsAppStatus>('/api/v1/admin/whatsapp/status', { auth: true })
}

export function getWhatsAppQR(): Promise<WhatsAppQR> {
  return apiClient<WhatsAppQR>('/api/v1/admin/whatsapp/qr', { auth: true })
}

export function logoutWhatsApp(): Promise<void> {
  return apiClient<void>('/api/v1/admin/whatsapp/logout', { method: 'POST', auth: true })
}

export function sendTestWhatsApp(): Promise<void> {
  return apiClient<void>('/api/v1/admin/whatsapp/test', { method: 'POST', auth: true })
}
