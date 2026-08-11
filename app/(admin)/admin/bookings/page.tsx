'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Check, Ban, CalendarOff, ChevronLeft, ChevronRight, Plus, List } from 'lucide-react'
import {
  PageHeader,
  StatusBadge,
  TableWrap,
  Th,
  Td,
  Modal,
  AdminButton,
  EmptyState,
} from '@/components/admin/ui'
import { Field, TextareaField } from '@/components/FormField'
import { useToast } from '@/context/ToastContext'
import { BOOKINGS, BLOCKED_DATES, serviceById } from '@/lib/data'
import { formatDateShort, formatDateLong, formatTime, formatPrice, toISODate } from '@/lib/format'
import { OPEN_WEEKDAYS } from '@/lib/config'
import type { Booking, BlockedDate, BookingStatus } from '@/lib/types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

type Filter = 'all' | BookingStatus

/** Booking management (doc §1.14.4): calendar, list, confirm, cancel, and blocked dates. */
export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS)
  const [blocked, setBlocked] = useState<BlockedDate[]>(BLOCKED_DATES)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [filter, setFilter] = useState<Filter>('all')
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const [blockingOpen, setBlockingOpen] = useState(false)
  const { toast } = useToast()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const visible = useMemo(
    () =>
      [...bookings]
        .filter((b) => filter === 'all' || b.status === filter)
        .sort(
          (a, b) =>
            b.booking_date.localeCompare(a.booking_date) || a.start_time.localeCompare(b.start_time),
        ),
    [bookings, filter],
  )

  const byDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of bookings) {
      if (b.status === 'cancelled') continue
      const list = map.get(b.booking_date) ?? []
      list.push(b)
      map.set(b.booking_date, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time))
    return map
  }, [bookings])

  const blockedSet = useMemo(() => new Set(blocked.map((b) => b.date)), [blocked])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (string | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, month, d)))

  function setStatus(id: string, status: BookingStatus, reason: string | null = null) {
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status, cancellation_reason: reason } : b)))
  }

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Every appointment, and the dates you are closed."
        action={
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={() => setBlockingOpen(true)}>
              <CalendarOff className="h-4 w-4" aria-hidden="true" />
              Block a date
            </AdminButton>
            <AdminButton
              variant={view === 'calendar' ? 'primary' : 'secondary'}
              onClick={() => setView(view === 'calendar' ? 'list' : 'calendar')}
            >
              {view === 'calendar' ? (
                <>
                  <List className="h-4 w-4" aria-hidden="true" />
                  List view
                </>
              ) : (
                <>
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Calendar view
                </>
              )}
            </AdminButton>
          </div>
        }
      />

      {view === 'calendar' ? (
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label="Previous month"
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-surface-container-high"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <h2 aria-live="polite" className="font-headline-md text-headline-md text-primary">
              {MONTHS[month]} {year}
            </h2>
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label="Next month"
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-surface-container-high"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="grid min-w-[44rem] grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div
                  key={d}
                  className="pb-2 text-center font-label-sm text-label-sm uppercase text-on-surface-variant"
                >
                  {d}
                </div>
              ))}

              {cells.map((iso, i) => {
                if (!iso) return <div key={`pad-${i}`} />
                const day = Number(iso.slice(-2))
                const dayBookings = byDate.get(iso) ?? []
                const weekday = new Date(year, month, day).getDay()
                const isClosed = !(OPEN_WEEKDAYS as readonly number[]).includes(weekday)
                const isBlocked = blockedSet.has(iso)
                const isToday = iso === toISODate(today)

                return (
                  <div
                    key={iso}
                    className={`min-h-24 rounded-xl border p-2 ${
                      isBlocked
                        ? 'border-error/30 bg-error-container/30'
                        : isClosed
                          ? 'border-outline-variant/40 bg-surface-container-low'
                          : 'border-outline-variant bg-surface-container-lowest'
                    } ${isToday ? 'ring-2 ring-primary' : ''}`}
                  >
                    <p className="mb-1 flex items-center justify-between font-label-sm text-label-sm">
                      <span className={isClosed || isBlocked ? 'text-outline' : 'text-on-surface'}>{day}</span>
                      {isToday && <span className="text-[10px] font-bold uppercase text-primary">Today</span>}
                    </p>

                    {isBlocked && (
                      <p className="font-label-sm text-[10px] uppercase text-on-error-container">Closed</p>
                    )}

                    <ul className="space-y-1">
                      {dayBookings.map((b) => (
                        <li
                          key={b.id}
                          className="truncate rounded bg-primary/10 px-1.5 py-1 font-body-md text-[11px] text-primary"
                          title={`${formatTime(b.start_time)} ${b.customer_name} — ${serviceById(b.service_id)?.name}`}
                        >
                          {formatTime(b.start_time)} {b.customer_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>

          {blocked.length > 0 && (
            <div className="mt-6 border-t border-outline-variant pt-4">
              <h3 className="mb-3 font-label-sm text-label-sm font-bold uppercase text-primary">
                Blocked dates
              </h3>
              <ul className="flex flex-wrap gap-2">
                {blocked.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-2 rounded-full bg-error-container px-3 py-1.5 font-body-md text-[13px] text-on-error-container"
                  >
                    {formatDateShort(b.date)} — {b.reason}
                    <button
                      type="button"
                      onClick={() => {
                        setBlocked((bs) => bs.filter((x) => x.id !== b.id))
                        toast(`${formatDateShort(b.date)} unblocked`, 'info')
                      }}
                      aria-label={`Unblock ${formatDateLong(b.date)}`}
                      className="rounded-full p-0.5 hover:bg-on-error-container/10"
                    >
                      <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <>
          <div role="radiogroup" aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={filter === f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 font-label-sm text-label-sm capitalize transition-colors ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No bookings" message="Nothing matches this filter." />
          ) : (
            <TableWrap caption="All bookings">
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Customer</Th>
                  <Th>Service</Th>
                  <Th>When</Th>
                  <Th>Deposit</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((b) => (
                  <tr key={b.id}>
                    <Td className="font-semibold text-primary">{b.reference}</Td>
                    <Td>
                      <span className="block font-semibold text-on-surface">{b.customer_name}</span>
                      <span className="block text-[12px]">{b.customer_email}</span>
                      {b.customer_phone && <span className="block text-[12px]">{b.customer_phone}</span>}
                    </Td>
                    <Td>{serviceById(b.service_id)?.name ?? '—'}</Td>
                    <Td>
                      {formatDateShort(b.booking_date)}
                      <span className="block text-[12px]">
                        {formatTime(b.start_time)}–{formatTime(b.end_time)}
                      </span>
                    </Td>
                    <Td>{formatPrice(b.deposit_cents)}</Td>
                    <Td>
                      <StatusBadge status={b.status} />
                      {b.cancellation_reason && (
                        <span className="mt-1 block text-[11px]">{b.cancellation_reason}</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        {b.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              setStatus(b.id, 'confirmed')
                              toast(`${b.reference} confirmed — customer emailed`)
                            }}
                            aria-label={`Confirm booking ${b.reference}`}
                            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        {b.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => setCancelling(b)}
                            aria-label={`Cancel booking ${b.reference}`}
                            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
                          >
                            <Ban className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </>
      )}

      {cancelling && (
        <CancelDialog
          booking={cancelling}
          onClose={() => setCancelling(null)}
          onConfirm={(reason) => {
            setStatus(cancelling.id, 'cancelled', reason)
            toast(`${cancelling.reference} cancelled — refund email queued`, 'info')
            setCancelling(null)
          }}
        />
      )}

      {blockingOpen && (
        <BlockDateDialog
          onClose={() => setBlockingOpen(false)}
          onConfirm={(date, reason) => {
            setBlocked((bs) => [
              ...bs,
              { id: `bd_${Date.now()}`, date, reason, created_at: new Date().toISOString() },
            ])
            toast(`${formatDateShort(date)} blocked out`)
            setBlockingOpen(false)
          }}
        />
      )}
    </>
  )
}

function CancelDialog({
  booking,
  onClose,
  onConfirm,
}: {
  booking: Booking
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  return (
    <Modal open onClose={onClose} title={`Cancel ${booking.reference}?`}>
      <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
        This cancels {booking.customer_name}&apos;s appointment on{' '}
        {formatDateLong(booking.booking_date)} at {formatTime(booking.start_time)}. A cancellation
        email is sent, and a refund is triggered where the policy allows one.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onConfirm(reason.trim() || 'Cancelled by studio')
        }}
      >
        <TextareaField
          label="Reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Shown to the customer in the cancellation email."
        />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <AdminButton type="submit" className="flex-1">
            Cancel booking
          </AdminButton>
          <AdminButton variant="secondary" className="flex-1" onClick={onClose}>
            Keep it
          </AdminButton>
        </div>
      </form>
    </Modal>
  )
}

function BlockDateDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: (date: string, reason: string) => void
}) {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  return (
    <Modal open onClose={onClose} title="Block out a date">
      <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
        Blocked dates are removed from the customer booking calendar. Existing bookings on that date
        are not cancelled automatically — cancel them individually first.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (date) onConfirm(date, reason.trim() || 'Studio closed')
        }}
        className="space-y-4"
      >
        <Field label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        <Field
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Public holiday, supplier visit, …"
        />
        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <AdminButton type="submit" className="flex-1">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Block date
          </AdminButton>
          <AdminButton variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </AdminButton>
        </div>
      </form>
    </Modal>
  )
}
