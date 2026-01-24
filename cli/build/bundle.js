#!/usr/bin/env node
/**
 * JSON Toolbox CLI - Bundle Builder
 * Creates a self-contained single-file bundle for standalone execution
 * 
 * Usage: node bundle.js [--output dist/jsontb.js]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Files to bundle in order
const files = [
  'lib/index.js',
  'lib/operators/json.js',
  'lib/operators/csv.js',
  'lib/operators/xml.js',
  'lib/operators/yaml-pure.js',
  'lib/operators/transform.js',
  'lib/operators/diff.js',
  'lib/operators/fix.js',
  'lib/operators/schema.js',
  'lib/operators/query.js'
];

// Output path
const outputArg = process.argv.indexOf('--output');
const outputPath = outputArg >= 0 
  ? process.argv[outputArg + 1] 
  : path.join(rootDir, 'dist', 'jsontb-bundle.js');

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Bundle header
const header = `#!/usr/bin/env node
/**
 * JSON Toolbox CLI - jsontb
 * Version: 2.0.0
 * 
 * Self-contained CLI for deterministic data transformation pipelines.
 * Zero dependencies. Offline capable. Cross-platform.
 * 
 * Usage:
 *   jsontb run <pipeline.json> < input.json
 *   jsontb exec <operator> [--param value] < input
 *   jsontb list-operators
 *   jsontb validate <pipeline.json>
 * 
 * License: MIT
 * Source: https://github.com/your-repo/json-toolbox
 */

'use strict';

// ============================================
// Self-Contained Bundle
// ============================================

const __modules = {};
const __cache = {};

function __require(id) {
  if (__cache[id]) return __cache[id].exports;
  const mod = __modules[id];
  if (!mod) throw new Error('Module not found: ' + id);
  __cache[id] = { exports: {} };
  mod(__cache[id].exports, __require, __cache[id]);
  return __cache[id].exports;
}

`;

// Bundle footer (CLI main)
const footer = `

// ============================================
// CLI Main Entry Point
// ============================================

(function() {
  const VERSION = '2.0.0';
  const PROGRAM_NAME = 'jsontb';

  const EXIT = {
    SUCCESS: 0,
    ERROR: 1,
    INVALID_MANIFEST: 2,
    INVALID_INPUT: 3,
    TIMEOUT: 4
  };

  // Get core modules
  const { OperatorRegistry, Pipeline } = __require('./lib/index.js');

  // Load all operators
  __require('./lib/operators/json.js')(OperatorRegistry);
  __require('./lib/operators/csv.js')(OperatorRegistry);
  __require('./lib/operators/xml.js')(OperatorRegistry);
  __require('./lib/operators/yaml-pure.js')(OperatorRegistry);
  __require('./lib/operators/transform.js')(OperatorRegistry);
  __require('./lib/operators/diff.js')(OperatorRegistry);
  __require('./lib/operators/fix.js')(OperatorRegistry);
  __require('./lib/operators/schema.js')(OperatorRegistry);
  __require('./lib/operators/query.js')(OperatorRegistry);

  // ============================================
  // Platform Detection
  // ============================================

  const isDeno = typeof Deno !== 'undefined';
  const isBun = typeof Bun !== 'undefined';
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

  // ============================================
  // I/O Abstraction
  // ============================================

  const IO = {
    args: isDeno ? Deno.args : (isBun || isNode ? process.argv.slice(2) : []),

    readFile(path) {
      if (isDeno) return Deno.readTextFileSync(path);
      if (isBun || isNode) return require('fs').readFileSync(path, 'utf8');
      throw new Error('readFile not supported');
    },

    writeFile(path, content) {
      if (isDeno) return Deno.writeTextFileSync(path, content);
      if (isBun || isNode) return require('fs').writeFileSync(path, content, 'utf8');
      throw new Error('writeFile not supported');
    },

    readStdin() {
      if (isDeno) {
        const buf = new Uint8Array(1024 * 1024);
        const n = Deno.stdin.readSync(buf);
        return new TextDecoder().decode(buf.subarray(0, n || 0));
      }
      if (isBun || isNode) {
        return require('fs').readFileSync(0, 'utf8');
      }
      throw new Error('readStdin not supported');
    },

    writeStdout(text) {
      if (isDeno) Deno.stdout.writeSync(new TextEncoder().encode(text));
      else if (isBun || isNode) process.stdout.write(text);
    },

    writeStderr(text) {
      if (isDeno) Deno.stderr.writeSync(new TextEncoder().encode(text));
      else if (isBun || isNode) process.stderr.write(text);
    },

    exit(code) {
      if (isDeno) Deno.exit(code);
      else if (isBun || isNode) process.exit(code);
    },

    isTTY() {
      if (isDeno) return Deno.stdin.isTerminal?.() || false;
      if (isBun || isNode) return process.stdin.isTTY || false;
      return true;
    }
  };

  // ============================================
  // Command Handlers
  // ============================================

  function cmdRun(args) {
    const manifestPath = args[0];
    const options = parseOptions(args.slice(1));

    if (!manifestPath) {
      IO.writeStderr('Error: manifest file required\\n');
      IO.writeStderr('Usage: jsontb run <manifest.json> [-i input] [-o output]\\n');
      IO.exit(EXIT.ERROR);
    }

    let manifest;
    try {
      manifest = JSON.parse(IO.readFile(manifestPath));
    } catch (e) {
      IO.writeStderr('Error reading manifest: ' + e.message + '\\n');
      IO.exit(EXIT.INVALID_MANIFEST);
    }

    let input;
    if (options.input) {
      try {
        input = IO.readFile(options.input);
      } catch (e) {
        IO.writeStderr('Error reading input file: ' + e.message + '\\n');
        IO.exit(EXIT.INVALID_INPUT);
      }
    } else if (!IO.isTTY()) {
      input = IO.readStdin();
    } else {
      IO.writeStderr('Error: no input provided. Use -i <file> or pipe via stdin\\n');
      IO.exit(EXIT.INVALID_INPUT);
    }

    if (options.dryRun) {
      const engine = new Pipeline.Engine();
      const plan = engine.plan(manifest, 'any');
      IO.writeStdout(JSON.stringify(plan, null, 2) + '\\n');
      IO.exit(EXIT.SUCCESS);
    }

    const engine = new Pipeline.Engine({
      collectMetrics: options.verbose,
      validateTypes: true
    });

    const result = engine.execute(manifest, input);

    if (result.success) {
      let output = result.output;
      if (typeof output === 'object') {
        output = JSON.stringify(output, null, options.minify ? 0 : 2);
      }

      if (options.output) {
        IO.writeFile(options.output, output);
        if (options.verbose) {
          IO.writeStderr('Output written to ' + options.output + '\\n');
        }
      } else {
        IO.writeStdout(output);
        if (!String(output).endsWith('\\n')) {
          IO.writeStdout('\\n');
        }
      }

      if (options.verbose && result.metrics) {
        IO.writeStderr('\\nExecution time: ' + result.metrics.totalDuration.toFixed(2) + 'ms\\n');
        IO.writeStderr('Steps executed: ' + result.metrics.stepCount + '\\n');
      }

      IO.exit(EXIT.SUCCESS);
    } else {
      IO.writeStderr('Pipeline error: ' + result.error.message + '\\n');
      if (result.error.step !== undefined) {
        IO.writeStderr('  at step ' + result.error.step + ': ' + result.error.operator + '\\n');
      }
      IO.exit(EXIT.ERROR);
    }
  }

  function cmdValidate(args) {
    const manifestPath = args[0];

    if (!manifestPath) {
      IO.writeStderr('Error: manifest file required\\n');
      IO.exit(EXIT.ERROR);
    }

    let manifest;
    try {
      manifest = JSON.parse(IO.readFile(manifestPath));
    } catch (e) {
      IO.writeStderr('Error: ' + e.message + '\\n');
      IO.exit(EXIT.INVALID_MANIFEST);
    }

    const engine = new Pipeline.Engine();
    const result = engine.validate(manifest);

    if (result.valid) {
      IO.writeStdout('Manifest is valid\\n');
      IO.exit(EXIT.SUCCESS);
    } else {
      IO.writeStderr('Manifest validation failed:\\n');
      result.errors.forEach(e => {
        IO.writeStderr('  - ' + (e.field || 'manifest') + ': ' + e.message + '\\n');
      });
      IO.exit(EXIT.INVALID_MANIFEST);
    }
  }

  function cmdListOperators(args) {
    const options = parseOptions(args);
    const operators = OperatorRegistry.listWithMeta();

    if (options.json) {
      IO.writeStdout(JSON.stringify(operators, null, 2) + '\\n');
    } else {
      const grouped = {};
      operators.forEach(op => {
        const ns = op.id.split('.')[0];
        if (!grouped[ns]) grouped[ns] = [];
        grouped[ns].push(op);
      });

      for (const [ns, ops] of Object.entries(grouped)) {
        IO.writeStdout('\\n' + ns.toUpperCase() + ':\\n');
        ops.forEach(op => {
          IO.writeStdout('  ' + op.id + '\\n');
          if (op.description) {
            IO.writeStdout('    ' + op.description + '\\n');
          }
        });
      }
    }

    IO.exit(EXIT.SUCCESS);
  }

  function cmdExec(args) {
    const operatorId = args[0];
    const options = parseOptions(args.slice(1));

    if (!operatorId) {
      IO.writeStderr('Error: operator ID required\\n');
      IO.exit(EXIT.ERROR);
    }

    if (!OperatorRegistry.has(operatorId)) {
      IO.writeStderr('Error: unknown operator "' + operatorId + '"\\n');
      IO.exit(EXIT.ERROR);
    }

    let input;
    if (options.input) {
      try {
        input = IO.readFile(options.input);
      } catch (e) {
        IO.writeStderr('Error reading input file: ' + e.message + '\\n');
        IO.exit(EXIT.INVALID_INPUT);
      }
    } else if (!IO.isTTY()) {
      input = IO.readStdin();
    } else {
      IO.writeStderr('Error: no input provided\\n');
      IO.exit(EXIT.INVALID_INPUT);
    }

    const params = {};
    for (const [key, value] of Object.entries(options)) {
      if (['input', 'output', 'verbose', 'json', 'minify'].includes(key)) continue;
      params[key] = parseParamValue(value);
    }

    // Auto-parse JSON input if operator expects non-string
    const meta = OperatorRegistry.getMeta(operatorId);
    let processedInput = input;

    if (meta && meta.inputType !== 'string') {
      try {
        processedInput = JSON.parse(input);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }

    try {
      const result = OperatorRegistry.execute(operatorId, processedInput, params);

      let output = result;
      if (typeof output === 'object') {
        output = JSON.stringify(output, null, options.minify ? 0 : 2);
      }

      if (options.output) {
        IO.writeFile(options.output, String(output));
      } else {
        IO.writeStdout(String(output));
        if (!String(output).endsWith('\\n')) {
          IO.writeStdout('\\n');
        }
      }

      IO.exit(EXIT.SUCCESS);
    } catch (e) {
      IO.writeStderr('Error: ' + e.message + '\\n');
      IO.exit(EXIT.ERROR);
    }
  }

  function cmdHelp() {
    IO.writeStdout(\`
\${PROGRAM_NAME} v\${VERSION}
Deterministic data transformation pipelines

USAGE:
  \${PROGRAM_NAME} <command> [options]

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
  \${PROGRAM_NAME} run pipeline.json < input.csv > output.json

  # Execute single operator
  \${PROGRAM_NAME} exec csv.parse --header true < data.csv

  # Format JSON
  \${PROGRAM_NAME} exec json.format --indent 2 < data.json

  # Generate schema
  echo '{"name":"test"}' | \${PROGRAM_NAME} exec schema.generate

\`);
    IO.exit(EXIT.SUCCESS);
  }

  function cmdVersion() {
    IO.writeStdout(PROGRAM_NAME + ' v' + VERSION + '\\n');
    IO.exit(EXIT.SUCCESS);
  }

  // ============================================
  // Utilities
  // ============================================

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

  // ============================================
  // Main
  // ============================================

  function main() {
    const args = IO.args;
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
          IO.writeStderr('Unknown command: ' + command + '\\n');
          IO.writeStderr('Run "' + PROGRAM_NAME + ' help" for usage\\n');
          IO.exit(EXIT.ERROR);
        }
    }
  }

  main();
})();
`;

// Process files
console.log('Building jsontb bundle...');
console.log('');

let bundle = header;

for (const file of files) {
  const filePath = path.join(rootDir, file);

  if (!fs.existsSync(filePath)) {
    console.log('  [SKIP] ' + file + ' (not found)');
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Transform require calls to use our module system
  content = content.replace(/require\(['"]([^'"]+)['"]\)/g, (match, modPath) => {
    if (modPath.startsWith('./') || modPath.startsWith('../')) {
      // Resolve relative path
      const resolved = './' + path.posix.normalize(path.posix.join(path.dirname(file), modPath).replace(/\\/g, '/')) + '.js';
      return `__require('${resolved.replace('.js.js', '.js')}')`;
    }
    // External module - not supported in bundle
    return match;
  });

  // Remove shebang
  content = content.replace(/^#!.*\n/, '');

  // Remove 'use strict' at top
  content = content.replace(/^'use strict';?\s*\n?/, '');

  // Wrap in module
  const moduleId = './' + file.replace(/\\/g, '/');

  bundle += `
// ============================================
// Module: ${file}
// ============================================

__modules['${moduleId}'] = function(exports, require, module) {
'use strict';

${content.trim()}

};

`;

  console.log('  [OK] ' + file);
}

bundle += footer;

// Write bundle
fs.writeFileSync(outputPath, bundle, 'utf8');

// Make executable
try {
  fs.chmodSync(outputPath, '755');
} catch (e) {
  // Windows doesn't support chmod
}

const stats = fs.statSync(outputPath);
console.log('');
console.log('Bundle created: ' + outputPath);
console.log('Size: ' + (stats.size / 1024).toFixed(1) + ' KB');
console.log('');
console.log('Run with:');
console.log('  node ' + outputPath + ' help');
console.log('  deno run --allow-read --allow-write ' + outputPath + ' help');
console.log('  bun ' + outputPath + ' help');
