#!/usr/bin/env node
/**
 * JSON Toolbox CLI - Smoke Tests
 * Quick validation of core functionality
 * 
 * Usage: node smoke.js [path-to-jsontb]
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const jsontb = process.argv[2] || path.join(__dirname, '..', 'dist', 'jsontb.js');
const testDataDir = path.join(__dirname, 'data');

let passed = 0;
let failed = 0;

function run(name, fn) {
  process.stdout.write('  ' + name.padEnd(50) + ' ');
  try {
    fn();
    console.log('[PASS]');
    passed++;
  } catch (e) {
    console.log('[FAIL]');
    console.log('    Error: ' + e.message);
    failed++;
  }
}

function exec(args, input) {
  const result = spawnSync('node', [jsontb, ...args.split(' ')], {
    input: input,
    encoding: 'utf8',
    timeout: 10000
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Exit code: ' + result.status);
  }
  return result.stdout;
}

function assertEq(actual, expected, msg) {
  const a = typeof actual === 'string' ? actual.trim() : JSON.stringify(actual);
  const e = typeof expected === 'string' ? expected.trim() : JSON.stringify(expected);
  if (a !== e) {
    throw new Error((msg || 'Assertion failed') + '\n    Expected: ' + e + '\n    Actual: ' + a);
  }
}

function assertContains(actual, substring) {
  if (!actual.includes(substring)) {
    throw new Error('Expected to contain: ' + substring);
  }
}

console.log('');
console.log('='.repeat(60));
console.log('JSON Toolbox CLI - Smoke Tests');
console.log('='.repeat(60));
console.log('');
console.log('Testing: ' + jsontb);
console.log('');

// Check CLI exists
if (!fs.existsSync(jsontb)) {
  console.log('ERROR: CLI not found at ' + jsontb);
  console.log('Run "node build/bundle.js" first');
  process.exit(1);
}

// ============================================
// Basic Commands
// ============================================

console.log('Basic Commands:');

run('version', () => {
  const out = exec('version');
  assertContains(out, 'jsontb v2.0.0');
});

run('help', () => {
  const out = exec('help');
  assertContains(out, 'COMMANDS');
  assertContains(out, 'run');
  assertContains(out, 'exec');
});

run('list-operators', () => {
  const out = exec('list-operators');
  assertContains(out, 'json.parse');
  assertContains(out, 'csv.parse');
  assertContains(out, 'yaml.parse');
});

run('list-operators --json', () => {
  const out = exec('list-operators --json');
  const ops = JSON.parse(out);
  if (!Array.isArray(ops) || ops.length < 30) {
    throw new Error('Expected 30+ operators, got ' + ops.length);
  }
});

// ============================================
// JSON Operators
// ============================================

console.log('');
console.log('JSON Operators:');

run('json.parse', () => {
  const out = exec('exec json.parse', '{"a":1}');
  assertEq(JSON.parse(out), { a: 1 });
});

run('json.stringify', () => {
  const out = exec('exec json.stringify --indent 0', '{"a":1}');
  assertEq(out.trim(), '{"a":1}');
});

run('json.format', () => {
  const out = exec('exec json.format --indent 2', '{"a":1,"b":2}');
  assertContains(out, '"a": 1');
});

run('json.minify', () => {
  const out = exec('exec json.minify', '{\n  "a": 1\n}');
  assertEq(out.trim(), '{"a":1}');
});

run('json.validate (valid)', () => {
  const out = exec('exec json.validate', '{"valid":true}');
  const result = JSON.parse(out);
  if (!result.valid) throw new Error('Expected valid');
});

run('json.validate (invalid)', () => {
  const out = exec('exec json.validate', '{invalid}');
  const result = JSON.parse(out);
  if (result.valid) throw new Error('Expected invalid');
});

run('json.path', () => {
  const out = exec('exec json.path --path user.name', '{"user":{"name":"test"}}');
  // String values are returned unquoted
  assertEq(out.trim(), 'test');
});

run('json.keys', () => {
  const out = exec('exec json.keys', '{"a":1,"b":2}');
  const keys = JSON.parse(out);
  assertEq(keys.sort(), ['a', 'b']);
});

// ============================================
// CSV Operators
// ============================================

console.log('');
console.log('CSV Operators:');

run('csv.parse', () => {
  const out = exec('exec csv.parse --header true', 'name,age\nAlice,30\nBob,25');
  const data = JSON.parse(out);
  assertEq(data.length, 2);
  assertEq(data[0].name, 'Alice');
});

run('csv.stringify', () => {
  const out = exec('exec csv.stringify', '[{"name":"Alice","age":30}]');
  assertContains(out, 'name,age');
  assertContains(out, 'Alice,30');
});

run('csv.parse (semicolon delimiter)', () => {
  const out = exec('exec csv.parse', 'a;b;c\n1;2;3');
  const data = JSON.parse(out);
  assertEq(data[0].a, '1');
});

// ============================================
// YAML Operators
// ============================================

console.log('');
console.log('YAML Operators:');

run('yaml.parse', () => {
  const out = exec('exec yaml.parse', 'name: test\nvalue: 42');
  const data = JSON.parse(out);
  assertEq(data.name, 'test');
  assertEq(data.value, 42);
});

run('yaml.stringify', () => {
  const out = exec('exec yaml.stringify', '{"name":"test"}');
  assertContains(out, 'name: test');
});

run('yaml.parse (array)', () => {
  const out = exec('exec yaml.parse', '- one\n- two\n- three');
  const data = JSON.parse(out);
  assertEq(data, ['one', 'two', 'three']);
});

run('yaml.validate (valid)', () => {
  const out = exec('exec yaml.validate', 'valid: true');
  const result = JSON.parse(out);
  if (!result.valid) throw new Error('Expected valid');
});

// ============================================
// XML Operators
// ============================================

console.log('');
console.log('XML Operators:');

run('xml.parse', () => {
  const out = exec('exec xml.parse', '<root><item>test</item></root>');
  const data = JSON.parse(out);
  if (!data.root) throw new Error('Expected root element');
});

run('xml.stringify', () => {
  const out = exec('exec xml.stringify', '{"root":{"item":"test"}}');
  assertContains(out, '<root>');
  assertContains(out, '<item>test</item>');
});

// ============================================
// Transform Operators
// ============================================

console.log('');
console.log('Transform Operators:');

run('transform.sort', () => {
  const out = exec('exec transform.sort', '[3,1,2]');
  assertEq(JSON.parse(out), [1, 2, 3]);
});

run('transform.sort (by key)', () => {
  const out = exec('exec transform.sort --key name', '[{"name":"B"},{"name":"A"}]');
  const data = JSON.parse(out);
  assertEq(data[0].name, 'A');
});

run('transform.filter', () => {
  const out = exec('exec transform.filter --key age --operator gt --value 25', 
    '[{"name":"Alice","age":30},{"name":"Bob","age":20}]');
  const data = JSON.parse(out);
  assertEq(data.length, 1);
  assertEq(data[0].name, 'Alice');
});

run('transform.unique', () => {
  const out = exec('exec transform.unique', '[1,2,2,3,3,3]');
  assertEq(JSON.parse(out), [1, 2, 3]);
});

run('transform.flatten', () => {
  const out = exec('exec transform.flatten', '[[1,2],[3,4]]');
  assertEq(JSON.parse(out), [1, 2, 3, 4]);
});

run('transform.group', () => {
  const out = exec('exec transform.group --key type', 
    '[{"type":"a","v":1},{"type":"b","v":2},{"type":"a","v":3}]');
  const data = JSON.parse(out);
  assertEq(data.a.length, 2);
  assertEq(data.b.length, 1);
});

// ============================================
// Diff Operators
// ============================================

console.log('');
console.log('Diff Operators:');

run('diff.compare (identical)', () => {
  const out = exec('exec diff.compare', '{"left":{"a":1},"right":{"a":1}}');
  const result = JSON.parse(out);
  if (!result.identical) throw new Error('Expected identical');
});

run('diff.compare (different)', () => {
  const out = exec('exec diff.compare', '{"left":{"a":1},"right":{"a":2}}');
  const result = JSON.parse(out);
  if (result.identical) throw new Error('Expected different');
  assertEq(result.count, 1);
});

// ============================================
// Fix Operators
// ============================================

console.log('');
console.log('Fix Operators:');

run('fix.repair (trailing comma)', () => {
  const out = exec('exec fix.repair', '{"a":1,}');
  assertEq(JSON.parse(out), { a: 1 });
});

run('fix.repair (single quotes)', () => {
  const out = exec('exec fix.repair', "{'a':1}");
  assertEq(JSON.parse(out), { a: 1 });
});

run('fix.repair (unquoted keys)', () => {
  const out = exec('exec fix.repair', '{a:1}');
  assertEq(JSON.parse(out), { a: 1 });
});

// ============================================
// Schema Operators
// ============================================

console.log('');
console.log('Schema Operators:');

run('schema.generate', () => {
  const out = exec('exec schema.generate', '{"name":"test","count":42}');
  const schema = JSON.parse(out);
  assertContains(schema.$schema, 'json-schema.org');
  assertEq(schema.properties.name.type, 'string');
  assertEq(schema.properties.count.type, 'integer');
});

run('schema.validate (valid)', () => {
  // Test basic schema validation using schema object in input
  // The validator should accept a number when schema says type:number
  const input = JSON.stringify({ type: 'number' });
  const out = exec('exec schema.validate --schema ' + input, '42');
  const result = JSON.parse(out);
  if (!result.valid) throw new Error('Expected valid: ' + JSON.stringify(result));
});

// ============================================
// Query Operators
// ============================================

console.log('');
console.log('Query Operators:');

run('query.jsonpath', () => {
  const out = exec('exec query.jsonpath --path $.users[0].name', 
    '{"users":[{"name":"Alice"},{"name":"Bob"}]}');
  const result = JSON.parse(out);
  assertEq(result[0], 'Alice');
});

run('query.select', () => {
  const out = exec('exec query.select --select name --limit 1', 
    '[{"name":"Alice","age":30},{"name":"Bob","age":25}]');
  const result = JSON.parse(out);
  assertEq(result.length, 1);
  assertEq(result[0].name, 'Alice');
});

// ============================================
// Determinism Tests
// ============================================

console.log('');
console.log('Determinism Tests:');

run('identical output on repeated runs', () => {
  const input = '{"z":1,"a":2,"m":3}';
  const out1 = exec('exec json.format --indent 2', input);
  const out2 = exec('exec json.format --indent 2', input);
  const out3 = exec('exec json.format --indent 2', input);
  if (out1 !== out2 || out2 !== out3) {
    throw new Error('Non-deterministic output detected');
  }
});

run('sort determinism', () => {
  const input = '[{"k":"c"},{"k":"a"},{"k":"b"}]';
  const out1 = exec('exec transform.sort --key k', input);
  const out2 = exec('exec transform.sort --key k', input);
  assertEq(out1, out2);
});

// ============================================
// Summary
// ============================================

console.log('');
console.log('='.repeat(60));
console.log('RESULTS');
console.log('='.repeat(60));
console.log('');
console.log('  Passed: ' + passed);
console.log('  Failed: ' + failed);
console.log('  Total:  ' + (passed + failed));
console.log('');

if (failed > 0) {
  console.log('SMOKE TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL SMOKE TESTS PASSED');
  process.exit(0);
}
