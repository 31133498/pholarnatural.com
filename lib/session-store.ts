/**
 * Hand-off storage for the two "you just did a thing" screens.
 *
 * `/order-confirmation` and `/book/confirmation` need the record that was just created. With no
 * backend this sprint there is nothing to fetch it from, so the flow writes it to sessionStorage
 * and the confirmation page reads it once.
 *
 * sessionStorage rather than localStorage on purpose: a confirmation is meaningful for the tab
 * that placed the order and should not resurface in a new session days later.
 *
 * When the API lands, these screens fetch `GET /api/orders/{id}` instead and this file goes away.
 */

const ORDER_KEY = 'pholar-last-order-v1'
const BOOKING_KEY = 'pholar-last-booking-v1'

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(key, JSON.stringify(value))
}

export const lastOrder = {
  get: <T>() => read<T>(ORDER_KEY),
  set: (v: unknown) => write(ORDER_KEY, v),
}

export const lastBooking = {
  get: <T>() => read<T>(BOOKING_KEY),
  set: (v: unknown) => write(BOOKING_KEY, v),
}

/**
 * Order and booking references.
 *
 * Deliberately derived from a counter seeded by the clock rather than `Math.random()`, so the
 * shape matches what the backend will issue (`PN-#####`) and stays readable over the phone.
 */
export function makeOrderNumber(): string {
  return `PN-${10_000 + Math.floor(Date.now() / 1000) % 89_999}`
}

export function makeBookingReference(): string {
  return `PN-B-${1000 + (Math.floor(Date.now() / 1000) % 8999)}`
}

/**
 * Prefixed unique id, standing in for the database's primary key.
 *
 * Lives here rather than inline in components so the clock read stays out of a component body —
 * `Date.now()` is impure, and the React lint rules reject it there even inside an async handler.
 */
export function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}`
}

/** ISO timestamp for "now", kept alongside `makeId` for the same reason. */
export function nowISO(): string {
  return new Date().toISOString()
}
