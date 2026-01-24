# jsontb - JSON Toolbox CLI

**Version:** 2.0.0
**License:** MIT
**Deterministic:** Yes
**Dependencies:** Zero (self-contained bundle)

---

## Installation

### Option 1: Download Bundle (Recommended)

```bash
# Download
curl -O https://mackan.eu/tools/json/cli/dist/jsontb.js

# Verify checksum
curl -O https://mackan.eu/tools/json/cli/dist/SHA256SUMS.txt
sha256sum -c SHA256SUMS.txt

# Run with Node.js
node jsontb.js help
```

### Option 2: Use with Different Runtimes

```bash
# Node.js (v16+)
node jsontb.js help

# Deno
deno run --allow-read --allow-write jsontb.js help

# Bun
bun jsontb.js help
```

### Option 3: Global Alias

```bash
# Add to ~/.bashrc or ~/.zshrc
alias jsontb='node /path/to/jsontb.js'

# Then use directly
jsontb help
```

---

## Commands

### `exec` - Execute Single Operator

```bash
jsontb exec <operator> [--param value] < input

# Examples
echo '{"a":1}' | jsontb exec json.format --indent 4
cat data.csv | jsontb exec csv.parse --header true
echo '{"users":[{"n":"A"}]}' | jsontb exec query.jsonpath --path '$.users[0].n'
```

### `run` - Execute Pipeline Manifest

```bash
jsontb run <manifest.json> [-i input] [-o output] [--dry-run] [-v]

# With stdin/stdout
jsontb run pipeline.json < input.csv > output.json

# With file arguments
jsontb run pipeline.json -i data.csv -o result.json

# Dry run (show plan without executing)
jsontb run pipeline.json --dry-run < input.csv

# Verbose (show timing metrics)
jsontb run pipeline.json -v < input.csv
```

### `validate` - Validate Pipeline Manifest

```bash
jsontb validate <manifest.json>

# Example
jsontb validate pipeline.json
# OK: Valid manifest with 3 steps
```

### `list-operators` - List Available Operators

```bash
jsontb list-operators          # Human-readable table
jsontb list-operators --json   # JSON output for scripting
```

### `help` - Show Help

```bash
jsontb help
jsontb help exec
jsontb help run
```

---

## Operators Reference

### JSON Namespace (10 operators)

| Operator | Description | Key Parameters |
|----------|-------------|----------------|
| `json.parse` | Parse JSON string to object | - |
| `json.stringify` | Convert object to JSON string | `indent` |
| `json.format` | Prettify JSON | `indent`, `sortKeys` |
| `json.minify` | Minify JSON (remove whitespace) | - |
| `json.validate` | Validate JSON syntax | - |
| `json.path` | Extract value at dot-path | `path` |
| `json.keys` | Get object keys as array | - |
| `json.values` | Get object values as array | - |
| `json.entries` | Get [key, value] pairs | - |
| `json.fromEntries` | Create object from pairs | - |

### CSV Namespace (3 operators)

| Operator | Description | Key Parameters |
|----------|-------------|----------------|
| `csv.parse` | Parse CSV to array of objects | `header`, `delimiter`, `quote` |
| `csv.stringify` | Convert array to CSV string | `header`, `delimiter` |
| `csv.transpose` | Swap rows and columns | - |

### XML Namespace (4 operators)

| Operator | Description | Key Parameters |
|----------|-------------|----------------|
| `xml.parse` | Parse XML to JSON object | `compact`, `preserveAttributes` |
| `xml.stringify` | Convert JSON to XML string | `rootName`, `indent` |
| `xml.format` | Prettify XML | `indent` |
| `xml.minify` | Minify XML | - |

### YAML Namespace (4 operators)

| Operator | Description | Key Parameters |
|----------|-------------|----------------|
| `yaml.parse` | Parse YAML to JSON object | - |
| `yaml.stringify` | Convert JSON to YAML string | `indent`, `flowLevel` |
| `yaml.format` | Prettify YAML | `indent` |
| `yaml.validate` | Validate YAML syntax | - |

### Transform Namespace (10 operators)

| Operator | Description | Key Parameters |
|----------|-------------|----------------|
| `transform.sort` | Sort array | `key`, `order` |
| `transform.filter` | Filter array by condition | `key`, `operator`, `value` |
| `transform.map` | Map array values | `expression` |
| `transform.flatten` | Flatten nested array | `depth` |
| `transform.unique` | Remove duplicate values | `key` |
| `transform.reverse` | Reverse array order | - |
| `transform.slice` | Slice array | `start`, `end` |
| `transform.group` | Group by key | `key` |
| `transform.count` | Count items | - |
| `transform.merge` | Merge objects | - |

### Diff Namespace (2 operators)

| Operator | Description | Key Parameters |
|----------|-------------|----------------|
| `diff.compare` | Compare two JSON values | `second` |
| `diff.patch` | Apply diff patches | `patches` |

### Fix Namespace (3 operators)

| Operator | Description | Key Parameters |
|----------|-------------|----------------|
| `fix.repair` | Repair broken JSON | - |
| `fix.repairDetailed` | Repair with change report | - |
| `fix.format` | Repair and prettify | `indent` |

### Schema Namespace (2 operators)

| Operator | Description | Key Parameters |
|----------|-------------|----------------|
| `schema.generate` | Generate JSON Schema from data | `title`, `draft` |
| `schema.validate` | Validate data against schema | `schema` |

### Query Namespace (3 operators)

| Operator | Description | Key Parameters |
|----------|-------------|----------------|
| `query.jsonpath` | Query with JSONPath expression | `path` |
| `query.select` | SQL-like select fields | `fields` |
| `query.get` | Get single value at path | `path` |

---

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Pipeline or operator error |
| 2 | Invalid manifest format |
| 3 | Invalid input data |
| 4 | Timeout exceeded |

---

## Examples

### Format JSON

```bash
echo '{"name":"Alice","age":30}' | jsontb exec json.format --indent 2
```

Output:
```json
{
  "name": "Alice",
  "age": 30
}
```

### Convert CSV to JSON

```bash
echo 'name,age
Alice,30
Bob,25' | jsontb exec csv.parse --header true
```

Output:
```json
[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]
```

### Chain Operations with Pipeline

```bash
# Create pipeline manifest
cat > pipeline.json << 'EOF'
{
  "name": "csv-to-sorted-json",
  "steps": [
    { "operator": "csv.parse", "params": { "header": true } },
    { "operator": "transform.sort", "params": { "key": "name" } },
    { "operator": "json.stringify", "params": { "indent": 2 } }
  ]
}
EOF

# Run pipeline
cat data.csv | jsontb run pipeline.json
```

### Query JSON with JSONPath

```bash
echo '{"users":[{"name":"Alice"},{"name":"Bob"}]}' | \
  jsontb exec query.jsonpath --path '$.users[*].name'
```

Output:
```json
["Alice","Bob"]
```

### Repair Broken JSON

```bash
echo "{'name': 'Alice', age: 30,}" | jsontb exec fix.repair
```

Output:
```json
{"name":"Alice","age":30}
```

---

## Presets

Pre-built pipeline manifests in `presets/`:

| Preset | Description |
|--------|-------------|
| `csv-to-json.json` | Parse CSV with headers to JSON |
| `json-to-yaml.json` | Convert JSON to YAML |
| `xml-to-json.json` | Parse XML to JSON |
| `data-cleanup.json` | Deduplicate, sort, format |
| `generate-schema.json` | Generate JSON Schema |
| `api-response-transform.json` | Extract and filter API data |

```bash
# Use preset
jsontb run presets/csv-to-json.json < data.csv
```

---

## Determinism Guarantee

The CLI guarantees deterministic output:

- Same input + same parameters = same output (always)
- No randomness in any transformation
- No timestamps inserted in output
- Reproducible across runs and platforms
- Identical output to browser version

Verify determinism:
```bash
# Run twice, compare
jsontb run pipeline.json < input.json > out1.json
jsontb run pipeline.json < input.json > out2.json
diff out1.json out2.json  # No difference
```

---

## Browser Parity

CLI output is byte-identical to browser version:

1. Build pipeline in browser UI
2. Export manifest (JSON)
3. Run same manifest via CLI
4. Output matches browser result

This enables:
- Local development with browser
- CI/CD automation with CLI
- Reproducible data pipelines

---

## Scripting Examples

### Batch Processing

```bash
#!/bin/bash
for file in data/*.csv; do
  jsontb run pipeline.json < "$file" > "output/$(basename "$file" .csv).json"
done
```

### Error Handling

```bash
#!/bin/bash
if jsontb run pipeline.json < input.json > output.json 2>&1; then
  echo "Success"
else
  echo "Failed with exit code $?"
fi
```

### Pipeline Composition

```bash
# Chain multiple pipelines
cat data.csv | \
  jsontb run step1.json | \
  jsontb run step2.json | \
  jsontb run step3.json > final.json
```

---

## Troubleshooting

### "Operator not found"

Check operator name with `jsontb list-operators`.

### "Invalid manifest"

Validate manifest with `jsontb validate manifest.json`.

### "Input parse error"

Ensure input format matches first operator's expected input type.

### Performance

For large files (>10MB), consider streaming or chunking input.

---

## Version History

**2.0.0** (2026-01-23)
- 42 operators across 9 namespaces
- Zero-dependency bundle
- Browser-CLI parity verified
- Pipeline presets

**1.0.0** (2026-01-19)
- Initial release
- Basic operators
- Pipeline execution
