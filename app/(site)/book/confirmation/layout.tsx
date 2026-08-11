import type { Metadata } from 'next'

/** Transactional page — kept out of the index, like the order confirmation (doc §1.9). */
export const metadata: Metadata = {
  title: 'Booking Confirmed',
  robots: { index: false, follow: false },
}

export default function BookingConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children
}
