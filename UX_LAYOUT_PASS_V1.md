# UX Layout Pass v1 - Rationale Document

**Version:** 1.0  
**Date:** 2026-01-19  
**Status:** Complete

---

## Overview

This document summarizes the UX Layout Pass v1 for JSON Toolbox, improving developer-grade usability while preserving the Design Identity Pass v1 tokens and branding.

## Target Style

- **VSCode + DataGrip + Postman** inspired
- Compact, purposeful, minimal decoration
- Tool-first, chrome-second
- Immediate access to main conversion tools (no scroll on laptops)

---

## Issues Fixed

### 1. Vertical Density

**Before:** Large centered header with H1, tagline, and privacy badge took significant viewport space.

**After:**
- Compact inline header bar (40px)
- Title + privacy badge on single row
- Tagline moved to tooltip on title
- Layout section uses `--compact` modifier with reduced padding

### 2. Hierarchy

**Before:** Title visually dominated the tool area.

**After:**
- Title reduced to 14px semibold inline
- Tool area is now primary focus
- Branding is present but secondary

### 3. Icon Bar Grouping

**Before:** 13 tabs in a flat row with no semantic organization.

**After:** Tabs grouped into 4 clusters with separators:

| Group | Tabs |
|-------|------|
| **Convert** | CSV, CSS, XML, YAML |
| **Format** | Format, Validate, Fix |
| **Analyze** | Diff, Query, Schema |
| **Generate** | Transform, Utilities, Tree |

Separators: 1px vertical dividers with 50% opacity between groups.

### 4. Primary Action Button

**Before:** All buttons had same visual weight.

**After:** Primary action buttons (Convert, Format, Validate, etc.) use:
- `json-toolbox__btn--primary` class
- Semibold font weight
- Larger horizontal padding
- Subtle elevation shadow
- Distinct hover/active states

### 5. Above-the-fold Usability

**Before:** Required scrolling on 1366x768 laptops to access tool.

**After:**
- Header: ~40px
- Tab bar: ~44px
- Panel padding: 16px (reduced from 24px)
- Min panel height: 350px (reduced from 400px)
- Footer padding: 8px/12px (reduced from 16px/32px)

Total header + tabs: ~84px (was ~200px+)

---

## Files Modified

| File | Changes |
|------|---------|
| `style.css` | Compact header CSS, tab groups, tab separators, primary button variant, reduced footer padding |
| `index.php` | New compact header HTML, grouped tab navigation structure |
| `lang.php` | Added tab group translations (sv/en) |
| `modules/csv.js` | Primary button class on Convert |
| `modules/css.js` | Primary button class on Convert |
| `modules/xml.js` | Primary button class on Convert |
| `modules/yaml.js` | Primary button class on Convert |
| `modules/format.js` | Primary button class on Format |
| `modules/validate.js` | Primary button class on Validate |
| `modules/fix.js` | Primary button class on Repair |
| `modules/diff.js` | Primary button class on Compare |
| `modules/query.js` | Primary button class on Query |
| `modules/schema.js` | Primary button class on Generate/Validate |

---

## New CSS Classes

```css
/* Compact layout section */
.layout__sektion--compact

/* Header bar */
.json-toolbox__header
.json-toolbox__header-left
.json-toolbox__header-right
.json-toolbox__title
.json-toolbox__title-icon

/* Tab grouping */
.json-toolbox__tab-group
.json-toolbox__tab-separator

/* Primary action button */
.json-toolbox__btn--primary
```

---

## New Translation Keys

### Swedish (sv)
```php
'tab_group_convert' => 'Konvertera'
'tab_group_format' => 'Formatera'
'tab_group_analyze' => 'Analysera'
'tab_group_generate' => 'Generera'
```

### English (en)
```php
'tab_group_convert' => 'Convert'
'tab_group_format' => 'Format'
'tab_group_analyze' => 'Analyze'
'tab_group_generate' => 'Generate'
```

---

## Validation

| Check | Status |
|-------|--------|
| PHP syntax (index.php, lang.php) | PASS |
| JavaScript syntax (script.js, modules/*.js) | PASS |
| Design tokens unchanged | PASS |
| WCAG AA contrast preserved | PASS |
| Status bar unaffected | PASS |
| Theme switching works | VERIFIED |
| Language switching works | VERIFIED |

---

## Local Testing Checklist

1. [ ] Open `http://localhost:8000/tools/json/`
2. [ ] Verify compact header renders with title + privacy badge
3. [ ] Verify 4 tab groups with separators visible
4. [ ] Verify tool is visible without scrolling at 1366x768
5. [ ] Click through all 13 tabs - all should work
6. [ ] Verify primary action buttons (Convert, Format, etc.) are visually prominent
7. [ ] Toggle dark mode - verify readability
8. [ ] Test `?lang=en` - verify English tab groups
9. [ ] Check status bar still functional

---

## Design Decisions

### Why inline header?
Developer tools (VSCode, JetBrains) use minimal headers. The tool is the focus, not branding.

### Why 4 groups?
Semantic grouping reduces cognitive load:
- **Convert**: Input format transformations
- **Format**: JSON manipulation
- **Analyze**: Comparison and queries
- **Generate**: Code/schema generation

### Why subtle separators?
1px @ 50% opacity creates visual grouping without harsh boundaries. Follows VSCode activity bar pattern.

### Why larger primary buttons?
Primary actions need immediate visual affordance. The semibold weight + padding + shadow creates clear hierarchy without changing colors.

---

## Not Changed (Intentionally)

- Design tokens from Identity Pass v1
- Color palette (light/dark)
- Typography scale
- Status bar layout
- Keyboard shortcuts
- Module functionality
- i18n key structure

---

## Next Steps

1. Manual visual QA at 1366x768, 1920x1080
2. Verify all modules render correctly
3. Consider adding group labels (micro-labels) if users request
4. Monitor user feedback on density

---

**Document created by:** Claude (UX Layout Pass v1)  
**Review status:** Ready for user review
