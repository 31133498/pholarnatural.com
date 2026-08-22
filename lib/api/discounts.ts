import { apiClient } from './client'

export interface DiscountValidateResponse {
  valid: boolean
  code: string
  discount_type: 'percentage' | 'fixed'
  value: number
  discount_cents: number
  message: string
}

export async function validateDiscount(
  code: string,
  subtotalCents: number,
): Promise<DiscountValidateResponse> {
  return apiClient<DiscountValidateResponse>('/api/v1/discounts/validate', {
    method: 'POST',
    body: { code, subtotal_cents: subtotalCents },
  })
}
