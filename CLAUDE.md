@AGENTS.md

## Frontend Sprint Context

This is the full **Pholar Natural** frontend — an e-commerce + service-booking product, not a set of
isolated screens. `IMPLEMENTATION-DOC.md` is the **single source of truth**. Where the doc and a
Stitch design disagree, the doc wins. Where the doc and your instincts disagree, the doc wins.

### Sources of truth, in order
1. `IMPLEMENTATION-DOC.md` — scope, routes, priorities, domain rules, copy.
2. `design/DESIGN.md` — pulled from Stitch. Colors, type scale, spacing, component language.
3. `.stitch-export/html/*.html` — the 14 exported Stitch screens (gitignored). UI flow + layout
   reference only. **Never paste this markup in as-is** — see "Porting a Stitch screen" below.

### Stitch project
`4004006649324751261` — "Pholar Natural Full-Stack Platform". Designed screens available:
Home, Shop, PDP, Cart & Checkout, Order Confirmation, Book Appointment, FAQ, Brand & Support,
Admin Login, Admin Dashboard, Product/Service/Booking Management, Order Details.
Not designed — extend the design system yourself, do not ask, do not leave placeholders:
`/services`, `/about`, `/contact`, the 4 policy pages, `/admin/discounts`, `/admin/settings`, 404.

### Porting a Stitch screen — mandatory rewrites
The exports are static HTML aimed at a browser, not a Next app. Every port must:
- **Strip all Google Fonts `<link>` tags.** Fonts come from `next/font` in `app/layout.tsx`
  (Playfair Display → `--font-playfair`, Montserrat → `--font-montserrat`). There are 25 such
  tags across the exports.
- **Replace every `material-symbols-outlined` span with a `lucide-react` icon.** There are 199
  across the exports. `lucide-react` is the only icon system in this codebase.
- **Replace `<img>` with `next/image`**, using local files from `public/images/` (already
  downloaded from Stitch and converted to WebP). Always pass `width`/`height` or `fill` +
  `sizes` — CLS budget is < 0.1.
- **Use design tokens, never raw hex.** `bg-primary`, `text-on-surface-variant`,
  `font-headline-lg text-headline-lg`. Any literal `#hex` in a component is a bug.
- Keep the export's layout, spacing rhythm, and copy; discard its implementation.

### Rules for this sprint
- All 25 routes in `IMPLEMENTATION-DOC.md` §7.0 must be built, including those with no Stitch design.
- Cart, checkout, and booking state must be **real** (React Context + localStorage), not static markup.
- Navigation between all screens must work end to end. No `href="#"` left anywhere.
- **Accessibility is P0, built in from the first component — not a QA pass at the end.** Visible
  focus rings, skip-to-main, real `<label>`s (never placeholder-only), semantic heading order,
  `aria-live` for cart and booking updates, and `prefers-reduced-motion` disabling all
  parallax/tilt/reveal animation.
- Mobile responsiveness is required on every screen (320px+), not just desktop.
- Backend is out of scope this sprint. Build against `lib/data.ts`, whose field names mirror the
  doc's §3.1 DB schema so the real API swaps in at one seam.
- Server Components by default; `'use client'` only where interaction genuinely requires it.

### Fixed domain facts — do not invent alternatives
- Currency **CAD** everywhere. Free shipping over **CAD $50**. Surface "All prices in CAD".
- 2 products: Restorative Hair Oil (CAD $25.00), Botanical Cleanse Shampoo (CAD $20.00).
  Variants are weight/size (30ml, 100ml, 250ml, 500ml).
- 7 services: French Braids, Cornrows, Cornrow Mix Twist, Natural Twist, Wash and Blow Dry,
  Hair Treatment, Hair Waxing. (Client revised the list on 11 Aug 2026; Didi Olowo and Kiko
  were removed. Prices and durations for the new ones are placeholders pending her sign-off.)
- Booking: Mon–Sat only (Sundays disabled), 10:00–17:00, 60-min slots at 10/11/12/13/14/15/16,
  **10% deposit**. Flow: service → date → time → deposit → confirmation.
- Cancellation: full refund within 30 min; deposit forfeited within 24h of appointment. The
  **middle window is still TBD** (doc §8.6) — keep it configurable, never hardcode a guess.
- Tilt limits: products 5°, services 4°, testimonials 3°.
- Admin is a single password-protected user. There is no backend — the gate is a client-side
  **stub** and must never be described as real security.

### Commit identity
Commit as `sanni shazily <sanni.aliu77@gmail.com>`. Never add Claude as co-author and never add
"Generated with Claude Code" trailers.
