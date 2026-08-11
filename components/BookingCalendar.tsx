'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { OPEN_WEEKDAYS } from '@/lib/config'
import { toISODate } from '@/lib/format'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

interface BookingCalendarProps {
  selected: string | null
  onSelect: (isoDate: string) => void
  blockedDates: string[]
  /** How far ahead bookings are accepted. */
  maxDaysAhead?: number
}

/**
 * Month-view date picker for the booking flow (doc §1.6.2).
 *
 * Unavailable days are rendered as disabled buttons rather than removed, so the grid keeps its
 * shape and each disabled day can carry a reason in its accessible name — "Sunday, closed" reads
 * very differently from a silently missing cell.
 *
 * Dates are handled as local `YYYY-MM-DD` strings throughout. Using `Date.toISOString()` here
 * would shift the date by a day for anyone west of UTC.
 */
export default function BookingCalendar({
  selected,
  onSelect,
  blockedDates,
  maxDaysAhead = 90,
}: BookingCalendarProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const maxDate = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + maxDaysAhead)
    return d
  }, [today, maxDaysAhead])

  const blocked = useMemo(() => new Set(blockedDates), [blockedDates])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const canGoBack = cursor > new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoForward = new Date(year, month + 1, 1) <= maxDate

  const cells: ({ day: number; iso: string; disabled: boolean; reason: string } | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const iso = toISODate(date)
    const isPast = date < today
    const isBeyond = date > maxDate
    const isClosedDay = !(OPEN_WEEKDAYS as readonly number[]).includes(date.getDay())
    const isBlocked = blocked.has(iso)

    const reason = isPast
      ? 'in the past'
      : isBeyond
        ? 'too far ahead'
        : isClosedDay
          ? 'closed on Sundays'
          : isBlocked
            ? 'studio closed'
            : ''

    cells.push({ day, iso, disabled: Boolean(reason), reason })
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-high disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <h3 aria-live="polite" className="font-headline-md text-headline-md text-primary">
          {MONTHS[month]} {year}
        </h3>

        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          disabled={!canGoForward}
          aria-label="Next month"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-high disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <table className="w-full border-collapse">
        <caption className="sr-only-live">
          Select an appointment date. We are open Monday to Saturday; Sundays are unavailable.
        </caption>
        <thead>
          <tr>
            {WEEKDAY_LABELS.map((w) => (
              <th
                key={w}
                scope="col"
                className="pb-2 text-center font-label-sm text-label-sm uppercase text-on-surface-variant"
              >
                <span aria-hidden="true">{w.slice(0, 1)}</span>
                <span className="sr-only-live">{w}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(cells.length / 7) }).map((_, row) => (
            <tr key={row}>
              {cells.slice(row * 7, row * 7 + 7).map((cell, col) => (
                <td key={col} className="p-1 text-center">
                  {cell && (
                    <button
                      type="button"
                      disabled={cell.disabled}
                      onClick={() => onSelect(cell.iso)}
                      aria-pressed={selected === cell.iso}
                      aria-label={
                        cell.disabled
                          ? `${MONTHS[month]} ${cell.day} — unavailable, ${cell.reason}`
                          : `${MONTHS[month]} ${cell.day}, ${year}`
                      }
                      className={`flex aspect-square w-full items-center justify-center rounded-full font-body-md text-body-md transition-colors ${
                        selected === cell.iso
                          ? 'bg-primary font-bold text-white'
                          : cell.disabled
                            ? 'cursor-not-allowed text-outline line-through'
                            : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {cell.day}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 font-body-md text-[12px] text-on-surface-variant">
        We are available Monday through Saturday, from 10:00 AM to 5:00 PM. Struck-through dates are
        unavailable.
      </p>
    </div>
  )
}
