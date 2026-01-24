#!/usr/bin/env node
/**
 * JSON Toolbox CLI
 * Version: 1.0.0
 * 
 * Command-line interface for deterministic data transformation pipelines.
 * 
 * Usage:
 *   json-toolbox run <manifest.json> [-i input] [-o output]
 *   json-toolbox validate <manifest.json>
 *   json-toolbox list-operators
 *   json-toolbox exec <operator> [params] < input
 * 
 * @see docs/pipelines.md for specification
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Load core modules
const { OperatorRegistry, Pipeline, loadOperators } = require('../lib/index.js');

// ============================================
// CLI Configuration
// ============================================

const VERSION = '1.0.0';
const PROGRAM_NAME = 'json-toolbox';

// Exit codes
const EXIT = {
  SUCCESS: 0,
  ERROR: 1,
  INVALID_MANIFEST: 2,
  INVALID_INPUT: 3,
  TIMEOUT: 4
};

// ============================================
// Command Handlers
// ============================================

/**
 * Run a pipeline
 */
function cmdRun(args) {
  const manifestPath = args[0];
  const options = parseOptions(args.slice(1));

  if (!manifestPath) {
    console.error('Error: manifest file required');
    console.error('Usage: json-toolbox run <manifest.json> [-i input] [-o output]');
    process.exit(EXIT.ERROR);
  }

  // Load manifest
  let manifest;
  try {
    const content = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(content);
  } catch (e) {
    console.error(`Error reading manifest: ${e.message}`);
    process.exit(EXIT.INVALID_MANIFEST);
  }

  // Get input
  let input;
  if (options.input) {
    try {
      input = fs.readFileSync(options.input, 'utf8');
    } catch (e) {
      console.error(`Error reading input file: ${e.message}`);
      process.exit(EXIT.INVALID_INPUT);
    }
  } else if (!process.stdin.isTTY) {
    // Read from stdin
    input = fs.readFileSync(0, 'utf8');
  } else {
    console.error('Error: no input provided. Use -i <file> or pipe data via stdin');
    process.exit(EXIT.INVALID_INPUT);
  }

  // Dry run mode
  if (options.dryRun) {
    const engine = new Pipeline.Engine();
    const plan = engine.plan(manifest, detectInputType(input));
    console.log(JSON.stringify(plan, null, 2));
    process.exit(EXIT.SUCCESS);
  }

  // Execute pipeline
  const engine = new Pipeline.Engine({
    collectMetrics: options.verbose,
    validateTypes: true
  });

  const result = engine.execute(manifest, input);

  if (result.success) {
    // Output result
    let output = result.output;
    if (typeof output === 'object') {
      output = JSON.stringify(output, null, options.minify ? 0 : 2);
    }

    if (options.output) {
      fs.writeFileSync(options.output, output, 'utf8');
      if (options.verbose) {
        console.error(`Output written to ${options.output}`);
      }
    } else {
      process.stdout.write(output);
      // Add newline if output doesn't end with one
      if (!output.endsWith('\n')) {
        process.stdout.write('\n');
      }
    }

    // Show metrics in verbose mode
    if (options.verbose && result.metrics) {
      console.error(`\nExecution time: ${result.metrics.totalDuration.toFixed(2)}ms`);
      console.error(`Steps executed: ${result.metrics.stepCount}`);
    }

    process.exit(EXIT.SUCCESS);
  } else {
    console.error(`Pipeline error: ${result.error.message}`);
    if (result.error.step !== undefined) {
      console.error(`  at step ${result.error.step}: ${result.error.operator}`);
    }
    process.exit(EXIT.ERROR);
  }
}

/**
 * Validate a manifest
 */
function cmdValidate(args) {
  const manifestPath = args[0];

  if (!manifestPath) {
    console.error('Error: manifest file required');
    console.error('Usage: json-toolbox validate <manifest.json>');
    process.exit(EXIT.ERROR);
  }

  // Load manifest
  let manifest;
  try {
    const content = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(content);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(EXIT.INVALID_MANIFEST);
  }

  // Validate
  const engine = new Pipeline.Engine();
  const result = engine.validate(manifest);

  if (result.valid) {
    console.log('Manifest is valid');
    process.exit(EXIT.SUCCESS);
  } else {
    console.error('Manifest validation failed:');
    result.errors.forEach(e => {
      console.error(`  - ${e.field || 'manifest'}: ${e.message}`);
    });
    process.exit(EXIT.INVALID_MANIFEST);
  }
}

/**
 * List available operators
 */
function cmdListOperators(args) {
  const options = parseOptions(args);
  const operators = OperatorRegistry.listWithMeta();

  if (options.json) {
    console.log(JSON.stringify(operators, null, 2));
  } else {
    // Group by namespace
    const grouped = {};
    operators.forEach(op => {
      const ns = op.id.split('.')[0];
      if (!grouped[ns]) grouped[ns] = [];
      grouped[ns].push(op);
    });

    for (const [ns, ops] of Object.entries(grouped)) {
      console.log(`\n${ns.toUpperCase()}:`);
      ops.forEach(op => {
        console.log(`  ${op.id}`);
        if (op.description) {
          console.log(`    ${op.description}`);
        }
      });
    }
  }

  process.exit(EXIT.SUCCESS);
}

/**
 * Execute a single operator
 */
function cmdExec(args) {
  const operatorId = args[0];
  const options = parseOptions(args.slice(1));

  if (!operatorId) {
    console.error('Error: operator ID required');
    console.error('Usage: json-toolbox exec <operator> [--param value] < input');
    process.exit(EXIT.ERROR);
  }

  // Check operator exists
  if (!OperatorRegistry.has(operatorId)) {
    console.error(`Error: unknown operator "${operatorId}"`);
    console.error('Use "json-toolbox list-operators" to see available operators');
    process.exit(EXIT.ERROR);
  }

  // Get input
  let input;
  if (options.input) {
    try {
      input = fs.readFileSync(options.input, 'utf8');
    } catch (e) {
      console.error(`Error reading input file: ${e.message}`);
      process.exit(EXIT.INVALID_INPUT);
    }
  } else if (!process.stdin.isTTY) {
    input = fs.readFileSync(0, 'utf8');
  } else {
    console.error('Error: no input provided');
    process.exit(EXIT.INVALID_INPUT);
  }

  // Parse params from options
  const params = {};
  for (const [key, value] of Object.entries(options)) {
    if (['input', 'output', 'verbose', 'json', 'minify'].includes(key)) continue;
    params[key] = parseParamValue(value);
  }

  // Execute operator
  try {
    const result = OperatorRegistry.execute(operatorId, input, params);
    
    let output = result;
    if (typeof output === 'object') {
      output = JSON.stringify(output, null, options.minify ? 0 : 2);
    }

    if (options.output) {
      fs.writeFileSync(options.output, output, 'utf8');
    } else {
      process.stdout.write(String(output));
      if (!String(output).endsWith('\n')) {
        process.stdout.write('\n');
      }
    }

    process.exit(EXIT.SUCCESS);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(EXIT.ERROR);
  }
}

/**
 * Show help
 */
function cmdHelp() {
  console.log(`
${PROGRAM_NAME} v${VERSION}
Deterministic data transformation pipelines

USAGE:
  ${PROGRAM_NAME} <command> [options]

COMMANDS:
  run <manifest.json>      Run a pipeline manifest
    -i, --input <file>     Input file (default: stdin)
    -o, --output <file>    Output file (default: stdout)
    --dry-run              Show execution plan without running
    --minify               Minify output
    -v, --verbose          Show execution metrics

  validate <manifest.json> Validate a pipeline manifest

  exec <operator>          Execute a single operator
    -i, --input <file>     Input file (default: stdin)
    -o, --output <file>    Output file (default: stdout)
    --<param> <value>      Operator parameters

  list-operators           List all available operators
    --json                 Output as JSON

  help                     Show this help message
  version                  Show version

EXAMPLES:
  # Run a pipeline
  ${PROGRAM_NAME} run pipeline.json < input.csv > output.json

  # Execute single operator
  ${PROGRAM_NAME} exec csv.parse --header true < data.csv

  # Validate manifest
  ${PROGRAM_NAME} validate pipeline.json
`);
  process.exit(EXIT.SUCCESS);
}

/**
 * Show version
 */
function cmdVersion() {
  console.log(`${PROGRAM_NAME} v${VERSION}`);
  process.exit(EXIT.SUCCESS);
}

// ============================================
// Utilities
// ============================================

/**
 * Parse command line options
 */
function parseOptions(args) {
  const options = {};
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];

      if (next && !next.startsWith('-')) {
        options[key] = next;
        i += 2;
      } else {
        options[key] = true;
        i++;
      }
    } else if (arg.startsWith('-')) {
      const key = {
        'i': 'input',
        'o': 'output',
        'v': 'verbose'
      }[arg.slice(1)] || arg.slice(1);

      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        options[key] = next;
        i += 2;
      } else {
        options[key] = true;
        i++;
      }
    } else {
      i++;
    }
  }

  return options;
}

/**
 * Parse parameter value (handle JSON, numbers, booleans)
 */
function parseParamValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(value) && value !== '') return Number(value);
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Detect input type
 */
function detectInputType(input) {
  if (typeof input !== 'string') return 'any';
  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'string'; // JSON string
  if (trimmed.startsWith('<')) return 'string'; // XML string
  return 'string';
}

// ============================================
// Main
// ============================================

function main() {
  // Load operators
  loadOperators();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'run':
      cmdRun(args.slice(1));
      break;
    case 'validate':
      cmdValidate(args.slice(1));
      break;
    case 'list-operators':
    case 'list':
      cmdListOperators(args.slice(1));
      break;
    case 'exec':
      cmdExec(args.slice(1));
      break;
    case 'help':
    case '-h':
    case '--help':
      cmdHelp();
      break;
    case 'version':
    case '-v':
    case '--version':
      cmdVersion();
      break;
    default:
      if (!command) {
        cmdHelp();
      } else {
        console.error(`Unknown command: ${command}`);
        console.error(`Run "${PROGRAM_NAME} help" for usage`);
        process.exit(EXIT.ERROR);
      }
  }
}

main();
