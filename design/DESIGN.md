---
name: Pholar Natural Brand Identity
colors:
  surface: '#fcf9f2'
  surface-dim: '#dcdad3'
  surface-bright: '#fcf9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ec'
  surface-container: '#f0eee7'
  surface-container-high: '#ebe8e1'
  surface-container-highest: '#e5e2db'
  on-surface: '#1c1c18'
  on-surface-variant: '#434843'
  inverse-surface: '#31312c'
  inverse-on-surface: '#f3f0ea'
  outline: '#737872'
  outline-variant: '#c3c8c1'
  surface-tint: '#506354'
  primary: '#334537'
  on-primary: '#ffffff'
  primary-container: '#4a5d4e'
  on-primary-container: '#c0d5c2'
  inverse-primary: '#b7ccb9'
  secondary: '#7d562d'
  on-secondary: '#ffffff'
  secondary-container: '#ffca98'
  on-secondary-container: '#7a532a'
  tertiary: '#553a3e'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e5155'
  on-tertiary-container: '#ecc6ca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e8d5'
  primary-fixed-dim: '#b7ccb9'
  on-primary-fixed: '#0e1f13'
  on-primary-fixed-variant: '#394b3d'
  secondary-fixed: '#ffdcbd'
  secondary-fixed-dim: '#f0bd8b'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#623f18'
  tertiary-fixed: '#ffd9de'
  tertiary-fixed-dim: '#e3bdc2'
  on-tertiary-fixed: '#2b1519'
  on-tertiary-fixed-variant: '#5b4043'
  background: '#fcf9f2'
  on-background: '#1c1c18'
  surface-variant: '#e5e2db'
  charcoal-text: '#333333'
  glass-surface: rgba(252, 249, 242, 0.7)
  sage-muted: '#6B7E6F'
typography:
  headline-display:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 20px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 32px
  unit-xl: 64px
---

## Brand & Style

This design system is anchored in the concept of "Botanical Elegance." It bridges the gap between raw African tradition and premium, clinical-grade organic beauty. The brand personality is rooted, sophisticated, and revitalizing.

The visual style employs a **Minimalist-Glassmorphic** approach. By combining heavy whitespace and a clean, cream-based layout with translucent, frosted glass overlays, the UI achieves a sense of depth and lightness. This reflects the transparency of organic ingredients and the premium nature of the service. Subtle parallax effects and organic, non-linear shapes should be used to break the rigidity of the grid, echoing the unpredictable beauty of the natural world.

## Colors

The palette is a sophisticated reflection of the earth and flora.

- **Primary (Deep Sage Green):** Used for primary brand elements, key CTAs, and structural headers. It represents growth and stability.
- **Secondary (Warm Gold/Terracotta):** Acts as a luminous accent. Use this for highlights, interactive states, and to draw attention to organic certifications.
- **Neutral (Soft Cream):** The foundation of the design system. Unlike pure white, this off-white tone provides a warmer, more welcoming canvas that feels artisanal and premium.
- **Text (Charcoal):** Provides high legibility while maintaining a softer contrast than pure black, ensuring the reading experience remains comfortable.

Color application should follow a 60-30-10 rule, where the Cream background dominates, Sage Green provides structure, and Gold offers the high-end finish.

## Typography

This design system utilizes a high-contrast typographic pairing to signal luxury and modernity.

- **Headlines:** Use Playfair Display. This serif face conveys authority and timelessness. Use it for editorial headings, product names, and section titles. Tighten the letter spacing slightly on larger display sizes to enhance the premium aesthetic.
- **Body & Interface:** Use Montserrat. The geometric clarity of this sans-serif balances the ornamental nature of the headline font. It ensures that product descriptions and booking instructions remain highly legible.
- **Labels:** Small labels and badges should use Montserrat in a semi-bold weight with increased letter spacing and uppercase styling to provide a clear hierarchy for metadata.

## Layout & Spacing

The layout philosophy is centered on **breathability**. This design system utilizes a 12-column grid for desktop with generous gutters to prevent the UI from feeling cluttered.

- **Grid:** On desktop, use a fixed-width container centered in the viewport. On mobile, transition to a fluid single-column layout.
- **Rhythm:** Spacing should follow a base-8 scale. Larger vertical gaps (unit-xl) should be used between major sections to emphasize the minimalist aesthetic.
- **Margins:** High-impact photography sections should occasionally break the grid margins to create an organic, editorial feel that mimics high-end beauty magazines.

## Elevation & Depth

Depth is communicated through a blend of **Glassmorphism** and **Soft Ambient Shadows**.

- **Surfaces:** Use backdrop blurs (10px–20px) on navigation bars and modal overlays. This allows the vibrant, natural textures of background photography to peek through without sacrificing text legibility.
- **Shadows:** Avoid harsh, dark shadows. Use extremely diffused, low-opacity shadows (rgba(74, 93, 78, 0.08)) that inherit a slight tint from the Sage Green primary color. This creates a "lifted" effect that feels natural and light.
- **Depth Layers:** The background (Cream) is the base. Product cards sit on the first elevation layer. Floating badges and navigation elements sit on the highest translucent layer.

## Shapes

The shape language is "Organic Geometric." While the structural containers are grounded, interactive elements use soft roundedness to feel approachable and tactile.

- **Primary Radius:** Use the `rounded` (0.5rem) setting for buttons and input fields to maintain a modern look.
- **Organic Accents:** Large image containers and hero sections should occasionally use asymmetrical border-radius values (e.g., `rounded-tl-[100px] rounded-br-[100px]`) to create leaf-like or pebble-like organic shapes.
- **Pills:** Floating badges and certification chips should use a full pill-shape (radius-xl) to distinguish them from functional UI buttons.

## Components

- **Tilt Cards:** Product and service cards should implement a subtle 3D hover effect (tilt). On hover, the shadow should deepen slightly and the image should scale up.
- **Floating Badges:** Certifications (e.g., "100% Organic") should be styled as small, glassmorphic circles or pills with gold icons. They should appear to float over product images.
- **Buttons:**
  - *Primary:* Solid Sage Green with white text.
  - *Secondary:* Outlined Sage Green or Solid Gold for "Book Now" actions.
- **Multi-step Booking Forms:** Use a clean, progress-tracked interface. Each step should be housed in a soft-white container with generous padding. Form fields use the Cream background with a thin Sage Green border that glows when focused.
- **Navigation:** A sticky glassmorphic top-bar with a blur effect. The active link is indicated by a subtle gold dot underneath the text.
- **Interactive Lists:** Used for ingredient lists or service menus. On hover, a subtle cream-to-sage gradient background appears.

---

## Implementation notes (this repo)

Pulled from Stitch project `4004006649324751261` ("Pholar Natural Full-Stack Platform").

Every token above is already materialised as a Tailwind v4 `@theme` token in `app/globals.css`.
**Consume them as Tailwind classes — never write a raw hex value in a component.**

| Intent | Class |
|---|---|
| Page background | `bg-background` |
| Body copy | `text-on-surface` / muted `text-on-surface-variant` |
| Headline | `font-headline-lg text-headline-lg text-primary` |
| Primary button | `bg-primary text-white` |
| Gold CTA | `bg-secondary text-white` |
| Card surface | `bg-surface-container-lowest` (white) or `bg-surface-container-low` |
| Divider | `border-outline-variant` |

Custom utilities in `globals.css`: `.glass-effect`, `.tilt-card`, `.parallax-blob`.

**Icons:** `lucide-react` only. Stitch exports use Google `material-symbols-outlined` — every one of
those must be swapped for its lucide equivalent when porting a screen.

**Fonts:** already wired in `app/layout.tsx` via `next/font` (Playfair Display → `--font-playfair`,
Montserrat → `--font-montserrat`). Never add a Google Fonts `<link>` tag from a Stitch export.
