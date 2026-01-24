# Operators Reference

Complete reference for all 42 operators in JSON Toolbox v2.0.

---

## Overview

| Namespace | Count | Description |
|-----------|-------|-------------|
| `json` | 10 | JSON parsing, formatting, manipulation |
| `csv` | 3 | CSV parsing and generation |
| `xml` | 4 | XML parsing and generation |
| `yaml` | 4 | YAML parsing and generation |
| `transform` | 10 | Array and object transformations |
| `diff` | 2 | JSON comparison and patching |
| `fix` | 3 | Broken JSON repair |
| `schema` | 2 | JSON Schema generation and validation |
| `query` | 3 | JSONPath and field selection |
| **Total** | **42** | |

---

## JSON Namespace

### json.parse

Parse JSON string to object/array.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** string (JSON)
**Output:** any (parsed value)

```bash
echo '"hello"' | jsontb exec json.parse
# Output: "hello"
```

---

### json.stringify

Convert value to JSON string.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `indent` | number | 0 | Indentation spaces (0 = minified) |

**Input:** any
**Output:** string (JSON)

```bash
echo '{"a":1}' | jsontb exec json.stringify --indent 2
```

---

### json.format

Prettify JSON with optional key sorting.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `indent` | number | 2 | Indentation spaces |
| `sortKeys` | boolean | false | Sort object keys alphabetically |

**Input:** any (JSON-compatible)
**Output:** string (formatted JSON)

```bash
echo '{"b":2,"a":1}' | jsontb exec json.format --sortKeys true
# Output: {"a":1,"b":2}
```

---

### json.minify

Remove whitespace from JSON.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** string or object
**Output:** string (minified JSON)

```bash
echo '{  "a": 1  }' | jsontb exec json.minify
# Output: {"a":1}
```

---

### json.validate

Check if input is valid JSON.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** string
**Output:** object `{ valid: boolean, error?: string }`

```bash
echo '{"a":1}' | jsontb exec json.validate
# Output: {"valid":true}
```

---

### json.path

Extract value at dot-notation path.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | required | Dot-notation path (e.g., `users.0.name`) |

**Input:** object or array
**Output:** any (value at path)

```bash
echo '{"users":[{"name":"Alice"}]}' | jsontb exec json.path --path users.0.name
# Output: "Alice"
```

---

### json.keys

Get object keys as array.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** object
**Output:** array of strings

```bash
echo '{"a":1,"b":2}' | jsontb exec json.keys
# Output: ["a","b"]
```

---

### json.values

Get object values as array.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** object
**Output:** array

```bash
echo '{"a":1,"b":2}' | jsontb exec json.values
# Output: [1,2]
```

---

### json.entries

Get [key, value] pairs.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** object
**Output:** array of [key, value] arrays

```bash
echo '{"a":1}' | jsontb exec json.entries
# Output: [["a",1]]
```

---

### json.fromEntries

Create object from [key, value] pairs.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** array of [key, value] arrays
**Output:** object

```bash
echo '[["a",1],["b",2]]' | jsontb exec json.fromEntries
# Output: {"a":1,"b":2}
```

---

## CSV Namespace

### csv.parse

Parse CSV string to array of objects.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `header` | boolean | true | First row contains headers |
| `delimiter` | string | "," | Field delimiter |
| `quote` | string | '"' | Quote character |
| `skipEmptyLines` | boolean | true | Skip empty lines |

**Input:** string (CSV)
**Output:** array of objects (if header=true) or arrays

```bash
echo 'name,age
Alice,30' | jsontb exec csv.parse --header true
# Output: [{"name":"Alice","age":"30"}]
```

---

### csv.stringify

Convert array to CSV string.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `header` | boolean | true | Include header row |
| `delimiter` | string | "," | Field delimiter |

**Input:** array of objects or arrays
**Output:** string (CSV)

```bash
echo '[{"name":"Alice","age":30}]' | jsontb exec csv.stringify
# Output: name,age
#         Alice,30
```

---

### csv.transpose

Swap rows and columns.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** array of arrays
**Output:** array of arrays (transposed)

```bash
echo '[[1,2],[3,4]]' | jsontb exec csv.transpose
# Output: [[1,3],[2,4]]
```

---

## XML Namespace

### xml.parse

Parse XML string to JSON object.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `compact` | boolean | true | Compact output format |
| `preserveAttributes` | boolean | true | Keep XML attributes |

**Input:** string (XML)
**Output:** object (JSON representation)

```bash
echo '<user id="1"><name>Alice</name></user>' | jsontb exec xml.parse
```

---

### xml.stringify

Convert JSON to XML string.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `rootName` | string | "root" | Root element name |
| `indent` | number | 2 | Indentation spaces |

**Input:** object
**Output:** string (XML)

```bash
echo '{"name":"Alice"}' | jsontb exec xml.stringify --rootName user
```

---

### xml.format

Prettify XML with indentation.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `indent` | number | 2 | Indentation spaces |

**Input:** string (XML)
**Output:** string (formatted XML)

---

### xml.minify

Remove whitespace from XML.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** string (XML)
**Output:** string (minified XML)

---

## YAML Namespace

### yaml.parse

Parse YAML string to JSON object.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** string (YAML)
**Output:** any (parsed value)

```bash
echo 'name: Alice
age: 30' | jsontb exec yaml.parse
# Output: {"name":"Alice","age":30}
```

---

### yaml.stringify

Convert JSON to YAML string.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `indent` | number | 2 | Indentation spaces |
| `flowLevel` | number | -1 | Flow style depth (-1 = block style) |

**Input:** any
**Output:** string (YAML)

```bash
echo '{"name":"Alice"}' | jsontb exec yaml.stringify
# Output: name: Alice
```

---

### yaml.format

Prettify YAML.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `indent` | number | 2 | Indentation spaces |

**Input:** string (YAML)
**Output:** string (formatted YAML)

---

### yaml.validate

Check if input is valid YAML.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** string
**Output:** object `{ valid: boolean, error?: string }`

---

## Transform Namespace

### transform.sort

Sort array by key or value.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | string | null | Object key to sort by (null = sort values) |
| `order` | string | "asc" | Sort order: "asc" or "desc" |

**Input:** array
**Output:** array (sorted)

```bash
echo '[{"n":"B"},{"n":"A"}]' | jsontb exec transform.sort --key n
# Output: [{"n":"A"},{"n":"B"}]
```

---

### transform.filter

Filter array by condition.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | string | required | Object key to test |
| `operator` | string | "eq" | Comparison: eq, ne, gt, lt, gte, lte, contains |
| `value` | any | required | Value to compare against |

**Input:** array of objects
**Output:** array (filtered)

```bash
echo '[{"age":20},{"age":30}]' | jsontb exec transform.filter --key age --operator gt --value 25
# Output: [{"age":30}]
```

---

### transform.map

Transform array elements.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `expression` | string | required | Transformation expression |

**Input:** array
**Output:** array (transformed)

---

### transform.flatten

Flatten nested arrays.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `depth` | number | 1 | Flatten depth (Infinity for full) |

**Input:** array
**Output:** array (flattened)

```bash
echo '[[1,2],[3,[4,5]]]' | jsontb exec transform.flatten --depth 2
# Output: [1,2,3,4,5]
```

---

### transform.unique

Remove duplicate values.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | string | null | Object key for uniqueness (null = whole value) |

**Input:** array
**Output:** array (deduplicated)

```bash
echo '[1,2,2,3,3,3]' | jsontb exec transform.unique
# Output: [1,2,3]
```

---

### transform.reverse

Reverse array order.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** array
**Output:** array (reversed)

---

### transform.slice

Extract array portion.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start` | number | 0 | Start index |
| `end` | number | null | End index (null = end of array) |

**Input:** array
**Output:** array (sliced)

---

### transform.group

Group array by key.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | string | required | Object key to group by |

**Input:** array of objects
**Output:** object with grouped arrays

```bash
echo '[{"type":"a","v":1},{"type":"b","v":2},{"type":"a","v":3}]' | \
  jsontb exec transform.group --key type
# Output: {"a":[{"type":"a","v":1},{"type":"a","v":3}],"b":[{"type":"b","v":2}]}
```

---

### transform.count

Count array items.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** array
**Output:** number

---

### transform.merge

Deep merge objects.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** array of objects
**Output:** object (merged)

---

## Diff Namespace

### diff.compare

Compare two JSON values.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `second` | any | required | Second value to compare |

**Input:** any (first value)
**Output:** object (diff description)

---

### diff.patch

Apply diff patches.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `patches` | array | required | Array of patch operations |

**Input:** any
**Output:** any (patched value)

---

## Fix Namespace

### fix.repair

Repair broken JSON.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** string (broken JSON)
**Output:** string (valid JSON)

Fixes:
- Trailing commas
- Single quotes → double quotes
- Unquoted keys
- Comments (removed)
- Missing quotes around strings

```bash
echo "{'name': 'Alice', age: 30,}" | jsontb exec fix.repair
# Output: {"name":"Alice","age":30}
```

---

### fix.repairDetailed

Repair with change report.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | | | |

**Input:** string (broken JSON)
**Output:** object `{ result: string, changes: array }`

---

### fix.format

Repair and prettify.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `indent` | number | 2 | Indentation spaces |

**Input:** string (broken JSON)
**Output:** string (repaired and formatted JSON)

---

## Schema Namespace

### schema.generate

Generate JSON Schema from data.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | "Generated Schema" | Schema title |
| `draft` | string | "draft-07" | JSON Schema draft version |

**Input:** any
**Output:** object (JSON Schema)

```bash
echo '{"name":"Alice","age":30}' | jsontb exec schema.generate
```

---

### schema.validate

Validate data against schema.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `schema` | object | required | JSON Schema to validate against |

**Input:** any
**Output:** object `{ valid: boolean, errors?: array }`

---

## Query Namespace

### query.jsonpath

Query with JSONPath expression.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | required | JSONPath expression |

**Input:** any
**Output:** array of matches

```bash
echo '{"users":[{"name":"Alice"},{"name":"Bob"}]}' | \
  jsontb exec query.jsonpath --path '$.users[*].name'
# Output: ["Alice","Bob"]
```

Supported JSONPath:
- `$` - root
- `.key` - child
- `[0]` - array index
- `[*]` - all elements
- `..key` - recursive descent

---

### query.select

Select fields from objects.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `fields` | array | required | Field names to select |

**Input:** array of objects
**Output:** array of objects (with selected fields only)

```bash
echo '[{"a":1,"b":2,"c":3}]' | jsontb exec query.select --fields '["a","c"]'
# Output: [{"a":1,"c":3}]
```

---

### query.get

Get single value at path.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | required | Dot-notation path |

**Input:** object or array
**Output:** any (value at path, or null if not found)

```bash
echo '{"user":{"name":"Alice"}}' | jsontb exec query.get --path user.name
# Output: "Alice"
```

---

## Type Compatibility Matrix

| Output Type | Compatible Input Operators |
|-------------|---------------------------|
| `string` | json.parse, yaml.parse, csv.parse, xml.parse |
| `array` | transform.*, query.* |
| `object` | json.*, query.get |
| `any` | json.stringify, yaml.stringify, csv.stringify, xml.stringify |

---

## Operator Categories

### Parsers
Convert string formats to JSON: `json.parse`, `csv.parse`, `xml.parse`, `yaml.parse`

### Serializers
Convert JSON to string formats: `json.stringify`, `csv.stringify`, `xml.stringify`, `yaml.stringify`

### Transformers
Modify data structure: `transform.*`, `json.keys`, `json.values`, `json.entries`

### Validators
Check data validity: `json.validate`, `yaml.validate`, `schema.validate`

### Query
Extract data: `query.*`, `json.path`

### Repair
Fix broken data: `fix.*`
