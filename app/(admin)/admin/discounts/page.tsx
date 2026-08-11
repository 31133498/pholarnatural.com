'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, TicketPercent } from 'lucide-react'
import {
  PageHeader,
  StatusBadge,
  TableWrap,
  Th,
  Td,
  Modal,
  ConfirmDialog,
  AdminButton,
  EmptyState,
} from '@/components/admin/ui'
import { Field } from '@/components/FormField'
import { useToast } from '@/context/ToastContext'
import { DISCOUNTS } from '@/lib/data'
import { formatPrice, formatDateShort } from '@/lib/format'
import type { Discount, DiscountType } from '@/lib/types'

/** Discount management (doc §1.14.6). */
export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>(DISCOUNTS)
  const [editing, setEditing] = useState<Discount | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Discount | null>(null)
  const { toast } = useToast()

  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  /** A code can be inactive because it was switched off, expired, or hit its usage cap. */
  const effectiveStatus = (d: Discount) => {
    if (!d.is_active) return 'draft'
    if (new Date(d.expires_at) < new Date()) return 'expired'
    if (d.used_count >= d.max_uses) return 'expired'
    return 'active'
  }

  const describeValue = (d: Discount) =>
    d.discount_type === 'percentage' ? `${d.value}% off` : `${formatPrice(d.value)} off`

  return (
    <>
      <PageHeader
        title="Discounts"
        description="Promo codes, their limits and how often they have been used."
        action={
          <AdminButton onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Discount
          </AdminButton>
        }
      />

      {discounts.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title="No discount codes"
          message="Create a code to run your first promotion."
        />
      ) : (
        <TableWrap caption="All discount codes">
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Type</Th>
              <Th>Value</Th>
              <Th>Usage</Th>
              <Th>Min order</Th>
              <Th>Expires</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id}>
                <Td>
                  <code className="rounded bg-surface-container-high px-2 py-1 font-mono text-[13px] font-bold text-primary">
                    {d.code}
                  </code>
                </Td>
                <Td className="capitalize">{d.discount_type}</Td>
                <Td className="font-semibold text-on-surface">{describeValue(d)}</Td>
                <Td>
                  {d.used_count} / {d.max_uses}
                  <span
                    className="mt-1 block h-1 w-20 overflow-hidden rounded-full bg-surface-container-highest"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={d.max_uses}
                    aria-valuenow={d.used_count}
                    aria-label={`${d.code} usage`}
                  >
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (d.used_count / d.max_uses) * 100)}%` }}
                    />
                  </span>
                </Td>
                <Td>{d.min_order_cents === 0 ? '—' : formatPrice(d.min_order_cents)}</Td>
                <Td>{formatDateShort(d.expires_at.slice(0, 10))}</Td>
                <Td>
                  <StatusBadge status={effectiveStatus(d)} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(d)}
                      aria-label={`Edit ${d.code}`}
                      className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(d)}
                      aria-label={`Delete ${d.code}`}
                      className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {(creating || editing) && (
        <DiscountForm
          key={editing?.id ?? 'new'}
          discount={editing}
          onClose={closeForm}
          onSave={(form) => {
            if (editing) {
              setDiscounts((ds) => ds.map((d) => (d.id === editing.id ? { ...d, ...form } : d)))
              toast(`${form.code} updated`)
            } else {
              setDiscounts((ds) => [
                ...ds,
                { ...form, id: `dsc_${Date.now()}`, used_count: 0, is_active: true },
              ])
              toast(`${form.code} created`)
            }
            closeForm()
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.code}?`}
        message="Customers who try this code will be told it is invalid. This cannot be undone."
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          setDiscounts((ds) => ds.filter((d) => d.id !== deleting.id))
          toast(`${deleting.code} deleted`, 'info')
          setDeleting(null)
        }}
      />
    </>
  )
}

interface DiscountFormValues {
  code: string
  discount_type: DiscountType
  value: number
  max_uses: number
  min_order_cents: number
  expires_at: string
}

function DiscountForm({
  discount,
  onClose,
  onSave,
}: {
  discount: Discount | null
  onClose: () => void
  onSave: (values: DiscountFormValues) => void
}) {
  const [values, setValues] = useState<DiscountFormValues>(() =>
    discount
      ? {
          code: discount.code,
          discount_type: discount.discount_type,
          value: discount.value,
          max_uses: discount.max_uses,
          min_order_cents: discount.min_order_cents,
          expires_at: discount.expires_at.slice(0, 10),
        }
      : {
          code: '',
          discount_type: 'percentage',
          value: 10,
          max_uses: 100,
          min_order_cents: 0,
          expires_at: '',
        },
  )

  return (
    <Modal open onClose={onClose} title={discount ? `Edit ${discount.code}` : 'Create discount'}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ ...values, expires_at: `${values.expires_at}T23:59:59Z` })
        }}
        className="space-y-4"
      >
        <Field
          label="Code"
          required
          hint="Customers type this at checkout. Uppercase, no spaces."
          value={values.code}
          onChange={(e) => setValues((v) => ({ ...v, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
        />

        <div>
          <label
            htmlFor="discount-type"
            className="mb-1.5 block font-label-sm text-label-sm font-semibold text-on-surface"
          >
            Type
          </label>
          <select
            id="discount-type"
            value={values.discount_type}
            onChange={(e) => setValues((v) => ({ ...v, discount_type: e.target.value as DiscountType }))}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md"
          >
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
          </select>
        </div>

        <Field
          label={values.discount_type === 'percentage' ? 'Percentage' : 'Amount (cents)'}
          type="number"
          required
          min={1}
          max={values.discount_type === 'percentage' ? 100 : undefined}
          value={values.value}
          hint={
            values.discount_type === 'percentage'
              ? `${values.value}% off the order`
              : `${formatPrice(values.value)} off the order`
          }
          onChange={(e) => setValues((v) => ({ ...v, value: Number(e.target.value) }))}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Max uses"
            type="number"
            required
            min={1}
            value={values.max_uses}
            onChange={(e) => setValues((v) => ({ ...v, max_uses: Number(e.target.value) }))}
          />
          <Field
            label="Min order (cents)"
            type="number"
            min={0}
            value={values.min_order_cents}
            hint={values.min_order_cents === 0 ? 'No minimum' : formatPrice(values.min_order_cents)}
            onChange={(e) => setValues((v) => ({ ...v, min_order_cents: Number(e.target.value) }))}
          />
        </div>

        <Field
          label="Expires on"
          type="date"
          required
          value={values.expires_at}
          onChange={(e) => setValues((v) => ({ ...v, expires_at: e.target.value }))}
        />

        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <AdminButton type="submit" className="flex-1">
            {discount ? 'Save changes' : 'Create discount'}
          </AdminButton>
          <AdminButton variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </AdminButton>
        </div>
      </form>
    </Modal>
  )
}
