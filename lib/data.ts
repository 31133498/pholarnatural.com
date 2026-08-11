/**
 * Mock data layer.
 *
 * This is the ONLY seam between the UI and the backend. Every function here mirrors an endpoint
 * from IMPLEMENTATION-DOC.md §3.2 and returns the shape that endpoint will return, so week 2
 * replaces the bodies with `fetch` calls and nothing else in the app changes.
 *
 *   getProducts()        -> GET  /api/products
 *   getProductBySlug()   -> GET  /api/products/{slug}
 *   getServices()        -> GET  /api/services
 *   getAvailableSlots()  -> GET  /api/bookings/slots?date=
 *   getBlockedDates()    -> GET  /api/bookings/blocked-dates
 *
 * Functions are async on purpose — they already have the signature the real client will have.
 */

import { SLOT_TIMES, SLOT_DURATION_MINUTES, OPEN_WEEKDAYS } from './config'
import { toISODate } from './format'
import type {
  AdminSettings,
  BlockedDate,
  Booking,
  ContactMessage,
  Discount,
  Order,
  Product,
  Service,
} from './types'

/* ------------------------------------------------------------------ products */

export const PRODUCTS: Product[] = [
  {
    id: 'prd_hair_oil',
    name: 'Restorative Hair Oil',
    slug: 'restorative-hair-oil',
    tagline: 'African Marula & Argan',
    category: 'Hair Oil',
    description:
      'A featherweight restorative oil pressed from hand-harvested marula and argan, blended with hibiscus and rosemary extract. It absorbs without residue, sealing moisture into the hair shaft while soothing the scalp. Formulated for coily, curly and textured hair that needs sustained nourishment rather than a surface shine.\n\nUse three to five drops on damp hair from mid-length to ends, or massage directly into the scalp before washing. Cold-pressed in small batches and bottled in amber glass to protect the botanicals from light.',
    is_active: true,
    is_bestseller: true,
    rating: 4.9,
    created_at: '2026-06-15T10:00:00Z',
    updated_at: '2026-08-11T08:00:00Z',
    images: [
      { id: 'img_oil_1', product_id: 'prd_hair_oil', url: '/images/products/restorative-hair-oil-hero.webp', alt: 'Amber glass dropper bottle of Restorative Hair Oil on a linen surface', sort_order: 0 },
      { id: 'img_oil_2', product_id: 'prd_hair_oil', url: '/images/products/restorative-hair-oil.webp', alt: 'Restorative Hair Oil beside dried botanical ingredients', sort_order: 1 },
      { id: 'img_oil_3', product_id: 'prd_hair_oil', url: '/images/products/restorative-hair-oil-alt.webp', alt: 'Close-up of the gold dropper of the Restorative Hair Oil', sort_order: 2 },
      { id: 'img_oil_4', product_id: 'prd_hair_oil', url: '/images/products/gallery-thumb-1.webp', alt: 'Restorative Hair Oil styled with fresh botanicals', sort_order: 3 },
    ],
    variants: [
      { id: 'var_oil_30', product_id: 'prd_hair_oil', weight_grams: 30, weight_label: '30ml', price_cents: 2_500, stock_count: 42, sku: 'PN-RHO-030', is_active: true },
      { id: 'var_oil_100', product_id: 'prd_hair_oil', weight_grams: 100, weight_label: '100ml', price_cents: 7_000, stock_count: 8, sku: 'PN-RHO-100', is_active: true },
      { id: 'var_oil_250', product_id: 'prd_hair_oil', weight_grams: 250, weight_label: '250ml', price_cents: 15_000, stock_count: 0, sku: 'PN-RHO-250', is_active: true },
    ],
  },
  {
    id: 'prd_shampoo',
    name: 'Botanical Cleanse Shampoo',
    slug: 'botanical-cleanse-shampoo',
    tagline: 'Shea Butter & Coconut',
    category: 'Shampoo',
    description:
      'A sulfate-free cleanser built around shea butter, virgin coconut and aloe. It lifts product build-up and scalp oil without stripping the natural lipids that keep textured hair soft, so hair is left clean but never squeaking.\n\nThe low-foam formula is gentle enough for daily use and safe on colour-treated and chemically relaxed hair. Work a small amount through wet hair, focusing on the scalp, then rinse thoroughly and follow with the Restorative Hair Oil.',
    is_active: true,
    is_bestseller: false,
    rating: 5.0,
    created_at: '2026-06-15T10:00:00Z',
    updated_at: '2026-08-11T08:00:00Z',
    images: [
      { id: 'img_sh_1', product_id: 'prd_shampoo', url: '/images/products/botanical-cleanse-shampoo-hero.webp', alt: 'White bottle of Botanical Cleanse Shampoo on a marble surface', sort_order: 0 },
      { id: 'img_sh_2', product_id: 'prd_shampoo', url: '/images/products/botanical-cleanse-shampoo.webp', alt: 'Botanical Cleanse Shampoo surrounded by fresh green leaves', sort_order: 1 },
      { id: 'img_sh_3', product_id: 'prd_shampoo', url: '/images/products/gallery-thumb-2.webp', alt: 'Detail of the Botanical Cleanse Shampoo pump', sort_order: 2 },
      { id: 'img_sh_4', product_id: 'prd_shampoo', url: '/images/products/gallery-thumb-3.webp', alt: 'Botanical Cleanse Shampoo styled in a bathroom setting', sort_order: 3 },
    ],
    variants: [
      { id: 'var_sh_100', product_id: 'prd_shampoo', weight_grams: 100, weight_label: '100ml', price_cents: 1_100, stock_count: 60, sku: 'PN-BCS-100', is_active: true },
      { id: 'var_sh_250', product_id: 'prd_shampoo', weight_grams: 250, weight_label: '250ml', price_cents: 2_000, stock_count: 31, sku: 'PN-BCS-250', is_active: true },
      { id: 'var_sh_500', product_id: 'prd_shampoo', weight_grams: 500, weight_label: '500ml', price_cents: 3_600, stock_count: 5, sku: 'PN-BCS-500', is_active: true },
    ],
  },
]

/** Card imagery used on `/shop` and the homepage grid (Stitch uses a different crop there). */
export const PRODUCT_CARD_IMAGE: Record<string, string> = {
  'restorative-hair-oil': '/images/shop/restorative-hair-oil.webp',
  'botanical-cleanse-shampoo': '/images/shop/botanical-cleanse-shampoo.webp',
}

/* ------------------------------------------------------------------ services */

/**
 * The seven services the client confirmed: Didi Olowo and Kiko removed, French Braids replacing
 * Didi Olowo, Wash and Blow Dry replacing Wash & Set, and Cornrows, Cornrow Mix Twist and
 * Natural Twist added.
 *
 * PRICES AND DURATIONS ARE PLACEHOLDERS. The client has not supplied figures for the new or
 * renamed services, so these carry over the previous CAD ladder and are estimated from how long
 * each style actually takes. Every one needs her sign-off before launch — this array is the
 * single place to correct them.
 */
export const SERVICES: Service[] = [
  {
    id: 'svc_french_braids',
    name: 'French Braids',
    slug: 'french-braids',
    description: 'Classic plaited braids worked over the scalp, protective and neat enough to last.',
    long_description:
      'French braids plait each section over the strand beneath it, so the braid sits raised along the scalp. Worked on natural hair it keeps tension even along the parting, which makes it one of the gentler protective styles on a fragile hairline.',
    what_to_expect: [
      'A scalp and tension check before any braiding begins',
      'Cleansing and light conditioning if there is product build-up',
      'Sectioning and plaiting, worked in the direction of growth',
      'A finishing oil along the parting to settle the scalp',
    ],
    duration_minutes: 180,
    price_cents: 12_000,
    image_url: '/images/services/french-braids.webp',
    is_active: true,
  },
  {
    id: 'svc_cornrows',
    name: 'Cornrows',
    slug: 'cornrows',
    description: 'Traditional braids laid flat to the scalp in clean, even rows.',
    long_description:
      'Cornrows are plaited under rather than over, so the braid lies flat against the scalp. Straight-back or patterned, they are among the longest-wearing protective styles and the foundation most other braided looks are built on.',
    what_to_expect: [
      'Consultation on the parting pattern you want',
      'Cleansing and stretching so the rows sit evenly',
      'Sectioning and braiding flat to the scalp',
      'Scalp oil and guidance on keeping the rows clean',
    ],
    duration_minutes: 180,
    price_cents: 10_000,
    image_url: '/images/services/cornrows.webp',
    is_active: true,
  },
  {
    id: 'svc_cornrow_mix_twist',
    name: 'Cornrow Mix Twist',
    slug: 'cornrow-mix-twist',
    description: 'Cornrows combined with twisted sections for a patterned, textured finish.',
    long_description:
      'A combination style: cornrows laid flat through part of the head with two-strand twists worked through the rest. It gives the staying power of cornrows with the softer movement of twists, and the balance between the two is set to whatever suits your head shape.',
    what_to_expect: [
      'Design consultation to agree where rows end and twists begin',
      'Cleansing and stretching',
      'Cornrow sections braided flat, twisted sections worked separately',
      'Finishing oil and aftercare guidance',
    ],
    duration_minutes: 240,
    price_cents: 13_000,
    image_url: '/images/services/cornrow-mix-twist.webp',
    is_active: true,
  },
  {
    id: 'svc_natural_twist',
    name: 'Natural Twist',
    slug: 'natural-twist',
    description: 'Two-strand twists that define texture and protect length, with no heat.',
    long_description:
      'Two strands wound around each other along the length of each section. Twists define natural curl pattern without a single degree of heat, and they can be worn as they are or unravelled for a twist-out.',
    what_to_expect: [
      'Consultation on twist size and the finish you want',
      'Cleansing and moisturising so each section holds',
      'Sectioning and twisting throughout',
      'Guidance on sleeping in them and on unravelling for a twist-out',
    ],
    duration_minutes: 120,
    price_cents: 9_000,
    image_url: '/images/services/natural-twist.webp',
    is_active: true,
  },
  {
    id: 'svc_wash_blow_dry',
    name: 'Wash and Blow Dry',
    slug: 'wash-and-blow-dry',
    description: 'Deep botanical cleanse followed by a smooth, controlled blow dry.',
    long_description:
      'A full cleanse with the Botanical Cleanse Shampoo, then a blow dry that stretches and smooths without scorching the strand. The service is built around our own products, so it is a good way to find out how your hair responds to them before buying.',
    what_to_expect: [
      'Double cleanse with the Botanical Cleanse Shampoo',
      'Scalp massage through the second lather',
      'Moisture-lock treatment before any heat',
      'Sectioned blow dry with a heat protectant, finished with the Restorative Hair Oil',
    ],
    duration_minutes: 60,
    price_cents: 6_500,
    image_url: '/images/services/wash-and-blow-dry.webp',
    is_active: true,
  },
  {
    id: 'svc_hair_treatment',
    name: 'Hair Treatment',
    slug: 'hair-treatment',
    description: 'Intensive protein and hydration therapy using our signature botanical blends.',
    long_description:
      'A two-phase treatment that rebuilds protein structure and then restores the hydration that protein alone leaves behind. Recommended for hair recovering from heat, colour or chemical processing.',
    what_to_expect: [
      'Strand test to establish the protein-to-moisture balance your hair needs',
      'Clarifying cleanse to open the cuticle',
      'Protein phase under gentle heat, then a hydration phase',
      'A written aftercare plan for the following four weeks',
    ],
    duration_minutes: 90,
    price_cents: 16_000,
    image_url: '/images/services/hair-treatment.webp',
    is_active: true,
  },
  {
    id: 'svc_hair_waxing',
    name: 'Hair Waxing',
    slug: 'hair-waxing',
    description: 'Gentle, natural hair removal using sugar and sage botanical waxes.',
    long_description:
      'Sugar-based waxing with a sage and chamomile calming finish. The sugar formula binds to hair rather than to skin, which makes it markedly gentler than resin wax on sensitive areas.',
    what_to_expect: [
      'Patch test on first visit',
      'Cleanse and pre-wax oil barrier',
      'Sugar wax application and removal in the direction of growth',
      'Sage and chamomile calming balm',
    ],
    duration_minutes: 45,
    price_cents: 8_000,
    image_url: '/images/services/hair-waxing.webp',
    is_active: true,
  },
]

/** Wider crops used on the homepage services strip. */
export const SERVICE_WIDE_IMAGE: Record<string, string> = {
  'french-braids': '/images/services/french-braids-wide.webp',
  cornrows: '/images/services/cornrows-wide.webp',
  'cornrow-mix-twist': '/images/services/cornrow-mix-twist-wide.webp',
  'natural-twist': '/images/services/natural-twist-wide.webp',
  'wash-and-blow-dry': '/images/services/wash-and-blow-dry-wide.webp',
  'hair-treatment': '/images/services/hair-treatment-wide.webp',
  'hair-waxing': '/images/services/hair-waxing-wide.webp',
}

/**
 * Services the client supplied more than one photo for. Any slug listed here renders as a
 * sliding carousel instead of a still image; everything else falls back to `image_url`.
 *
 * Frontend-only for now: the backend `services` table carries a single `image_url`, so when the
 * API takes over this becomes a `service_images` join in the same shape as `product_images`.
 */
export const SERVICE_GALLERY: Record<string, { card: string[]; tall: string[] }> = {
  'wash-and-blow-dry': {
    card: ['/images/services/wash-and-blow-dry.webp', '/images/services/wash-and-blow-dry-2.webp'],
    tall: [
      '/images/services/wash-and-blow-dry-wide.webp',
      '/images/services/wash-and-blow-dry-2-wide.webp',
    ],
  },
  'hair-treatment': {
    card: ['/images/services/hair-treatment.webp', '/images/services/hair-treatment-2.webp'],
    tall: ['/images/services/hair-treatment-wide.webp', '/images/services/hair-treatment-2-wide.webp'],
  },
}

/* ------------------------------------------------------------------ testimonials */

export interface Testimonial {
  id: string
  name: string
  role: 'Verified Buyer' | 'Loyal Client'
  quote: string
  image_url: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Amina J.',
    role: 'Verified Buyer',
    quote: 'The Restorative Hair Oil changed my hair game completely. My edges have never looked fuller!',
    image_url: '/images/testimonials/amina.webp',
  },
  {
    id: 't2',
    name: 'Sarah K.',
    role: 'Verified Buyer',
    quote: "Finding Pholar was a blessing. Their Botanical Cleanse doesn't strip my hair, it feels so soft.",
    image_url: '/images/testimonials/sarah.webp',
  },
  {
    id: 't3',
    name: 'Fatima L.',
    role: 'Loyal Client',
    quote: "The cornrows were handled with so much care. I've never felt more connected to my roots.",
    image_url: '/images/testimonials/fatima.webp',
  },
]

/* ------------------------------------------------------------------ bookings */

/** Relative to today so the admin dashboard has plausible "today / upcoming" rows. */
function todayPlus(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export const BLOCKED_DATES: BlockedDate[] = [
  { id: 'bd1', date: todayPlus(9), reason: 'Studio closed — supplier visit', created_at: '2026-08-01T09:00:00Z' },
  { id: 'bd2', date: todayPlus(10), reason: 'Studio closed — supplier visit', created_at: '2026-08-01T09:00:00Z' },
]

export const BOOKINGS: Booking[] = [
  { id: 'bk_1', reference: 'PN-B-4821', service_id: 'svc_french_braids', customer_name: 'Adaeze Okafor', customer_email: 'adaeze@example.com', customer_phone: '+1 416 555 0111', booking_date: todayPlus(0), start_time: '10:00', end_time: '13:00', status: 'confirmed', deposit_cents: 1_200, stripe_payment_intent_id: 'pi_mock_4821', cancellation_reason: null, created_at: '2026-08-05T12:04:00Z' },
  { id: 'bk_2', reference: 'PN-B-4822', service_id: 'svc_wash_blow_dry', customer_name: 'Lena Petrova', customer_email: 'lena@example.com', customer_phone: null, booking_date: todayPlus(0), start_time: '14:00', end_time: '15:00', status: 'confirmed', deposit_cents: 650, stripe_payment_intent_id: 'pi_mock_4822', cancellation_reason: null, created_at: '2026-08-06T09:22:00Z' },
  { id: 'bk_3', reference: 'PN-B-4823', service_id: 'svc_hair_treatment', customer_name: 'Marcus Bell', customer_email: 'marcus@example.com', customer_phone: '+1 647 555 0193', booking_date: todayPlus(1), start_time: '11:00', end_time: '12:30', status: 'pending', deposit_cents: 1_600, stripe_payment_intent_id: 'pi_mock_4823', cancellation_reason: null, created_at: '2026-08-08T17:41:00Z' },
  { id: 'bk_4', reference: 'PN-B-4824', service_id: 'svc_cornrows', customer_name: 'Priya Raman', customer_email: 'priya@example.com', customer_phone: '+1 905 555 0164', booking_date: todayPlus(2), start_time: '15:00', end_time: '17:00', status: 'confirmed', deposit_cents: 950, stripe_payment_intent_id: 'pi_mock_4824', cancellation_reason: null, created_at: '2026-08-09T11:15:00Z' },
  { id: 'bk_5', reference: 'PN-B-4820', service_id: 'svc_hair_waxing', customer_name: 'Tolu Adeyemi', customer_email: 'tolu@example.com', customer_phone: null, booking_date: todayPlus(-3), start_time: '16:00', end_time: '16:45', status: 'cancelled', deposit_cents: 800, stripe_payment_intent_id: 'pi_mock_4820', cancellation_reason: 'Customer rescheduled', created_at: '2026-08-02T14:30:00Z' },
]

/* ------------------------------------------------------------------ orders */

export const ORDERS: Order[] = [
  {
    id: 'ord_1', order_number: 'PN-10428', customer_name: 'Chiamaka Eze', customer_email: 'chiamaka@example.com',
    shipping_address: { full_name: 'Chiamaka Eze', address_line1: '84 Bathurst Street', address_line2: 'Unit 12', city: 'Toronto', province: 'ON', postal_code: 'M5V 2R6', country: 'Canada' },
    subtotal_cents: 4_500, shipping_cents: 995, total_cents: 5_495, status: 'processing',
    stripe_payment_intent_id: 'pi_mock_10428', created_at: '2026-08-10T14:22:00Z',
    items: [
      { id: 'oi_1', order_id: 'ord_1', product_variant_id: 'var_oil_30', product_name: 'Restorative Hair Oil', variant_label: '30ml', quantity: 1, unit_price_cents: 2_500, image_url: '/images/products/restorative-hair-oil-sm.webp' },
      { id: 'oi_2', order_id: 'ord_1', product_variant_id: 'var_sh_250', product_name: 'Botanical Cleanse Shampoo', variant_label: '250ml', quantity: 1, unit_price_cents: 2_000, image_url: '/images/products/botanical-cleanse-shampoo-sm.webp' },
    ],
  },
  {
    id: 'ord_2', order_number: 'PN-10427', customer_name: 'Yusuf Bello', customer_email: 'yusuf@example.com',
    shipping_address: { full_name: 'Yusuf Bello', address_line1: '3300 Yonge Street', address_line2: '', city: 'Toronto', province: 'ON', postal_code: 'M4N 2L6', country: 'Canada' },
    subtotal_cents: 7_000, shipping_cents: 0, total_cents: 7_000, status: 'shipped',
    stripe_payment_intent_id: 'pi_mock_10427', created_at: '2026-08-09T10:05:00Z',
    items: [
      { id: 'oi_3', order_id: 'ord_2', product_variant_id: 'var_oil_100', product_name: 'Restorative Hair Oil', variant_label: '100ml', quantity: 1, unit_price_cents: 7_000, image_url: '/images/products/restorative-hair-oil-sm.webp' },
    ],
  },
  {
    id: 'ord_3', order_number: 'PN-10426', customer_name: 'Grace Mensah', customer_email: 'grace@example.com',
    shipping_address: { full_name: 'Grace Mensah', address_line1: '1 King Street West', address_line2: 'Apt 908', city: 'Hamilton', province: 'ON', postal_code: 'L8P 1A4', country: 'Canada' },
    subtotal_cents: 5_600, shipping_cents: 0, total_cents: 5_600, status: 'delivered',
    stripe_payment_intent_id: 'pi_mock_10426', created_at: '2026-08-07T16:48:00Z',
    items: [
      { id: 'oi_4', order_id: 'ord_3', product_variant_id: 'var_sh_500', product_name: 'Botanical Cleanse Shampoo', variant_label: '500ml', quantity: 1, unit_price_cents: 3_600, image_url: '/images/products/botanical-cleanse-shampoo-sm.webp' },
      { id: 'oi_5', order_id: 'ord_3', product_variant_id: 'var_sh_250', product_name: 'Botanical Cleanse Shampoo', variant_label: '250ml', quantity: 1, unit_price_cents: 2_000, image_url: '/images/products/botanical-cleanse-shampoo-sm.webp' },
    ],
  },
  {
    id: 'ord_4', order_number: 'PN-10425', customer_name: 'Nadia Haddad', customer_email: 'nadia@example.com',
    shipping_address: { full_name: 'Nadia Haddad', address_line1: '221 Sherbrooke Street', address_line2: '', city: 'Montreal', province: 'QC', postal_code: 'H2X 1X1', country: 'Canada' },
    subtotal_cents: 2_500, shipping_cents: 995, total_cents: 3_495, status: 'confirmed',
    stripe_payment_intent_id: 'pi_mock_10425', created_at: '2026-08-11T07:12:00Z',
    items: [
      { id: 'oi_6', order_id: 'ord_4', product_variant_id: 'var_oil_30', product_name: 'Restorative Hair Oil', variant_label: '30ml', quantity: 1, unit_price_cents: 2_500, image_url: '/images/products/restorative-hair-oil-sm.webp' },
    ],
  },
]

/* ------------------------------------------------------------------ discounts, settings, messages */

export const DISCOUNTS: Discount[] = [
  { id: 'dsc_1', code: 'WELCOME10', discount_type: 'percentage', value: 10, max_uses: 500, used_count: 128, min_order_cents: 3_000, expires_at: '2026-12-31T23:59:59Z', is_active: true },
  { id: 'dsc_2', code: 'FREESHIP', discount_type: 'fixed', value: 995, max_uses: 200, used_count: 64, min_order_cents: 2_500, expires_at: '2026-09-30T23:59:59Z', is_active: true },
  { id: 'dsc_3', code: 'LAUNCH25', discount_type: 'percentage', value: 25, max_uses: 100, used_count: 100, min_order_cents: 0, expires_at: '2026-07-01T23:59:59Z', is_active: false },
]

export const ADMIN_SETTINGS: AdminSettings = {
  whatsapp_enabled: false,
  whatsapp_number: '',
  email_notifications_enabled: true,
  business_hours_start: '10:00',
  business_hours_end: '17:00',
}

export const CONTACT_MESSAGES: ContactMessage[] = [
  { id: 'msg_1', name: 'Ruth Ade', email: 'ruth@example.com', subject: 'Wholesale enquiry', message: 'Do you offer wholesale pricing for salons in the GTA?', is_read: false, created_at: '2026-08-11T06:30:00Z' },
  { id: 'msg_2', name: 'Dan Whitfield', email: 'dan@example.com', subject: 'Shipping to the UK', message: 'How long does delivery to London usually take?', is_read: true, created_at: '2026-08-09T13:11:00Z' },
]

/* ------------------------------------------------------------------ query functions */

export async function getProducts(opts?: { category?: string; q?: string }): Promise<Product[]> {
  let list = PRODUCTS.filter((p) => p.is_active)
  if (opts?.category && opts.category !== 'All Products') {
    list = list.filter((p) => p.category === opts.category)
  }
  if (opts?.q) {
    const q = opts.q.toLowerCase()
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    )
  }
  return list
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return PRODUCTS.find((p) => p.slug === slug && p.is_active) ?? null
}

export function getProductSlugs(): string[] {
  return PRODUCTS.filter((p) => p.is_active).map((p) => p.slug)
}

export async function getServices(): Promise<Service[]> {
  return SERVICES.filter((s) => s.is_active)
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return SERVICES.find((s) => s.slug === slug && s.is_active) ?? null
}

export async function getBlockedDates(): Promise<string[]> {
  return BLOCKED_DATES.map((b) => b.date)
}

/** The lowest price across a product's active variants — what the card shows as "from". */
export function lowestPriceCents(product: Product): number {
  return Math.min(...product.variants.filter((v) => v.is_active).map((v) => v.price_cents))
}

export function totalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stock_count, 0)
}

export interface Slot {
  time: string
  available: boolean
  /** Why it is unavailable — surfaced to screen readers rather than colour alone. */
  reason?: 'booked' | 'too-late' | 'past'
}

/**
 * Availability for one date, mirroring `GET /api/bookings/slots?date=`.
 *
 * A booking occupies every hourly slot its duration spans, not just its start hour — a 180-minute
 * French Braids at 10:00 blocks 10:00, 11:00 and 12:00. Slots that cannot fit the requested service
 * before the 17:00 close are returned as `too-late`.
 */
export async function getAvailableSlots(date: string, serviceId?: string): Promise<Slot[]> {
  const blocked = BLOCKED_DATES.some((b) => b.date === date)
  const [y, m, d] = date.split('-').map(Number)
  const weekday = new Date(y, m - 1, d).getDay()
  const isOpenDay = (OPEN_WEEKDAYS as readonly number[]).includes(weekday)

  if (blocked || !isOpenDay) {
    return SLOT_TIMES.map((time) => ({ time, available: false, reason: 'booked' as const }))
  }

  const taken = new Set<string>()
  for (const b of BOOKINGS) {
    if (b.booking_date !== date || b.status === 'cancelled') continue
    const start = SLOT_TIMES.indexOf(b.start_time as (typeof SLOT_TIMES)[number])
    if (start < 0) continue
    const svc = SERVICES.find((s) => s.id === b.service_id)
    const span = Math.ceil((svc?.duration_minutes ?? SLOT_DURATION_MINUTES) / SLOT_DURATION_MINUTES)
    for (let i = start; i < start + span && i < SLOT_TIMES.length; i++) taken.add(SLOT_TIMES[i])
  }

  const service = serviceId ? SERVICES.find((s) => s.id === serviceId) : undefined
  const span = Math.ceil((service?.duration_minutes ?? SLOT_DURATION_MINUTES) / SLOT_DURATION_MINUTES)

  return SLOT_TIMES.map((time, i) => {
    if (i + span > SLOT_TIMES.length) return { time, available: false, reason: 'too-late' as const }
    for (let j = i; j < i + span; j++) {
      if (taken.has(SLOT_TIMES[j])) return { time, available: false, reason: 'booked' as const }
    }
    return { time, available: true }
  })
}

/** doc §1.14.1 — the dashboard stat cards. Mirrors `GET /api/admin/dashboard`. */
export async function getDashboardStats() {
  const today = toISODate(new Date())
  const ordersToday = ORDERS.filter((o) => o.created_at.slice(0, 10) === today)
  return {
    orders_today: ordersToday.length,
    revenue_today_cents: ordersToday.reduce((s, o) => s + o.total_cents, 0),
    revenue_total_cents: ORDERS.reduce((s, o) => s + o.total_cents, 0),
    bookings_today: BOOKINGS.filter((b) => b.booking_date === today && b.status !== 'cancelled').length,
    recent_orders: [...ORDERS].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10),
    upcoming_bookings: BOOKINGS.filter((b) => b.booking_date >= today && b.status !== 'cancelled').sort(
      (a, b) => a.booking_date.localeCompare(b.booking_date) || a.start_time.localeCompare(b.start_time),
    ),
  }
}

export function serviceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id)
}
