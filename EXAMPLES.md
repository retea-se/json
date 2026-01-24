# Examples

Real-world workflows and example pipelines for JSON Toolbox.

---

## Quick Examples

### Format JSON

```bash
# CLI
echo '{"name":"Alice","age":30}' | jsontb exec json.format --indent 2

# Browser: Paste in Format tab, click "Beautify"
```

### Convert CSV to JSON

```bash
# CLI
cat users.csv | jsontb exec csv.parse --header true > users.json

# Browser: Paste CSV in CSV tab, click "To JSON"
```

### Repair Broken JSON

```bash
# CLI
echo "{'name': 'Alice', age: 30,}" | jsontb exec fix.repair

# Browser: Paste in Fix tab, click "Repair"
```

---

## Workflow Examples

### API Response Processing

**Scenario:** Extract user data from nested API response, filter active users, sort by name.

Input:
```json
{
  "status": "ok",
  "data": {
    "users": [
      { "id": 1, "name": "Bob", "active": false },
      { "id": 2, "name": "Alice", "active": true },
      { "id": 3, "name": "Carol", "active": true }
    ]
  }
}
```

Pipeline:
```json
{
  "name": "api-user-extract",
  "steps": [
    { "operator": "query.jsonpath", "params": { "path": "$.data.users" } },
    { "operator": "transform.filter", "params": { "key": "active", "operator": "eq", "value": true } },
    { "operator": "transform.sort", "params": { "key": "name", "order": "asc" } },
    { "operator": "json.stringify", "params": { "indent": 2 } }
  ]
}
```

Output:
```json
[
  { "id": 2, "name": "Alice", "active": true },
  { "id": 3, "name": "Carol", "active": true }
]
```

---

### Log File Processing

**Scenario:** Parse NDJSON logs, filter errors, extract timestamps.

Input (`logs.ndjson`):
```
{"level":"info","msg":"Started","ts":"2026-01-01T10:00:00Z"}
{"level":"error","msg":"Failed to connect","ts":"2026-01-01T10:01:00Z"}
{"level":"info","msg":"Retrying","ts":"2026-01-01T10:02:00Z"}
{"level":"error","msg":"Timeout","ts":"2026-01-01T10:03:00Z"}
```

```bash
# Parse NDJSON (one JSON per line)
cat logs.ndjson | \
  jsontb exec json.parse | \
  jsontb exec transform.filter --key level --operator eq --value '"error"' | \
  jsontb exec query.select --fields '["ts","msg"]'
```

Output:
```json
[
  {"ts":"2026-01-01T10:01:00Z","msg":"Failed to connect"},
  {"ts":"2026-01-01T10:03:00Z","msg":"Timeout"}
]
```

---

### CSV Data Cleanup

**Scenario:** Parse CSV, remove duplicates, sort, export clean CSV.

Input (`messy.csv`):
```csv
name,email,dept
Bob,bob@example.com,Sales
Alice,alice@example.com,Engineering
Bob,bob@example.com,Sales
Carol,carol@example.com,Marketing
Alice,alice@example.com,Engineering
```

Pipeline:
```json
{
  "name": "csv-cleanup",
  "steps": [
    { "operator": "csv.parse", "params": { "header": true } },
    { "operator": "transform.unique", "params": { "key": "email" } },
    { "operator": "transform.sort", "params": { "key": "name", "order": "asc" } },
    { "operator": "csv.stringify", "params": { "header": true } }
  ]
}
```

Output:
```csv
name,email,dept
Alice,alice@example.com,Engineering
Bob,bob@example.com,Sales
Carol,carol@example.com,Marketing
```

---

### XML to YAML Conversion

**Scenario:** Convert XML configuration to YAML.

Input:
```xml
<config>
  <database>
    <host>localhost</host>
    <port>5432</port>
  </database>
  <cache enabled="true">
    <ttl>3600</ttl>
  </cache>
</config>
```

Pipeline:
```json
{
  "name": "xml-to-yaml",
  "steps": [
    { "operator": "xml.parse", "params": { "compact": true } },
    { "operator": "yaml.stringify", "params": { "indent": 2 } }
  ]
}
```

---

### Schema Generation from Sample Data

**Scenario:** Generate JSON Schema from sample API response.

Input:
```json
{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@example.com", "verified": true },
    { "id": 2, "name": "Bob", "email": "bob@example.com", "verified": false }
  ],
  "total": 2,
  "page": 1
}
```

```bash
cat sample.json | jsontb exec schema.generate --title "UserListResponse"
```

Output:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UserListResponse",
  "type": "object",
  "properties": {
    "users": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "name": { "type": "string" },
          "email": { "type": "string" },
          "verified": { "type": "boolean" }
        }
      }
    },
    "total": { "type": "integer" },
    "page": { "type": "integer" }
  }
}
```

---

### Kubernetes YAML Processing

**Scenario:** Extract container images from K8s deployment.

Input (`deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: app
          image: myapp:v1.2.3
        - name: sidecar
          image: sidecar:latest
```

```bash
cat deployment.yaml | \
  jsontb exec yaml.parse | \
  jsontb exec query.jsonpath --path '$.spec.template.spec.containers[*].image'
```

Output:
```json
["myapp:v1.2.3","sidecar:latest"]
```

---

### Data Transformation for Export

**Scenario:** Transform internal format to external API format.

Input:
```json
{
  "records": [
    { "user_id": "u1", "user_name": "Alice", "created_at": "2026-01-01" },
    { "user_id": "u2", "user_name": "Bob", "created_at": "2026-01-02" }
  ]
}
```

Pipeline (rename fields, restructure):
```json
{
  "name": "export-transform",
  "steps": [
    { "operator": "query.jsonpath", "params": { "path": "$.records" } },
    { "operator": "transform.map", "params": {
      "expression": "{ id: item.user_id, name: item.user_name, date: item.created_at }"
    }},
    { "operator": "json.stringify", "params": { "indent": 2 } }
  ]
}
```

---

## Batch Processing Examples

### Process Multiple Files

```bash
#!/bin/bash
# Convert all CSV files to JSON
for file in data/*.csv; do
  name=$(basename "$file" .csv)
  jsontb run presets/csv-to-json.json < "$file" > "output/${name}.json"
done
```

### Parallel Processing

```bash
#!/bin/bash
# Process files in parallel (GNU parallel)
find data/ -name "*.json" | \
  parallel 'jsontb run cleanup.json < {} > cleaned/{/}'
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Validate JSON configs
  run: |
    for file in config/*.json; do
      echo "Validating $file"
      jsontb exec json.validate < "$file" || exit 1
    done
```

---

## Common Patterns

### Parse → Transform → Serialize

Most pipelines follow this pattern:

```
Input String → Parse → Transform(s) → Serialize → Output String
```

Example:
```json
{
  "steps": [
    { "operator": "csv.parse", "params": { "header": true } },
    { "operator": "transform.filter", "params": { ... } },
    { "operator": "transform.sort", "params": { ... } },
    { "operator": "json.stringify", "params": { "indent": 2 } }
  ]
}
```

### Extract → Process → Embed

For nested data:

```
Input → Extract (query) → Process → Embed back (if needed)
```

### Validate → Transform → Validate

For data quality:

```
Input → Validate Schema → Transform → Validate Output Schema
```

---

## Preset Reference

### csv-to-json.json

```json
{
  "name": "csv-to-json",
  "description": "Parse CSV with headers to JSON array",
  "steps": [
    { "operator": "csv.parse", "params": { "header": true } },
    { "operator": "json.stringify", "params": { "indent": 2 } }
  ]
}
```

### json-to-yaml.json

```json
{
  "name": "json-to-yaml",
  "description": "Convert JSON to YAML",
  "steps": [
    { "operator": "json.parse", "params": {} },
    { "operator": "yaml.stringify", "params": { "indent": 2 } }
  ]
}
```

### data-cleanup.json

```json
{
  "name": "data-cleanup",
  "description": "Deduplicate, sort, and format JSON array",
  "steps": [
    { "operator": "json.parse", "params": {} },
    { "operator": "transform.unique", "params": {} },
    { "operator": "transform.sort", "params": { "key": "id", "order": "asc" } },
    { "operator": "json.stringify", "params": { "indent": 2 } }
  ]
}
```

---

## Browser-Specific Examples

### Using Pipeline Builder

1. Open JSON Toolbox → Pipeline tab
2. Click "Add Step"
3. Select operator from dropdown
4. Configure parameters
5. Add more steps as needed
6. Paste input data
7. Click "Run Pipeline"
8. Export manifest for CLI use

### Cross-Module Workflow

1. Paste CSV in CSV tab
2. Click "To JSON"
3. Click "Send to..." → Schema
4. Generate JSON Schema
5. Click "Send to..." → Validate
6. Validate original data against schema

### Keyboard-Driven Workflow

```
Ctrl+1    → Switch to CSV tab
Paste     → Input CSV data
Ctrl+Enter → Convert to JSON
Ctrl+2    → Switch to Format tab
Ctrl+Enter → Beautify output
Ctrl+Shift+C → Copy output
```
