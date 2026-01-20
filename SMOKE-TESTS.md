# JSON Toolbox - Smoke Test Pack v1.0

**Created:** 2026-01-19
**Purpose:** RC1 validation and ongoing QA
**Coverage:** All 13 modules with realistic developer data

---

## Test Protocol

### Pre-Test Setup
1. Start local dev server: `php -S localhost:8000`
2. Open http://localhost:8000/tools/json/
3. Clear browser cache and localStorage
4. Test in both light and dark mode
5. Test in Swedish (default) and English (?lang=en)

### Test Execution
- Run each test case in order
- Mark PASS/FAIL with timestamp
- Note any console errors
- Document any visual issues
- Test keyboard shortcuts on each module

---

## 1. CSV Module Tests

### Test 1.1: Comma-Delimited CSV
**Input:**
```csv
name,email,age,active
Alice,alice@example.com,28,true
Bob,bob@example.com,34,false
Charlie,charlie@example.com,22,true
```

**Expected Output:**
```json
[
  {"name": "Alice", "email": "alice@example.com", "age": "28", "active": "true"},
  {"name": "Bob", "email": "bob@example.com", "age": "34", "active": "false"},
  {"name": "Charlie", "email": "charlie@example.com", "age": "22", "active": "true"}
]
```

**Acceptance:** Array of 3 objects with 4 keys each

---

### Test 1.2: Semicolon-Delimited CSV (European format)
**Input:**
```csv
product;price;quantity
"Laptop";9999,00;5
"Mouse";199,50;25
"Keyboard";599,00;12
```

**Expected Output:** Array of 3 objects (auto-detect semicolon delimiter)

---

### Test 1.3: Tab-Delimited CSV
**Input:**
```
id	name	department
1	John Doe	Engineering
2	Jane Smith	Marketing
3	Bob Wilson	Sales
```

**Expected Output:** Array with tab-delimited parsing

---

### Test 1.4: CSV with Quoted Fields and Commas
**Input:**
```csv
title,description,price
"Widget A","A simple, affordable widget",19.99
"Widget B","Premium widget, with extras",49.99
```

**Expected Output:** Commas inside quotes preserved in strings

---

### Test 1.5: CSV Edge Case - Empty Fields
**Input:**
```csv
name,middle,last
John,,Doe
Jane,Marie,Smith
,Anonymous,
```

**Expected Output:** Empty strings for missing values

---

## 2. XML Module Tests

### Test 2.1: Simple XML
**Input:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user id="1">
    <name>Alice</name>
    <email>alice@example.com</email>
  </user>
  <user id="2">
    <name>Bob</name>
    <email>bob@example.com</email>
  </user>
</users>
```

**Expected Output:** Nested JSON object with users array

---

### Test 2.2: XML with Namespaces
**Input:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <auth:Token xmlns:auth="http://example.com/auth">abc123</auth:Token>
  </soap:Header>
  <soap:Body>
    <ns:GetUserRequest xmlns:ns="http://example.com/users">
      <ns:UserId>42</ns:UserId>
    </ns:GetUserRequest>
  </soap:Body>
</soap:Envelope>
```

**Expected Output:** JSON preserving namespace prefixes

---

### Test 2.3: XML with Attributes and CDATA
**Input:**
```xml
<article id="123" status="published">
  <title>Test Article</title>
  <content><![CDATA[<p>HTML content here</p>]]></content>
  <meta key="author" value="John Doe"/>
</article>
```

**Expected Output:** Attributes converted to properties (@id, @status, etc.)

---

### Test 2.4: XML Error Case - Invalid XML
**Input:**
```xml
<root>
  <unclosed>
  <invalid attr=>text</invalid>
</root>
```

**Expected Output:** Error message with line/position info

---

## 3. YAML Module Tests

### Test 3.1: Simple YAML
**Input:**
```yaml
server:
  host: localhost
  port: 8080
  ssl: true
database:
  driver: postgresql
  host: db.example.com
  name: myapp
```

**Expected Output:**
```json
{
  "server": {"host": "localhost", "port": 8080, "ssl": true},
  "database": {"driver": "postgresql", "host": "db.example.com", "name": "myapp"}
}
```

---

### Test 3.2: YAML with Anchors and Aliases
**Input:**
```yaml
defaults: &defaults
  adapter: postgres
  host: localhost
  pool: 5

development:
  <<: *defaults
  database: myapp_development

test:
  <<: *defaults
  database: myapp_test

production:
  <<: *defaults
  host: db.production.com
  database: myapp_production
  pool: 25
```

**Expected Output:** Anchors resolved, each environment inherits defaults

---

### Test 3.3: YAML with Complex Types
**Input:**
```yaml
multiline: |
  This is a
  multiline string
  with newlines preserved.
folded: >
  This is a folded
  string that becomes
  one line.
list:
  - item1
  - item2
  - nested:
      key: value
date: 2026-01-19
null_value: null
bool_values:
  - true
  - false
  - yes
  - no
```

**Expected Output:** Correct type coercion for dates, nulls, booleans

---

### Test 3.4: YAML Error Case
**Input:**
```yaml
bad: indentation
  wrong: level
    invalid: nesting
```

**Expected Output:** Error with line number

---

## 4. JSON Format Module Tests

### Test 4.1: Beautify Minified JSON
**Input:**
```json
{"users":[{"id":1,"name":"Alice","roles":["admin","user"]},{"id":2,"name":"Bob","roles":["user"]}],"meta":{"total":2}}
```

**Expected Output:** Formatted with 2-space indentation

---

### Test 4.2: Minify JSON
**Input:**
```json
{
  "name": "Test",
  "value": 123,
  "nested": {
    "deep": true
  }
}
```

**Expected Output:** Single line, no whitespace

---

### Test 4.3: Sort Keys Alphabetically
**Input:**
```json
{"zebra": 1, "alpha": 2, "mike": 3, "beta": 4}
```

**Expected Output:** `{"alpha": 2, "beta": 4, "mike": 3, "zebra": 1}`

---

### Test 4.4: Large JSON (Performance Test)
**Input:** Generate 1000+ element array
```json
[{"id":0,"value":"test0"},{"id":1,"value":"test1"},...,{"id":999,"value":"test999"}]
```

**Expected Output:** Formatted without lag (< 500ms)

---

## 5. JSON Validate Module Tests

### Test 5.1: Valid JSON
**Input:**
```json
{"name": "Test", "count": 42, "active": true, "tags": ["a", "b"]}
```

**Expected Output:** "Valid JSON" with structure analysis

---

### Test 5.2: Invalid JSON - Trailing Comma
**Input:**
```json
{"name": "Test", "value": 123,}
```

**Expected Output:** Error at position, suggest "Send to Fix"

---

### Test 5.3: Invalid JSON - Single Quotes
**Input:**
```json
{'name': 'Test'}
```

**Expected Output:** Error, JSON requires double quotes

---

### Test 5.4: Invalid JSON - Unquoted Keys
**Input:**
```json
{name: "Test", value: 123}
```

**Expected Output:** Error, keys must be quoted

---

## 6. JSON Fix Module Tests

### Test 6.1: Fix Trailing Commas
**Input:**
```json
{
  "items": [1, 2, 3,],
  "name": "test",
}
```

**Expected Output:** Valid JSON without trailing commas

---

### Test 6.2: Fix Single Quotes
**Input:**
```json
{'name': 'Alice', 'age': 30}
```

**Expected Output:** Double-quoted JSON

---

### Test 6.3: Fix JavaScript Comments
**Input:**
```javascript
{
  // Configuration
  "debug": true,
  /* API settings */
  "api": {
    "url": "https://api.example.com"
  }
}
```

**Expected Output:** Valid JSON without comments

---

### Test 6.4: Fix Python Values
**Input:**
```python
{"active": True, "disabled": False, "value": None}
```

**Expected Output:** `{"active": true, "disabled": false, "value": null}`

---

## 7. JSON Diff Module Tests

### Test 7.1: Object Differences
**JSON A:**
```json
{"name": "Alice", "age": 30, "city": "Stockholm"}
```

**JSON B:**
```json
{"name": "Alice", "age": 31, "country": "Sweden"}
```

**Expected Output:**
- Changed: age (30 -> 31)
- Removed: city
- Added: country

---

### Test 7.2: Array Differences
**JSON A:**
```json
{"items": [1, 2, 3, 4]}
```

**JSON B:**
```json
{"items": [1, 2, 5]}
```

**Expected Output:** Shows array element changes

---

### Test 7.3: Identical Objects
**JSON A & B:**
```json
{"same": true, "value": 123}
```

**Expected Output:** "No differences found"

---

## 8. JSONPath Query Module Tests

### Test 8.1: Root Query
**Input:**
```json
{"store": {"book": [{"title": "A"}, {"title": "B"}]}}
```

**Query:** `$`

**Expected Output:** Entire object

---

### Test 8.2: Nested Property
**Query:** `$.store.book`

**Expected Output:** Array of books

---

### Test 8.3: Array Wildcard
**Query:** `$.store.book[*].title`

**Expected Output:** `["A", "B"]`

---

### Test 8.4: Filter Expression
**Input:**
```json
{
  "products": [
    {"name": "A", "price": 10},
    {"name": "B", "price": 25},
    {"name": "C", "price": 5}
  ]
}
```

**Query:** `$.products[?(@.price < 15)]`

**Expected Output:** Products A and C

---

## 9. JSON Schema Module Tests

### Test 9.1: Generate Schema from Object
**Input:**
```json
{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com",
  "active": true
}
```

**Expected Output:** JSON Schema with string/integer/boolean types

---

### Test 9.2: Generate Schema from Array
**Input:**
```json
[
  {"id": 1, "name": "A"},
  {"id": 2, "name": "B"}
]
```

**Expected Output:** Array schema with items definition

---

### Test 9.3: Validate Against Schema
**Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "age"],
  "properties": {
    "name": {"type": "string"},
    "age": {"type": "integer", "minimum": 0}
  }
}
```

**Valid Input:**
```json
{"name": "Alice", "age": 30}
```

**Invalid Input:**
```json
{"name": "Bob", "age": -5}
```

**Expected Output:** Validation pass/fail with error details

---

## 10. Transform Module Tests

### Test 10.1: Generate TypeScript Interface
**Input:**
```json
{
  "user": {
    "id": 123,
    "name": "Alice",
    "email": "alice@example.com",
    "roles": ["admin", "user"]
  }
}
```

**Expected Output:**
```typescript
interface Root {
  user: User;
}

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}
```

---

### Test 10.2: Generate Go Struct
**Expected Output:**
```go
type Root struct {
    User User `json:"user"`
}

type User struct {
    ID    int      `json:"id"`
    Name  string   `json:"name"`
    Email string   `json:"email"`
    Roles []string `json:"roles"`
}
```

---

## 11. Utilities Module Tests

### Test 11.1: Base64 Encode/Decode
**Input:** `Hello, World!`
**Encoded:** `SGVsbG8sIFdvcmxkIQ==`

---

### Test 11.2: URL Encode/Decode
**Input:** `name=Alice&city=Stockholm`
**Encoded:** `name%3DAlice%26city%3DStockholm`

---

### Test 11.3: JSON Escape/Unescape
**Input:** `Line 1\nLine 2\tTabbed`
**Escaped:** `Line 1\\nLine 2\\tTabbed`

---

## 12. Tree Module Tests

### Test 12.1: Render Complex Tree
**Input:**
```json
{
  "company": {
    "name": "Acme Corp",
    "departments": [
      {
        "name": "Engineering",
        "employees": [{"name": "Alice"}, {"name": "Bob"}]
      },
      {
        "name": "Marketing",
        "employees": [{"name": "Charlie"}]
      }
    ]
  }
}
```

**Expected Output:** Expandable/collapsible tree view with path display

---

### Test 12.2: Click to Copy Path
**Action:** Click on "Alice" node
**Expected Output:** Path `$.company.departments[0].employees[0].name` copied

---

## 13. CSS Module Tests

### Test 13.1: CSS to JSON
**Input:**
```css
.button {
  background-color: #007bff;
  padding: 10px 20px;
  border-radius: 4px;
}

.button:hover {
  background-color: #0056b3;
}
```

**Expected Output:** JSON representation of CSS rules

---

## Global UI Tests

### Test G.1: Keyboard Shortcuts
| Shortcut | Action | Expected |
|----------|--------|----------|
| ? | Show help | Modal opens |
| Escape | Close modal | Modal closes |
| Ctrl+1 | Go to CSV tab | Tab switches |
| Ctrl+Tab | Next tab | Cycles forward |
| Ctrl+Shift+Tab | Previous tab | Cycles backward |

---

### Test G.2: Dark Mode
1. Toggle to dark mode
2. Verify all text readable (contrast >= 4.5:1)
3. Verify inputs, buttons, modals styled correctly

---

### Test G.3: Language Switch
1. Navigate to `?lang=en`
2. Verify all UI labels in English
3. Test all modules function identically

---

### Test G.4: localStorage Persistence
1. Enter data in CSV input
2. Refresh page
3. Verify data persists

---

### Test G.5: Hash Routing
1. Click Format tab
2. Verify URL shows `#format`
3. Copy URL, open in new tab
4. Verify Format tab active

---

## Error Case Summary

| Test | Error Type | Expected Behavior |
|------|------------|-------------------|
| 2.4 | Invalid XML | Show line/position error |
| 3.4 | Invalid YAML | Show line number error |
| 5.2-5.4 | Invalid JSON | Show specific error + suggest Fix |
| 8.4 | Complex JSONPath | Graceful fallback if unsupported |

---

## Test Results Template

```markdown
## Smoke Test Results - [DATE]

**Tester:** [Name]
**Browser:** [Chrome/Firefox/Safari version]
**Theme:** [Light/Dark]
**Language:** [sv/en]

| Test ID | Result | Notes |
|---------|--------|-------|
| 1.1 | PASS/FAIL | |
| 1.2 | PASS/FAIL | |
| ... | ... | |

**Console Errors:** [None / List]
**Visual Issues:** [None / List]
**Overall Status:** PASS / FAIL
```

---

## Automated Test Commands

For CI/CD integration (future):

```bash
# Start server
php -S localhost:8000 &

# Wait for server
sleep 2

# Run validation script
curl -s http://localhost:8000/tools/json/ | grep -q "JSON Toolbox" && echo "PASS: Page loads"

# Check all module files exist
for m in csv css xml yaml format validate fix diff query schema transform utilities tree; do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/tools/json/modules/$m.js | grep -q 200 && echo "PASS: $m.js"
done

# Check CDN libraries
curl -s -o /dev/null -w "%{http_code}" https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js | grep -q 200 && echo "PASS: PapaParse CDN"
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-19
