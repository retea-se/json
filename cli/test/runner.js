#!/usr/bin/env node
/**
 * JSON Toolbox CLI - Test Runner
 * Runs all operator and pipeline tests
 */

'use strict';

const { OperatorRegistry, Pipeline, loadOperators } = require('../lib/index.js');

// ============================================
// Test Utilities
// ============================================

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

function assertEqual(actual, expected, msg = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${msg}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
  }
}

function assertThrows(fn, msg = '') {
  try {
    fn();
    throw new Error(`${msg || 'Expected function to throw'}`);
  } catch (e) {
    if (e.message.startsWith('Expected function to throw')) throw e;
    // Expected
  }
}

// ============================================
// JSON Operator Tests
// ============================================

function testJsonOperators() {
  console.log('\nJSON Operators:');

  test('json.parse - basic object', () => {
    const result = OperatorRegistry.execute('json.parse', '{"a":1}');
    assertEqual(result, { a: 1 });
  });

  test('json.parse - array', () => {
    const result = OperatorRegistry.execute('json.parse', '[1,2,3]');
    assertEqual(result, [1, 2, 3]);
  });

  test('json.parse - invalid JSON throws', () => {
    assertThrows(() => OperatorRegistry.execute('json.parse', '{invalid}'));
  });

  test('json.stringify - basic object', () => {
    const result = OperatorRegistry.execute('json.stringify', { a: 1 }, { minify: true });
    assertEqual(result, '{"a":1}');
  });

  test('json.stringify - with indent', () => {
    const result = OperatorRegistry.execute('json.stringify', { a: 1 }, { indent: 2 });
    assertEqual(result, '{\n  "a": 1\n}');
  });

  test('json.stringify - sortKeys', () => {
    const result = OperatorRegistry.execute('json.stringify', { b: 2, a: 1 }, { sortKeys: true, minify: true });
    assertEqual(result, '{"a":1,"b":2}');
  });

  test('json.format - prettify', () => {
    const result = OperatorRegistry.execute('json.format', '{"a":1}', { indent: 2 });
    assertEqual(result, '{\n  "a": 1\n}');
  });

  test('json.minify - compact', () => {
    const result = OperatorRegistry.execute('json.minify', '{\n  "a": 1\n}');
    assertEqual(result, '{"a":1}');
  });

  test('json.validate - valid', () => {
    const result = OperatorRegistry.execute('json.validate', '{"a":1}');
    assertEqual(result.valid, true);
  });

  test('json.validate - invalid', () => {
    const result = OperatorRegistry.execute('json.validate', '{invalid}');
    assertEqual(result.valid, false);
  });

  test('json.path - simple path', () => {
    const result = OperatorRegistry.execute('json.path', { a: { b: 1 } }, { path: 'a.b' });
    assertEqual(result, 1);
  });

  test('json.path - array index', () => {
    const result = OperatorRegistry.execute('json.path', { a: [1, 2, 3] }, { path: 'a[1]' });
    assertEqual(result, 2);
  });

  test('json.keys - object keys', () => {
    const result = OperatorRegistry.execute('json.keys', { a: 1, b: 2 });
    assertEqual(result.sort(), ['a', 'b']);
  });

  test('json.values - object values', () => {
    const result = OperatorRegistry.execute('json.values', { a: 1, b: 2 });
    assertEqual(result.sort(), [1, 2]);
  });

  test('json.entries - object entries', () => {
    const result = OperatorRegistry.execute('json.entries', { a: 1 });
    assertEqual(result, [['a', 1]]);
  });

  test('json.fromEntries - array to object', () => {
    const result = OperatorRegistry.execute('json.fromEntries', [['a', 1], ['b', 2]]);
    assertEqual(result, { a: 1, b: 2 });
  });
}

// ============================================
// CSV Operator Tests
// ============================================

function testCsvOperators() {
  console.log('\nCSV Operators:');

  test('csv.parse - basic with header', () => {
    const result = OperatorRegistry.execute('csv.parse', 'a,b\n1,2');
    assertEqual(result, [{ a: '1', b: '2' }]);
  });

  test('csv.parse - without header', () => {
    const result = OperatorRegistry.execute('csv.parse', 'a,b\n1,2', { header: false });
    assertEqual(result, [['a', 'b'], ['1', '2']]);
  });

  test('csv.parse - tab delimiter', () => {
    const result = OperatorRegistry.execute('csv.parse', 'a\tb\n1\t2', { delimiter: '\t' });
    assertEqual(result, [{ a: '1', b: '2' }]);
  });

  test('csv.parse - auto-detect delimiter', () => {
    const result = OperatorRegistry.execute('csv.parse', 'a;b\n1;2');
    assertEqual(result, [{ a: '1', b: '2' }]);
  });

  test('csv.parse - quoted fields', () => {
    const result = OperatorRegistry.execute('csv.parse', 'a,b\n"hello, world",2');
    assertEqual(result, [{ a: 'hello, world', b: '2' }]);
  });

  test('csv.stringify - array of objects', () => {
    const result = OperatorRegistry.execute('csv.stringify', [{ a: '1', b: '2' }]);
    assertEqual(result, 'a,b\n1,2');
  });

  test('csv.stringify - custom delimiter', () => {
    const result = OperatorRegistry.execute('csv.stringify', [{ a: '1', b: '2' }], { delimiter: ';' });
    assertEqual(result, 'a;b\n1;2');
  });

  test('csv.transpose - array of objects', () => {
    const result = OperatorRegistry.execute('csv.transpose', [{ a: '1', b: '2' }]);
    assertEqual(result, [{ _key: 'a', col_1: '1' }, { _key: 'b', col_1: '2' }]);
  });
}

// ============================================
// Transform Operator Tests
// ============================================

function testTransformOperators() {
  console.log('\nTransform Operators:');

  test('transform.sort - basic', () => {
    const result = OperatorRegistry.execute('transform.sort', [3, 1, 2]);
    assertEqual(result, [1, 2, 3]);
  });

  test('transform.sort - by key', () => {
    const result = OperatorRegistry.execute('transform.sort', [{ n: 3 }, { n: 1 }], { key: 'n' });
    assertEqual(result, [{ n: 1 }, { n: 3 }]);
  });

  test('transform.sort - descending', () => {
    const result = OperatorRegistry.execute('transform.sort', [1, 3, 2], { order: 'desc' });
    assertEqual(result, [3, 2, 1]);
  });

  test('transform.filter - equality', () => {
    const result = OperatorRegistry.execute('transform.filter', [{ a: 1 }, { a: 2 }], { key: 'a', value: '1' });
    assertEqual(result, [{ a: 1 }]);
  });

  test('transform.filter - expression', () => {
    const result = OperatorRegistry.execute('transform.filter', [{ a: 1 }, { a: 2 }], { expression: 'a == 2' });
    assertEqual(result, [{ a: 2 }]);
  });

  test('transform.map - pick', () => {
    const result = OperatorRegistry.execute('transform.map', [{ a: 1, b: 2 }], { pick: ['a'] });
    assertEqual(result, [{ a: 1 }]);
  });

  test('transform.map - omit', () => {
    const result = OperatorRegistry.execute('transform.map', [{ a: 1, b: 2 }], { omit: ['b'] });
    assertEqual(result, [{ a: 1 }]);
  });

  test('transform.map - extract', () => {
    const result = OperatorRegistry.execute('transform.map', [{ a: 1 }, { a: 2 }], { extract: 'a' });
    assertEqual(result, [1, 2]);
  });

  test('transform.flatten - depth 1', () => {
    const result = OperatorRegistry.execute('transform.flatten', [[1, 2], [3, 4]]);
    assertEqual(result, [1, 2, 3, 4]);
  });

  test('transform.unique - primitives', () => {
    const result = OperatorRegistry.execute('transform.unique', [1, 2, 2, 3]);
    assertEqual(result, [1, 2, 3]);
  });

  test('transform.unique - by key', () => {
    const result = OperatorRegistry.execute('transform.unique', [{ a: 1 }, { a: 1 }, { a: 2 }], { key: 'a' });
    assertEqual(result, [{ a: 1 }, { a: 2 }]);
  });

  test('transform.reverse', () => {
    const result = OperatorRegistry.execute('transform.reverse', [1, 2, 3]);
    assertEqual(result, [3, 2, 1]);
  });

  test('transform.slice - start/end', () => {
    const result = OperatorRegistry.execute('transform.slice', [1, 2, 3, 4], { start: 1, end: 3 });
    assertEqual(result, [2, 3]);
  });

  test('transform.slice - limit', () => {
    const result = OperatorRegistry.execute('transform.slice', [1, 2, 3, 4], { limit: 2 });
    assertEqual(result, [1, 2]);
  });

  test('transform.group - by key', () => {
    const result = OperatorRegistry.execute('transform.group', [{ t: 'a', v: 1 }, { t: 'b', v: 2 }, { t: 'a', v: 3 }], { key: 't' });
    assertEqual(result, { a: [{ t: 'a', v: 1 }, { t: 'a', v: 3 }], b: [{ t: 'b', v: 2 }] });
  });

  test('transform.count - simple', () => {
    const result = OperatorRegistry.execute('transform.count', [1, 2, 3]);
    assertEqual(result, 3);
  });

  test('transform.count - by key', () => {
    const result = OperatorRegistry.execute('transform.count', [{ t: 'a' }, { t: 'b' }, { t: 'a' }], { key: 't' });
    assertEqual(result, { a: 2, b: 1 });
  });

  test('transform.merge - shallow', () => {
    const result = OperatorRegistry.execute('transform.merge', [{ a: 1 }, { b: 2 }]);
    assertEqual(result, { a: 1, b: 2 });
  });
}

// ============================================
// Pipeline Tests
// ============================================

function testPipeline() {
  console.log('\nPipeline Engine:');

  test('pipeline validate - valid manifest', () => {
    const engine = new Pipeline.Engine();
    const result = engine.validate({
      name: 'test-pipeline',
      version: '1.0.0',
      steps: [{ operator: 'json.parse' }]
    });
    assertEqual(result.valid, true);
  });

  test('pipeline validate - missing name', () => {
    const engine = new Pipeline.Engine();
    const result = engine.validate({
      version: '1.0.0',
      steps: [{ operator: 'json.parse' }]
    });
    assertEqual(result.valid, false);
  });

  test('pipeline validate - unknown operator', () => {
    const engine = new Pipeline.Engine();
    const result = engine.validate({
      name: 'test',
      version: '1.0.0',
      steps: [{ operator: 'unknown.op' }]
    });
    assertEqual(result.valid, false);
  });

  test('pipeline execute - single step', () => {
    const engine = new Pipeline.Engine();
    const result = engine.execute({
      name: 'test',
      version: '1.0.0',
      steps: [{ operator: 'json.parse' }]
    }, '{"a":1}');
    assertEqual(result.success, true);
    assertEqual(result.output, { a: 1 });
  });

  test('pipeline execute - multiple steps', () => {
    const engine = new Pipeline.Engine();
    const result = engine.execute({
      name: 'test',
      version: '1.0.0',
      steps: [
        { operator: 'csv.parse', params: { header: true } },
        { operator: 'json.stringify', params: { minify: true } }
      ]
    }, 'a,b\n1,2');
    assertEqual(result.success, true);
    assertEqual(result.output, '[{"a":"1","b":"2"}]');
  });

  test('pipeline execute - with params', () => {
    const engine = new Pipeline.Engine();
    const result = engine.execute({
      name: 'test',
      version: '1.0.0',
      steps: [
        { operator: 'json.parse' },
        { operator: 'transform.sort', params: { key: 'n' } },
        { operator: 'json.stringify', params: { minify: true } }
      ]
    }, '[{"n":3},{"n":1},{"n":2}]');
    assertEqual(result.success, true);
    assertEqual(result.output, '[{"n":1},{"n":2},{"n":3}]');
  });

  test('pipeline execute - error handling (stop)', () => {
    const engine = new Pipeline.Engine();
    const result = engine.execute({
      name: 'test',
      version: '1.0.0',
      steps: [
        { operator: 'json.parse' },
        { operator: 'json.parse' } // Will fail - input is object, not string
      ]
    }, '{"a":1}');
    assertEqual(result.success, false);
    assertEqual(result.error.step, 1);
  });

  test('pipeline execute - collect metrics', () => {
    const engine = new Pipeline.Engine({ collectMetrics: true });
    const result = engine.execute({
      name: 'test',
      version: '1.0.0',
      steps: [{ operator: 'json.parse' }]
    }, '{"a":1}');
    assertEqual(result.success, true);
    assertEqual(typeof result.metrics.totalDuration, 'number');
    assertEqual(result.metrics.stepCount, 1);
  });

  test('pipeline plan - execution plan', () => {
    const engine = new Pipeline.Engine();
    const plan = engine.plan({
      name: 'test',
      version: '1.0.0',
      steps: [
        { operator: 'csv.parse' },
        { operator: 'json.stringify' }
      ]
    }, 'string');
    assertEqual(plan.valid, true);
    assertEqual(plan.steps.length, 2);
    assertEqual(plan.steps[0].operator, 'csv.parse');
    assertEqual(plan.steps[1].operator, 'json.stringify');
  });
}

// ============================================
// Main
// ============================================

function main() {
  console.log('JSON Toolbox CLI - Test Suite');
  console.log('==============================');

  // Load operators
  loadOperators();

  // Run tests
  testJsonOperators();
  testCsvOperators();
  testTransformOperators();
  testPipeline();

  // Summary
  console.log('\n==============================');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => {
      console.log(`  - ${f.name}: ${f.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
