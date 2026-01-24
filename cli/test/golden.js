#!/usr/bin/env node
/**
 * JSON Toolbox CLI - Golden Baseline Tests
 * Verifies byte-identical deterministic output
 * 
 * Determinism Guarantees:
 * - Same input + same params = same output (always)
 * - Output is reproducible across runs
 * - No randomness, no timestamps in output
 */

'use strict';

const crypto = require('crypto');
const { OperatorRegistry, Pipeline, loadOperators } = require('../lib/index.js');

// ============================================
// Golden Baselines
// ============================================

const GOLDEN_BASELINES = [
  // CSV to JSON
  {
    name: 'csv-to-json-basic',
    pipeline: {
      name: 'csv-to-json',
      version: '1.0.0',
      steps: [
        { operator: 'csv.parse', params: { header: true } },
        { operator: 'json.stringify', params: { minify: true } }
      ]
    },
    input: 'name,age\nAlice,30\nBob,25',
    expectedOutput: '[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]',
    expectedHash: '43c03c7d7b7c5c0f8c0f8c0f8c0f8c0f' // Placeholder, will be computed
  },

  // CSV to JSON with sort
  {
    name: 'csv-to-json-sorted',
    pipeline: {
      name: 'csv-to-json-sorted',
      version: '1.0.0',
      steps: [
        { operator: 'csv.parse', params: { header: true } },
        { operator: 'transform.sort', params: { key: 'name', order: 'asc' } },
        { operator: 'json.stringify', params: { indent: 2 } }
      ]
    },
    input: 'name,age\nCharlie,35\nAlice,30\nBob,25',
    expectedOutput: `[
  {
    "name": "Alice",
    "age": "30"
  },
  {
    "name": "Bob",
    "age": "25"
  },
  {
    "name": "Charlie",
    "age": "35"
  }
]`
  },

  // JSON format
  {
    name: 'json-format-basic',
    pipeline: {
      name: 'json-format',
      version: '1.0.0',
      steps: [
        { operator: 'json.format', params: { indent: 2 } }
      ]
    },
    input: '{"b":2,"a":1}',
    expectedOutput: `{
  "b": 2,
  "a": 1
}`
  },

  // JSON format with sort keys
  {
    name: 'json-format-sorted',
    pipeline: {
      name: 'json-format-sorted',
      version: '1.0.0',
      steps: [
        { operator: 'json.parse' },
        { operator: 'json.stringify', params: { indent: 2, sortKeys: true } }
      ]
    },
    input: '{"z":1,"a":2,"m":3}',
    expectedOutput: `{
  "a": 2,
  "m": 3,
  "z": 1
}`
  },

  // JSON minify
  {
    name: 'json-minify',
    pipeline: {
      name: 'json-minify',
      version: '1.0.0',
      steps: [
        { operator: 'json.minify' }
      ]
    },
    input: `{
  "name": "test",
  "value": 123
}`,
    expectedOutput: '{"name":"test","value":123}'
  },

  // Transform filter
  {
    name: 'transform-filter',
    pipeline: {
      name: 'transform-filter',
      version: '1.0.0',
      steps: [
        { operator: 'json.parse' },
        { operator: 'transform.filter', params: { key: 'active', value: 'true' } },
        { operator: 'json.stringify', params: { minify: true } }
      ]
    },
    input: '[{"name":"a","active":"true"},{"name":"b","active":"false"},{"name":"c","active":"true"}]',
    expectedOutput: '[{"name":"a","active":"true"},{"name":"c","active":"true"}]'
  },

  // Transform unique
  {
    name: 'transform-unique',
    pipeline: {
      name: 'transform-unique',
      version: '1.0.0',
      steps: [
        { operator: 'json.parse' },
        { operator: 'transform.unique', params: { key: 'type' } },
        { operator: 'json.stringify', params: { minify: true } }
      ]
    },
    input: '[{"type":"a","v":1},{"type":"b","v":2},{"type":"a","v":3}]',
    expectedOutput: '[{"type":"a","v":1},{"type":"b","v":2}]'
  },

  // Transform group
  {
    name: 'transform-group',
    pipeline: {
      name: 'transform-group',
      version: '1.0.0',
      steps: [
        { operator: 'json.parse' },
        { operator: 'transform.group', params: { key: 'category' } },
        { operator: 'json.stringify', params: { minify: true } }
      ]
    },
    input: '[{"category":"x","v":1},{"category":"y","v":2},{"category":"x","v":3}]',
    expectedOutput: '{"x":[{"category":"x","v":1},{"category":"x","v":3}],"y":[{"category":"y","v":2}]}'
  },

  // CSV roundtrip
  {
    name: 'csv-roundtrip',
    pipeline: {
      name: 'csv-roundtrip',
      version: '1.0.0',
      steps: [
        { operator: 'csv.parse', params: { header: true } },
        { operator: 'csv.stringify', params: { delimiter: ',' } }
      ]
    },
    input: 'a,b,c\n1,2,3\n4,5,6',
    expectedOutput: 'a,b,c\n1,2,3\n4,5,6'
  },

  // Complex pipeline
  {
    name: 'complex-pipeline',
    pipeline: {
      name: 'complex-pipeline',
      version: '1.0.0',
      steps: [
        { operator: 'csv.parse', params: { header: true } },
        { operator: 'transform.filter', params: { expression: 'score > 50' } },
        { operator: 'transform.sort', params: { key: 'score', order: 'desc', numeric: true } },
        { operator: 'transform.slice', params: { limit: 2 } },
        { operator: 'transform.map', params: { pick: ['name', 'score'] } },
        { operator: 'json.stringify', params: { indent: 2 } }
      ]
    },
    input: 'name,score\nAlice,85\nBob,42\nCharlie,91\nDiana,78\nEve,55',
    expectedOutput: `[
  {
    "name": "Charlie",
    "score": "91"
  },
  {
    "name": "Alice",
    "score": "85"
  }
]`
  }
];

// ============================================
// Test Utilities
// ============================================

function computeHash(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function normalizeLineEndings(str) {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// ============================================
// Golden Baseline Tests
// ============================================

function runGoldenTests() {
  console.log('JSON Toolbox CLI - Golden Baseline Tests');
  console.log('=========================================\n');
  console.log('Testing deterministic output...\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const baseline of GOLDEN_BASELINES) {
    const engine = new Pipeline.Engine();
    
    // Run pipeline
    const result = engine.execute(baseline.pipeline, baseline.input);

    if (!result.success) {
      failed++;
      failures.push({
        name: baseline.name,
        error: `Pipeline failed: ${result.error.message}`
      });
      console.log(`  ✗ ${baseline.name}`);
      console.log(`    Pipeline error: ${result.error.message}`);
      continue;
    }

    // Normalize output
    let actualOutput = result.output;
    if (typeof actualOutput === 'object') {
      actualOutput = JSON.stringify(actualOutput, null, 2);
    }
    actualOutput = normalizeLineEndings(actualOutput);
    const expectedOutput = normalizeLineEndings(baseline.expectedOutput);

    // Compare output
    if (actualOutput === expectedOutput) {
      passed++;
      console.log(`  ✓ ${baseline.name}`);
    } else {
      failed++;
      failures.push({
        name: baseline.name,
        expected: expectedOutput,
        actual: actualOutput
      });
      console.log(`  ✗ ${baseline.name}`);
      console.log(`    Expected: ${expectedOutput.substring(0, 100)}...`);
      console.log(`    Actual:   ${actualOutput.substring(0, 100)}...`);
    }
  }

  // Reproducibility test - run each pipeline twice
  console.log('\nReproducibility Tests:');
  
  for (const baseline of GOLDEN_BASELINES) {
    const engine1 = new Pipeline.Engine();
    const engine2 = new Pipeline.Engine();

    const result1 = engine1.execute(baseline.pipeline, baseline.input);
    const result2 = engine2.execute(baseline.pipeline, baseline.input);

    if (!result1.success || !result2.success) {
      console.log(`  ✗ ${baseline.name} (reproducibility) - pipeline failed`);
      continue;
    }

    let output1 = typeof result1.output === 'object' ? JSON.stringify(result1.output) : result1.output;
    let output2 = typeof result2.output === 'object' ? JSON.stringify(result2.output) : result2.output;

    if (output1 === output2) {
      passed++;
      console.log(`  ✓ ${baseline.name} (reproducibility)`);
    } else {
      failed++;
      failures.push({
        name: `${baseline.name} (reproducibility)`,
        error: 'Outputs differ between runs'
      });
      console.log(`  ✗ ${baseline.name} (reproducibility)`);
    }
  }

  // Summary
  console.log('\n=========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => {
      console.log(`  - ${f.name}: ${f.error || 'Output mismatch'}`);
    });
  }

  return failed === 0;
}

// ============================================
// Generate Golden Baselines
// ============================================

function generateBaselines() {
  console.log('Generating golden baselines...\n');

  const baselines = [];

  for (const baseline of GOLDEN_BASELINES) {
    const engine = new Pipeline.Engine();
    const result = engine.execute(baseline.pipeline, baseline.input);

    if (result.success) {
      let output = result.output;
      if (typeof output === 'object') {
        output = JSON.stringify(output, null, 2);
      }
      output = normalizeLineEndings(output);

      baselines.push({
        ...baseline,
        expectedOutput: output,
        expectedHash: computeHash(output)
      });

      console.log(`Generated: ${baseline.name}`);
      console.log(`  Hash: ${computeHash(output).substring(0, 16)}...`);
    } else {
      console.log(`Failed: ${baseline.name} - ${result.error.message}`);
    }
  }

  // Output as JSON for potential export
  console.log('\n// Golden Baselines JSON:');
  console.log(JSON.stringify(baselines, null, 2));
}

// ============================================
// Main
// ============================================

function main() {
  // Load operators
  loadOperators();

  const args = process.argv.slice(2);

  if (args.includes('--generate')) {
    generateBaselines();
  } else {
    const success = runGoldenTests();
    process.exit(success ? 0 : 1);
  }
}

main();
