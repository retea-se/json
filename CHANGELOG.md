# Changelog

All notable changes to JSON Toolbox are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-01-23

### Added

- **jsontb CLI** - Standalone command-line interface with full browser parity
  - 42 operators across 9 namespaces
  - Zero-dependency bundle (113 KB)
  - Cross-platform: Node.js, Deno, Bun
  - STDIN/STDOUT pipeline execution
  - Exit codes for scripting

- **Pipeline Engine**
  - Visual pipeline builder in browser
  - JSON manifest format for pipelines
  - Deterministic execution engine
  - Step-by-step result inspection

- **New Operators**
  - `diff.compare`, `diff.patch` - JSON comparison
  - `fix.repair`, `fix.repairDetailed`, `fix.format` - Broken JSON repair
  - `schema.generate`, `schema.validate` - JSON Schema support
  - `query.jsonpath`, `query.select`, `query.get` - Data querying

- **Presets**
  - csv-to-json, json-to-yaml, xml-to-json
  - data-cleanup, generate-schema, api-response-transform

- **Trust & Compliance**
  - Analytics default-off (opt-in only)
  - Compliance mode for enterprise
  - Zero-telemetry build variant
  - COMPLIANCE.md documentation

- **Documentation**
  - CLI.md - Complete CLI reference
  - PIPELINE.md - Pipeline engine guide
  - OPERATORS.md - All 42 operators documented
  - EXAMPLES.md - Real-world workflows
  - ROADMAP.md - Future plans

### Changed

- Operator registry is now central (shared between browser and CLI)
- Self-hosted dependencies (no CDN in default build)
- Improved error messages with operator context

### Fixed

- Dark mode contrast issues
- i18n consistency across modules

---

## [1.3.0] - 2026-01-23

### Added

- **Cross-Module Handoff**
  - "Send to..." dropdown on all modules
  - Seamless data transfer between tools
  - Workflow chaining without copy/paste

---

## [1.2.0] - 2026-01-22

### Added

- **Contextual Hints** - Tips panel with example workflows
- **Sample Data** - "Load sample" button per module
- **Smart Paste** (Ctrl+Shift+V) - Auto-detect format
- **Clear Inputs** (Ctrl+K) - Quick reset shortcut

---

## [1.1.0] - 2026-01-21

### Added

- **Pipeline Tab** - Visual pipeline builder
- **31 Operators** - csv, json, transform, xml, yaml namespaces
- **Manifest Export** - JSON/YAML format
- **Execution Metrics** - Timing and logging

---

## [1.0.0] - 2026-01-19

### Added

- **13 Modules** - CSV, CSS, XML, YAML, Format, Validate, Fix, Diff, Query, Schema, Transform, Utilities, Tree
- **i18n** - Swedish and English (400+ keys)
- **Themes** - Dark and Light with WCAG AA compliance
- **Keyboard Shortcuts** - Full keyboard operation (press ?)
- **Status Bar** - Mode, theme, language indicators
- **LocalStorage** - Persistent state
- **Drag & Drop** - File input support
- **Deep Linking** - Hash-based tab navigation

---

## [0.x.x] - Pre-release

Initial development and prototype versions.
