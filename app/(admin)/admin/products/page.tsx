'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Package, ImageUp, X } from 'lucide-react'
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
import { PRODUCTS, totalStock } from '@/lib/data'
import { formatPrice } from '@/lib/format'
import type { Product, ProductVariant } from '@/lib/types'

/**
 * Product management (doc §1.14.2).
 *
 * State is local to this page — edits are not persisted anywhere, because the CRUD endpoints
 * (`POST/PUT/DELETE /api/admin/products`) arrive in week 2. Every mutation below is where the
 * corresponding fetch will go.
 */
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS)
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const { toast } = useToast()

  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  function save(form: ProductFormValues, variants: ProductVariant[]) {
    if (editing) {
      setProducts((ps) =>
        ps.map((p) =>
          p.id === editing.id ? { ...p, ...form, variants, updated_at: new Date().toISOString() } : p,
        ),
      )
      toast(`${form.name} updated`)
    } else {
      const id = `prd_${Date.now()}`
      setProducts((ps) => [
        ...ps,
        {
          id,
          ...form,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [],
          variants: variants.map((v) => ({ ...v, product_id: id })),
        },
      ])
      toast(`${form.name} created`)
    }
    closeForm()
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage the catalog, its variants and stock levels."
        action={
          <AdminButton onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Product
          </AdminButton>
        }
      />

      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products" message="Add your first product to get started." />
      ) : (
        <TableWrap caption="All products, including inactive ones">
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Variants</Th>
              <Th>Total stock</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                      {p.images[0] && (
                        <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover" />
                      )}
                    </div>
                    <div>
                      <span className="block font-semibold text-on-surface">{p.name}</span>
                      <span className="block text-[12px]">{p.tagline}</span>
                    </div>
                  </div>
                </Td>
                <Td>{p.category}</Td>
                <Td>{p.variants.length}</Td>
                <Td>
                  <span className={totalStock(p) === 0 ? 'font-semibold text-error' : ''}>
                    {totalStock(p)}
                  </span>
                </Td>
                <Td>
                  <StatusBadge status={p.is_active ? 'active' : 'draft'} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      aria-label={`Edit ${p.name}`}
                      className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(p)}
                      aria-label={`Delete ${p.name}`}
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

      {/*
        `key` remounts the form whenever the target changes, so its state initialises from the
        new product. Without it the dialog would show the previously edited product's values.
      */}
      {(creating || editing) && (
        <ProductForm
          key={editing?.id ?? 'new'}
          open
          product={editing}
          onClose={closeForm}
          onSave={save}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name}?`}
        message="This removes the product and all of its variants. This cannot be undone."
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          setProducts((ps) => ps.filter((p) => p.id !== deleting.id))
          toast(`${deleting.name} deleted`, 'info')
          setDeleting(null)
        }}
      />
    </>
  )
}

interface ProductFormValues {
  name: string
  slug: string
  tagline: string
  description: string
  category: Product['category']
}

function ProductForm({
  open,
  product,
  onClose,
  onSave,
}: {
  open: boolean
  product: Product | null
  onClose: () => void
  onSave: (values: ProductFormValues, variants: ProductVariant[]) => void
}) {
  // Initialised once per mount; the parent remounts this via `key` when the target changes.
  const [values, setValues] = useState<ProductFormValues>(() =>
    product
      ? {
          name: product.name,
          slug: product.slug,
          tagline: product.tagline,
          description: product.description,
          category: product.category,
        }
      : { name: '', slug: '', tagline: '', description: '', category: 'Hair Oil' },
  )
  const [variants, setVariants] = useState<ProductVariant[]>(() => product?.variants ?? [])

  const addVariant = () =>
    setVariants((vs) => [
      ...vs,
      {
        id: `var_${Date.now()}`,
        product_id: product?.id ?? '',
        weight_grams: 0,
        weight_label: '',
        price_cents: 0,
        stock_count: 0,
        sku: '',
        is_active: true,
      },
    ])

  const updateVariant = (id: string, patch: Partial<ProductVariant>) =>
    setVariants((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v)))

  return (
    <Modal open={open} onClose={onClose} title={product ? `Edit ${product.name}` : 'Add product'} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave(values, variants)
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
          hint="Appears in the address bar, e.g. /shop/restorative-hair-oil"
          value={values.slug}
          onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))}
        />
        <Field
          label="Tagline"
          value={values.tagline}
          onChange={(e) => setValues((v) => ({ ...v, tagline: e.target.value }))}
        />

        <div>
          <label
            htmlFor="product-category"
            className="mb-1.5 block font-label-sm text-label-sm font-semibold text-on-surface"
          >
            Category
          </label>
          <select
            id="product-category"
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value as Product['category'] }))}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md"
          >
            <option value="Hair Oil">Hair Oil</option>
            <option value="Shampoo">Shampoo</option>
          </select>
        </div>

        <TextareaField
          label="Description"
          rows={5}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />

        {/* Variant management (doc §1.14.2) */}
        <fieldset className="rounded-xl border border-outline-variant p-4">
          <legend className="px-2 font-label-sm text-label-sm font-bold uppercase text-primary">
            Variants
          </legend>

          {variants.length === 0 && (
            <p className="mb-3 font-body-md text-[13px] text-on-surface-variant">
              No variants yet. A product needs at least one before it can be sold.
            </p>
          )}

          <ul className="space-y-3">
            {variants.map((v) => (
              <li key={v.id} className="grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-3 sm:grid-cols-5">
                <Field
                  label="Label"
                  value={v.weight_label}
                  onChange={(e) => updateVariant(v.id, { weight_label: e.target.value })}
                />
                <Field
                  label="Size"
                  type="number"
                  value={v.weight_grams}
                  onChange={(e) => updateVariant(v.id, { weight_grams: Number(e.target.value) })}
                />
                <Field
                  label="Price (cents)"
                  type="number"
                  value={v.price_cents}
                  hint={formatPrice(v.price_cents)}
                  onChange={(e) => updateVariant(v.id, { price_cents: Number(e.target.value) })}
                />
                <Field
                  label="Stock"
                  type="number"
                  value={v.stock_count}
                  onChange={(e) => updateVariant(v.id, { stock_count: Number(e.target.value) })}
                />
                <div className="flex items-end justify-between gap-2">
                  <Field
                    label="SKU"
                    className="flex-1"
                    value={v.sku}
                    onChange={(e) => updateVariant(v.id, { sku: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setVariants((vs) => vs.filter((x) => x.id !== v.id))}
                    aria-label={`Remove variant ${v.weight_label || 'untitled'}`}
                    className="mb-1 rounded-full p-2 text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <AdminButton variant="secondary" className="mt-3" onClick={addVariant}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add variant
          </AdminButton>
        </fieldset>

        {/* Image upload is a stub — object storage lands with the backend (doc §3.2). */}
        <fieldset className="rounded-xl border border-dashed border-outline p-6 text-center">
          <legend className="px-2 font-label-sm text-label-sm font-bold uppercase text-primary">Images</legend>
          <ImageUp className="mx-auto mb-2 h-8 w-8 text-outline" aria-hidden="true" />
          <p className="font-body-md text-[13px] text-on-surface-variant">
            Image upload and reordering connect to object storage with the backend in week 2.
          </p>
        </fieldset>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <AdminButton type="submit" className="flex-1">
            {product ? 'Save changes' : 'Create product'}
          </AdminButton>
          <AdminButton variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </AdminButton>
        </div>
      </form>
    </Modal>
  )
}
