# Pipeline Engine

JSON Toolbox pipelines enable deterministic, composable data transformations.

---

## Concept

A **pipeline** is an ordered sequence of operators that transform data step-by-step.

```
Input → Operator 1 → Operator 2 → ... → Operator N → Output
```

Each step receives the output of the previous step as input.

---

## Manifest Format

Pipelines are defined as JSON manifests:

```json
{
  "name": "my-pipeline",
  "version": "1.0.0",
  "description": "Human-readable description",
  "steps": [
    {
      "operator": "namespace.name",
      "params": { "key": "value" }
    },
    {
      "operator": "namespace.name",
      "params": {}
    }
  ]
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Pipeline identifier |
| `steps` | array | Ordered list of operator steps |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Semver version |
| `description` | string | Human-readable description |
| `metadata` | object | Arbitrary key-value pairs |

### Step Object

| Field | Type | Description |
|-------|------|-------------|
| `operator` | string | Operator identifier (e.g., `csv.parse`) |
| `params` | object | Operator parameters (defaults if omitted) |
| `id` | string | Optional step identifier for debugging |
| `onError` | string | Error handling: `"stop"` (default) or `"continue"` |

---

## Execution Model

### Sequential Execution

Steps execute in order. Each step's output becomes the next step's input.

```
Step 1 Output → Step 2 Input
Step 2 Output → Step 3 Input
...
```

### Type Flow

Each operator has defined input/output types:

| Operator | Input Type | Output Type |
|----------|------------|-------------|
| `csv.parse` | string (CSV) | array |
| `transform.sort` | array | array |
| `json.stringify` | any | string |

The pipeline engine validates type compatibility between steps.

### Error Handling

Default behavior: stop on first error.

Per-step override:
```json
{
  "operator": "json.parse",
  "params": {},
  "onError": "continue"
}
```

With `onError: "continue"`, the step passes its input unchanged to the next step on error.

---

## Browser Usage

### Visual Pipeline Builder

1. Open JSON Toolbox → Pipeline tab
2. Click "Add Step" to add operators
3. Configure each step's parameters
4. Click "Run Pipeline" to execute
5. View intermediate results per step
6. Export manifest as JSON or YAML

### Export Manifest

```javascript
// Get current pipeline as manifest
const manifest = window.PipelineBuilder.exportManifest();
console.log(JSON.stringify(manifest, null, 2));
```

### Import Manifest

```javascript
// Load manifest into builder
window.PipelineBuilder.importManifest(manifestObject);
```

---

## CLI Usage

### Run Pipeline

```bash
# Basic execution
jsontb run pipeline.json < input.csv > output.json

# With file arguments
jsontb run pipeline.json -i input.csv -o output.json

# Dry run (show plan)
jsontb run pipeline.json --dry-run < input.csv

# Verbose (show metrics)
jsontb run pipeline.json -v < input.csv
```

### Validate Manifest

```bash
jsontb validate pipeline.json
# OK: Valid manifest with 3 steps
```

---

## Example Pipelines

### CSV to Sorted JSON

```json
{
  "name": "csv-to-sorted-json",
  "version": "1.0.0",
  "description": "Parse CSV, sort by name, format output",
  "steps": [
    {
      "operator": "csv.parse",
      "params": { "header": true, "delimiter": "," }
    },
    {
      "operator": "transform.sort",
      "params": { "key": "name", "order": "asc" }
    },
    {
      "operator": "json.stringify",
      "params": { "indent": 2 }
    }
  ]
}
```

### API Response Transform

```json
{
  "name": "api-response-transform",
  "version": "1.0.0",
  "description": "Extract users array, filter active, select fields",
  "steps": [
    {
      "operator": "json.parse",
      "params": {}
    },
    {
      "operator": "query.jsonpath",
      "params": { "path": "$.data.users" }
    },
    {
      "operator": "transform.filter",
      "params": { "key": "active", "operator": "eq", "value": true }
    },
    {
      "operator": "query.select",
      "params": { "fields": ["id", "name", "email"] }
    },
    {
      "operator": "json.stringify",
      "params": { "indent": 2 }
    }
  ]
}
```

### Data Cleanup

```json
{
  "name": "data-cleanup",
  "version": "1.0.0",
  "description": "Deduplicate, sort, format",
  "steps": [
    {
      "operator": "json.parse",
      "params": {}
    },
    {
      "operator": "transform.unique",
      "params": { "key": "id" }
    },
    {
      "operator": "transform.sort",
      "params": { "key": "id", "order": "asc" }
    },
    {
      "operator": "json.stringify",
      "params": { "indent": 2 }
    }
  ]
}
```

---

## Presets

Pre-built pipelines in `cli/presets/`:

| Preset | Use Case |
|--------|----------|
| `csv-to-json.json` | Parse CSV file to JSON |
| `json-to-yaml.json` | Convert JSON to YAML |
| `xml-to-json.json` | Parse XML to JSON |
| `data-cleanup.json` | Dedupe, sort, format |
| `generate-schema.json` | Generate JSON Schema |
| `api-response-transform.json` | Extract API data |

Usage:
```bash
jsontb run presets/csv-to-json.json < data.csv
```

---

## Determinism

All pipelines produce deterministic output:

1. **No randomness** - Same input = same output
2. **Stable ordering** - Keys and arrays maintain order
3. **No side effects** - Pure transformations only
4. **Cross-platform** - Same result on any runtime

Verify:
```bash
jsontb run p.json < in.json | sha256sum  # Run 1
jsontb run p.json < in.json | sha256sum  # Run 2 (identical)
```

---

## Browser-CLI Parity

Pipelines work identically in browser and CLI:

1. Build pipeline in browser
2. Export manifest
3. Run via CLI
4. Output matches browser

This enables:
- Development in browser (visual feedback)
- Automation via CLI (scripts, CI/CD)
- Reproducible workflows

---

## Advanced Topics

### Composing Pipelines

Chain multiple pipelines via shell:

```bash
cat data.csv | \
  jsontb run parse.json | \
  jsontb run transform.json | \
  jsontb run format.json > output.json
```

### Parameterized Pipelines

Future feature (v2.1): Parameter placeholders

```json
{
  "params": {
    "sortKey": { "type": "string", "default": "name" }
  },
  "steps": [
    {
      "operator": "transform.sort",
      "params": { "key": "${sortKey}" }
    }
  ]
}
```

### Step Results

In browser, access intermediate results:

```javascript
const results = window.PipelineEngine.getStepResults();
// { "step-0": {...}, "step-1": {...}, ... }
```

---

## Schema Reference

Full manifest JSON Schema available at:
`cli/dist/manifest-schema.json`

Validate manifests:
```bash
# Using jsontb
jsontb validate pipeline.json

# Using external validator
jsonschema -i pipeline.json manifest-schema.json
```
