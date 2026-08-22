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

export interface OrderCheckoutResponse {
  order_id: string
  checkout_url: string
  total_cents: number
  status: string
}

// ─── Public functions ─────────────────────────────────────────────────────────

export async function createOrder(payload: OrderPayload): Promise<OrderCheckoutResponse> {
  return apiClient<OrderCheckoutResponse>('/api/v1/orders/', {
    method: 'POST',
    body: payload,
  })
}
