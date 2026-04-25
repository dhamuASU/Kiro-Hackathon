---
name: ui-design-patterns
description: UI design patterns — color palette, spacing, components. Use when styling frontend.
---

# UI Design Quick Reference

## DermaDecode Color Palette
```css
:root {
  --navy:       #28396C; /* rgb(40, 57, 108)   — primary, headers, buttons */
  --sage:       #B5E18B; /* rgb(181, 225, 139)  — safe/good indicators */
  --mint:       #F0FFC2; /* rgb(240, 255, 194)  — page background, highlights */
  --cream:      #EAE6BC; /* rgb(234, 230, 188)  — cards, secondary surfaces */

  /* Semantic aliases */
  --color-primary:    var(--navy);
  --color-safe:       var(--sage);
  --color-bg:         var(--mint);
  --color-bg-card:    var(--cream);
  --color-text:       var(--navy);

  /* Score gauge colors */
  --score-safe:       #B5E18B; /* 8-10 — safe */
  --score-moderate:   #fbca04; /* 5-7  — moderate */
  --score-concerning: #f97316; /* 3-4  — concerning */
  --score-danger:     #dc2626; /* 1-2  — dangerous */
}
```

## Usage Guide
- **Navy `#28396C`** — primary buttons, headings, nav bar, links
- **Sage `#B5E18B`** — safe score indicators, success states, swap suggestion cards
- **Mint `#F0FFC2`** — page background, highlight sections
- **Cream `#EAE6BC`** — card backgrounds, input fields, secondary surfaces

## Spacing: multiples of 4px (4, 8, 12, 16, 24, 32, 48)

## Cards
```css
.card {
  background: var(--cream);
  border: 1px solid var(--navy);
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(40,57,108,0.08);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}
.card:hover { box-shadow: 0 4px 12px rgba(40,57,108,0.15); transform: translateY(-1px); }
```

## Buttons
```css
.btn { padding: 8px 16px; border-radius: 6px; font-weight: 500; border: none; cursor: pointer; }
.btn-primary { background: #28396C; color: #F0FFC2; }
.btn-safe    { background: #B5E18B; color: #28396C; }
.btn-danger  { background: #dc2626; color: white; }
```

## Accessible Modals
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Escape key to close
- Focus trap inside modal
- Return focus on close
