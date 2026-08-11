# PHOLAR NATURAL — Implementation Document

**Version:** 1.0
**Timeline:** 3 Weeks (Frontend: 4 Days)
**Stack:** Next.js 16 + FastAPI + PostgreSQL + Stripe
**Date:** June 2026

---

## 1.0 FRONTEND EXPERIENCES — COMPLETE BREAKDOWN

### 1.1 Global Site Experiences (All Pages)

#### 1.1.1 Navigation
| Component | Description | Priority |
|-----------|-------------|----------|
| Navbar | Fixed top, glassmorphism on scroll, logo left, nav links center, CTA right | P0 |
| Mobile Menu | Hamburger toggle, slide-down drawer, full nav links + Sign In + Book Now | P0 |
| Footer | 4-column: brand + 3 link groups (Shop, Services, Company), copyright, Stripe notice | P0 |
| Active Nav State | Current page/section highlighted with sage color underline | P1 |

#### 1.1.2 SEO & Metadata
| Feature | Description | Priority |
|---------|-------------|----------|
| Per-page metadata | Title, description for every page (Home, Shop, PDP, Services, Booking, About, FAQ, Contact, Policies) | P0 |
| Open Graph tags | OG title, description, image for social sharing on every page | P0 |
| Sitemap.xml | Auto-generated sitemap for all public pages | P0 |
| Robots.txt | Allow all, point to sitemap | P0 |
| Structured data | Product schema (JSON-LD) on PDPs, Service schema on services page, LocalBusiness schema | P0 |
| Canonical URLs | Per-page canonical tags to prevent duplicate content | P1 |

#### 1.1.3 Cookie Consent & Legal
| Feature | Description | Priority |
|---------|-------------|----------|
| Cookie consent banner | Bottom banner: "We use cookies..." with Accept / Manage Preferences / Decline | P0 |
| Cookie preferences modal | Toggle for essential (locked), analytics, marketing cookies | P1 |
| Privacy Policy page | Full privacy policy, cookie usage details, data handling | P0 |
| Terms of Service page | Terms of service for purchases and bookings | P0 |
| Refund Policy page | Refund policy per PRD (30min full refund, 24h forfeit, etc.) | P0 |
| Shipping Policy page | Shipping rates, regions, timelines | P0 |

#### 1.1.4 Notifications & Feedback
| Feature | Description | Priority |
|---------|-------------|----------|
| Toast notifications | Success/error/info toasts for cart adds, form submissions, booking confirmations | P0 |
| Loading states | Skeleton loaders for product grids, spinners for buttons during async ops | P0 |
| Empty states | Helpful empty state messages for empty cart, no search results, no bookings | P1 |
| Error states | Inline error messages on forms, retry buttons on failed fetches | P0 |
| 404 page | Custom not-found page with brand styling, link back to home | P1 |
| Offline indicator | Banner when connection is lost (PWA-lite, no full offline support per scope) | P2 |

#### 1.1.5 Accessibility (AA Compliance)
| Feature | Description | Priority |
|---------|-------------|----------|
| Focus rings | Visible focus indicators on all interactive elements | P0 |
| Skip to main content | Hidden link, visible on focus, skips to main | P0 |
| Alt text | All images have descriptive alt text | P0 |
| ARIA labels | aria-label on icon-only buttons, aria-live for dynamic content | P0 |
| Keyboard navigation | Tab order matches visual order, all interactions keyboard-accessible | P0 |
| Reduced motion | Respects prefers-reduced-motion, disables parallax/animations | P0 |
| Color contrast | All text/background pairs meet 4.5:1 minimum | P0 |
| Form labels | Visible labels on all inputs, not placeholder-only | P0 |
| Semantic HTML | Proper heading hierarchy (h1→h6), landmark regions, buttons vs links | P0 |
| Screen reader | aria-live regions for cart updates, booking confirmations, error announcements | P1 |

### 1.2 Homepage (`/`)

#### 1.2.1 Hero Section
| Feature | Description | Priority |
|---------|-------------|----------|
| Headline & subtext | "Nature's finest for your crown" with supporting copy | P0 |
| Primary CTA | "Shop Collection" → scrolls to Shop section or `/shop` | P0 |
| Secondary CTA | "Book a Service" → scrolls to Services or `/services` | P0 |
| Badge | "Now Shipping Worldwide" with pulse indicator | P0 |
| Stats bar | 10k+ Happy Customers, 2+ Products, 5 Services | P0 |
| Hero visual | Woman with braids photography, glassmorphism frame, floating badges (100% Natural, CAD) | P0 |
| Parallax depth | Image column scrolls slower than text, blobs drift at staggered speeds | P0 |
| "Discover" indicator | Animated chevron at bottom, scrolls to next section | P1 |
| Animation | Text/CTAs/stats reveal on scroll (motion whileInView) | P0 |

#### 1.2.2 Products Showcase
| Feature | Description | Priority |
|---------|-------------|----------|
| Section heading | "Pure ingredients, real results" | P0 |
| Product cards (2) | Restorative Hair Oil + Botanical Cleanse Shampoo, variant pills, price, Add to Cart | P0 |
| Card hover tilt | Perspective tilt on mouse hover (TiltCard, max 5°) | P0 |
| Scroll entrance | Staggered reveal of product cards | P0 |
| "View All" link | Links to `/shop` | P1 |

#### 1.2.3 Services Preview
| Feature | Description | Priority |
|---------|-------------|----------|
| Section heading | "Beauty treatments crafted for you" | P0 |
| Service cards (5) | Didi Olowo, Kiko, Wash & Set, Hair Treatment, Hair Waxing — icon, description, price, duration | P0 |
| "Book Appointment" CTAs | Links to booking flow | P0 |
| Card hover tilt | Perspective tilt on hover (max 4°) | P0 |

#### 1.2.4 About Section
| Feature | Description | Priority |
|---------|-------------|----------|
| Brand story | "Haircare rooted in nature and tradition" — 2 paragraphs | P0 |
| Value cards | 100% Natural, Cruelty Free, Sustainable — icon, title, description | P0 |
| Photography | Woman with braids, parallax-framed | P0 |
| "Learn More" CTA | Links to `/about` | P1 |

#### 1.2.5 Testimonials Section
| Feature | Description | Priority |
|---------|-------------|----------|
| 3 testimonial cards | Quote, name, role (Verified Buyer / Loyal Client) | P0 |
| Quote icon decoration | SVG quote mark | P0 |
| Avatar initials | Gradient circle with first letter | P0 |
| Card hover tilt | Subtle perspective tilt (max 3°) | P0 |

#### 1.2.6 CTA Section
| Feature | Description | Priority |
|---------|-------------|----------|
| CTA card | "Your hair deserves the best" with decorative blob backgrounds | P0 |
| "Shop Now" button | Links to `/shop` | P0 |
| "Book a Service" button | Links to booking flow | P0 |
| Free shipping note | "Free shipping on orders over CAD $50" | P0 |
| CAD currency note | "All prices in CAD" | P0 |
| Parallax lift | Card lifts and scales into view on scroll | P0 |

### 1.3 Shop Page (`/shop`)

#### 1.3.1 Product Catalog
| Feature | Description | Priority |
|---------|-------------|----------|
| Product grid | 2-column grid of product cards with image, name, price, variants | P0 |
| Filter sidebar/bar | Filter by category (Shampoo, Hair Oil, etc.) | P0 |
| Keyword search | Search bar with debounced input, filters products by name/description | P0 |
| Sort | Sort by price (low→high, high→low), newest, name A-Z | P1 |
| Product count | "Showing X of Y products" | P1 |
| Empty state | "No products match your search" with clear filters link | P1 |
| Pagination | Page numbers or "Load More" if >12 products (needed when admin adds more) | P2 |

#### 1.3.2 Product Card (Shop Grid)
| Feature | Description | Priority |
|---------|-------------|----------|
| Product image | Placeholder SVG until client photos arrive | P0 |
| Product name | Bold serif heading | P0 |
| Price | "CAD $XX.XX" format | P0 |
| Variant pills | Click to select weight/size variant (100ml, 250ml, 500ml etc.) | P0 |
| "Add to Cart" | Adds selected variant to cart, shows toast confirmation | P0 |
| "View Details" | Links to PDP | P1 |
| Bestseller badge | "Bestseller" tag on top products (managed from admin) | P1 |

### 1.4 Product Detail Page (`/shop/[slug]`)

| Feature | Description | Priority |
|---------|-------------|----------|
| Product image gallery | Main image + thumbnails (placeholder SVGs until real photos) | P0 |
| Product name | H1 heading | P0 |
| Tagline | Italic subtitle | P0 |
| Full description | Multi-paragraph, SEO-optimized | P0 |
| Variant selector | Radio or pill buttons for each weight/size | P0 |
| Price | Dynamic price based on selected variant | P0 |
| Stock indicator | "In Stock" (green), "Low Stock" (amber), "Out of Stock" (red, disabled) | P0 |
| Quantity selector | +/- stepper, min 1, max = available stock | P0 |
| "Add to Cart" | Adds selected variant + quantity to cart | P0 |
| Breadcrumb | Home > Shop > Product Name | P1 |
| SEO metadata | Product name in title, description meta, OG tags, product schema JSON-LD | P0 |
| Related products | "You may also like" section (cross-sells other products) | P2 |

### 1.5 Services Page (`/services`)

| Feature | Description | Priority |
|---------|-------------|----------|
| Service cards (5+) | Photo/icon, name, description, duration, price | P0 |
| "Book Now" per service | Links to booking flow with that service pre-selected | P0 |
| Service detail accordion | Expand for full description, what to expect, preparation tips | P1 |
| Pricing table | Quick-reference pricing table for all services | P1 |

### 1.6 Booking Flow (`/book`)

#### 1.6.1 Service Selection
| Feature | Description | Priority |
|---------|-------------|----------|
| Service list/radio | Select one service from catalog | P0 |
| Service details | Name, duration, price shown on selection | P0 |
| "Next" button | Proceeds to date selection | P0 |
| Progress indicator | Step 1 of 3: Select Service | P1 |

#### 1.6.2 Date Selection
| Feature | Description | Priority |
|---------|-------------|----------|
| Calendar widget | Month view, date picker | P0 |
| Available dates highlighted | Dates within Mon-Sat, 10AM-5PM, not admin-blocked | P0 |
| Unavailable dates | Greyed out: Sundays, admin-blocked dates, fully booked days | P0 |
| "Back" button | Returns to service selection | P0 |
| "Next" button | Proceeds to time slot selection | P0 |
| Progress indicator | Step 2 of 3: Select Date | P1 |

#### 1.6.3 Time Slot Selection
| Feature | Description | Priority |
|---------|-------------|----------|
| Time slot grid | Available 60-min slots for selected date (10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00) | P0 |
| Booked slots | Greyed out or "Booked" label | P0 |
| Available slots | Clickable, sage highlight on selection | P0 |
| "Back" button | Returns to date selection | P0 |
| "Next" button | Proceeds to deposit payment | P0 |
| Progress indicator | Step 3 of 3: Select Time | P1 |

#### 1.6.4 Deposit Payment
| Feature | Description | Priority |
|---------|-------------|----------|
| Booking summary | Service name, date, time, price, deposit amount (10%) | P0 |
| Name input | Customer full name | P0 |
| Email input | For confirmation email | P0 |
| Phone input | Optional, for WhatsApp/SMS updates | P0 |
| Stripe payment element | Embedded Stripe payment form for deposit | P0 |
| "Pay Deposit" button | Submit payment | P0 |
| Loading state | Processing payment spinner | P0 |
| Cancel policy notice | "You can cancel within 30 minutes for a full refund" | P0 |
| "Back" button | Returns to time slot selection | P0 |

#### 1.6.5 Booking Confirmation
| Feature | Description | Priority |
|---------|-------------|----------|
| Success checkmark | Animated checkmark | P0 |
| Booking details | Service, date, time, deposit paid, booking reference number | P0 |
| "Back to Home" | Link to homepage | P0 |
| "Book Another" | Link back to booking flow | P1 |
| Confirmation email sent | Message confirming email was dispatched | P0 |

### 1.7 Cart (`/cart`)

| Feature | Description | Priority |
|---------|-------------|----------|
| Cart items list | Product image, name, variant, unit price, quantity stepper, line total | P0 |
| Remove item | X button with confirmation | P0 |
| Quantity adjust | +/- stepper, updates subtotal live | P0 |
| Cart subtotal | Sum of all line items | P0 |
| Cart empty state | "Your cart is empty" with link to Shop | P0 |
| "Continue Shopping" | Link back to `/shop` | P0 |
| "Proceed to Checkout" | Links to checkout | P0 |
| Persisted cart | Cart survives page refresh (localStorage) | P0 |
| Cart count badge | Number in navbar cart icon, updates live | P0 |

### 1.8 Checkout (`/checkout`)

| Feature | Description | Priority |
|---------|-------------|----------|
| Order summary | All cart items with quantities and prices | P0 |
| Shipping address form | Name, address line 1, address line 2, city, state/province, ZIP/postal code, country | P0 |
| Shipping method | Flat rate (domestic) or region-based (international) — finalized week 1 | P0 |
| Order total | Subtotal + shipping + tax (if applicable) | P0 |
| Stripe Checkout | Embedded Stripe payment form | P0 |
| "Place Order" button | Submit payment + create order | P0 |
| Loading state | Processing payment spinner | P0 |
| Error state | Payment failed message with retry option | P0 |
| Guest checkout | No account required, email for confirmation only | P0 |

### 1.9 Order Confirmation (`/order-confirmation`)

| Feature | Description | Priority |
|---------|-------------|----------|
| Success message | "Thank you for your order!" with order number | P0 |
| Order details | Items purchased, quantities, prices, shipping address, total | P0 |
| Estimated delivery | Placeholder message (no real-time tracking per scope) | P1 |
| "Continue Shopping" | Link back to `/shop` | P0 |
| Confirmation email sent | Note that email was dispatched | P0 |
| SEO | Noindex this page (transactional, not for search) | P1 |

### 1.10 About Page (`/about`)

| Feature | Description | Priority |
|---------|-------------|----------|
| Brand story | Full story: roots in African haircare tradition, clean ingredients, small-batch | P0 |
| Photography | Woman with braids, elegant framing | P0 |
| Values section | 100% Natural, Cruelty Free, Sustainable with expanded descriptions | P0 |
| Founder/story note | Placeholder for client bio | P1 |
| "Shop Collection" CTA | Links to `/shop` | P1 |

### 1.11 FAQ Page (`/faq`)

| Feature | Description | Priority |
|---------|-------------|----------|
| Accordion FAQ | Expandable questions grouped by category | P0 |
| Categories | Products, Services & Booking, Shipping, Payments, Returns | P0 |
| Search FAQ | Search bar to filter FAQ items | P1 |
| "Still have questions?" | Links to Contact page | P0 |
| Initial questions drafted | Developer provides initial FAQ copy, client refines | P0 |

### 1.12 Contact Page (`/contact`)

| Feature | Description | Priority |
|---------|-------------|----------|
| Contact form | Name, email, subject, message fields | P0 |
| Form validation | Required fields, valid email format | P0 |
| Success state | "Message sent! We'll get back to you within 24 hours." | P0 |
| Email delivery | Sends to client's email address | P0 |
| Business info | Address (if applicable), email, phone | P1 |
| Social links | Instagram, Facebook, TikTok (if client has them) | P2 |

### 1.13 Policy Pages

#### Shipping Policy (`/shipping-policy`)
| Feature | Description | Priority |
|---------|-------------|----------|
| Domestic shipping | Canada rates, timelines | P0 |
| International shipping | US, UK rates, timelines, customs note | P0 |
| Free shipping threshold | Orders over CAD $50 ship free | P0 |
| Processing time | Order processing 1-2 business days | P0 |

#### Refund Policy (`/refund-policy`)
| Feature | Description | Priority |
|---------|-------------|----------|
| Product returns | Return window, condition requirements, process | P0 |
| Booking cancellations | 30min full refund, 24h forfeit deposit, middle ground TBD week 1 | P0 |
| Refund method | Refund to original payment method | P0 |

#### Privacy Policy (`/privacy-policy`)
| Feature | Description | Priority |
|---------|-------------|----------|
| Data collection | What data is collected and why | P0 |
| Cookie usage | Types of cookies used | P0 |
| Third-party sharing | Stripe, email provider disclosures | P0 |
| User rights | Access, delete, opt-out rights | P0 |

#### Terms of Service (`/terms-of-service`)
| Feature | Description | Priority |
|---------|-------------|----------|
| Use of site | Terms governing site usage | P0 |
| Purchases | Terms for product purchases | P0 |
| Bookings | Terms for service bookings | P0 |
| Liability | Limitation of liability | P0 |

### 1.14 Admin Dashboard (`/admin`)
(Password-protected, single admin user)

#### 1.14.1 Dashboard Home
| Feature | Description | Priority |
|---------|-------------|----------|
| Login form | Password authentication | P0 |
| Sales overview | Orders today, total revenue, bookings count — simple stat cards | P0 |
| Recent orders | Last 10 orders, status, amount | P0 |
| Upcoming bookings | Today + tomorrow bookings preview | P0 |
| Quick actions | Add Product, Add Service, View Calendar | P0 |

#### 1.14.2 Product Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Product list | Table: name, category, variants count, stock total, status (active/draft) | P0 |
| Add product | Form: name, description, category, images, SEO fields | P0 |
| Edit product | Same form, pre-filled | P0 |
| Delete product | Confirmation dialog before delete | P0 |
| Variant management | Add/edit/delete variants per product: weight, price, stock count | P0 |
| Image upload | Upload + reorder product images | P0 |

#### 1.14.3 Service Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Service list | Table: name, duration, price, active status | P0 |
| Add service | Form: name, description, duration, price, image | P0 |
| Edit service | Same form, pre-filled | P0 |
| Delete service | Confirmation dialog (only if no future bookings exist) | P0 |

#### 1.14.4 Booking Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Calendar view | Month/week/day calendar showing all bookings | P0 |
| Booking list | Table: customer, service, date, time, status (confirmed/cancelled) | P0 |
| Confirm booking | Mark booking as confirmed, sends email to customer | P0 |
| Cancel booking | Cancel booking with reason, triggers refund email if applicable | P0 |
| Block dates | Block out unavailable dates (holidays, closures) | P0 |
| Manual slot adjustment | Override available slots for specific dates | P1 |

#### 1.14.5 Order Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Order list | Table: order #, customer, items, total, status, date | P0 |
| Order detail | Full order view: items, shipping address, payment status | P0 |
| Update status | Status flow: Confirmed → Processing → Shipped → Delivered | P0 |

#### 1.14.6 Discount Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Discount list | Table: code, type (% or flat), value, usage count, expiry, active | P0 |
| Create discount | Form: code, percentage, max uses, expiry date, min order amount | P0 |
| Edit discount | Same form, pre-filled | P0 |
| Delete discount | Confirmation dialog | P0 |

#### 1.14.7 Notification Settings
| Feature | Description | Priority |
|---------|-------------|----------|
| WhatsApp toggle | Enable/disable WhatsApp notifications | P0 |
| WhatsApp number | Input for business WhatsApp number | P0 |
| Email notification toggle | Enable/disable admin email notifications | P1 |
| Test notification | Send test WhatsApp/email to verify configuration | P1 |

### 1.15 Additional Frontend Experiences

#### 1.15.1 Site-wide
| Feature | Description | Priority |
|---------|-------------|----------|
| Favicon | Logo mark as favicon (32x32, 180x180) | P0 |
| PWA manifest | For Add to Home Screen (optional, P2) | P2 |
| Scroll to top button | Appears after scrolling 300px, smooth scroll to top | P1 |
| Announcement bar | Promo bar at very top (powered by admin toggle) — optional | P2 |

#### 1.15.2 Performance
| Feature | Description | Priority |
|---------|-------------|----------|
| Image optimization | Next.js Image component, WebP/AVIF, responsive sizes | P0 |
| Lazy loading | Below-fold images, dynamic imports for heavy components | P0 |
| Font optimization | next/font with display:swap, preload critical fonts | P0 |
| Bundle splitting | Route-based code splitting (Next.js automatic) | P0 |
| Core Web Vitals | CLS < 0.1, LCP < 2.5s, INP < 200ms target | P0 |

#### 1.15.3 Cross-browser & Responsive
| Feature | Description | Priority |
|---------|-------------|----------|
| Mobile (320px+) | Full responsive, hamburger menu, touch-optimized targets | P0 |
| Tablet (768px+) | Optimized grid, comfortable spacing | P0 |
| Desktop (1024px+) | Full layout, hover effects, parallax | P0 |
| Chrome, Safari, Firefox, Edge | Cross-browser testing and fixes | P0 |
| iOS Safari | Test on iPhone, address Safari-specific quirks | P0 |
| Android Chrome | Test on Android device | P0 |

---

## 2.0 FRONTEND DELIVERABLES — 4 DAYS

### Day 1: Foundation & Homepage (P0)
**Goal:** Complete homepage with all sections, global layout, and design system.

| # | Task | Files | Duration |
|---|------|-------|----------|
| 1.1 | Install dependencies (motion, sharp for images) | `package.json` | 15min |
| 1.2 | Finalize globals.css with full design tokens | `globals.css` | 20min |
| 1.3 | Build reusable animation components (TiltCard, ParallaxSection, RevealOnScroll) | `components/animations/*.tsx` | 30min |
| 1.4 | Navbar with motion useScroll, mobile drawer, active states | `components/Navbar.tsx` | 45min |
| 1.5 | Hero section with braids photo, parallax, motion entrance | `components/Hero.tsx` | 45min |
| 1.6 | Products showcase section with TiltCard cards | `components/Products.tsx` | 30min |
| 1.7 | Services preview section | `components/Services.tsx` | 30min |
| 1.8 | About section with photo + value cards | `components/About.tsx` | 30min |
| 1.9 | Testimonials section | `components/Testimonials.tsx` | 20min |
| 1.10 | CTA section with parallax blobs | `components/CTA.tsx` | 20min |
| 1.11 | Footer component | `components/Footer.tsx` | 20min |
| 1.12 | Layout with SEO metadata, OG tags, fonts | `app/layout.tsx` | 20min |
| 1.13 | Homepage composition | `app/page.tsx` | 15min |
| 1.14 | Cookie consent banner component | `components/CookieConsent.tsx` | 30min |
| 1.15 | Toast notification system | `components/Toast.tsx` + context | 30min |
| **Total** | | | **~6.5 hours** |

### Day 2: Shop, PDP, Cart, Checkout (P0)
**Goal:** Complete product browsing and purchase flow.

| # | Task | Files | Duration |
|---|------|-------|----------|
| 2.1 | Shop layout + product grid | `app/shop/page.tsx` | 45min |
| 2.2 | Product card component (reusable) | `components/ProductCard.tsx` | 30min |
| 2.3 | Filter sidebar (category, search) | `components/ProductFilters.tsx` | 30min |
| 2.4 | Search bar with debounce | `components/SearchBar.tsx` | 20min |
| 2.5 | Product detail page with variant selector | `app/shop/[slug]/page.tsx` | 60min |
| 2.6 | Cart context (React Context + localStorage) | `context/CartContext.tsx` | 45min |
| 2.7 | Cart page with quantity adjust, remove | `app/cart/page.tsx` | 45min |
| 2.8 | Cart icon badge in Navbar | Update `Navbar.tsx` | 15min |
| 2.9 | Checkout page with address form | `app/checkout/page.tsx` | 60min |
| 2.10 | Order confirmation page | `app/order-confirmation/page.tsx` | 30min |
| 2.11 | Add to Cart toast integration | Wire up toasts to cart actions | 20min |
| **Total** | | | **~6.5 hours** |

### Day 3: Services, Booking Flow, Content Pages (P0)
**Goal:** Complete booking system UI and all static pages.

| # | Task | Files | Duration |
|---|------|-------|----------|
| 3.1 | Services page (full, not preview) | `app/services/page.tsx` | 45min |
| 3.2 | Booking — service selection step | `app/book/page.tsx` (step 1) | 30min |
| 3.3 | Booking — calendar/date selection step | `app/book/page.tsx` (step 2) | 45min |
| 3.4 | Booking — time slot selection step | `app/book/page.tsx` (step 3) | 45min |
| 3.5 | Booking — deposit payment step (Stripe placeholder) | `app/book/page.tsx` (step 4) | 30min |
| 3.6 | Booking confirmation page | `app/book/confirmation/page.tsx` | 30min |
| 3.7 | About page | `app/about/page.tsx` | 20min |
| 3.8 | FAQ page with accordion | `app/faq/page.tsx` | 45min |
| 3.9 | Contact page with form + validation | `app/contact/page.tsx` | 45min |
| 3.10 | Shipping Policy page | `app/shipping-policy/page.tsx` | 15min |
| 3.11 | Refund Policy page | `app/refund-policy/page.tsx` | 15min |
| 3.12 | Privacy Policy page | `app/privacy-policy/page.tsx` | 15min |
| 3.13 | Terms of Service page | `app/terms-of-service/page.tsx` | 15min |
| 3.14 | 404 Not Found page | `app/not-found.tsx` | 15min |
| **Total** | | | **~8 hours** |

### Day 4: Admin Dashboard (P0)
**Goal:** Complete admin dashboard with all management interfaces.

| # | Task | Files | Duration |
|---|------|-------|----------|
| 4.1 | Admin layout (sidebar nav, auth gate) | `app/admin/layout.tsx` | 30min |
| 4.2 | Admin login page | `app/admin/login/page.tsx` | 30min |
| 4.3 | Dashboard home (stats cards, recent orders, upcoming bookings) | `app/admin/page.tsx` | 45min |
| 4.4 | Product list + add/edit/delete forms | `app/admin/products/*` | 60min |
| 4.5 | Service list + add/edit/delete forms | `app/admin/services/*` | 45min |
| 4.6 | Booking management (calendar view + list) | `app/admin/bookings/*` | 60min |
| 4.7 | Order management (list + detail) | `app/admin/orders/*` | 45min |
| 4.8 | Discount management | `app/admin/discounts/*` | 30min |
| 4.9 | Notification settings | `app/admin/settings/*` | 20min |
| 4.10 | SEO metadata sweep (all public pages) | All public routes | 30min |
| 4.11 | Sitemap + robots.txt generation | `app/sitemap.ts`, `app/robots.ts` | 15min |
| 4.12 | Cross-browser/responsive QA pass | All pages | 60min |
| **Total** | | | **~8.5 hours** |

---

## 3.0 BACKEND DELIVERABLES

### 3.1 Database Schema (Week 1, Day 5-6)

#### Tables
```
users          — (optional future use, not in scope for guest checkout)
products       — id, name, slug, description, tagline, category, is_active, created_at, updated_at
product_images — id, product_id, url, alt, sort_order
product_variants — id, product_id, weight_grams, weight_label, price_cents, stock_count, sku, is_active
services       — id, name, slug, description, duration_minutes, price_cents, image_url, is_active
bookings       — id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, status, deposit_cents, stripe_payment_intent_id, cancellation_reason, created_at
blocked_dates  — id, date, reason, created_at
orders         — id, customer_name, customer_email, shipping_address (JSONB), subtotal_cents, shipping_cents, total_cents, status, stripe_payment_intent_id, created_at
order_items    — id, order_id, product_variant_id, product_name, variant_label, quantity, unit_price_cents
discounts      — id, code, discount_type (percentage/fixed), value, max_uses, used_count, min_order_cents, expires_at, is_active
admin_settings — id, key, value (for WhatsApp number, notification toggles, etc.)
contact_messages — id, name, email, subject, message, is_read, created_at
```

### 3.2 API Endpoints (FastAPI)

#### Public API

**Products**
- `GET /api/products` — List products (filter: category, search: q)
- `GET /api/products/{slug}` — Product detail with variants

**Services**
- `GET /api/services` — List services
- `GET /api/services/{slug}` — Service detail

**Bookings**
- `GET /api/bookings/slots?date=YYYY-MM-DD` — Available time slots for date
- `GET /api/bookings/blocked-dates` — List blocked dates
- `POST /api/bookings` — Create booking with deposit payment
- `POST /api/bookings/{id}/cancel` — Cancel booking

**Orders**
- `POST /api/orders` — Create order with payment

**Content**
- `POST /api/contact` — Submit contact form

**Discounts**
- `POST /api/discounts/validate` — Validate discount code

**SEO**
- `GET /api/sitemap.xml` — Sitemap
- `GET /api/robots.txt` — Robots

#### Admin API (Password Protected)

**Auth**
- `POST /api/admin/login` — Admin login
- `POST /api/admin/logout` — Admin logout

**Products CRUD**
- `GET /api/admin/products` — List all (including inactive)
- `POST /api/admin/products` — Create
- `PUT /api/admin/products/{id}` — Update
- `DELETE /api/admin/products/{id}` — Delete
- `POST /api/admin/products/{id}/images` — Upload images
- `DELETE /api/admin/products/{id}/images/{image_id}` — Delete image

**Variants CRUD**
- `POST /api/admin/products/{id}/variants` — Add variant
- `PUT /api/admin/variants/{id}` — Update variant
- `DELETE /api/admin/variants/{id}` — Delete variant

**Services CRUD**
- `GET /api/admin/services` — List all
- `POST /api/admin/services` — Create
- `PUT /api/admin/services/{id}` — Update
- `DELETE /api/admin/services/{id}` — Delete

**Bookings Management**
- `GET /api/admin/bookings` — List (filter: date, status)
- `PUT /api/admin/bookings/{id}/confirm` — Confirm
- `PUT /api/admin/bookings/{id}/cancel` — Cancel (admin)
- `POST /api/admin/blocked-dates` — Block date
- `DELETE /api/admin/blocked-dates/{id}` — Unblock date

**Orders Management**
- `GET /api/admin/orders` — List (filter: status)
- `GET /api/admin/orders/{id}` — Detail
- `PUT /api/admin/orders/{id}/status` — Update status

**Discounts CRUD**
- `GET /api/admin/discounts` — List
- `POST /api/admin/discounts` — Create
- `PUT /api/admin/discounts/{id}` — Update
- `DELETE /api/admin/discounts/{id}` — Delete

**Admin Settings**
- `GET /api/admin/settings` — Get all settings
- `PUT /api/admin/settings` — Update settings
- `POST /api/admin/settings/test-whatsapp` — Send test WhatsApp
- `POST /api/admin/settings/test-email` — Send test email

**Dashboard**
- `GET /api/admin/dashboard` — Stats: orders_today, revenue_today, bookings_today, recent_orders, upcoming_bookings

**Messages**
- `GET /api/admin/messages` — Contact messages list
- `PUT /api/admin/messages/{id}/read` — Mark as read

---

## 4.0 DATABASE SETUP

### 4.1 PostgreSQL Configuration
- Database: `pholar_natural`
- User: dedicated app user with limited privileges
- Migrations: Alembic (Python) for schema versioning
- Backups: pg_dump cron job, daily at 3AM, retain 7 days
- Connection pooling: SQLAlchemy async with asyncpg driver

### 4.2 Seed Data
- 2 products (Restorative Hair Oil, Botanical Cleanse Shampoo) with variants
- 5 services (Didi Olowo, Kiko, Wash & Set, Hair Treatment, Hair Waxing)
- Default admin settings (WhatsApp off, business hours Mon-Sat 10-5)
- 1 admin password (set via env var on deploy)

---

## 5.0 INTEGRATION PHASE

### 5.1 Stripe Integration
| # | Task | Description |
|---|------|-------------|
| 5.1.1 | Stripe account setup | Client completes KYC, activates account (parallel, up to 3 weeks) |
| 5.1.2 | Sandbox mode | Develop + test with Stripe test keys |
| 5.1.3 | Product checkout | Stripe Checkout session for product purchases |
| 5.1.4 | Booking deposits | Payment Intents for 10% deposit on bookings |
| 5.1.5 | Webhook handling | `checkout.session.completed`, `payment_intent.succeeded` → update order/booking status |
| 5.1.6 | Refund handling | API-triggered refunds for booking cancellations within 30min |
| 5.1.7 | Live switch | Swap test keys for live keys, verify end-to-end |
| 5.1.8 | Stripe setup video | Developer records walkthrough for client |

### 5.2 Email Integration
| # | Task | Description |
|---|------|-------------|
| 5.2.1 | Email provider | Resend or SendGrid free tier |
| 5.2.2 | Order confirmation email | To customer: order #, items, total, shipping address |
| 5.2.3 | Booking confirmation email | To customer: service, date, time, deposit, cancel policy |
| 5.2.4 | Admin notification email | On every order + booking |
| 5.2.6 | Email templates | Branded HTML templates with Pholar Natural logo + colors |

### 5.3 WhatsApp Integration
| # | Task | Description |
|---|------|-------------|
| 5.3.1 | WhatsApp Business API | Twilio or WhatsApp Cloud API |
| 5.3.2 | Order notification | Message to admin on new orders |
| 5.3.3 | Booking notification | Message to admin on new bookings |
| 5.3.4 | Admin toggle | Enable/disable from admin dashboard |
| 5.3.5 | Test endpoint | Admin can send test WhatsApp message |

### 5.4 Domain & Hosting
| # | Task | Description |
|---|------|-------------|
| 5.4.1 | Domain purchase | pholarnatural.com (or .ca) — Week 1, Day 1 |
| 5.4.2 | VPS provisioning | 8GB RAM, 120GB bandwidth — Week 1, Day 2 |
| 5.4.3 | SSL setup | Let's Encrypt with auto-renewal |
| 5.4.4 | DNS configuration | Point domain to VPS IP, configure subdomains if needed |
| 5.4.5 | Nginx reverse proxy | Route traffic to Next.js (port 3000) + FastAPI (port 8000) |
| 5.4.6 | PM2 process manager | Keep Node and Python processes alive |
| 5.4.7 | Deploy pipelines | Git pull + rebuild on VPS |

---

## 6.0 WEEKLY TIMELINE

### Week 1: Foundation & Frontend Completion
| Day | Focus | Key Deliverables |
|-----|-------|------------------|
| Mon AM | Kickoff meeting, domain purchase, VPS provision | Domain + VPS active |
| Mon PM | Codebase setup, DB schema design, env config | Repo initialized, DB designed |
| Tue | Frontend Day 1: Homepage layout, design system | Homepage complete |
| Wed | Frontend Day 2: Shop, PDP, Cart, Checkout | Product purchase flow complete |
| Thu | Frontend Day 3: Services, Booking UI, Content pages | Booking UI + all content pages |
| Fri AM | Frontend Day 4: Admin dashboard | Admin dashboard complete |
| Fri PM | Week 1 review, wireframe walkthrough with client | Week 1 sign-off |
| **Parallel** | Client begins Stripe onboarding | Stripe KYC in progress |

### Week 2: Backend & Database
| Day | Focus | Key Deliverables |
|-----|-------|------------------|
| Mon | Database setup, migrations, seed data | DB live, seeded |
| Tue | Products API + Services API | Public product/service endpoints |
| Wed | Cart/Checkout API + Stripe sandbox integration | Purchase flow API |
| Thu | Booking API + calendar logic + Stripe deposit | Booking flow API |
| Fri | Admin API + email integration | Admin CRUD + email sending |
| Fri PM | Week 2 review + demo | Week 2 sign-off |

### Week 3: Integration, Polish, Launch
| Day | Focus | Key Deliverables |
|-----|-------|------------------|
| Mon | WhatsApp integration, admin toggle | WhatsApp notifications |
| Tue | Full integration testing (frontend ↔ backend) | End-to-end flows verified |
| Wed | Cross-browser/mobile QA, bug fixes | QA complete |
| Thu | Stripe live switch (if activated), content refinement | Live payments |
| Fri | Final walkthrough, admin training, deploy, handover | **PROJECT DELIVERED** |

---

## 7.0 TOTAL FRONTEND PAGE/ROUTE INVENTORY

| # | Route | Page | Status |
|---|-------|------|--------|
| 1 | `/` | Homepage | Has landing page — needs shop/service/booking sections plumbed |
| 2 | `/shop` | Product Catalog | TO BUILD Day 2 |
| 3 | `/shop/[slug]` | Product Detail | TO BUILD Day 2 |
| 4 | `/services` | Services Overview | TO BUILD Day 3 |
| 5 | `/book` | Booking Flow (multi-step) | TO BUILD Day 3 |
| 6 | `/book/confirmation` | Booking Confirmation | TO BUILD Day 3 |
| 7 | `/cart` | Shopping Cart | TO BUILD Day 2 |
| 8 | `/checkout` | Checkout | TO BUILD Day 2 |
| 9 | `/order-confirmation` | Order Confirmation | TO BUILD Day 2 |
| 10 | `/about` | About Page | TO BUILD Day 3 |
| 11 | `/faq` | FAQ Page | TO BUILD Day 3 |
| 12 | `/contact` | Contact Page | TO BUILD Day 3 |
| 13 | `/shipping-policy` | Shipping Policy | TO BUILD Day 3 |
| 14 | `/refund-policy` | Refund Policy | TO BUILD Day 3 |
| 15 | `/privacy-policy` | Privacy Policy | TO BUILD Day 3 |
| 16 | `/terms-of-service` | Terms of Service | TO BUILD Day 3 |
| 17 | `/admin` | Admin Dashboard Home | TO BUILD Day 4 |
| 18 | `/admin/login` | Admin Login | TO BUILD Day 4 |
| 19 | `/admin/products` | Product Management | TO BUILD Day 4 |
| 20 | `/admin/services` | Service Management | TO BUILD Day 4 |
| 21 | `/admin/bookings` | Booking Management | TO BUILD Day 4 |
| 22 | `/admin/orders` | Order Management | TO BUILD Day 4 |
| 23 | `/admin/discounts` | Discount Management | TO BUILD Day 4 |
| 24 | `/admin/settings` | Notification Settings | TO BUILD Day 4 |
| 25 | `/not-found` | 404 Page | TO BUILD Day 3 |

---

## 8.0 IMMEDIATE NEXT STEPS

1. **Domain purchase** — buy pholarnatural.com (Week 1, Day 1)
2. **VPS provisioning** — 8GB RAM, 120GB bandwidth (Week 1, Day 2)
3. **Client sends sample sites** — for color/style confirmation
4. **Client begins Stripe onboarding** — KYC, bank details
5. **Client provides product photos** — or confirms placeholders OK
6. **Confirm cancellation policy middle window** — 30min to 24h before appointment
7. **Finalize shipping rates** — flat-rate vs region-based for international
8. **Frontend build begins** — Day 1 tasks as outlined above
