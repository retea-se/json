# JSON Toolbox

Status: Active • Repo: retea-se/json • Type: Tool (frontend, static)

Local-first data conversion and JSON manipulation for developers.

```
Input → Transform → Output
  ↑        ↑         ↓
 CSV    Validate   TypeScript
 XML    Format     Schema
 YAML   Repair     Tree View
```

**No server. Zero telemetry by default. Deterministic output.**

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
| **Pipeline** | Any | Any | Chain operators, visual builder, manifest export |

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
| `Ctrl+K` | Clear inputs |
| `Ctrl+Shift+V` | Smart paste (auto-format) |
| `Ctrl+Shift+C` | Copy output |
| `Ctrl+1-9` | Switch to tab 1-9 |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Escape` | Close modal |

---

## Cross-Module Workflow

Data can flow seamlessly between modules using **Send to...** buttons:

```
CSV → Parse → JSON → Validate → Schema → TypeScript
         ↓
    Transform → YAML/XML
         ↓
    Pipeline (chain operations)
```

Each module output includes a "Send to..." dropdown to forward data to compatible modules.

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
- Zero telemetry by default (analytics opt-in only)
- All processing in browser JavaScript
- Compliance mode available for enterprise environments

### Privacy Policy

- Zero telemetry by default (analytics OFF unless explicitly enabled)
- Privacy-first analytics available (aggregate only, cookieless, self-hosted)
- Zero cookies (localStorage for preferences only, disabled in compliance mode)
- User data never transmitted to any server
- Compliance mode: zero network calls, no persistent storage

### Compliance Mode

For enterprise and air-gapped environments:

```javascript
// Activate via URL parameter
?compliance=1

// Or environment variable
JSON_TOOLBOX_COMPLIANCE=true
```

**Zero-telemetry build:** Use `index-zero-telemetry.php` for deployments where even analytics code must be absent.

See `COMPLIANCE.md` for full documentation.

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
├── modules/           16 lazy-loaded capability modules
│   ├── csv.js, css.js, xml.js, yaml.js
│   ├── format.js, validate.js, fix.js
│   ├── diff.js, query.js, schema.js
│   ├── transform.js, utilities.js, tree.js
│   ├── pipeline.js    Visual pipeline builder + engine
│   ├── handoff.js     Cross-module data transfer
│   └── hints.js       Contextual tips and workflows
├── operators/         Pipeline operator registry
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

## CLI (jsontb)

A standalone command-line interface with full browser parity.

### Quick Start

```bash
# Download bundle
curl -O https://mackan.eu/tools/json/cli/dist/jsontb.js

# Format JSON
echo '{"a":1,"b":2}' | node jsontb.js exec json.format

# Convert CSV to JSON
cat data.csv | node jsontb.js exec csv.parse --header true

# Run a pipeline
node jsontb.js run pipeline.json < input.json > output.json

# List all operators
node jsontb.js list-operators
```

### Features

- **42 operators** across 9 namespaces
- **Zero dependencies** - single self-contained bundle
- **Offline capable** - no network access required
- **Cross-platform** - Node.js, Deno, or Bun
- **Deterministic** - identical output to browser version

### Presets

Pre-built pipelines for common workflows:

```bash
node jsontb.js run presets/csv-to-json.json < data.csv
node jsontb.js run presets/data-cleanup.json < messy.json
node jsontb.js run presets/generate-schema.json < sample.json
```

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Pipeline/operator error |
| 2 | Invalid manifest |
| 3 | Invalid input |
| 4 | Timeout |

See `cli/README.md` for full documentation.

---

## Version

**2.0.0** — Pipeline Foundation + CLI Parity
- Analytics default-off (opt-in only)
- Compliance mode for enterprise environments
- Zero-telemetry build variant
- StorageAdapter with compliance-aware behavior

**1.3.0** — Cross-Module Handoff
- "Send to..." dropdown on all modules
- Seamless data transfer between modules
- Workflow chaining without copy/paste

**1.2.0** — Developer Showcase
- Contextual hints panel with tips and workflows
- Sample datasets ("Load sample" button) per module
- Smart paste with auto-detection (Ctrl+Shift+V)
- Clear inputs shortcut (Ctrl+K)

**1.1.0** — Pipeline Engine
- Visual pipeline builder
- 31 operators (csv, json, transform, xml, yaml)
- Manifest export (JSON/YAML)
- Execution metrics and logging

**1.0.0** — Developer Ergonomics Pass V1

---

**URL:** https://mackan.eu/tools/json/
