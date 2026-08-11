'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Scissors, ImageUp } from 'lucide-react'
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
import { Field, TextareaField } from '@/components/FormField'
import { useToast } from '@/context/ToastContext'
import { SERVICES, BOOKINGS } from '@/lib/data'
import { formatPrice, formatDuration, toISODate } from '@/lib/format'
import type { Service } from '@/lib/types'

/** Service management (doc §1.14.3). */
export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>(SERVICES)
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Service | null>(null)
  const { toast } = useToast()

  const today = toISODate(new Date())

  /**
   * doc §1.14.3: a service may only be deleted if it has no future bookings — otherwise a
   * customer's confirmed appointment would point at a service that no longer exists.
   */
  const futureBookingsFor = (serviceId: string) =>
    BOOKINGS.filter(
      (b) => b.service_id === serviceId && b.booking_date >= today && b.status !== 'cancelled',
    ).length

  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  return (
    <>
      <PageHeader
        title="Services"
        description="Manage the treatment menu, durations and pricing."
        action={
          <AdminButton onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Service
          </AdminButton>
        }
      />

      {services.length === 0 ? (
        <EmptyState icon={Scissors} title="No services" message="Add a service to open up bookings." />
      ) : (
        <TableWrap caption="All services">
          <thead>
            <tr>
              <Th>Service</Th>
              <Th>Duration</Th>
              <Th>Price</Th>
              <Th>Upcoming</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => {
              const upcoming = futureBookingsFor(s.id)
              return (
                <tr key={s.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                        <Image src={s.image_url} alt="" fill sizes="48px" className="object-cover" />
                      </div>
                      <div>
                        <span className="block font-semibold text-on-surface">{s.name}</span>
                        <span className="block max-w-xs truncate text-[12px]">{s.description}</span>
                      </div>
                    </div>
                  </Td>
                  <Td>{formatDuration(s.duration_minutes)}</Td>
                  <Td className="font-semibold text-on-surface">{formatPrice(s.price_cents)}</Td>
                  <Td>{upcoming === 0 ? '—' : `${upcoming} booked`}</Td>
                  <Td>
                    <StatusBadge status={s.is_active ? 'active' : 'draft'} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(s)}
                        aria-label={`Edit ${s.name}`}
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={upcoming > 0}
                        onClick={() => setDeleting(s)}
                        aria-label={
                          upcoming > 0
                            ? `Cannot delete ${s.name} — it has ${upcoming} upcoming bookings`
                            : `Delete ${s.name}`
                        }
                        title={upcoming > 0 ? 'Cannot delete a service with upcoming bookings' : undefined}
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>
      )}

      {(creating || editing) && (
        <ServiceForm
          key={editing?.id ?? 'new'}
          service={editing}
          onClose={closeForm}
          onSave={(form) => {
            if (editing) {
              setServices((ss) => ss.map((s) => (s.id === editing.id ? { ...s, ...form } : s)))
              toast(`${form.name} updated`)
            } else {
              setServices((ss) => [
                ...ss,
                {
                  ...form,
                  id: `svc_${Date.now()}`,
                  long_description: form.description,
                  what_to_expect: [],
                  image_url: '/images/services/wash-and-set.webp',
                  is_active: true,
                },
              ])
              toast(`${form.name} created`)
            }
            closeForm()
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name}?`}
        message="This removes the service from the booking flow and the services page. This cannot be undone."
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          setServices((ss) => ss.filter((s) => s.id !== deleting.id))
          toast(`${deleting.name} deleted`, 'info')
          setDeleting(null)
        }}
      />
    </>
  )
}

interface ServiceFormValues {
  name: string
  slug: string
  description: string
  duration_minutes: number
  price_cents: number
}

function ServiceForm({
  service,
  onClose,
  onSave,
}: {
  service: Service | null
  onClose: () => void
  onSave: (values: ServiceFormValues) => void
}) {
  const [values, setValues] = useState<ServiceFormValues>(() =>
    service
      ? {
          name: service.name,
          slug: service.slug,
          description: service.description,
          duration_minutes: service.duration_minutes,
          price_cents: service.price_cents,
        }
      : { name: '', slug: '', description: '', duration_minutes: 60, price_cents: 0 },
  )

  return (
    <Modal open onClose={onClose} title={service ? `Edit ${service.name}` : 'Add service'}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave(values)
        }}
        className="space-y-4"
      >
        <Field
          label="Name"
          required
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        />
        <Field
          label="URL slug"
          required
          value={values.slug}
          onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))}
        />
        <TextareaField
          label="Description"
          rows={3}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Duration (minutes)"
            type="number"
            required
            min={15}
            step={15}
            value={values.duration_minutes}
            hint={formatDuration(values.duration_minutes)}
            onChange={(e) => setValues((v) => ({ ...v, duration_minutes: Number(e.target.value) }))}
          />
          <Field
            label="Price (cents)"
            type="number"
            required
            min={0}
            value={values.price_cents}
            hint={formatPrice(values.price_cents)}
            onChange={(e) => setValues((v) => ({ ...v, price_cents: Number(e.target.value) }))}
          />
        </div>

        <fieldset className="rounded-xl border border-dashed border-outline p-6 text-center">
          <legend className="px-2 font-label-sm text-label-sm font-bold uppercase text-primary">Image</legend>
          <ImageUp className="mx-auto mb-2 h-8 w-8 text-outline" aria-hidden="true" />
          <p className="font-body-md text-[13px] text-on-surface-variant">
            Image upload connects to object storage with the backend in week 2.
          </p>
        </fieldset>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <AdminButton type="submit" className="flex-1">
            {service ? 'Save changes' : 'Create service'}
          </AdminButton>
          <AdminButton variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </AdminButton>
        </div>
      </form>
    </Modal>
  )
}
