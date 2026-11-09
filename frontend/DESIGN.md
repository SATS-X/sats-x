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

- App pages use the sticky glass `Header` with horizontal navigation and a 1200px content column. Forms and settings narrow to 880–960px.
- Marketing and sign-in surfaces use `src/styles/marketing.module.css`.

## Motion

Entrance animations only translate. Content must stay visible if an animation is paused, so never start from `opacity: 0`.

## Brand

The SX monogram and the teal gradient are reserved for brand moments: the monogram, the hero phrase, and pipeline progress.
