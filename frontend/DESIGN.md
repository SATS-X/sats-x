# SATS X design system

The interface follows the ArchFlow visual language and carries the SATS X identity. Tokens live in `src/index.css` and `tailwind.config.js`, and shared components live in `src/components/ui`.

## Foundations

- **Color:** cool neutral surfaces with one teal signal (`accent`). Status colors (`present`, `late`, `absent`) appear only in chips and measurements. Light and dark themes share token names through `data-theme`.
- **Type:** Geist for interface text and Geist Mono for IDs, times, and measurements (`.font-data`). Headings use tight tracking, and `-0.04em` is the limit.
- **Radius:** `rounded-lg` for controls, `rounded-card` for panels, and `rounded-2xl` for modals and large surfaces.
- **Depth:** panels use `shadow-panel`. Floating menus and modals use `shadow-elevated`.

## Components

- **Primary action:** inverted ink (`bg-text text-bg`), never the brand gradient. Use one per region.
- **Page header:** `PageHeader` with a mono eyebrow, title, description, and right-aligned actions.
- **Lists:** repeated records are full-width row cards or a `Table`, not a grid of equal tiles. Face records are the exception because the photo is the content.
- **Filters:** `Segmented` for a short fixed set, and `Select` for data-driven options.
- **Status:** `StatusChip` is a full pill with a dot. Do not use colored side borders.
- **Forms:** `Field` provides the mono label, and `.control` provides the input styling.

## Layout

- App pages use the left `Sidebar`: navigation grouped by task (Overview, Attendance, Academic, Recognition), collapsible to an icon rail on desktop and a drawer below `lg`. Content sits in a 1200px column. Forms and settings narrow to 880–960px.
- The exhibition kiosk (`/kiosk`) is the one full-screen surface: dark, camera fills the screen, large touch targets, and its own Vietnamese/English copy.
- Marketing and sign-in surfaces use `src/styles/marketing.module.css`.

## Signature surfaces

- **Canvas band:** `.canvas-band` adds a fine grid and teal light to the one main block on a page, such as the session hero. Use it once per page, not on every card.
- **Roll sheet:** the Live page treats the session roster as the page. A mono ink stamp (`On time`, `Late`, `Absent`) marks each arrival, and pending rows stay quiet.
- **Status lamp:** a pulsing `animate-lamp` dot means a camera is online. Reserve it for live hardware state.

## Camera

- `useCamera` and `CameraView` own every webcam surface. The preview is mirrored, and captured frames are mirrored too, so a saved photo looks exactly like the preview and face boxes need no flipping.
- Camera errors explain the fix in plain words (permission, no device, busy, insecure origin).

## Motion

Entrance animations only translate. Content must stay visible if an animation is paused, so never start from `opacity: 0`. The arrival stamp and row highlight run only when a student actually arrives, never on a data refresh.

## Brand

The SX monogram and the teal gradient are reserved for brand moments: the monogram, the hero phrase, and pipeline progress.
