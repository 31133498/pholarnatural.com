import { apiClient } from './client'

// ─── Public payload / response types ─────────────────────────────────────────

export interface OrderPayload {
  customer_name: string
  customer_email: string
  shipping_address: {
    full_name: string
    address_line1: string
    address_line2?: string
    city: string
    province: string
    postal_code: string
    country: string
  }
  items: Array<{ variant_id: string; quantity: number }>
  discount_code?: string
}

export interface OrderCreateResponse {
  id: string
  subtotal_cents: number
  shipping_cents: number
  discount_cents: number
  total_cents: number
  status: string
}

// ─── Public functions ─────────────────────────────────────────────────────────

export async function createOrder(payload: OrderPayload): Promise<OrderCreateResponse> {
  return apiClient<OrderCreateResponse>('/api/v1/orders/', {
    method: 'POST',
    body: payload,
  })
}
