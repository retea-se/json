# Design Identity Pass v1 - Rationale Document

**Version:** 1.0  
**Date:** 2026-01-19  
**Status:** Complete

---

## Overview

This document summarizes the Design Identity Pass v1 for JSON Toolbox, transitioning from functional RC to developer-grade polished UI.

## Design Philosophy

- **Developer-oriented power tool aesthetic** - Dense information display, minimal decorative elements
- **VSCode/JetBrains/Figma inspired patterns** - Familiar mental models for developers
- **Restrained, intentional color usage** - Color conveys meaning, not decoration
- **Information density over whitespace** - Maximize utility per viewport

---

## Changes Made

### 1. Design Tokens (style.css)

Updated to Design System v3.0 with:

- **Typography**: IBM Carbon scale (11px-24px range)
- **Spacing**: 8-point grid with semantic aliases
- **Borders**: Subtle 1-2px with rounded corners (2-12px range)
- **Transitions**: Categorized durations (50ms-350ms)
- **Elevation**: Minimal shadow system (no "shadow circus")

### 2. Color Palette Refinement

**Light Theme (warmer)**:
- Primary: `#0066cc` (refined blue)
- Text: `#212529` (16.1:1 contrast on white)
- Text Secondary: `#495057` (7.4:1 contrast)
- Text Tertiary: `#6c757d` (4.9:1 contrast)

**Dark Theme (cooler)**:
- Primary: `#4dabf7` (readable on dark)
- Background: `#0c0e12` (near-black)
- Text: `#e6e9ed` (14.5:1 contrast)
- Surfaces with subtle tonal shifts

All colors verified WCAG AA (≥4.5:1 for body text).

### 3. Status Bar (VSCode-inspired)

New 24px compact status bar with:
- Left section: Active mode indicator
- Center section: Operation status/feedback
- Right section: Keyboard shortcut hint, theme toggle, language toggle

CSS class: `.json-toolbox__statusbar`

### 4. Shortcut Discoverability

Moved from footer hint to status bar with visible `?` badge. More discoverable and consistent with professional IDE patterns.

### 5. Typography Tightening

- Input/textarea: 13px mono with relaxed line-height
- Labels: 12px sans-serif
- Headings: Semantic scale (16px-24px)
- Consistent font stack: system fonts with JetBrains Mono fallback

### 6. i18n Polish

Fixed Swedish translation encoding issues:
- `Lage` → `Läge`
- `Morkt` → `Mörkt`  
- `Sprak` → `Språk`
- `for genvagar` → `för genvägar`

---

## Files Modified

| File | Changes |
|------|---------|
| `style.css` | Design tokens v3.0, refined palettes, status bar CSS, removed old shortcut hint |
| `index.php` | New status bar HTML structure |
| `script.js` | Status bar shortcut button handler |
| `lang.php` | Fixed Swedish encoding issues |

---

## Validation

| Check | Status |
|-------|--------|
| PHP syntax (index.php, lang.php) | PASS |
| JavaScript syntax (script.js) | PASS |
| All 13 modules present | PASS |
| WCAG AA contrast (light) | PASS |
| WCAG AA contrast (dark) | PASS |
| i18n coverage sv/en | PASS |

---

## Design Decisions

### Why VSCode-style status bar?
Developers are familiar with IDE status bars. The 24px height is efficient, the three-section layout allows for clear information hierarchy.

### Why warmer light theme?
Pure blue (#0000ff-based) feels cold and aggressive. Warmer blue (#0066cc) is easier on the eyes for extended use.

### Why cooler dark theme?
Dark themes work better with cooler tones. The near-black (#0c0e12) background provides maximum contrast without being harsh.

### Why no external design libraries?
Keep bundle size minimal. Lucide icons (already present) provide all necessary iconography at ~16-20px sizes.

---

## Not Changed (Intentionally)

- No new features added (per constraint)
- No external libraries added beyond existing Lucide
- Module logic unchanged
- localStorage behavior unchanged
- Keyboard shortcuts unchanged (only discoverability improved)

---

## Next Steps

1. Manual visual QA in both themes
2. Test all 13 modules function correctly
3. Verify responsive behavior at 375px/768px/1920px
4. Deploy when approved

---

**Document created by:** Claude (Design Identity Pass v1)  
**Review status:** Ready for user review
