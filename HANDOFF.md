# PHOLAR NATURAL — Agent Handoff

**Written:** 11 August 2026
**Status:** Orientation complete. **No code has been written or modified yet.** The repo is exactly as it was at commit `704115d`.

---

## 1. Where you are

```
C:\Users\shazily\Desktop\Techbros Grind\work\pholar-natural
```

Windows 11, PowerShell primary shell (Git Bash also available). Node v22.17.1, npm 10.9.2.

**Git:** branch `main`, one commit — `704115d feat: initial Next.js build of Pholar Natural landing page`.

Untracked files: `IMPLEMENTATION-DOC.md`, `Pholar-Natural-PRD.docx`, `~$olar-Natural-PRD.docx`.
The `~$…docx` is a Microsoft Word lock file and should be added to `.gitignore`, never committed.

**Commit identity:** commit as `sanni shazily <sanni.aliu77@gmail.com>`. Do **not** add Claude as co-author, and do not add "Generated with Claude Code" trailers. This is a standing user preference.

---

## 2. The sprint

**Frontend only. Build every screen in the implementation doc. `IMPLEMENTATION-DOC.md` is the single source of truth.** Those are the user's words. When the doc and your instincts disagree, the doc wins. No backend work this sprint.

---

## 3. Read this before writing any code

`CLAUDE.md` imports `AGENTS.md`, which says:

> **This is NOT the Next.js you know.** This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.

That warning is real. I verified the following against the bundled docs (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`) — these are confirmed, not remembered:

- **`params` and `searchParams` are Promises and must be awaited.** Synchronous access was deprecated in 15 and **fully removed in 16**. This hits `layout.js`, `page.js`, `route.js`, `default.js`, `opengraph-image`, `icon`. Matters immediately for `app/shop/[slug]/page.tsx`.
- **Run `npx next typegen`** to generate the `PageProps<'/shop/[slug]'>`, `LayoutProps`, and `RouteContext` helper types. Use them:
  ```tsx
  export default async function Page(props: PageProps<'/shop/[slug]'>) {
    const { slug } = await props.params
  }
  ```
- **`cookies`, `headers`, `draftMode` are async too.**
- **Scroll behavior changed.** Next 16 no longer overrides `scroll-behavior: smooth` during route transitions. `app/layout.tsx` currently sets `scroll-smooth` on `<html>` **without** `data-scroll-behavior="smooth"`, so SPA navigations will now animate-scroll instead of jumping instantly. Add `data-scroll-behavior="smooth"` to `<html>` to restore snappy navigation while keeping smooth in-page anchor scrolling. **This is a live bug in the current code.**
- **`middleware` is renamed to `proxy`.** Relevant if you gate `/admin`.
- **Turbopack is the default bundler.**
- **`next lint` is removed** — `package.json` already correctly uses `"lint": "eslint"` with flat config (`eslint.config.mjs`).
- **`next/image`:** `images.domains` is deprecated (this repo already correctly uses `remotePatterns`); `minimumCacheTTL`, `imageSizes`, and `qualities` defaults all changed; local images with query strings are a breaking change.
- **Parallel routes now require `default.js`.**
- React 19.2 with React Compiler support available.
- The docs index carries an agent hint: if fixing slow client-side navigation, `Suspense` alone is not enough — you must also export `unstable_instant` from the route. See `docs/01-app/02-guides/instant-navigation.mdx`.

---

## 4. What actually exists

The whole app is three files.

| File | Lines | Notes |
|---|---|---|
| `app/page.tsx` | 391 | **The entire homepage inline in one `'use client'` component.** Navbar, hero, products, services, about, testimonials, CTA and footer are all hardcoded JSX here. |
| `app/layout.tsx` | 33 | Playfair Display + Montserrat via `next/font/google`, wired to `--font-playfair` / `--font-montserrat`. Basic `metadata` (title + description) only. |
| `app/globals.css` | 142 | Tailwind v4 `@theme` design tokens. **This is the most valuable asset in the repo.** |

Also: `app/favicon.ico`, `public/*.svg` (untouched create-next-app defaults — `file`, `globe`, `next`, `vercel`, `window`).

There is **no** `components/`, `lib/`, `context/`, or `types/` directory yet. No state management, no data layer, no tests.

**Stack:** `next@16.2.9`, `react@19.2.4`, `react-dom@19.2.4`, `lucide-react@^1.18.0`. Dev: `tailwindcss@^4`, `@tailwindcss/postcss`, `typescript@^5`, `eslint@^9`, `eslint-config-next@16.2.9`.

**`next.config.ts`** allows remote images only from `lh3.googleusercontent.com/aida-public/**`.

---

## 5. The design system — use these tokens, never raw hex

`app/globals.css` defines a full Material-3-style palette as Tailwind v4 `@theme` tokens. Consume them as normal Tailwind classes (`bg-primary`, `text-on-surface-variant`, `font-headline-lg`, `text-headline-lg`).

**Core colours**

| Token | Value | Role |
|---|---|---|
| `--color-primary` | `#334537` | Deep sage — headings, primary buttons |
| `--color-primary-container` | `#4a5d4e` | Lighter sage surface |
| `--color-secondary` | `#7d562d` | Warm bronze — accents, CTAs, "Book Now" |
| `--color-secondary-container` | `#ffca98` | Peach badge background |
| `--color-background` / `--color-surface` | `#fcf9f2` | Warm cream page background |
| `--color-on-surface` | `#1c1c18` | Body text |
| `--color-on-surface-variant` | `#434843` | Muted body text |
| `--color-sage-muted` | `#6B7E6F` | Secondary sage |
| `--color-outline-variant` | `#c3c8c1` | Borders/dividers |
| `--color-error` | `#ba1a1a` | Errors |

Plus a full surface-container ramp (`lowest` → `low` → `container` → `high` → `highest`), tertiary pinks, fixed/dim variants, and error containers. Read the file — it is only 142 lines.

**Typography** — Playfair Display for headlines, Montserrat for body/labels:
`headline-display` 48px/700, `headline-lg` 36px/700, `headline-lg-mobile` 28px/700, `headline-md` 24px/600, `body-lg` 18px, `body-md` 16px, `label-sm` 12px/600 with `0.05em` tracking. Each has matching `--font-*` and `--text-*` tokens, so the idiom in this codebase is `className="font-headline-lg text-headline-lg text-primary"`.

**Spacing/radius:** `--spacing-container-max: 1280px` (pages use `max-w-7xl mx-auto px-5 md:px-16`), units xs/sm/md/lg/xl = 4/8/16/32/64px, radius `lg` 0.5rem, `xl` 0.75rem, `full`.

**Custom utilities already available:**
- `.glass-effect` — `rgba(252,249,242,0.7)` + `backdrop-filter: blur(12px)` (used by the fixed navbar)
- `.tilt-card` — hover `translateY(-8px) scale(1.02)` with a springy cubic-bezier
- `.parallax-blob` — `blur(60px)` + 20s floating keyframe animation

---

## 6. Full scope — 25 routes

From doc §7.0. Route 1 exists; everything else is greenfield.

| Route | Page | Day |
|---|---|---|
| `/` | Homepage (exists, needs decomposition + real links) | 1 |
| `/shop` | Product catalog | 2 |
| `/shop/[slug]` | Product detail | 2 |
| `/cart` | Cart | 2 |
| `/checkout` | Checkout | 2 |
| `/order-confirmation` | Order confirmation | 2 |
| `/services` | Services overview | 3 |
| `/book` | Booking flow (multi-step) | 3 |
| `/book/confirmation` | Booking confirmation | 3 |
| `/about`, `/faq`, `/contact` | Content pages | 3 |
| `/shipping-policy`, `/refund-policy`, `/privacy-policy`, `/terms-of-service` | Policies | 3 |
| `/not-found` | 404 | 3 |
| `/admin` + `/admin/login`, `/products`, `/services`, `/bookings`, `/orders`, `/discounts`, `/settings` | Admin (8 screens) | 4 |

**The doc prescribes exact filenames** in §2.0 — follow them:
`components/animations/{TiltCard,ParallaxSection,RevealOnScroll}.tsx`, `components/{Navbar,Hero,Products,Services,About,Testimonials,CTA,Footer,CookieConsent,Toast,ProductCard,ProductFilters,SearchBar}.tsx`, `context/CartContext.tsx`, `app/sitemap.ts`, `app/robots.ts`.

Doc §2.0 task 1.1 explicitly calls for installing **`motion`** (animation) and **`sharp`** (image optimization).

---

## 7. Domain facts the doc fixes (do not invent alternatives)

- **Currency is CAD throughout.** Free shipping over **CAD $50**. Show "All prices in CAD".
- **Products (2):** Restorative Hair Oil (CAD $25.00), Botanical Cleanse Shampoo (CAD $20.00). Variants are weight/size based (30ml, 100ml, 250ml, 500ml).
- **Services (5):** Didi Olowo, Kiko, Wash & Set, Hair Treatment, Hair Waxing.
- **Booking rules:** Mon–Sat only (Sundays greyed out), 10AM–5PM, 60-minute slots at 10:00/11:00/12:00/13:00/14:00/15:00/16:00, **10% deposit**.
- **Cancellation:** full refund within 30 minutes; deposit forfeited within 24h of appointment; **the middle window is still TBD** (doc §8 item 6) — leave it configurable, don't hardcode a guess.
- **Booking flow order:** service → date → time → deposit payment → confirmation (3 progress steps then payment).
- **Copy already fixed by the doc:** hero "Nature's finest for your crown" with "Now Shipping Worldwide" badge; stats 10k+ happy customers / 2+ products / 5 services; "Pure ingredients, real results"; "Beauty treatments crafted for you"; "Haircare rooted in nature and tradition"; "Your hair deserves the best".
- **Values:** 100% Natural, Cruelty Free, Sustainable.
- **Tilt limits:** products 5°, services 4°, testimonials 3°.
- **Admin** is a single password-protected user.

**Accessibility is P0, not a nice-to-have** (doc §1.1.5): AA contrast 4.5:1, visible focus rings, skip-to-main link, real `<label>`s (not placeholder-only), full keyboard nav, `prefers-reduced-motion` must disable parallax/animations, `aria-live` for cart and booking updates, semantic heading hierarchy.

---

## 8. Judgement calls the next agent must make

None of these are settled — I had not started building when the session ended.

1. **There is no backend.** The doc's §3.0 FastAPI + PostgreSQL is a later phase. Build a typed mock data layer (suggest `lib/data.ts` + `lib/types.ts`) mirroring the doc's DB schema field names (§3.1) so swapping in the real API later is a seam, not a rewrite.
2. **Stripe is UI-only this sprint** — the doc itself says "Stripe placeholder" for the booking deposit step.
3. **Admin auth** has no backend to authenticate against; a client-side gate is the pragmatic stub, but do not present it as real security.
4. **`app/page.tsx` must be decomposed.** It is one 391-line `'use client'` file. Day 1 requires splitting it into `components/`, which also lets most new routes stay Server Components.
5. **Images:** the existing page uses raw `<img>` with Google Stitch export URLs (`lh3.googleusercontent.com/aida-public/…`). Doc §1.15.2 requires `next/image` with WebP/AVIF and responsive sizes, and §1.3.2 says placeholder SVGs until the client's real photos arrive. Converting these is real work with a real CLS payoff.
6. **The mouse-parallax in `page.tsx`** tracks `mousemove` on every move and calls `setState`, re-rendering the whole page. It must not survive decomposition in that form, and it must respect `prefers-reduced-motion`.

---

## 9. Blocked on the client (doc §8)

Domain purchase, VPS provisioning, sample sites for style confirmation, Stripe onboarding/KYC, real product photos, the cancellation middle window, and final shipping rates. None of these block frontend work — build against placeholders.

---

## 10. Suggested first moves

1. `npm run dev` and confirm the current homepage renders.
2. `npx next typegen`.
3. Fix the `data-scroll-behavior="smooth"` bug in `app/layout.tsx`.
4. Add `~$*.docx` to `.gitignore`.
5. `npm i motion sharp` (doc task 1.1).
6. Build `lib/types.ts` + `lib/data.ts` from the doc's §3.1 schema.
7. Then work Day 1 in the doc's order: animation primitives → Navbar → sections → Footer → CookieConsent → Toast → recompose `app/page.tsx`.
