# Paye. UI Rules

A design system reference for every UI decision made on Paye. These rules apply to the landing page, dashboard, and any future product surface.

---

## Brand

**Logo:** Always rendered as `Paye.` — the period is part of the logo and must always be colored `#2563EB`. Never omit the dot. Never change its color.

**Domain:** paye.africa

**Tagline direction:** Infrastructure language. Not consumer payment language. Paye is for developers and businesses, not end users paying for things.

---

## Color

| Role | Light mode | Dark mode |
|---|---|---|
| Primary (Paye blue) | `#2563EB` | `#3B82F6` |
| Primary hover | `#1D4ED8` | `#2563EB` |
| Primary subtle bg | `#EFF6FF` | `#1E3A5F` |
| Background page | `#F9FAFB` | `#0A0A0A` |
| Background surface | `#FFFFFF` | `#141414` |
| Background secondary | `#F3F4F6` | `#1F1F1F` |
| Text primary | `#0A0A0A` | `#F9FAFB` |
| Text secondary | `#6B7280` | `#9CA3AF` |
| Text tertiary | `#9CA3AF` | `#6B7280` |
| Border default | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` |
| Success | `#16A34A` bg `#F0FDF4` | `#22C55E` bg `#14291A` |
| Warning | `#B45309` bg `#FFFBEB` | `#F59E0B` bg `#2A1F05` |
| Danger | `#DC2626` bg `#FEF2F2` | `#EF4444` bg `#2A0A0A` |

**Rules:**
- Never use hardcoded hex values inside components. Always use CSS variables or Tailwind tokens derived from the palette above.
- `#2563EB` is Paye blue. It is used for: the logo dot, primary buttons, active nav items, links, accent highlights. Nothing else.
- No gradients anywhere. Flat surfaces only.
- No colored backgrounds on full sections except very subtle gray (`#F9FAFB`) to alternate section rhythm.

---

## Typography

**Font:** `Inter` — used for everything. No secondary typeface.

| Role | Size | Weight | Letter spacing |
|---|---|---|---|
| Display / hero headline | 56–64px | 700 | -2px |
| Section title | 36–42px | 700 | -1px |
| Card title / h3 | 15–16px | 600 | 0 |
| Body | 15–16px | 400 | 0 |
| Small / label | 12–13px | 400–500 | 0 |
| Eyebrow | 11–12px | 500 | +0.08em |
| Monospace (refs, code) | 12–13px | 400 | 0 |

**Rules:**
- Eyebrow labels (section labels above titles) are always uppercase, `#2563EB`, letter-spacing `0.08em`. Example: `FOR DEVELOPERS`.
- Never use font-weight 300 or 800+.
- Hero headlines use tight letter-spacing (-1.5px to -2px). Everything else is default or slightly tighter.
- Sentence case everywhere. No ALL CAPS except eyebrow labels and table column headers.

---

## Layout

**Max content width:** `1100px`, centered, `2rem` horizontal padding.

**Section padding:** `5rem 0` for standard sections. `6rem 0` for hero and CTA.

**Border radius:**
- Cards, containers: `12px–14px`
- Buttons: `8px–10px`
- Badges / pills: `999px`
- Small elements (tags, chips): `6px–8px`

**Borders:** Always `0.5px solid` with the border color token. Never `1px` on surfaces. `1px` only for featured/highlighted card accent borders.

**Shadows:** None. Borders define surfaces, not shadows.

---

## Components

### Buttons

| Variant | Style |
|---|---|
| Primary | `bg #2563EB`, white text, `border-radius 10px`, `padding 12px 28px` |
| Ghost | Transparent bg, `border 0.5px` border-default, secondary text |
| Danger | `bg #DC2626`, white text |
| Link | No border, no bg, `#2563EB` text |

- Primary button hover: `#1D4ED8`
- Never use more than one primary button per section
- Button text is always sentence case: "Get started", not "GET STARTED"

### Badges / Status pills

Always use semantic colors:
- Success: green bg + green text
- Pending / warning: amber bg + amber text  
- Failed / error: red bg + red text
- Neutral: gray bg + gray text

Font size: `11px`, font-weight `500`, padding `3px 8px`, border-radius `999px`.

### Cards

- Background: surface white (`#FFFFFF` light / `#141414` dark)
- Border: `0.5px solid` border-default
- Border radius: `12px–14px`
- Padding: `1.25rem–1.5rem`
- No shadow

### Stat / metric cards

- Background: secondary (`#F3F4F6` light)
- Label: `11px`, uppercase, tertiary text color
- Value: `22–28px`, weight `700`, tight letter-spacing
- Sub-label: `11px`, semantic color (green for positive, amber for warning)

### Navigation sidebar

- Width: `200px`
- Background: surface white
- Right border: `0.5px solid` border-default
- Nav items: `13px`, `border-radius 8px`, `padding 7px 10px`
- Active item: `#EFF6FF` background, `#2563EB` icon and text
- No section category labels (DEVELOPER, PAYMENTS etc.) for fewer than 10 items total
- Project switcher sits just below the logo, above nav items

### Top bar

- Background: surface white, `border-bottom 0.5px`
- Height: approximately `52px`
- Mode toggle (Test / Live): a segmented control in top right — one quiet pill, not repeated anywhere else on the page

### Tables

- No outer shadow
- Column headers: `11px`, uppercase, `letter-spacing 0.05em`, tertiary text, secondary bg
- Row border: `0.5px solid` border-default between rows
- Row hover: secondary background
- Monospace font for references and IDs
- Align amounts right, align status badges left

---

## Iconography

Use **Tabler Icons** (outline only). Never filled variants.

Icon sizes:
- Sidebar nav: `16px`
- Feature cards: `20px`
- Inline text: `14–16px`

---

## Specific rules — what NOT to do

- **No dark terminal backgrounds** on the landing page or dashboard. The product is not a hacker tool.
- **No badge pills in the hero** — no "Provider-agnostic · Built for Africa" type pills. Let the headline do the work.
- **No TEST MODE label in more than one place** — one mode toggle in the topbar is enough.
- **No section category labels** in the sidebar (DEVELOPER, BILLING etc.) unless there are 12+ nav items.
- **No gradients** anywhere — not on buttons, not on backgrounds, not on cards.
- **No drop shadows** on cards or modals. Use borders.
- **No excessive animation** — no auto-playing carousels, no looping animations that distract. Subtle hover transitions only (`transition: 0.15s ease`).
- **No ALL CAPS** except eyebrow labels and table headers.
- **No neon or glow effects** — we are not a crypto product.
- **No more than one primary (blue) CTA button** visible at a time per section.

---

## Africa motif

The Africa continent outline is Paye's signature visual element.

- Used as a large, very subtle background element in the hero section
- Color: `#2563EB` at `7–10% opacity`
- Position: right side of hero, vertically centered, partially cropped
- Never use it as a foreground illustration or make it prominent
- Never add a flag, text label, or annotation to it
- It should feel geographic and ambient, not decorative

---

## Voice and copy rules

- Write from the developer/builder's perspective, not the end user paying
- Active voice: "Route payments" not "Payments are routed"
- Specific over clever: "One API endpoint" not "Seamless integration experience"
- No filler words: "powerful", "seamless", "robust", "cutting-edge" are banned
- Numbers over adjectives: "2 providers, 1 API" not "multiple provider support"
- CTA buttons: verb-first, lowercase: "Start building free", "Read the docs", "View all"
