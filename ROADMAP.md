# Roadmap

JSON Toolbox development roadmap and planned features.

---

## Current: v2.0.0 (Released)

**Theme:** Pipeline Foundation + CLI Parity

### Delivered

- **Pipeline Engine** - Visual builder, manifest format, 42 operators
- **jsontb CLI** - Zero-dependency bundle with full browser parity
- **Trust Repair** - Analytics default-off, compliance mode, zero-telemetry build
- **Operator Registry** - Central registry for all operators
- **Browser-CLI Parity** - Byte-identical output verified
- **Presets** - 6 pre-built pipeline manifests
- **Documentation** - CLI.md, PIPELINE.md, OPERATORS.md, EXAMPLES.md

---

## Next: v2.1.0 (Planned)

**Theme:** Log Processing + Developer Experience

### Core Features

#### NDJSON Support
- [ ] `ndjson.parse` - Parse newline-delimited JSON
- [ ] `ndjson.stringify` - Output as NDJSON
- [ ] Streaming support for large log files

#### Aggregation Operators
- [ ] `transform.sum` - Sum numeric values
- [ ] `transform.avg` - Calculate average
- [ ] `transform.min` / `transform.max` - Find extremes
- [ ] `transform.stats` - Basic statistics

#### Step Parameter Editing UI
- [ ] Edit operator params visually in pipeline builder
- [ ] Parameter validation and hints
- [ ] Default value indicators

### Documentation

- [ ] Interactive operator reference
- [ ] "Try it" buttons in docs
- [ ] Video tutorials

### Developer Experience

- [ ] Examples gallery (20+ examples with "Load" button)
- [ ] Improved error messages with suggestions
- [ ] Auto-complete for JSONPath expressions

---

## v2.2.0 (Planned)

**Theme:** Sharing + Distribution

### Core Features

#### Pipeline Library
- [ ] Curated library of community pipelines
- [ ] Import pipeline by URL
- [ ] Rate and review pipelines

#### Shareable URLs
- [ ] Encode pipeline + input in URL
- [ ] Short URL generation
- [ ] QR code export

#### npm Package
- [ ] `npm install -g json-toolbox-cli`
- [ ] `npx jsontb` support
- [ ] TypeScript type definitions

### UI Improvements

- [ ] Preset picker in UI
- [ ] Recent pipelines list
- [ ] Pipeline templates gallery

### Integration

- [ ] GitHub Action for CI/CD
- [ ] Pre-commit hook support

---

## v2.3.0 (Planned)

**Theme:** Enterprise + Ecosystem

### Core Features

#### Export Formats
- [ ] Export pipeline results as HTML report
- [ ] PDF export (via browser print)
- [ ] Markdown export

#### HAR Support
- [ ] `har.parse` - Parse HTTP Archive files
- [ ] `har.filter` - Filter requests by URL/status
- [ ] `har.extract` - Extract response bodies

#### VS Code Extension
- [ ] Run pipelines from editor
- [ ] JSONPath IntelliSense
- [ ] Pipeline manifest validation

### Enterprise Features

- [ ] Audit logging (compliance mode)
- [ ] Custom operator registration
- [ ] Team pipeline sharing

---

## Future Considerations

### v3.0 Ideas

- **Branching Pipelines** - Multiple output paths
- **Conditionals** - If/else in pipelines
- **Variables** - Named intermediate results
- **Loops** - Iterate over collections
- **External Data** - Fetch from URLs (opt-in)

### Platform Expansion

- **Desktop App** - Electron wrapper
- **Mobile** - PWA improvements
- **Cloud Sync** - Optional pipeline storage

### Language Support

- **Plugins** - Custom operator development
- **Wasm Operators** - High-performance transforms
- **Python SDK** - Use operators from Python

---

## Versioning Policy

| Version | Scope |
|---------|-------|
| Patch (x.x.1) | Bug fixes, docs |
| Minor (x.1.0) | New operators, features |
| Major (1.0.0) | Breaking changes |

### Deprecation Policy

1. Feature marked deprecated in release notes
2. Deprecated warning for 2 minor versions
3. Removed in next major version

### Compatibility

- CLI manifests: Forward compatible
- Browser pipelines: Exportable to CLI
- Operators: Stable parameters

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose features.

### Feature Requests

1. Check existing issues
2. Open issue with `enhancement` label
3. Include use case and examples

### Operator Requests

1. Describe input/output
2. Show example usage
3. Consider edge cases

---

## Release Schedule

| Version | Target | Status |
|---------|--------|--------|
| v2.0.0 | 2026-01-23 | Released |
| v2.1.0 | 2026 Q1 | Planning |
| v2.2.0 | 2026 Q2 | Planning |
| v2.3.0 | 2026 Q3 | Planning |

---

## Feedback

Have ideas? Found issues?

- GitHub Issues: [retea-se/mackan.eu](https://github.com/retea-se/mackan.eu/issues)
- Feature Requests: Use `enhancement` label
- Bug Reports: Use `bug` label
