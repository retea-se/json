# JSON Toolbox

Local-first data conversion and JSON manipulation for developers.

```
Input → Transform → Output
  ↑        ↑         ↓
 CSV    Validate   TypeScript
 XML    Format     Schema
 YAML   Repair     Tree View
```

**No server. No telemetry. Deterministic output.**

---

## What It Does

Convert, validate, format, and transform JSON and related data formats. Everything runs in your browser. Nothing leaves your machine.

**Formats:** JSON, CSV, XML, YAML, CSS  
**Operations:** Convert, Format, Minify, Validate, Repair, Diff, Query, Transform  
**Output:** JSON, TypeScript interfaces, Go structs, Python dataclasses, JSON Schema, Tree view

---

## Capability Matrix

| Module | Input | Output | Notes |
|--------|-------|--------|-------|
| **CSV** | CSV, TSV | JSON | Column filter, transpose, delimiter auto-detect |
| | JSON | CSV | Array-of-objects to CSV |
| **XML** | XML | JSON | Preserves attributes, compact mode |
| | JSON | XML | Configurable output |
| **YAML** | YAML | JSON | Full YAML 1.2 support |
| | JSON | YAML | Flow style, custom indent |
| **CSS** | CSS | JSON | Rule-based parsing |
| **Format** | JSON | JSON | Beautify, minify, sort keys |
| **Validate** | JSON | Report | Syntax check, schema validation |
| **Repair** | Broken JSON | Valid JSON | Fixes trailing commas, single quotes, comments |
| **Diff** | 2× JSON | Diff view | Visual comparison, ignore order option |
| **Query** | JSON + JSONPath | JSON subset | Standard JSONPath expressions |
| **Schema** | JSON | JSON Schema | Draft-07 generation |
| **Transform** | JSON | TypeScript, Go, Python | Interfaces, structs, dataclasses, JSDoc |
| **Utilities** | String | String | Base64, URL encode/decode, escape |
| **Tree** | JSON | Tree view | Interactive expand/collapse |

---

## Why Local Execution?

| Concern | Server-based tools | JSON Toolbox |
|---------|-------------------|--------------|
| **Data privacy** | Data sent to third party | Data never leaves browser |
| **PII handling** | Compliance risk | No compliance burden |
| **Offline use** | Requires internet | Works offline after first load |
| **Speed** | Network latency | Instant |
| **Determinism** | Server may change | Same input = same output |
| **Enterprise use** | May violate policy | IT-friendly |

---

## Deterministic Developer Utility

JSON Toolbox follows the **Deterministic Developer Utility** pattern:

1. **Local execution** — No network calls during operation
2. **Deterministic output** — Same input always produces same output
3. **Zero onboarding** — Paste data, click convert
4. **No side effects** — Nothing installed, nothing persisted without consent
5. **Keyboard-first** — Full operation via shortcuts (press `?`)

This is a tool, not a service.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Show/hide shortcuts |
| `Ctrl+Enter` | Run current operation |
| `Ctrl+1-9` | Switch to tab 1-9 |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+Shift+C` | Copy output |
| `Escape` | Close modal |

---

## Policies

### Dependency Policy

**Allowed:** Capability libraries (local-only, deterministic, self-hosted)

Self-hosted in `/vendor/`:
- `papaparse.min.js` — CSV parsing (RFC 4180 compliant)
- `js-yaml.min.js` — YAML parsing (YAML 1.2)
- `jsonrepair.min.js` — Broken JSON repair
- `lucide.min.js` — Icon library

**Disallowed:** Frameworks, build systems, CDN dependencies, external services

### Local Execution Policy

- No network calls during tool operation
- No backend or cloud processing
- No telemetry (aggregate analytics only, opt-out available)
- All processing in browser JavaScript

### Privacy Policy

- Zero telemetry (no user tracking)
- Privacy-first analytics (aggregate usage only, cookieless, self-hosted, opt-out)
- Zero cookies (localStorage for preferences only)
- User data never transmitted to any server

### Accessibility Policy

- WCAG AA contrast compliance (≥4.5:1)
- Keyboard navigation for all functions
- ARIA labels on interactive elements
- Screen reader compatible

---

## Technical Details

| Metric | Value |
|--------|-------|
| Viewport | 1366×768, 1920×1080 (no scroll) |
| Languages | Swedish (sv), English (en) |
| Themes | Light, Dark |
| i18n Keys | 400+ |

### Architecture

```
tools/json/
├── index.php          Main page, i18n, structured data
├── lang.php           Translation strings (sv/en, 400+ keys)
├── script.js          Core orchestration, shortcuts, persistence
├── style.css          Design tokens, components
├── modules/           13 lazy-loaded capability modules
│   ├── csv.js, css.js, xml.js, yaml.js
│   ├── format.js, validate.js, fix.js
│   ├── diff.js, query.js, schema.js
│   └── transform.js, utilities.js, tree.js
└── vendor/            Self-hosted capability libraries
    ├── papaparse.min.js
    ├── jsonrepair.min.js
    ├── js-yaml.min.js
    └── lucide.min.js
```

---

## Related Tools

*Part of the mackan.eu developer utility suite:*

- [Password Generator](/tools/passwordgenerator/) — Cryptographically secure passwords
- [Image Converter](/tools/bildconverter/) — Local image format conversion
- [Coordinate Converter](/tools/koordinat/) — GPS coordinate transformation

---

## Version

**1.0.0** — Developer Ergonomics Pass V1

---

**URL:** https://mackan.eu/tools/json/
