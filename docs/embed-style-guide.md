# Squarespace Embed — Palette & Type Draft

Design tokens for the schedule/map embed, benchmarked against the live
`maplewoodporchfest.com` site so the embed doesn't look out of place next to
it. Visual version (swatches + type specimens + component mockup):
https://claude.ai/code/artifact/fb71d6ba-b873-4b53-8309-f53dae463e5e

Status: **draft only** — not yet wired into `site/src/pages/schedule.astro`
or a standalone embed page.

## Source comparison

**maplewoodporchfest.com** (from their live `site.css` custom properties —
this is their whole accent system, no per-section overrides):
- `#FEA30B` — accent
- `#93358D` — dark accent
- `#E7E7E8` — light accent
- black / white base
- Typography: **Kepler Std** (licensed Adobe/Typekit serif) for both
  headings and body — one warm editorial serif carrying the whole page.
  Nav chrome falls back to `'Clarkson', Helvetica Neue, Arial, sans-serif`
  in a couple spots.

**Current Astro demo** (`site/src/styles/global.css`):
- `#2C5F2E` — green
- `#C8922A` — gold
- `#FAF6EE` — cream
- `#1C1A17` — charcoal
- Typography: `Fraunces` (display) + `DM Sans` (body)

## Proposed embed tokens

| Token | Hex | Source | Usage |
|---|---|---|---|
| `--amber` | `#E8930D` | tuned from their `#FEA30B` | Primary accent — active filter pills, active view toggle, primary buttons |
| `--plum` | `#8C3684` | close to their `#93358D` | Secondary accent, spent in one place — Honk Parade card + pill |
| `--green` | `#2C5F2E` | unchanged, ours | Demoted to map markers / porch wayfinding only — no longer the UI's primary color |
| `--bg` (cream) | `#FAF6EE` | unchanged, ours | Page ground. Warmer than their `#E7E7E8`, close enough in value not to clash |
| `--text` (charcoal) | `#1C1A17` | unchanged, ours | Body text — both sites already default near-black |
| `--text-muted` (gray) | `#5A5550` | unchanged, ours | Secondary text — addresses, meta, captions |

Dark-mode equivalents are defined in the artifact's `:root` /
`prefers-color-scheme` blocks if this ever needs to render outside a fixed
light iframe.

## Typography

Their site can't be matched exactly — Kepler Std is a paid Adobe Fonts
license we don't have inside a page pasted as raw embed code. The pairing
below borrows their instinct (one warm editorial serif carrying content)
with free faces, and keeps a plain sans for small interactive chrome where
a serif would hurt legibility:

| Role | Face | Used for |
|---|---|---|
| Display | Fraunces 600 | Headings |
| Body | Source Serif 4 | Act descriptions, longer copy |
| UI | DM Sans | Filter pills, buttons, time labels, view toggle |

## Next step

Apply these tokens to `schedule.astro` (or the standalone embed page once
it's split out) and confirm the mockup holds up in the real component,
not just the draft's simplified re-creation of it.
