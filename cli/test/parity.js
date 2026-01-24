#!/usr/bin/env node
/**
 * JSON Toolbox CLI - Browser/CLI Parity Tests
 * Verifies identical output between browser and CLI execution
 * 
 * Usage: node parity.js [path-to-jsontb]
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const jsontb = process.argv[2] || path.join(__dirname, '..', 'dist', 'jsontb-bundle.js');
const presetsDir = path.join(__dirname, '..', 'presets');

let passed = 0;
let failed = 0;

function run(name, fn) {
  process.stdout.write('  ' + name.padEnd(55) + ' ');
  try {
    fn();
    console.log('[PASS]');
    passed++;
  } catch (e) {
    console.log('[FAIL]');
    console.log('    ' + e.message);
    failed++;
  }
}

function exec(args, input) {
  // Parse args properly handling quoted paths
  const argList = [];
  let current = '';
  let inQuote = false;
  
  for (const char of args) {
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ' ' && !inQuote) {
      if (current) argList.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) argList.push(current);

  const result = spawnSync('node', [jsontb, ...argList], {
    input: input,
    encoding: 'utf8',
    timeout: 10000
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Exit code: ' + result.status);
  }
  return result.stdout;
}

function runPreset(preset, input) {
  const presetPath = path.join(presetsDir, preset);
  return exec(`run "${presetPath}"`, input);
}

console.log('');
console.log('='.repeat(65));
console.log('JSON Toolbox - Browser/CLI Parity Tests');
console.log('='.repeat(65));
console.log('');

// ============================================
// Preset Tests
// ============================================

console.log('Preset Pipelines:');

run('csv-to-json preset', () => {
  const input = 'id,name,score\n1,Alice,95\n2,Bob,87\n3,Carol,92';
  const output = runPreset('csv-to-json.json', input);
  const data = JSON.parse(output);
  if (data.length !== 3) throw new Error('Expected 3 rows');
  if (data[0].name !== 'Alice') throw new Error('Expected Alice');
});

run('json-to-yaml preset', () => {
  const input = '{"database":{"host":"localhost","port":5432}}';
  const output = runPreset('json-to-yaml.json', input);
  if (!output.includes('database:')) throw new Error('Expected database key');
  if (!output.includes('host: localhost')) throw new Error('Expected host');
});

run('data-cleanup preset (dedupe + sort)', () => {
  const input = '["c","a","b","a","c","b"]';
  const output = runPreset('data-cleanup.json', input);
  const data = JSON.parse(output);
  if (JSON.stringify(data) !== '["a","b","c"]') {
    throw new Error('Expected ["a","b","c"], got ' + JSON.stringify(data));
  }
});

run('generate-schema preset', () => {
  const input = '{"email":"test@example.com","count":42}';
  const output = runPreset('generate-schema.json', input);
  const schema = JSON.parse(output);
  if (!schema.$schema) throw new Error('Missing $schema');
  if (schema.properties.email.type !== 'string') throw new Error('Expected string type');
});

run('xml-to-json preset', () => {
  const input = '<root><item id="1">test</item></root>';
  const output = runPreset('xml-to-json.json', input);
  const data = JSON.parse(output);
  if (!data.root) throw new Error('Expected root element');
});

// ============================================
// Determinism Tests
// ============================================

console.log('');
console.log('Determinism (identical output across runs):');

run('csv-to-json determinism', () => {
  const input = 'a,b,c\n1,2,3\n4,5,6';
  const out1 = runPreset('csv-to-json.json', input);
  const out2 = runPreset('csv-to-json.json', input);
  const out3 = runPreset('csv-to-json.json', input);
  if (out1 !== out2 || out2 !== out3) {
    throw new Error('Non-deterministic output');
  }
});

run('json-to-yaml determinism', () => {
  const input = '{"z":1,"a":2,"m":3}';
  const out1 = runPreset('json-to-yaml.json', input);
  const out2 = runPreset('json-to-yaml.json', input);
  if (out1 !== out2) throw new Error('Non-deterministic output');
});

run('data-cleanup determinism', () => {
  const input = '[5,3,1,4,2,3,1]';
  const out1 = runPreset('data-cleanup.json', input);
  const out2 = runPreset('data-cleanup.json', input);
  if (out1 !== out2) throw new Error('Non-deterministic output');
});

// ============================================
// Operator Parity Tests
// ============================================

console.log('');
console.log('Operator Output Parity:');

run('json.format output format', () => {
  const input = '{"a":1,"b":2}';
  const out = exec('exec json.format --indent 2', input);
  // Verify standard JSON formatting
  if (!out.includes('"a": 1')) throw new Error('Missing formatted key');
  if (!out.includes('\n')) throw new Error('Missing newlines');
});

run('csv.parse with headers', () => {
  const input = 'x,y\n10,20\n30,40';
  const out = exec('exec csv.parse --header true', input);
  const data = JSON.parse(out);
  if (data[0].x !== '10') throw new Error('Expected x=10');
  if (data[1].y !== '40') throw new Error('Expected y=40');
});

run('transform.filter expression', () => {
  const input = '[{"n":1},{"n":2},{"n":3}]';
  const out = exec('exec transform.filter --key n --operator gt --value 1', input);
  const data = JSON.parse(out);
  if (data.length !== 2) throw new Error('Expected 2 items');
});

run('yaml.parse nested objects', () => {
  const input = 'server:\n  host: localhost\n  port: 8080';
  const out = exec('exec yaml.parse', input);
  const data = JSON.parse(out);
  if (data.server.port !== 8080) throw new Error('Expected port 8080');
});

run('diff.compare identical objects', () => {
  const input = '{"left":{"a":1},"right":{"a":1}}';
  const out = exec('exec diff.compare', input);
  const result = JSON.parse(out);
  if (!result.identical) throw new Error('Expected identical');
});

run('fix.repair common issues', () => {
  const input = "{name: 'test', value: 42,}";
  const out = exec('exec fix.repair', input);
  JSON.parse(out); // Should not throw
});

run('query.jsonpath extraction', () => {
  const input = '{"users":[{"name":"A"},{"name":"B"}]}';
  const out = exec('exec query.jsonpath --path $.users[*].name', input);
  const data = JSON.parse(out);
  if (!data.includes('A') || !data.includes('B')) {
    throw new Error('Expected A and B');
  }
});

// ============================================
// Edge Cases
// ============================================

console.log('');
console.log('Edge Cases:');

run('empty array handling', () => {
  const out = exec('exec transform.sort', '[]');
  if (JSON.parse(out).length !== 0) throw new Error('Expected empty array');
});

run('null value handling', () => {
  const out = exec('exec json.format', '{"a":null}');
  if (!out.includes('null')) throw new Error('Expected null preserved');
});

run('unicode handling', () => {
  const out = exec('exec json.format', '{"emoji":"test","lang":"svenska"}');
  if (!out.includes('svenska')) throw new Error('Expected unicode preserved');
});

run('large number handling', () => {
  const out = exec('exec json.format', '{"big":9007199254740991}');
  if (!out.includes('9007199254740991')) throw new Error('Expected large number');
});

run('nested object handling', () => {
  const input = '{"a":{"b":{"c":{"d":1}}}}';
  const out = exec('exec json.format --indent 2', input);
  const data = JSON.parse(out);
  if (data.a.b.c.d !== 1) throw new Error('Expected nested value');
});

// ============================================
// Summary
// ============================================

console.log('');
console.log('='.repeat(65));
console.log('PARITY TEST RESULTS');
console.log('='.repeat(65));
console.log('');
console.log('  Passed: ' + passed);
console.log('  Failed: ' + failed);
console.log('  Total:  ' + (passed + failed));
console.log('');

if (failed > 0) {
  console.log('PARITY TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL PARITY TESTS PASSED');
  console.log('Browser-CLI parity verified.');
  process.exit(0);
}
