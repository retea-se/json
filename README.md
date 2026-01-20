# JSON Toolbox

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/retea-se/json/releases/tag/v1.0.0)
[![Offline](https://img.shields.io/badge/offline-ready-brightgreen.svg)](#offline--air-gapped)
[![Local Only](https://img.shields.io/badge/execution-local--only-orange.svg)](#why-local-execution)

**Local-first JSON/CSV/YAML/XML conversion for developers. No server, no telemetry, deterministic output.**

```
Input → Transform → Output
  ↑        ↑         ↓
 CSV    Validate   TypeScript
 XML    Format     Schema
 YAML   Repair     Tree View
```

---

## Quick Start

**Use it in 10 seconds:**

1. Open [mackan.eu/tools/json](https://mackan.eu/tools/json/)
2. Paste your data
3. Click convert

No signup. No installation. Works offline after first load.

---

## Examples

### CSV → JSON

**Input:**
```csv
name,role,active
Alice,admin,true
Bob,user,false
```

**Output:**
```json
[
  {"name": "Alice", "role": "admin", "active": true},
  {"name": "Bob", "role": "user", "active": false}
]
```

### JSON → TypeScript

**Input:**
```json
{"id": 1, "name": "Product", "price": 29.99, "tags": ["sale"]}
```

**Output:**
```typescript
interface Root {
  id: number;
  name: string;
  price: number;
  tags: string[];
}
```

### Repair Broken JSON

**Input:**
```javascript
{name: 'Alice', active: true,}  // single quotes + trailing comma
```

**Output:**
```json
{"name": "Alice", "active": true}
```

---

## Capabilities

| Operation | Input | Output | Notes |
|-----------|-------|--------|-------|
| **CSV** | CSV, TSV | JSON | Auto-detect delimiter, transpose |
| | JSON | CSV | Array-of-objects export |
| **XML** | XML | JSON | Preserves attributes |
| | JSON | XML | Configurable output |
| **YAML** | YAML | JSON | YAML 1.2 compliant |
| | JSON | YAML | Flow/block style |
| **Format** | JSON | JSON | Beautify, minify, sort keys |
| **Validate** | JSON | Report | Syntax + schema validation |
| **Repair** | Broken JSON | Valid JSON | Trailing commas, quotes, comments |
| **Diff** | 2× JSON | Diff | Visual comparison |
| **Query** | JSON | Subset | JSONPath expressions |
| **Schema** | JSON | JSON Schema | Draft-07 |
| **Transform** | JSON | TS/Go/Python | Interfaces, structs, dataclasses |
| **Utilities** | String | String | Base64, URL encode, escape |
| **Tree** | JSON | Tree view | Interactive navigation |

---

## Why Local Execution?

| Concern | Server-based | JSON Toolbox |
|---------|--------------|--------------|
| Data privacy | Sent to third party | Never leaves browser |
| PII/PHI handling | Compliance risk | No compliance burden |
| Offline | Requires internet | Works offline |
| Speed | Network latency | Instant |
| Determinism | Server may change | Same input = same output |
| Enterprise | May violate policy | IT-approved friendly |

**When to use JSON Toolbox:**
- Converting production data exports with PII
- Working with API keys or credentials
- Processing proprietary business data
- Air-gapped or regulated environments
- Needing reproducible, auditable output

---

## Keyboard Shortcuts

Press `?` to view all shortcuts.

| Shortcut | Action |
|----------|--------|
| `?` | Show shortcuts |
| `Ctrl+Enter` | Run operation |
| `Ctrl+1-9` | Switch tabs |
| `Ctrl+Shift+C` | Copy output |

---

## Offline & Air-Gapped

JSON Toolbox works fully offline after initial page load.

**For air-gapped environments:**
1. Load page once with internet
2. All resources cached locally
3. Disconnect — tool continues working

**Disable analytics entirely:**
```html
<script>window.ANALYTICS_DISABLED = true;</script>
```

Or download this repo and self-host.

---

## FAQ

<details>
<summary><strong>Is my data sent anywhere?</strong></summary>

No. All processing happens in your browser. User data never leaves your machine.
</details>

<details>
<summary><strong>Can I use this with PII/PHI/sensitive data?</strong></summary>

Yes. JSON Toolbox is designed for regulated workloads. Data stays local, no compliance burden.
</details>

<details>
<summary><strong>What about analytics/telemetry?</strong></summary>

**Telemetry:** None. No user tracking, no identifiers, no fingerprinting.

**Analytics:** Optional aggregate usage stats (which tabs are used). Cookieless, self-hosted, respects DNT. Disable with `ANALYTICS_DISABLED = true`.
</details>

<details>
<summary><strong>Does it work offline?</strong></summary>

Yes. After first load, all features work without internet. No external dependencies at runtime.
</details>

<details>
<summary><strong>What dependencies does it use?</strong></summary>

Self-hosted only (no CDN):
- PapaParse — CSV parsing
- js-yaml — YAML parsing  
- jsonrepair — JSON fixing
- Lucide — Icons

No frameworks, no build systems, no external services.
</details>

<details>
<summary><strong>Can I self-host this?</strong></summary>

Yes. Clone this repo, serve statically. Set `ANALYTICS_DISABLED = true` for full air-gap.
</details>

---

## Philosophy

JSON Toolbox follows the **Deterministic Developer Utility** pattern:

1. **Local execution** — No network calls during operation
2. **Deterministic output** — Same input → same output, always
3. **Zero onboarding** — Paste, click, done
4. **No side effects** — Nothing installed without consent
5. **Keyboard-first** — Full operation via shortcuts

This is a tool, not a service.

---

## Policies

### Privacy
- Zero telemetry (no user tracking)
- Optional aggregate analytics (cookieless, self-hosted, opt-out)
- No cookies
- User data never transmitted

### Dependencies
- **Allowed:** Local-only capability libraries
- **Disallowed:** Frameworks, CDNs, external services

### Accessibility
- WCAG AA contrast (≥4.5:1)
- Full keyboard navigation
- Screen reader compatible

See [SECURITY.md](SECURITY.md) for full security model.

---

## Suite

JSON Toolbox is part of the **mackan.eu developer utility suite** — a collection of deterministic, privacy-first tools:

| Tool | Purpose | Status |
|------|---------|--------|
| **JSON Toolbox** | Data conversion & manipulation | v1.0.0 |
| Password Generator | Cryptographic passwords | Available |
| Image Converter | Local format conversion | Available |
| Coordinate Converter | GPS transformation | Available |

Suite philosophy: Local execution, zero telemetry, deterministic output.

---

## Project Structure

```
├── index.php          Main page
├── lang.php           i18n strings (sv/en)
├── script.js          Core logic, shortcuts
├── style.css          Design system
├── modules/           13 capability modules
│   ├── csv.js, xml.js, yaml.js, css.js
│   ├── format.js, validate.js, fix.js
│   ├── diff.js, query.js, schema.js
│   └── transform.js, utilities.js, tree.js
├── vendor/            Self-hosted libraries
├── docs/              QA reports, design docs
└── SECURITY.md        Security policy
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**TL;DR:** PRs welcome. No new dependencies. No telemetry. Preserve local-only execution.

---

## License

[MIT](LICENSE)

---

**Version:** 1.0.0  
**URL:** [mackan.eu/tools/json](https://mackan.eu/tools/json/)  
**Source:** [github.com/retea-se/json](https://github.com/retea-se/json)
