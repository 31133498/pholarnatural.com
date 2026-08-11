import type { Metadata } from 'next'

/**
 * The confirmation page is transactional, not something search should index (doc §1.9).
 * The metadata lives in a layout because `page.tsx` is a Client Component — Client Components
 * cannot export `metadata`.
 */
export const metadata: Metadata = {
  title: 'Order Confirmation',
  robots: { index: false, follow: false },
}

export default function OrderConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children
}
