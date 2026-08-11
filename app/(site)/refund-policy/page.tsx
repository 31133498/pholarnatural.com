import type { Metadata } from 'next'
import Link from 'next/link'
import PolicyPage from '@/components/PolicyPage'
import { CANCELLATION_POLICY, BUSINESS, DEPOSIT_RATE } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'Pholar Natural returns and refunds: 30-day returns on unopened products, and the deposit rules for cancelling a salon appointment.',
  alternates: { canonical: '/refund-policy' },
}

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund Policy"
      intro="Returning a product, and cancelling an appointment."
      lastUpdated="11 August 2026"
    >
      <h2>Product returns</h2>
      <p>
        Because these are personal care products, we can only accept returns on items that are
        <strong> unopened and unused</strong>, with any seal intact.
      </p>
      <ul>
        <li>Return window: 30 days from the delivery date</li>
        <li>Condition: unopened, unused, in original packaging</li>
        <li>Return shipping is paid by you unless the item was faulty or incorrect</li>
      </ul>

      <h3>How to start a return</h3>
      <p>
        Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> with your order number and
        what you would like to return. We will send return instructions within one business day.
        Please do not send anything back before you hear from us.
      </p>

      <h3>Faulty, damaged or incorrect items</h3>
      <p>
        If we sent the wrong item, or it arrived damaged, we cover return shipping and either replace
        it or refund it in full — your choice. Report it within 48 hours of delivery.
      </p>

      <h2>Booking cancellations</h2>
      <p>
        Appointments are held with a {Math.round(DEPOSIT_RATE * 100)}% deposit. How that deposit is treated
        depends on when you cancel.
      </p>
      <ul>
        <li>
          <strong>Within {CANCELLATION_POLICY.fullRefundWithinMinutes} minutes of booking</strong> —
          cancel for any reason and the deposit is refunded in full.
        </li>
        <li>
          <strong>Within {CANCELLATION_POLICY.forfeitWithinHours} hours of your appointment</strong> —
          the deposit is forfeited. At that point the slot is very unlikely to be refilled.
        </li>
        <li>
          <strong>Between those two points</strong> —{' '}
          {CANCELLATION_POLICY.middleWindowRefundRate === null ? (
            <>
              this part of the policy is being finalised. Until it is published here, contact us
              directly and we will deal with you fairly — we are not going to keep a deposit on a
              technicality while our own policy is incomplete.
            </>
          ) : (
            <>
              {Math.round(CANCELLATION_POLICY.middleWindowRefundRate * 100)}% of the deposit is
              refunded.
            </>
          )}
        </li>
      </ul>

      <h3>Rescheduling</h3>
      <p>
        Rescheduling more than {CANCELLATION_POLICY.forfeitWithinHours} hours ahead carries your
        deposit over to the new appointment at no charge. Contact us rather than cancelling and
        rebooking, so the deposit follows you.
      </p>

      <h3>If we cancel</h3>
      <p>
        If we have to cancel or move your appointment for any reason, your deposit is refunded in
        full, or carried to a new slot if you prefer — regardless of notice.
      </p>

      <h2>How refunds are issued</h2>
      <p>
        Refunds go back to the original payment method. Once we process a refund, your bank
        typically takes 5–10 business days to post it. We cannot refund to a different card or
        account.
      </p>

      <p>
        See also our <Link href="/shipping-policy">shipping policy</Link> and{' '}
        <Link href="/terms-of-service">terms of service</Link>.
      </p>
    </PolicyPage>
  )
}
