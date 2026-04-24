---
name: ui-design-patterns
description: UI design patterns — color palette, spacing, components. Use when styling frontend.
---

# UI Design Quick Reference

## Spacing: multiples of 4px (4, 8, 12, 16, 24, 32, 48)

## Cards
```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}
.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-1px); }
```

## Buttons
```css
.btn { padding: 8px 16px; border-radius: 6px; font-weight: 500; border: none; cursor: pointer; }
.btn-primary { background: #4a6cf7; color: white; }
.btn-danger { background: #dc3545; color: white; }
```

## Accessible Modals
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Escape key to close
- Focus trap inside modal
- Return focus on close
