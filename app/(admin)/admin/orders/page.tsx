'use client'

import { useEffect, useMemo, useState } from 'react'
import { Receipt, Eye, ArrowRight, Loader2 } from 'lucide-react'
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
import { listAdminOrders, updateOrderStatus, type AdminOrder } from '@/lib/api/admin-orders'
import { formatPrice, formatDateShort, formatDateLong } from '@/lib/format'

/** The fulfilment pipeline, in order (doc §1.14.5). */
const STATUS_FLOW = ['paid', 'confirmed', 'processing', 'shipped', 'delivered'] as const
type PipelineStatus = (typeof STATUS_FLOW)[number]
type Filter = 'all' | PipelineStatus | 'cancelled' | 'pending'

/** Order management (doc §1.14.5). */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [viewing, setViewing] = useState<AdminOrder | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    listAdminOrders()
      .then(setOrders)
      .catch(() => toast('Failed to load orders', 'error'))
      .finally(() => setLoading(false))
  }, [toast])

  const visible = useMemo(
    () =>
      [...orders]
        .filter((o) => filter === 'all' || o.status === filter)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [orders, filter],
  )

  const nextStatus = (status: string): PipelineStatus | null => {
    const i = STATUS_FLOW.indexOf(status as PipelineStatus)
    if (i === -1 || i === STATUS_FLOW.length - 1) return null
    return STATUS_FLOW[i + 1]
  }

  async function advance(order: AdminOrder) {
    const next = nextStatus(order.status)
    if (!next) return
    try {
      await updateOrderStatus(order.id, next)
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: next } : o)))
      setViewing((v) => (v?.id === order.id ? { ...v, status: next } : v))
      toast(`${order.order_number} marked ${next}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error')
    }
  }

  const filterOptions: Filter[] = ['all', 'pending', ...STATUS_FLOW, 'cancelled']

  return (
    <>
      <PageHeader title="Orders" description="Track and fulfil customer orders." />

      <div role="radiogroup" aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {filterOptions.map((f) => (
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading orders" />
        </div>
      ) : visible.length === 0 ? (
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
        <OrderModal
          order={viewing}
          onClose={() => setViewing(null)}
          onAdvance={() => advance(viewing)}
          nextStatus={nextStatus(viewing.status)}
        />
      )}
    </>
  )
}

function OrderModal({
  order,
  onClose,
  onAdvance,
  nextStatus,
}: {
  order: AdminOrder
  onClose: () => void
  onAdvance: () => void
  nextStatus: string | null
}) {
  const addr = order.shipping_address

  return (
    <Modal open onClose={onClose} title={`Order ${order.order_number}`} wide>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={order.status} />
          <p className="font-body-md text-[13px] text-on-surface-variant">
            Placed {formatDateLong(order.created_at.slice(0, 10))}
          </p>
        </div>

        <section>
          <h3 className="mb-3 font-label-sm text-label-sm font-bold uppercase text-primary">Items</h3>
          <ul className="divide-y divide-outline-variant">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-body-md text-body-md font-semibold text-on-surface">
                    {item.product_name}
                  </p>
                  <p className="font-body-md text-[12px] text-on-surface-variant">
                    {item.variant_label ?? '—'} · Qty {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-body-md text-body-md font-bold text-primary">
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
              <span className="block font-semibold text-on-surface">{addr.full_name}</span>
              <span className="block">{addr.address_line1}</span>
              {addr.address_line2 && <span className="block">{addr.address_line2}</span>}
              <span className="block">
                {addr.city}, {addr.province} {addr.postal_code}
              </span>
              <span className="block">{addr.country}</span>
            </address>
          </div>

          <div>
            <h3 className="mb-3 font-label-sm text-label-sm font-bold uppercase text-primary">Payment</h3>
            <dl className="space-y-2 font-body-md text-body-md">
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Subtotal</dt>
                <dd className="text-on-surface">{formatPrice(order.subtotal_cents)}</dd>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-primary">
                  <dt>Discount</dt>
                  <dd>−{formatPrice(order.discount_cents)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Shipping</dt>
                <dd className="text-on-surface">
                  {order.shipping_cents === 0 ? 'Free' : formatPrice(order.shipping_cents)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 font-semibold">
                <dt className="text-primary">Total</dt>
                <dd className="text-primary">{formatPrice(order.total_cents)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Status flow (doc §1.14.5) */}
        <section className="border-t border-outline-variant pt-4">
          <h3 className="mb-3 font-label-sm text-label-sm font-bold uppercase text-primary">
            Fulfilment
          </h3>
          <ol className="mb-4 flex flex-wrap items-center gap-2">
            {STATUS_FLOW.map((s, i) => {
              const currentIndex = STATUS_FLOW.indexOf(order.status as PipelineStatus)
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
                  {i < STATUS_FLOW.length - 1 && <span className="h-px w-4 bg-outline-variant" aria-hidden="true" />}
                </li>
              )
            })}
          </ol>

          {nextStatus ? (
            <AdminButton onClick={onAdvance}>
              Mark as {nextStatus}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </AdminButton>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant">
              {order.status === 'delivered'
                ? 'Order delivered — pipeline complete.'
                : 'This order is not currently in the fulfilment pipeline.'}
            </p>
          )}
        </section>
      </div>
    </Modal>
  )
}
