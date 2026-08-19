import type { Slot } from '@/lib/data'
import { apiClient } from './client'

// ─── Raw backend shapes ───────────────────────────────────────────────────────

interface RawSlotInfo {
  time: string
  available: boolean
}

interface RawSlotsResponse {
  date: string
  slots: RawSlotInfo[]
}

interface RawBlockedDate {
  id: string
  date: string
  reason: string | null
  created_at: string
}

// ─── Public payload / response types ─────────────────────────────────────────

export interface BookingPayload {
  service_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  booking_date: string  // YYYY-MM-DD
  start_time: string    // HH:MM
}

export interface BookingCreateResponse {
  id: string
  status: string
  deposit_cents: number
  booking_date: string
  start_time: string
  end_time: string
}

// ─── Public functions ─────────────────────────────────────────────────────────

export async function getBlockedDates(): Promise<string[]> {
  const raw = await apiClient<RawBlockedDate[]>('/api/v1/bookings/blocked-dates')
  return raw.map((b) => b.date)
}

export async function getAvailableSlots(date: string, serviceId?: string): Promise<Slot[]> {
  const params = new URLSearchParams({ date })
  if (serviceId) params.set('service_id', serviceId)
  const raw = await apiClient<RawSlotsResponse>(`/api/v1/bookings/slots?${params}`)
  return raw.slots.map((s) => ({
    time: s.time,
    available: s.available,
    ...(!s.available ? { reason: 'booked' as const } : {}),
  }))
}

export async function createBooking(payload: BookingPayload): Promise<BookingCreateResponse> {
  return apiClient<BookingCreateResponse>('/api/v1/bookings/', {
    method: 'POST',
    body: {
      ...payload,
      // Pydantic time field expects HH:MM:SS
      start_time: payload.start_time.length === 5 ? `${payload.start_time}:00` : payload.start_time,
    },
  })
}
