# JSON Toolbox - Developer Ergonomics & UX Layout Pass v1

**Date:** 2026-01-20  
**Branch:** feature/dev-ergo-layout-v1  
**Status:** Complete

---

## Objective

Upgrade JSON Toolbox from "good developer utility" to "pro-grade developer tool" with:
- Strong ergonomics and density
- Pipeline flow pattern
- Minimal chrome
- Clear affordance
- Full i18n
- Zero-onboarding usability

---

## Target Style Reference

- VSCode (status bar, command palette patterns)
- DataGrip (data grid density)
- Postman (request/response pipeline)
- JSON Crack (tree visualization)
- jq (CLI-style efficiency)

---

## Changes Implemented

### 1. Developer Ergonomics CSS

Added comprehensive CSS rules in `style.css`:

```css
/* DEVELOPER ERGONOMICS PASS v1 */
```

**Key Changes:**

| Element | Before | After |
|---------|--------|-------|
| Panel padding | 16px | 12px |
| Panel min-height | 350px | 280px |
| Section header (h2) | Visible | Hidden (redundant) |
| Content margin-top | 16px | 0 |
| Module gaps | 16px | 12px |
| Header padding | 8px 12px | 4px 12px |
| Title font size | 14px | 13px |

### 2. Pipeline Flow Layout System

Added `.jt-pipeline` grid system:

```
┌─────────────────┬─────────────────┐
│                 │    Options      │
│     Input       ├─────────────────┤
│                 │    Actions      │
├─────────────────┴─────────────────┤
│              Output               │
└───────────────────────────────────┘
```

CSS Classes:
- `.jt-pipeline` - Grid container
- `.jt-pipeline__input` - Input area
- `.jt-pipeline__options` - Options bar
- `.jt-pipeline__actions` - Action buttons
- `.jt-pipeline__output` - Output area

### 3. Compact Action Bar

New button hierarchy:

| Class | Purpose | Style |
|-------|---------|-------|
| `.jt-action-primary` | Main action (Convert) | Primary color, prominent |
| `.jt-action-secondary` | Secondary (Clear, Paste) | Ghost, subtle |
| `.jt-action-icon` | Icon-only (Copy) | Minimal, hover reveals |

### 4. Compact Options Row

`.jt-options-row` provides inline, dense option layouts:
- Horizontal flex layout
- Tighter spacing
- Smaller font sizes

### 5. Above-Fold Optimization

Media queries for viewport height:

```css
@media (max-height: 768px) {
  /* Constrain heights for 1366x768 */
}

@media (min-height: 900px) {
  /* Expand heights for larger displays */
}
```

### 6. Module Density Adjustments

Global selectors for module consistency:

- `[class*="-module__direction"]` - Compact toggles
- `[class*="-module__options"]` - Tighter option spacing
- `[class*="-module__actions"]` - Compact action rows
- `[class*="-module__textarea"]` - Constrained heights

---

## i18n Status

### Coverage
- All UI strings routed via `lang.php`
- All JavaScript uses `t(key, fallback)` pattern
- Swedish mode: 100% coverage
- English mode: Baseline complete

### Keys Added (This Pass)
- Direction toggles (CSV↔JSON, XML↔JSON, YAML↔JSON)
- Input/output labels for all modules
- Diff module options
- Transform select options

---

## Accessibility Maintained

- WCAG AA contrast preserved (≥4.5:1)
- Focus-visible rings on all interactive elements
- ARIA attributes on tabs, panels, buttons
- Keyboard navigation preserved
- Screen reader structure intact

---

## Theme Compatibility

Both light and dark themes tested:
- Light: Clean, professional appearance
- Dark: VSCode-inspired deep darks
- Status bar adapts to theme
- All new classes respect theme tokens

---

## Files Modified

1. `style.css` - Added ~300 lines for developer ergonomics
2. `lang.php` - Added translation keys (previous pass)
3. `index.php` - window.i18n extended (previous pass)
4. Module files - i18n updates (previous pass)

---

## Validation Checklist

### Above-Fold Test (Primary Workflow)

| Viewport | Pass? |
|----------|-------|
| 1366x768 | ✓ Primary workflow visible |
| 1920x1080 | ✓ Generous workspace |

### Language Test

| Language | Pass? |
|----------|-------|
| Swedish (default) | ✓ All labels translated |
| English (?lang=en) | ✓ Baseline complete |

### Theme Test

| Theme | Pass? |
|-------|-------|
| Light | ✓ Clean, professional |
| Dark | ✓ VSCode-inspired |

### Ergonomics Test

| Metric | Target | Result |
|--------|--------|--------|
| Time to first action | <10s | ✓ |
| Clicks to convert | ≤2 | ✓ |
| Tab discovery | Immediate | ✓ |
| Primary action visible | Always | ✓ |

---

## Known Limitations

1. **Module CSS Embedded**: Individual module styles are embedded in JS files, not extracted to central CSS
2. **No Service Worker**: Offline mode relies on browser cache, not PWA
3. **Pipeline Layout**: Not yet applied to all modules (opt-in)

---

## Suggested v2 Improvements

1. **Command Palette**: Ctrl+K quick actions (VSCode-style)
2. **Split Pane Mode**: Horizontal or vertical split for diff/compare
3. **Recent Files**: localStorage history of recent conversions
4. **Presets**: Save and recall frequently-used option combinations
5. **Batch Mode**: Convert multiple files at once
6. **Keyboard Hints**: Show shortcuts on hover
7. **Module CSS Extraction**: Move embedded styles to central file

---

## Commit Message

```
feat(json-toolbox): Developer Ergonomics & UX Layout Pass v1

- Add pipeline flow layout system (.jt-pipeline)
- Reduce chrome: hide redundant section headers
- Increase density: tighter padding, smaller heights
- Add compact action bar hierarchy
- Optimize for above-fold (1366x768 + 1920x1080)
- Complete i18n coverage (sv/en)
- Add viewport-responsive media queries

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

**Author:** Claude (Serena-assisted)  
**Reviewed:** Pending
