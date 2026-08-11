'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Receipt, Eye, ArrowRight } from 'lucide-react'
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
import { useToast } from '@/context/ToastContext'
import { ORDERS } from '@/lib/data'
import { formatPrice, formatDateShort, formatDateLong } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'

/** The fulfilment pipeline, in order (doc §1.14.5). */
const STATUS_FLOW: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered']

type Filter = 'all' | OrderStatus

/** Order management (doc §1.14.5). */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(ORDERS)
  const [filter, setFilter] = useState<Filter>('all')
  const [viewing, setViewing] = useState<Order | null>(null)
  const { toast } = useToast()

  const visible = useMemo(
    () =>
      [...orders]
        .filter((o) => filter === 'all' || o.status === filter)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [orders, filter],
  )

  /** The next stage in the pipeline, or null once delivered / cancelled. */
  const nextStatus = (status: OrderStatus): OrderStatus | null => {
    const i = STATUS_FLOW.indexOf(status)
    if (i === -1 || i === STATUS_FLOW.length - 1) return null
    return STATUS_FLOW[i + 1]
  }

  function advance(order: Order) {
    const next = nextStatus(order.status)
    if (!next) return
    setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: next } : o)))
    setViewing((v) => (v && v.id === order.id ? { ...v, status: next } : v))
    toast(`${order.order_number} marked ${next}`)
  }

  return (
    <>
      <PageHeader title="Orders" description="Track and fulfil customer orders." />

      <div role="radiogroup" aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {(['all', ...STATUS_FLOW, 'cancelled'] as const).map((f) => (
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
        <EmptyState icon={Receipt} title="No orders" message="Nothing matches this filter." />
      ) : (
        <TableWrap caption="All orders">
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Total</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => {
              const next = nextStatus(o.status)
              return (
                <tr key={o.id}>
                  <Td className="font-semibold text-primary">{o.order_number}</Td>
                  <Td>
                    <span className="block font-semibold text-on-surface">{o.customer_name}</span>
                    <span className="block text-[12px]">{o.customer_email}</span>
                  </Td>
                  <Td>{o.items.reduce((s, i) => s + i.quantity, 0)}</Td>
                  <Td className="font-semibold text-on-surface">{formatPrice(o.total_cents)}</Td>
                  <Td>{formatDateShort(o.created_at.slice(0, 10))}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setViewing(o)}
                        aria-label={`View order ${o.order_number}`}
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {next && (
                        <button
                          type="button"
                          onClick={() => advance(o)}
                          aria-label={`Mark order ${o.order_number} as ${next}`}
                          title={`Mark as ${next}`}
                          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>
      )}

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={`Order ${viewing.order_number}`} wide>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={viewing.status} />
              <p className="font-body-md text-[13px] text-on-surface-variant">
                Placed {formatDateLong(viewing.created_at.slice(0, 10))}
              </p>
            </div>

            <section>
              <h3 className="mb-3 font-label-sm text-label-sm font-bold uppercase text-primary">Items</h3>
              <ul className="space-y-3">
                {viewing.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                      {item.image_url && (
                        <Image src={item.image_url} alt="" fill sizes="56px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-body-md text-body-md font-semibold text-on-surface">
                        {item.product_name}
                      </p>
                      <p className="font-body-md text-[12px] text-on-surface-variant">
                        {item.variant_label} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="font-body-md text-body-md font-bold text-primary">
                      {formatPrice(item.unit_price_cents * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 font-label-sm text-label-sm font-bold uppercase text-primary">
                  Shipping address
                </h3>
                <address className="font-body-md text-body-md not-italic text-on-surface-variant">
                  <span className="block text-on-surface">{viewing.shipping_address.full_name}</span>
                  <span className="block">{viewing.shipping_address.address_line1}</span>
                  {viewing.shipping_address.address_line2 && (
                    <span className="block">{viewing.shipping_address.address_line2}</span>
                  )}
                  <span className="block">
                    {viewing.shipping_address.city}, {viewing.shipping_address.province}{' '}
                    {viewing.shipping_address.postal_code}
                  </span>
                  <span className="block">{viewing.shipping_address.country}</span>
                </address>
              </div>

              <div>
                <h3 className="mb-3 font-label-sm text-label-sm font-bold uppercase text-primary">Payment</h3>
                <dl className="space-y-2 font-body-md text-body-md">
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">Subtotal</dt>
                    <dd className="text-on-surface">{formatPrice(viewing.subtotal_cents)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">Shipping</dt>
                    <dd className="text-on-surface">
                      {viewing.shipping_cents === 0 ? 'Free' : formatPrice(viewing.shipping_cents)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-outline-variant pt-2 font-semibold">
                    <dt className="text-primary">Total</dt>
                    <dd className="text-primary">{formatPrice(viewing.total_cents)}</dd>
                  </div>
                </dl>
                <p className="mt-3 font-body-md text-[12px] text-on-surface-variant">
                  Stripe intent: {viewing.stripe_payment_intent_id ?? 'not connected yet'}
                </p>
              </div>
            </section>

            {/* Status flow (doc §1.14.5) */}
            <section className="border-t border-outline-variant pt-4">
              <h3 className="mb-3 font-label-sm text-label-sm font-bold uppercase text-primary">
                Fulfilment
              </h3>
              <ol className="mb-4 flex flex-wrap items-center gap-2">
                {STATUS_FLOW.map((s, i) => {
                  const currentIndex = STATUS_FLOW.indexOf(viewing.status)
                  const done = currentIndex >= i && currentIndex !== -1
                  return (
                    <li key={s} className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 font-label-sm text-[11px] font-bold uppercase ${
                          done ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {s}
                      </span>
                      {i < STATUS_FLOW.length - 1 && (
                        <span className="h-px w-4 bg-outline-variant" aria-hidden="true" />
                      )}
                    </li>
                  )
                })}
              </ol>

              {nextStatus(viewing.status) ? (
                <AdminButton onClick={() => advance(viewing)}>
                  Mark as {nextStatus(viewing.status)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </AdminButton>
              ) : (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  This order has reached the end of the pipeline.
                </p>
              )}
            </section>
          </div>
        </Modal>
      )}
    </>
  )
}
