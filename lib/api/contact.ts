import { apiClient } from './client'

export interface ContactPayload {
  name: string
  email: string
  subject?: string
  message: string
}

export interface ContactMessageResponse {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

export async function submitContact(payload: ContactPayload): Promise<ContactMessageResponse> {
  return apiClient<ContactMessageResponse>('/api/v1/contact/', {
    method: 'POST',
    body: payload,
  })
}
