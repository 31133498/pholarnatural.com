import { apiClient } from './client'

export interface AdminDiscount {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  value: number
  max_uses: number | null
  min_order_cents: number | null
  expires_at: string | null
  is_active: boolean
  used_count: number
}

export interface DiscountCreatePayload {
  code: string
  discount_type: 'percentage' | 'fixed'
  value: number
  max_uses?: number | null
  min_order_cents?: number | null
  expires_at?: string | null
  is_active?: boolean
}

export interface DiscountUpdatePayload {
  code?: string
  discount_type?: 'percentage' | 'fixed'
  value?: number
  max_uses?: number | null
  min_order_cents?: number | null
  expires_at?: string | null
  is_active?: boolean
}

export function listAdminDiscounts(): Promise<AdminDiscount[]> {
  return apiClient<AdminDiscount[]>('/api/v1/admin/discounts/', { auth: true })
}

export function createAdminDiscount(data: DiscountCreatePayload): Promise<AdminDiscount> {
  return apiClient<AdminDiscount>('/api/v1/admin/discounts/', {
    method: 'POST',
    body: data,
    auth: true,
  })
}

export function updateAdminDiscount(id: string, data: DiscountUpdatePayload): Promise<AdminDiscount> {
  return apiClient<AdminDiscount>(`/api/v1/admin/discounts/${id}`, {
    method: 'PUT',
    body: data,
    auth: true,
  })
}

export function deleteAdminDiscount(id: string): Promise<void> {
  return apiClient<void>(`/api/v1/admin/discounts/${id}`, {
    method: 'DELETE',
    auth: true,
  })
}
