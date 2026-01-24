# jsontb - JSON Toolbox CLI

**Version:** 2.0.0  
**Status:** Production Ready  
**License:** MIT

Deterministic data transformation pipelines for JSON, CSV, XML, and YAML.

## Features

- **42 operators** across 9 namespaces (json, csv, xml, yaml, transform, diff, fix, schema, query)
- **Zero dependencies** - single self-contained bundle
- **Offline capable** - no network access required
- **Cross-platform** - runs on Node.js, Deno, or Bun
- **Pipeline execution** - chain operators via manifest files
- **Browser parity** - identical output to browser version
- **Deterministic** - same input + params = same output (always)

## Quick Start

```bash
# Format JSON
echo '{"a":1,"b":2}' | jsontb exec json.format

# Convert CSV to JSON
cat data.csv | jsontb exec csv.parse --header true

# Run a pipeline
jsontb run pipeline.json < input.json > output.json

# List available operators
jsontb list-operators
```

## Installation

### Option 1: Download Bundle (Recommended)

Download `jsontb.js` from releases and run with Node.js, Deno, or Bun:

```bash
# Node.js
node jsontb.js help

# Deno
deno run --allow-read --allow-write jsontb.js help

# Bun
bun jsontb.js help
```

### Option 2: Use Standalone Binary

Download platform-specific binary from releases:
- `jsontb-linux-x64` / `jsontb-linux-arm64`
- `jsontb-macos-x64` / `jsontb-macos-arm64`  
- `jsontb-windows-x64.exe`

### Option 3: Build from Source

```bash
cd tools/json/cli
node build/bundle.js
# Bundle created at: dist/jsontb.js
```

## Usage

### Execute Single Operator

```bash
jsontb exec <operator> [--param value] < input

# Examples
echo '{"a":1}' | jsontb exec json.format --indent 4
echo 'name,age\nAlice,30' | jsontb exec csv.parse --header true
echo '{"users":[{"n":"A"}]}' | jsontb exec query.jsonpath --path $.users[0].n
```

### Run Pipeline Manifest

```bash
jsontb run <manifest.json> [-i input] [-o output]

# With stdin/stdout
jsontb run pipeline.json < input.csv > output.json

# With file arguments
jsontb run pipeline.json -i data.csv -o result.json

# Dry run (show plan)
jsontb run pipeline.json --dry-run < input.csv

# Verbose mode (show metrics)
jsontb run pipeline.json -v < input.csv
```

### Validate Manifest

```bash
jsontb validate pipeline.json
```

### List Operators

```bash
jsontb list-operators        # Human readable
jsontb list-operators --json # JSON output
```

## Pipeline Manifest Format

```json
{
  "name": "my-pipeline",
  "version": "1.0.0",
  "description": "Transform CSV to sorted JSON",
  "steps": [
    { "operator": "csv.parse", "params": { "header": true } },
    { "operator": "transform.sort", "params": { "key": "name" } },
    { "operator": "json.stringify", "params": { "indent": 2 } }
  ]
}
```

## Available Operators

### JSON (10 operators)
| Operator | Description |
|----------|-------------|
| `json.parse` | Parse JSON string |
| `json.stringify` | Convert to JSON string |
| `json.format` | Prettify JSON |
| `json.minify` | Minify JSON |
| `json.validate` | Validate JSON syntax |
| `json.path` | Extract value at path |
| `json.keys` | Get object keys |
| `json.values` | Get object values |
| `json.entries` | Get [key, value] pairs |
| `json.fromEntries` | Create object from pairs |

### CSV (3 operators)
| Operator | Description |
|----------|-------------|
| `csv.parse` | Parse CSV to array |
| `csv.stringify` | Convert array to CSV |
| `csv.transpose` | Swap rows/columns |

### XML (4 operators)
| Operator | Description |
|----------|-------------|
| `xml.parse` | Parse XML to JSON |
| `xml.stringify` | Convert JSON to XML |
| `xml.format` | Prettify XML |
| `xml.minify` | Minify XML |

### YAML (4 operators)
| Operator | Description |
|----------|-------------|
| `yaml.parse` | Parse YAML to JSON |
| `yaml.stringify` | Convert JSON to YAML |
| `yaml.format` | Prettify YAML |
| `yaml.validate` | Validate YAML syntax |

### Transform (10 operators)
| Operator | Description |
|----------|-------------|
| `transform.sort` | Sort array |
| `transform.filter` | Filter array |
| `transform.map` | Map array values |
| `transform.flatten` | Flatten nested array |
| `transform.unique` | Remove duplicates |
| `transform.reverse` | Reverse array |
| `transform.slice` | Slice array |
| `transform.group` | Group by key |
| `transform.count` | Count items |
| `transform.merge` | Merge objects |

### Diff (2 operators)
| Operator | Description |
|----------|-------------|
| `diff.compare` | Compare two JSON values |
| `diff.patch` | Apply diff patches |

### Fix (3 operators)
| Operator | Description |
|----------|-------------|
| `fix.repair` | Repair broken JSON |
| `fix.repairDetailed` | Repair with report |
| `fix.format` | Repair and format |

### Schema (2 operators)
| Operator | Description |
|----------|-------------|
| `schema.generate` | Generate JSON Schema |
| `schema.validate` | Validate against schema |

### Query (3 operators)
| Operator | Description |
|----------|-------------|
| `query.jsonpath` | Query with JSONPath |
| `query.select` | SQL-like select |
| `query.get` | Get single value |

## Presets

Pre-built pipeline manifests for common workflows:

| Preset | Description |
|--------|-------------|
| `csv-to-json.json` | Convert CSV to JSON |
| `json-to-yaml.json` | Convert JSON to YAML |
| `xml-to-json.json` | Convert XML to JSON |
| `data-cleanup.json` | Dedupe, sort, format |
| `generate-schema.json` | Generate JSON Schema |
| `api-response-transform.json` | Extract and filter API data |

```bash
jsontb run presets/csv-to-json.json < data.csv
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Pipeline/operator error |
| 2 | Invalid manifest |
| 3 | Invalid input |
| 4 | Timeout |

## Determinism Guarantee

The CLI provides deterministic output:
- Same input + same params = same output (always)
- No randomness in transformations
- No timestamps in output
- Reproducible across runs and platforms

Run determinism tests:
```bash
node test/smoke.js   # Core functionality
node test/parity.js  # Browser-CLI parity
```

## Zero Dependencies

The bundle is completely self-contained:
- Pure JavaScript (ES2020)
- No npm packages required
- No network access
- No telemetry or analytics
- Works offline/airgapped

## Browser Parity

Output from CLI operators is identical to the browser version:
- Export pipeline from browser, run in CLI
- Run pipeline via CLI, load back into browser
- Same operators, same parameters, same output

## Building

```bash
# Create bundle
node build/bundle.js

# Create platform binaries (requires Deno or Bun)
node build/build-all.js

# Run tests
node test/smoke.js
node test/parity.js
```

## Changelog

### v2.0.0 (2026-01-23)

- Added WASM-ready CLI bundle
- Added 42 operators across 9 namespaces
- Added diff, fix, schema, query operators
- Added pure YAML parser (zero dependencies)
- Added pipeline presets
- Added browser-CLI parity verification
- Added determinism tests

### v1.0.0 (2026-01-19)

- Initial Node.js CLI
- Basic JSON, CSV, XML, YAML operators
- Pipeline engine with manifest execution

## License

MIT
