# Squarespace Embed — Palette & Type Guide

Design tokens for the schedule/map embed (`embed/schedule.html`), matching
the live `maplewoodporchfest.com` site.

Status: **live** — this is what's actually implemented in
`embed/schedule.html`, not a draft.

## History: two corrections to get here

1. **First pass** worked from colors reverse-engineered out of the site's
   CSS custom properties (`--accent-hsl` etc.), landing on a soft amber
   (`#fea30b`) as the primary accent, plus a plum/magenta secondary color
   that turned out not to exist on the real site at all.
2. **Second pass**: the user supplied the real 8-color brand list —
   `#fea30b #000000 #95833D #e7e7e8 #fafafa #ffffff #FF5D00 #EEEEEF` — which
   we constrained the embed to, still treating amber as primary.
3. **Third pass (current)**: the user sent screenshots of all six real
   pages (Home, Participate, Schedule, About, Photos, Contact). The actual
   visual hierarchy is different from both earlier passes:
   - **Purple is the dominant color** — logo wordmark + guitar soundhole
     (every page, above the fold), the "Porchfest 2026" heading, and the
     solid-fill primary buttons ("🏡 Hilton Porch Signup", "🎤 Performer
     Signup") are all purple.
   - **Vibrant orange (`#ff5d00`) is a real second color**, not a single
     rare accent — a full-width band under the nav on the homepage.
   - **Soft amber (`#fea30b`) is barely visible anywhere** on the real
     site despite being the most-referenced color name in their CSS — it's
     the site's default `--accent-hsl` token, but the actual buttons/
     headings were evidently customized to other swatches instead.
   - **Background is pure white** (`#ffffff`), not the off-white we'd used.

   Purple isn't in the original 8-color list, but the site's own CSS
   custom property `--darkAccent-hsl` resolves to `#93358d` — and that's
   almost certainly what the list's `#95833D` entry was meant to be: the
   two hexes are anagrams of each other (same six characters: 9,3,3,5,8,D),
   no olive-gold color appears in any of the six screenshots, and
   `#93358d` independently matches the site's own CSS. Treating it as a
   **digit-transposition typo**, not a 9th color, the corrected palette is:

   | Hex | Color |
   |---|---|
   | `#fea30b` | soft amber *(defined in the palette, unused in the embed — see below)* |
   | `#000000` | black |
   | `#93358d` | purple *(corrected from the typo'd `#95833D`)* |
   | `#e7e7e8` | light gray |
   | `#fafafa` | off-white *(unused in the embed — see below)* |
   | `#ffffff` | white |
   | `#ff5d00` | vibrant orange |
   | `#eeeeef` | pale gray |

## The two-color split

Amber is dropped entirely (barely visible on the real site; kept out of
the embed to match). What's left is two real accent hues with a clean
semantic split:

- **Purple = interactive/active state** — "what you're doing right now."
- **Orange = the recurring structural/identity motif** — appears in
  multiple places on purpose, so it reads as core rather than incidental
  (this was an explicit correction: an earlier version used it in exactly
  one spot, which wasn't enough).

## Embed tokens (`.pf-embed` custom properties in `embed/schedule.html`)

| Token | Color | Hex | Usage |
|---|---|---|---|
| `--pf-bg` | white | `#ffffff` | Page background |
| `--pf-surface` | white | `#ffffff` | Card/dropdown/button backgrounds |
| `--pf-surface-2` | pale gray | `#eeeeef` | Secondary surface — inactive pill fill, hover states |
| `--pf-border` | light gray | `#e7e7e8` | Card/pill/divider borders — also their own documented site accent color |
| `--pf-text` | black | `#000000` | Primary text |
| `--pf-text-muted` | black, 62% opacity | `rgba(0,0,0,.62)` | Labels, addresses, meta — opacity tint, no mid-gray exists in the palette |
| `--pf-text-faint` | black, 42% opacity | `rgba(0,0,0,.42)` | Faintest captions (map note, time separator) |
| `--pf-primary` | purple | `#93358d` | Active pills, active view toggle, filter-select focus ring, filter-pill hover border, time-slot rule, highlighted-card border |
| `--pf-primary-contrast` | white | `#ffffff` | Text on purple fills — white, not black, since purple is dark/saturated enough to need it |
| `--pf-primary-soft` | purple, 35% opacity | `rgba(147,53,141,.35)` | Highlighted-card glow shadow |
| `--pf-cta` | vibrant orange | `#ff5d00` | Map markers (all ~40 pins), porch-number badges in By Porch view, the accent bar, the Honk Parade card border + pill, the mobile "Show Map" button |
| `--pf-cta-contrast` | black | `#000000` | Text/numbers on orange fills |
| `--pf-cta-soft` | orange, 14% opacity | `rgba(255,93,0,.14)` | Honk Parade pill background |

Map marker **hover** state uses `--pf-primary`/`--pf-primary-contrast`
(not orange) — resting state is the identity color (orange), hover is the
interactive-feedback color (purple), keeping the semantic split consistent
between markers and every other interactive element.

No dark-mode variant — the embed is a fixed light-theme widget sitting on
a light Squarespace page, not a standalone theme-aware surface.

## The accent bar

A new `.pf-accent-bar` element — a solid orange 8px band between the
filter bar and the schedule layout — is a simplified nod to the real
homepage's full-width solid-color band directly under the nav. It's not a
pixel-exact recreation: no full-bleed/negative-margin trick against the
widget's own rounded corners, just a simple inset bar. Exists specifically
to give orange a second, unmissable presence beyond the map markers and
the mobile CTA button, since "one button" wasn't enough for a color this
central to the real site.

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
