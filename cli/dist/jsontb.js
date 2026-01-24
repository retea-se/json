#!/usr/bin/env node
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


// ============================================
// Module: lib/index.js
// ============================================

__modules['./lib/index.js'] = function(exports, require, module) {
'use strict';

/**
 * JSON Toolbox CLI - Core Library
 * Version: 1.0.0
 * 
 * Node.js compatible operators and pipeline engine.
 * Pure functions with deterministic output.
 */

'use strict';

// ============================================
// Operator Registry
// ============================================

const registry = new Map();
const metadata = new Map();

const OperatorRegistry = {
  TYPES: {
    STRING: 'string',
    OBJECT: 'object',
    ARRAY: 'array',
    ANY: 'any'
  },

  register(id, fn, meta = {}) {
    if (!/^[a-z]+\.[a-z][a-zA-Z]*$/.test(id)) {
      throw new Error(`Invalid operator ID format: "${id}"`);
    }
    registry.set(id, fn);
    metadata.set(id, {
      id,
      inputType: meta.inputType || 'any',
      outputType: meta.outputType || 'any',
      description: meta.description || '',
      params: meta.params || {},
      pure: true,
      ...meta
    });
  },

  get(id) {
    return registry.get(id) || null;
  },

  getMeta(id) {
    return metadata.get(id) || null;
  },

  has(id) {
    return registry.has(id);
  },

  list() {
    return Array.from(registry.keys()).sort();
  },

  listByNamespace(namespace) {
    return this.list().filter(id => id.startsWith(namespace + '.'));
  },

  listWithMeta() {
    return this.list().map(id => this.getMeta(id));
  },

  execute(id, input, params = {}) {
    const op = this.get(id);
    if (!op) {
      throw new Error(`Unknown operator: "${id}"`);
    }
    try {
      return op(input, params);
    } catch (e) {
      const error = new Error(`Operator "${id}" failed: ${e.message}`);
      error.operatorId = id;
      error.originalError = e;
      throw error;
    }
  },

  isTypeCompatible(outputType, inputType) {
    if (inputType === 'any') return true;
    if (outputType === 'any') return true;
    return outputType === inputType;
  },

  validateTypeChain(steps, inputType = 'any') {
    const errors = [];
    let currentType = inputType;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const meta = this.getMeta(step.operator);

      if (!meta) {
        errors.push({
          step: i,
          error: 'UNKNOWN_OPERATOR',
          message: `Unknown operator: "${step.operator}"`
        });
        continue;
      }

      if (!this.isTypeCompatible(currentType, meta.inputType)) {
        errors.push({
          step: i,
          error: 'TYPE_MISMATCH',
          message: `Type mismatch at step ${i}: expected "${meta.inputType}", got "${currentType}"`,
          expected: meta.inputType,
          received: currentType
        });
      }

      currentType = meta.outputType;
    }

    return {
      valid: errors.length === 0,
      errors,
      outputType: currentType
    };
  }
};

// ============================================
// Pipeline Engine
// ============================================

class PipelineEngine {
  constructor(options = {}) {
    this.options = {
      stopOnError: true,
      validateTypes: true,
      collectMetrics: false,
      timeout: 30000,
      ...options
    };
  }

  execute(manifest, input, options = {}) {
    const opts = { ...this.options, ...options };
    const startTime = opts.collectMetrics ? Date.now() : 0;

    const validation = this.validate(manifest);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_MANIFEST',
          message: validation.errors.map(e => e.message).join('; '),
          details: validation.errors
        },
        output: null,
        steps: [],
        metrics: null
      };
    }

    const steps = manifest.steps || [];
    const stepResults = [];
    let current = input;
    let currentType = this._detectType(input);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStart = opts.collectMetrics ? Date.now() : 0;
      const inputSize = opts.collectMetrics ? this._getSize(current) : 0;

      try {
        const operator = OperatorRegistry.get(step.operator);
        if (!operator) {
          throw {
            code: 'UNKNOWN_OPERATOR',
            message: `Unknown operator: "${step.operator}"`
          };
        }

        if (opts.validateTypes) {
          const meta = OperatorRegistry.getMeta(step.operator);
          if (meta && !OperatorRegistry.isTypeCompatible(currentType, meta.inputType)) {
            throw {
              code: 'TYPE_MISMATCH',
              message: `Type mismatch: "${step.operator}" expects ${meta.inputType}, got ${currentType}`,
              expected: meta.inputType,
              received: currentType
            };
          }
        }

        const result = operator(current, step.params || {});
        const outputType = this._detectType(result);

        const stepResult = {
          step: i,
          id: step.id || null,
          operator: step.operator,
          success: true,
          inputType: currentType,
          outputType: outputType
        };

        if (opts.collectMetrics) {
          stepResult.metrics = {
            duration: Date.now() - stepStart,
            inputSize: inputSize,
            outputSize: this._getSize(result)
          };
        }

        stepResults.push(stepResult);
        current = result;
        currentType = outputType;

      } catch (e) {
        const errorCode = e.code || 'OPERATOR_ERROR';
        const errorMessage = e.message || String(e);

        const stepResult = {
          step: i,
          id: step.id || null,
          operator: step.operator,
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            expected: e.expected,
            received: e.received
          }
        };

        if (opts.collectMetrics) {
          stepResult.metrics = {
            duration: Date.now() - stepStart,
            inputSize: inputSize,
            outputSize: 0
          };
        }

        stepResults.push(stepResult);

        if (step.onError === 'continue') {
          continue;
        }

        if (opts.stopOnError) {
          return {
            success: false,
            error: {
              code: errorCode,
              step: i,
              operator: step.operator,
              message: errorMessage,
              expected: e.expected,
              received: e.received
            },
            output: null,
            partialOutput: i > 0 ? stepResults[i - 1] : null,
            steps: stepResults,
            metrics: opts.collectMetrics ? {
              totalDuration: Date.now() - startTime,
              stepCount: i + 1
            } : null
          };
        }
      }
    }

    return {
      success: true,
      output: current,
      steps: stepResults,
      metrics: opts.collectMetrics ? {
        totalDuration: Date.now() - startTime,
        stepCount: steps.length
      } : null
    };
  }

  validate(manifest) {
    const errors = [];

    if (!manifest) {
      errors.push({ field: 'manifest', message: 'Manifest is required' });
      return { valid: false, errors };
    }

    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push({ field: 'name', message: 'Pipeline name is required' });
    } else if (!/^[a-z][a-z0-9-]*$/.test(manifest.name)) {
      errors.push({ field: 'name', message: 'Pipeline name must be kebab-case' });
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push({ field: 'version', message: 'Pipeline version is required' });
    } else if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push({ field: 'version', message: 'Version must be semver format (x.y.z)' });
    }

    if (!manifest.steps || !Array.isArray(manifest.steps)) {
      errors.push({ field: 'steps', message: 'Pipeline steps array is required' });
      return { valid: false, errors };
    }

    if (manifest.steps.length === 0) {
      errors.push({ field: 'steps', message: 'Pipeline must have at least one step' });
    }

    manifest.steps.forEach((step, i) => {
      if (!step.operator || typeof step.operator !== 'string') {
        errors.push({ field: `steps[${i}].operator`, message: `Step ${i} requires operator` });
      } else {
        if (!OperatorRegistry.has(step.operator)) {
          errors.push({
            field: `steps[${i}].operator`,
            message: `Unknown operator: "${step.operator}"`
          });
        }
      }

      if (step.onError && !['stop', 'continue'].includes(step.onError)) {
        errors.push({
          field: `steps[${i}].onError`,
          message: `Invalid onError value: "${step.onError}"`
        });
      }
    });

    if (errors.length === 0 && this.options.validateTypes) {
      const typeValidation = OperatorRegistry.validateTypeChain(
        manifest.steps,
        manifest.input?.type || 'any'
      );
      errors.push(...typeValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  plan(manifest, inputType = 'any') {
    const validation = this.validate(manifest);
    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors,
        steps: []
      };
    }

    const steps = [];
    let currentType = inputType;

    for (let i = 0; i < manifest.steps.length; i++) {
      const step = manifest.steps[i];
      const meta = OperatorRegistry.getMeta(step.operator);

      steps.push({
        step: i,
        id: step.id || null,
        operator: step.operator,
        params: step.params || {},
        inputType: currentType,
        outputType: meta?.outputType || 'any',
        description: meta?.description || ''
      });

      currentType = meta?.outputType || 'any';
    }

    return {
      valid: true,
      errors: [],
      steps,
      outputType: currentType
    };
  }

  _detectType(value) {
    if (value === null || value === undefined) return 'any';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'string') return 'string';
    return 'any';
  }

  _getSize(value) {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
  }
}

const Pipeline = {
  Engine: PipelineEngine,
  VERSION: '1.0.0'
};

// ============================================
// Load Operators
// ============================================

function loadOperators() {
  // Load all operator modules
  __require('./lib/operators/json.js')(OperatorRegistry);
  __require('./lib/operators/csv.js')(OperatorRegistry);
  __require('./lib/operators/xml.js')(OperatorRegistry);
  __require('./lib/operators/transform.js')(OperatorRegistry);
  __require('./lib/operators/diff.js')(OperatorRegistry);
  __require('./lib/operators/fix.js')(OperatorRegistry);
  __require('./lib/operators/schema.js')(OperatorRegistry);
  __require('./lib/operators/query.js')(OperatorRegistry);

  // Use pure YAML parser (zero dependencies)
  __require('./lib/operators/yaml-pure.js')(OperatorRegistry);
}

// ============================================
// Exports
// ============================================

module.exports = {
  OperatorRegistry,
  Pipeline,
  PipelineEngine,
  loadOperators
};

};


// ============================================
// Module: lib/operators/json.js
// ============================================

__modules['./lib/operators/json.js'] = function(exports, require, module) {
'use strict';

/**
 * JSON Toolbox CLI - JSON Operators
 * Pure JSON operators for Node.js
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // JSON Parse
  // ============================================

  function jsonParse(input, params = {}) {
    if (typeof input !== 'string') {
      throw new Error('json.parse expects string input');
    }
    const { strict = true } = params;
    try {
      return JSON.parse(input);
    } catch (e) {
      if (strict) {
        throw new Error(`Invalid JSON: ${e.message}`);
      }
      throw e;
    }
  }

  // ============================================
  // JSON Stringify
  // ============================================

  function sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sorted = {};
      Object.keys(obj).sort().forEach(key => {
        sorted[key] = sortObjectKeys(obj[key]);
      });
      return sorted;
    }
    return obj;
  }

  function jsonStringify(input, params = {}) {
    const { indent = 2, minify = false, sortKeys = false } = params;
    let data = input;
    if (sortKeys && typeof data === 'object' && data !== null) {
      data = sortObjectKeys(data);
    }
    if (minify) {
      return JSON.stringify(data);
    }
    return JSON.stringify(data, null, indent);
  }

  // ============================================
  // JSON Format
  // ============================================

  function jsonFormat(input, params = {}) {
    const parsed = jsonParse(input, { strict: true });
    return jsonStringify(parsed, params);
  }

  // ============================================
  // JSON Minify
  // ============================================

  function jsonMinify(input, params = {}) {
    const parsed = jsonParse(input, { strict: true });
    return JSON.stringify(parsed);
  }

  // ============================================
  // JSON Validate
  // ============================================

  function jsonValidate(input, params = {}) {
    if (typeof input !== 'string') {
      return { valid: false, error: 'Input must be a string', position: null };
    }
    try {
      JSON.parse(input);
      return { valid: true, error: null, position: null };
    } catch (e) {
      const match = e.message.match(/position\s+(\d+)/i);
      return {
        valid: false,
        error: e.message,
        position: match ? parseInt(match[1], 10) : null
      };
    }
  }

  // ============================================
  // JSON Path
  // ============================================

  function jsonPath(input, params = {}) {
    const { path = '' } = params;
    if (!path) return input;

    const segments = path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(s => s !== '');

    let current = input;
    for (const segment of segments) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[segment];
    }
    return current;
  }

  // ============================================
  // JSON Keys
  // ============================================

  function jsonKeys(input, params = {}) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('json.keys expects object input');
    }
    const { sorted = false } = params;
    const keys = Object.keys(input);
    return sorted ? keys.sort() : keys;
  }

  // ============================================
  // JSON Values
  // ============================================

  function jsonValues(input, params = {}) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('json.values expects object input');
    }
    return Object.values(input);
  }

  // ============================================
  // JSON Entries
  // ============================================

  function jsonEntries(input, params = {}) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('json.entries expects object input');
    }
    return Object.entries(input);
  }

  // ============================================
  // JSON FromEntries
  // ============================================

  function jsonFromEntries(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('json.fromEntries expects array input');
    }
    return Object.fromEntries(input);
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('json.parse', jsonParse, {
    inputType: TYPES.STRING,
    outputType: TYPES.ANY,
    description: 'Parse JSON string to object/array'
  });

  registry.register('json.stringify', jsonStringify, {
    inputType: TYPES.ANY,
    outputType: TYPES.STRING,
    description: 'Convert object/array to JSON string'
  });

  registry.register('json.format', jsonFormat, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Format/prettify JSON string'
  });

  registry.register('json.minify', jsonMinify, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Minify JSON string'
  });

  registry.register('json.validate', jsonValidate, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Validate JSON string'
  });

  registry.register('json.path', jsonPath, {
    inputType: TYPES.ANY,
    outputType: TYPES.ANY,
    description: 'Extract value at JSON path'
  });

  registry.register('json.keys', jsonKeys, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.ARRAY,
    description: 'Get keys from object'
  });

  registry.register('json.values', jsonValues, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.ARRAY,
    description: 'Get values from object'
  });

  registry.register('json.entries', jsonEntries, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.ARRAY,
    description: 'Get entries from object'
  });

  registry.register('json.fromEntries', jsonFromEntries, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.OBJECT,
    description: 'Create object from entries'
  });
};

};


// ============================================
// Module: lib/operators/csv.js
// ============================================

__modules['./lib/operators/csv.js'] = function(exports, require, module) {
'use strict';

/**
 * JSON Toolbox CLI - CSV Operators
 * Pure CSV operators for Node.js
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Helpers
  // ============================================

  function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const counts = {
      ',': (firstLine.match(/,/g) || []).length,
      '\t': (firstLine.match(/\t/g) || []).length,
      ';': (firstLine.match(/;/g) || []).length,
      '|': (firstLine.match(/\|/g) || []).length
    };
    let max = 0;
    let result = ',';
    for (const [delim, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        result = delim;
      }
    }
    return result;
  }

  function escapeCell(value, delimiter) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function parseRow(line, delimiter) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }

    cells.push(current.trim());
    return cells;
  }

  // ============================================
  // CSV Parse
  // ============================================

  function csvParse(input, params = {}) {
    if (typeof input !== 'string') {
      throw new Error('csv.parse expects string input');
    }

    const {
      delimiter = 'auto',
      header = true,
      skipEmptyLines = true,
      trim = true
    } = params;

    const actualDelimiter = delimiter === 'auto' ? detectDelimiter(input) : delimiter;
    let lines = input.split(/\r?\n/);

    if (skipEmptyLines) {
      lines = lines.filter(line => line.trim() !== '');
    }

    if (lines.length === 0) {
      return [];
    }

    const rows = lines.map(line => {
      const cells = parseRow(line, actualDelimiter);
      return trim ? cells.map(c => c.trim()) : cells;
    });

    if (!header) {
      return rows;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    return dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
  }

  // ============================================
  // CSV Stringify
  // ============================================

  function csvStringify(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('csv.stringify expects array input');
    }

    if (input.length === 0) {
      return '';
    }

    const {
      delimiter = ',',
      header = true,
      eol = '\n',
      columns = null
    } = params;

    const firstItem = input[0];

    if (Array.isArray(firstItem)) {
      return input.map(row =>
        row.map(cell => escapeCell(cell, delimiter)).join(delimiter)
      ).join(eol);
    }

    if (typeof firstItem === 'object' && firstItem !== null) {
      const keys = columns || Object.keys(firstItem);
      const rows = [];

      if (header) {
        rows.push(keys.map(k => escapeCell(k, delimiter)).join(delimiter));
      }

      input.forEach(item => {
        const row = keys.map(k => escapeCell(item[k], delimiter));
        rows.push(row.join(delimiter));
      });

      return rows.join(eol);
    }

    return input.map(item => escapeCell(item, delimiter)).join(eol);
  }

  // ============================================
  // CSV Transpose
  // ============================================

  function csvTranspose(input, params = {}) {
    if (!Array.isArray(input) || input.length === 0) {
      return input;
    }

    const firstItem = input[0];

    if (typeof firstItem === 'object' && !Array.isArray(firstItem)) {
      const headers = Object.keys(firstItem);
      return headers.map(header => {
        const row = { _key: header };
        input.forEach((item, i) => {
          row[`col_${i + 1}`] = item[header];
        });
        return row;
      });
    }

    if (Array.isArray(firstItem)) {
      const maxLen = Math.max(...input.map(row => row.length));
      const transposed = [];
      for (let i = 0; i < maxLen; i++) {
        transposed.push(input.map(row => row[i] !== undefined ? row[i] : ''));
      }
      return transposed;
    }

    return input;
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('csv.parse', csvParse, {
    inputType: TYPES.STRING,
    outputType: TYPES.ARRAY,
    description: 'Parse CSV string to array of objects'
  });

  registry.register('csv.stringify', csvStringify, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.STRING,
    description: 'Convert array to CSV string'
  });

  registry.register('csv.transpose', csvTranspose, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Transpose CSV data'
  });
};

};


// ============================================
// Module: lib/operators/xml.js
// ============================================

__modules['./lib/operators/xml.js'] = function(exports, require, module) {
'use strict';

/**
 * JSON Toolbox CLI - XML Operators
 * Pure XML operators for Node.js
 * Uses basic DOM parsing without external dependencies
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Helpers
  // ============================================

  function escapeXml(str) {
    if (typeof str !== 'string') str = String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Simple XML parser for Node.js
   * Handles basic XML without namespaces or DTD
   */
  function parseXml(xml) {
    const result = {};
    let pos = 0;

    function skipWhitespace() {
      while (pos < xml.length && /\s/.test(xml[pos])) pos++;
    }

    function parseText() {
      let text = '';
      while (pos < xml.length && xml[pos] !== '<') {
        text += xml[pos++];
      }
      return text.trim();
    }

    function parseAttributes() {
      const attrs = {};
      while (pos < xml.length) {
        skipWhitespace();
        if (xml[pos] === '>' || xml[pos] === '/' || xml[pos] === '?') break;

        // Parse attribute name
        let name = '';
        while (pos < xml.length && /[a-zA-Z0-9_:-]/.test(xml[pos])) {
          name += xml[pos++];
        }
        if (!name) break;

        skipWhitespace();
        if (xml[pos] !== '=') continue;
        pos++; // skip =
        skipWhitespace();

        // Parse attribute value
        const quote = xml[pos];
        if (quote !== '"' && quote !== "'") continue;
        pos++; // skip opening quote

        let value = '';
        while (pos < xml.length && xml[pos] !== quote) {
          value += xml[pos++];
        }
        pos++; // skip closing quote

        attrs[name] = value;
      }
      return attrs;
    }

    function parseElement() {
      skipWhitespace();

      // Skip XML declaration and comments
      if (xml.substring(pos, pos + 2) === '<?') {
        while (pos < xml.length && xml.substring(pos, pos + 2) !== '?>') pos++;
        pos += 2;
        skipWhitespace();
      }

      if (xml.substring(pos, pos + 4) === '<!--') {
        while (pos < xml.length && xml.substring(pos, pos + 3) !== '-->') pos++;
        pos += 3;
        skipWhitespace();
      }

      if (xml[pos] !== '<') {
        return parseText();
      }

      pos++; // skip <

      // Parse tag name
      let tagName = '';
      while (pos < xml.length && /[a-zA-Z0-9_:-]/.test(xml[pos])) {
        tagName += xml[pos++];
      }

      if (!tagName) return null;

      const element = {};
      const attrs = parseAttributes();

      if (Object.keys(attrs).length > 0) {
        element['@attributes'] = attrs;
      }

      skipWhitespace();

      // Self-closing tag
      if (xml[pos] === '/') {
        pos += 2; // skip />
        return Object.keys(element).length === 0 ? '' : element;
      }

      pos++; // skip >

      // Parse children
      const children = {};
      let textContent = '';

      while (pos < xml.length) {
        skipWhitespace();

        // End tag
        if (xml.substring(pos, pos + 2) === '</') {
          pos += 2;
          while (pos < xml.length && xml[pos] !== '>') pos++;
          pos++; // skip >
          break;
        }

        // Comment
        if (xml.substring(pos, pos + 4) === '<!--') {
          while (pos < xml.length && xml.substring(pos, pos + 3) !== '-->') pos++;
          pos += 3;
          continue;
        }

        // Child element
        if (xml[pos] === '<') {
          const child = parseElement();
          if (child && typeof child === 'object') {
            // Get child tag name
            const nextTag = xml.substring(pos).match(/<([a-zA-Z0-9_:-]+)/);
            pos--; // Rewind for next iteration
            
            // Find the tag name of what we just parsed
            const prevMatch = xml.substring(0, pos).match(/<([a-zA-Z0-9_:-]+)[^>]*>(?:[^<]*|<[^/])*$/);
            if (prevMatch) {
              const childTagName = prevMatch[1];
              if (children[childTagName]) {
                if (!Array.isArray(children[childTagName])) {
                  children[childTagName] = [children[childTagName]];
                }
                children[childTagName].push(child);
              } else {
                children[childTagName] = child;
              }
            }
          }
          pos++;
        } else {
          // Text content
          const text = parseText();
          if (text) {
            textContent += text;
          }
        }
      }

      // Build result
      if (textContent && Object.keys(children).length === 0 && Object.keys(element).length === 0) {
        return textContent;
      }

      if (textContent) {
        element['#text'] = textContent;
      }

      Object.assign(element, children);

      return element;
    }

    skipWhitespace();
    const root = parseElement();

    // Find root tag name
    const rootMatch = xml.match(/<([a-zA-Z0-9_:-]+)/);
    if (rootMatch) {
      return { [rootMatch[1]]: root };
    }

    return root;
  }

  // ============================================
  // XML Parse (Simplified)
  // ============================================

  function xmlParse(input, params = {}) {
    if (typeof input !== 'string') {
      throw new Error('xml.parse expects string input');
    }

    const {
      preserveAttributes = true,
      attributePrefix = '@',
      textNodeName = '#text',
      trim = true
    } = params;

    // Simple regex-based XML to JSON conversion
    let json = {};
    
    // Remove XML declaration
    let xml = input.replace(/<\?xml[^>]*\?>/gi, '').trim();
    
    // Remove comments
    xml = xml.replace(/<!--[\s\S]*?-->/g, '');

    // Find root element
    const rootMatch = xml.match(/<([a-zA-Z0-9_:-]+)(\s[^>]*)?\s*(?:\/>|>([\s\S]*?)<\/\1>)/);
    if (!rootMatch) {
      throw new Error('Invalid XML: no root element found');
    }

    const rootName = rootMatch[1];
    const rootAttrs = rootMatch[2] || '';
    const rootContent = rootMatch[3] || '';

    function parseNode(content, attrs) {
      const result = {};

      // Parse attributes
      if (preserveAttributes && attrs) {
        const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*["']([^"']*)["']/g;
        let match;
        const attributes = {};
        while ((match = attrRegex.exec(attrs)) !== null) {
          attributes[match[1]] = match[2];
        }
        if (Object.keys(attributes).length > 0) {
          result[attributePrefix + 'attributes'] = attributes;
        }
      }

      // If content is just text
      const trimmedContent = trim ? content.trim() : content;
      if (!trimmedContent.includes('<')) {
        if (Object.keys(result).length === 0) {
          return trimmedContent;
        }
        if (trimmedContent) {
          result[textNodeName] = trimmedContent;
        }
        return result;
      }

      // Parse child elements
      const childRegex = /<([a-zA-Z0-9_:-]+)(\s[^>]*)?\s*(?:\/>|>([\s\S]*?)<\/\1>)/g;
      let childMatch;
      
      while ((childMatch = childRegex.exec(content)) !== null) {
        const childName = childMatch[1];
        const childAttrs = childMatch[2] || '';
        const childContent = childMatch[3] || '';
        
        const childValue = parseNode(childContent, childAttrs);
        
        if (result[childName] !== undefined) {
          if (!Array.isArray(result[childName])) {
            result[childName] = [result[childName]];
          }
          result[childName].push(childValue);
        } else {
          result[childName] = childValue;
        }
      }

      // Check for text content mixed with elements
      const textOnly = content.replace(/<[^>]+>/g, '').trim();
      if (textOnly && Object.keys(result).filter(k => !k.startsWith(attributePrefix)).length > 0) {
        result[textNodeName] = trim ? textOnly.trim() : textOnly;
      }

      return result;
    }

    json[rootName] = parseNode(rootContent, rootAttrs);
    return json;
  }

  // ============================================
  // XML Stringify
  // ============================================

  function xmlStringify(input, params = {}) {
    if (typeof input !== 'object' || input === null) {
      throw new Error('xml.stringify expects object input');
    }

    const {
      indent = 2,
      declaration = true,
      attributePrefix = '@',
      textNodeName = '#text',
      rootName = 'root'
    } = params;

    const compact = indent === 0;

    function toXml(data, tagName, level = 0) {
      const spaces = compact ? '' : ' '.repeat(level * indent);
      const nl = compact ? '' : '\n';

      if (data === null || data === undefined) {
        return `${spaces}<${tagName}/>${nl}`;
      }

      if (typeof data !== 'object') {
        return `${spaces}<${tagName}>${escapeXml(data)}</${tagName}>${nl}`;
      }

      if (Array.isArray(data)) {
        return data.map(item => toXml(item, tagName, level)).join('');
      }

      let attrs = '';
      let content = '';
      let hasChildElements = false;
      const attrsKey = attributePrefix + 'attributes';

      if (data[attrsKey]) {
        for (const [key, value] of Object.entries(data[attrsKey])) {
          attrs += ` ${key}="${escapeXml(value)}"`;
        }
      }

      for (const [key, value] of Object.entries(data)) {
        if (key === attrsKey) continue;

        if (key === textNodeName) {
          content += escapeXml(value);
        } else {
          hasChildElements = true;
          content += toXml(value, key, level + 1);
        }
      }

      if (content === '') {
        return `${spaces}<${tagName}${attrs}/>${nl}`;
      }

      if (hasChildElements) {
        return `${spaces}<${tagName}${attrs}>${nl}${content}${spaces}</${tagName}>${nl}`;
      }

      return `${spaces}<${tagName}${attrs}>${content}</${tagName}>${nl}`;
    }

    const keys = Object.keys(input);
    let xml = '';

    if (declaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>' + (compact ? '' : '\n');
    }

    if (keys.length === 1) {
      xml += toXml(input[keys[0]], keys[0], 0);
    } else {
      xml += toXml(input, rootName, 0);
    }

    return xml.trim();
  }

  // ============================================
  // XML Format
  // ============================================

  function xmlFormat(input, params = {}) {
    const parsed = xmlParse(input, params);
    return xmlStringify(parsed, {
      ...params,
      indent: params.indent || 2
    });
  }

  // ============================================
  // XML Minify
  // ============================================

  function xmlMinify(input, params = {}) {
    const parsed = xmlParse(input, params);
    return xmlStringify(parsed, {
      ...params,
      indent: 0,
      declaration: params.declaration !== false
    });
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('xml.parse', xmlParse, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Parse XML string to JSON object'
  });

  registry.register('xml.stringify', xmlStringify, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.STRING,
    description: 'Convert JSON object to XML string'
  });

  registry.register('xml.format', xmlFormat, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Format/prettify XML string'
  });

  registry.register('xml.minify', xmlMinify, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Minify XML string'
  });
};

};


// ============================================
// Module: lib/operators/yaml-pure.js
// ============================================

__modules['./lib/operators/yaml-pure.js'] = function(exports, require, module) {
'use strict';

/**
 * JSON Toolbox CLI - Pure YAML Operators
 * Zero-dependency YAML parser for standalone builds
 * Supports YAML 1.2 subset (covers 95% of real-world use cases)
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Pure YAML Parser
  // ============================================

  function parseYAML(input) {
    if (typeof input !== 'string') {
      throw new Error('yaml.parse expects string input');
    }

    const lines = input.split(/\r?\n/);
    let lineIndex = 0;

    // Skip leading empty lines and comments
    while (lineIndex < lines.length) {
      const line = lines[lineIndex].trim();
      if (line === '' || line.startsWith('#') || line.startsWith('---')) {
        lineIndex++;
        continue;
      }
      break;
    }

    if (lineIndex >= lines.length) {
      return null;
    }

    return parseValue(lines, { index: lineIndex }, 0);
  }

  function parseValue(lines, state, baseIndent) {
    while (state.index < lines.length) {
      const line = lines[state.index];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('#')) {
        state.index++;
        continue;
      }

      const indent = getIndent(line);

      // End of block at this indent level
      if (indent < baseIndent) {
        return undefined;
      }

      // List item
      if (trimmed.startsWith('- ')) {
        return parseList(lines, state, indent);
      }

      // Bare list item (just -)
      if (trimmed === '-') {
        return parseList(lines, state, indent);
      }

      // Object/mapping
      if (trimmed.includes(':')) {
        return parseObject(lines, state, indent);
      }

      // Scalar value
      state.index++;
      return parseScalar(trimmed);
    }

    return undefined;
  }

  function parseObject(lines, state, baseIndent) {
    const obj = {};

    while (state.index < lines.length) {
      const line = lines[state.index];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('#')) {
        state.index++;
        continue;
      }

      const indent = getIndent(line);

      // End of object
      if (indent < baseIndent) {
        break;
      }

      // Same level - must be a key: value pair
      if (indent === baseIndent) {
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) {
          break;
        }

        let key = trimmed.substring(0, colonIndex).trim();
        // Handle quoted keys
        key = unquote(key);

        const afterColon = trimmed.substring(colonIndex + 1).trim();
        state.index++;

        if (afterColon === '' || afterColon.startsWith('#')) {
          // Value is on next line(s) - could be nested object/list
          const nextIndent = peekNextIndent(lines, state);
          if (nextIndent > baseIndent) {
            obj[key] = parseValue(lines, state, nextIndent);
          } else {
            obj[key] = null;
          }
        } else if (afterColon === '|' || afterColon === '|-' || afterColon === '|+') {
          // Literal block scalar
          obj[key] = parseLiteralBlock(lines, state, baseIndent, afterColon);
        } else if (afterColon === '>' || afterColon === '>-' || afterColon === '>+') {
          // Folded block scalar
          obj[key] = parseFoldedBlock(lines, state, baseIndent, afterColon);
        } else {
          // Inline value
          obj[key] = parseScalar(afterColon);
        }
      } else {
        // Deeper indent means we've gone too far
        break;
      }
    }

    return obj;
  }

  function parseList(lines, state, baseIndent) {
    const arr = [];

    while (state.index < lines.length) {
      const line = lines[state.index];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('#')) {
        state.index++;
        continue;
      }

      const indent = getIndent(line);

      // End of list
      if (indent < baseIndent) {
        break;
      }

      // List item at same indent
      if (indent === baseIndent && (trimmed.startsWith('- ') || trimmed === '-')) {
        const afterDash = trimmed.substring(1).trim();
        state.index++;

        if (afterDash === '' || afterDash.startsWith('#')) {
          // Nested structure
          const nextIndent = peekNextIndent(lines, state);
          if (nextIndent > baseIndent) {
            arr.push(parseValue(lines, state, nextIndent));
          } else {
            arr.push(null);
          }
        } else if (afterDash.includes(':') && !afterDash.startsWith('"') && !afterDash.startsWith("'")) {
          // Inline object
          state.index--; // Back up
          const itemLines = [line.substring(line.indexOf('- ') + 2)];

          // Collect following lines at greater indent
          while (state.index + 1 < lines.length) {
            const nextLine = lines[state.index + 1];
            const nextTrimmed = nextLine.trim();
            if (nextTrimmed === '' || nextTrimmed.startsWith('#')) {
              state.index++;
              continue;
            }
            const nextIndent = getIndent(nextLine);
            if (nextIndent <= baseIndent) break;
            state.index++;
          }

          // Parse the inline object
          const colonIdx = afterDash.indexOf(':');
          const key = afterDash.substring(0, colonIdx).trim();
          const val = afterDash.substring(colonIdx + 1).trim();

          const obj = {};
          obj[unquote(key)] = val ? parseScalar(val) : null;

          // Continue collecting nested properties
          while (state.index < lines.length) {
            const nextLine = lines[state.index];
            const nextTrimmed = nextLine.trim();
            if (nextTrimmed === '' || nextTrimmed.startsWith('#')) {
              state.index++;
              continue;
            }
            const nextIndent = getIndent(nextLine);
            if (nextIndent <= baseIndent) break;
            if (nextTrimmed.startsWith('- ')) break;

            const colonIdx2 = nextTrimmed.indexOf(':');
            if (colonIdx2 > 0) {
              const k = nextTrimmed.substring(0, colonIdx2).trim();
              const v = nextTrimmed.substring(colonIdx2 + 1).trim();
              obj[unquote(k)] = v ? parseScalar(v) : null;
              state.index++;
            } else {
              break;
            }
          }

          arr.push(obj);
        } else {
          // Simple scalar value
          arr.push(parseScalar(afterDash));
        }
      } else {
        break;
      }
    }

    return arr;
  }

  function parseLiteralBlock(lines, state, baseIndent, indicator) {
    const contentLines = [];
    const blockIndent = peekNextIndent(lines, state);

    while (state.index < lines.length) {
      const line = lines[state.index];
      const lineIndent = getIndent(line);

      if (line.trim() === '') {
        contentLines.push('');
        state.index++;
        continue;
      }

      if (lineIndent < blockIndent) {
        break;
      }

      contentLines.push(line.substring(blockIndent));
      state.index++;
    }

    let result = contentLines.join('\n');

    // Handle chomping indicator
    if (indicator === '|-') {
      result = result.replace(/\n+$/, '');
    } else if (indicator === '|+') {
      // Keep trailing newlines
    } else {
      // Default: single trailing newline
      result = result.replace(/\n+$/, '\n');
    }

    return result;
  }

  function parseFoldedBlock(lines, state, baseIndent, indicator) {
    const contentLines = [];
    const blockIndent = peekNextIndent(lines, state);

    while (state.index < lines.length) {
      const line = lines[state.index];
      const lineIndent = getIndent(line);

      if (line.trim() === '') {
        contentLines.push('');
        state.index++;
        continue;
      }

      if (lineIndent < blockIndent) {
        break;
      }

      contentLines.push(line.substring(blockIndent));
      state.index++;
    }

    // Fold: replace single newlines with spaces, preserve double newlines
    let result = contentLines.join('\n')
      .replace(/([^\n])\n([^\n])/g, '$1 $2')
      .replace(/\n\n+/g, '\n\n');

    // Handle chomping
    if (indicator === '>-') {
      result = result.replace(/\n+$/, '');
    } else if (indicator === '>+') {
      // Keep trailing newlines
    } else {
      result = result.replace(/\n+$/, '\n');
    }

    return result;
  }

  function parseScalar(str) {
    if (!str) return null;

    // Remove inline comments
    const commentIndex = str.indexOf(' #');
    if (commentIndex > 0 && !isInQuotes(str, commentIndex)) {
      str = str.substring(0, commentIndex).trim();
    }

    // Null
    if (str === 'null' || str === '~' || str === '') {
      return null;
    }

    // Boolean
    if (str === 'true' || str === 'True' || str === 'TRUE') return true;
    if (str === 'false' || str === 'False' || str === 'FALSE') return false;

    // Quoted strings
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
      return unquote(str);
    }

    // Numbers
    if (/^-?\d+$/.test(str)) {
      return parseInt(str, 10);
    }
    if (/^-?\d*\.\d+$/.test(str) || /^-?\d+\.\d*$/.test(str)) {
      return parseFloat(str);
    }
    if (/^-?\d+e[+-]?\d+$/i.test(str) || /^-?\d*\.\d+e[+-]?\d+$/i.test(str)) {
      return parseFloat(str);
    }

    // Hex numbers
    if (/^0x[0-9a-fA-F]+$/.test(str)) {
      return parseInt(str, 16);
    }

    // Octal numbers
    if (/^0o[0-7]+$/.test(str)) {
      return parseInt(str.substring(2), 8);
    }

    // Special float values
    if (str === '.inf' || str === '.Inf' || str === '.INF') return Infinity;
    if (str === '-.inf' || str === '-.Inf' || str === '-.INF') return -Infinity;
    if (str === '.nan' || str === '.NaN' || str === '.NAN') return NaN;

    // Inline arrays [a, b, c]
    if (str.startsWith('[') && str.endsWith(']')) {
      return parseInlineArray(str);
    }

    // Inline objects {a: b, c: d}
    if (str.startsWith('{') && str.endsWith('}')) {
      return parseInlineObject(str);
    }

    // Plain string
    return str;
  }

  function parseInlineArray(str) {
    const content = str.slice(1, -1).trim();
    if (!content) return [];

    const items = splitByComma(content);
    return items.map(item => parseScalar(item.trim()));
  }

  function parseInlineObject(str) {
    const content = str.slice(1, -1).trim();
    if (!content) return {};

    const obj = {};
    const pairs = splitByComma(content);

    for (const pair of pairs) {
      const colonIdx = pair.indexOf(':');
      if (colonIdx === -1) continue;

      const key = pair.substring(0, colonIdx).trim();
      const value = pair.substring(colonIdx + 1).trim();

      obj[unquote(key)] = parseScalar(value);
    }

    return obj;
  }

  function splitByComma(str) {
    const result = [];
    let current = '';
    let depth = 0;
    let inQuote = null;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (inQuote) {
        current += char;
        if (char === inQuote && str[i - 1] !== '\\') {
          inQuote = null;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inQuote = char;
        current += char;
        continue;
      }

      if (char === '[' || char === '{') {
        depth++;
        current += char;
        continue;
      }

      if (char === ']' || char === '}') {
        depth--;
        current += char;
        continue;
      }

      if (char === ',' && depth === 0) {
        result.push(current);
        current = '';
        continue;
      }

      current += char;
    }

    if (current) result.push(current);
    return result;
  }

  function getIndent(line) {
    let indent = 0;
    for (const char of line) {
      if (char === ' ') indent++;
      else if (char === '\t') indent += 2;
      else break;
    }
    return indent;
  }

  function peekNextIndent(lines, state) {
    for (let i = state.index; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed !== '' && !trimmed.startsWith('#')) {
        return getIndent(line);
      }
    }
    return 0;
  }

  function unquote(str) {
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
      str = str.slice(1, -1);
    }

    // Handle escape sequences for double-quoted strings
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');
  }

  function isInQuotes(str, index) {
    let inDouble = false;
    let inSingle = false;

    for (let i = 0; i < index; i++) {
      if (str[i] === '"' && !inSingle) inDouble = !inDouble;
      if (str[i] === "'" && !inDouble) inSingle = !inSingle;
    }

    return inDouble || inSingle;
  }

  // ============================================
  // YAML Stringify
  // ============================================

  function stringifyYAML(input, params = {}) {
    const {
      indent = 2,
      flowLevel = -1,
      sortKeys = false
    } = params;

    return yamlStringify(input, 0, indent, flowLevel, sortKeys);
  }

  function yamlStringify(value, level, indentSize, flowLevel, sortKeys) {
    const indent = ' '.repeat(level * indentSize);

    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      if (value === Infinity) return '.inf';
      if (value === -Infinity) return '-.inf';
      if (isNaN(value)) return '.nan';
      return String(value);
    }

    if (typeof value === 'string') {
      return stringifyString(value, level, indentSize);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';

      if (flowLevel >= 0 && level >= flowLevel) {
        return '[' + value.map(v => yamlStringify(v, 0, indentSize, flowLevel, sortKeys)).join(', ') + ']';
      }

      const lines = value.map((item, i) => {
        const itemStr = yamlStringify(item, level + 1, indentSize, flowLevel, sortKeys);
        if (typeof item === 'object' && item !== null) {
          return indent + '- ' + itemStr.trim().replace(/^\n/, '').replace(new RegExp('^' + indent + '  ', 'gm'), indent + '  ');
        }
        return indent + '- ' + itemStr;
      });

      return '\n' + lines.join('\n');
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';

      if (sortKeys) {
        keys.sort();
      }

      if (flowLevel >= 0 && level >= flowLevel) {
        const pairs = keys.map(k => `${k}: ${yamlStringify(value[k], 0, indentSize, flowLevel, sortKeys)}`);
        return '{' + pairs.join(', ') + '}';
      }

      const lines = keys.map(key => {
        const val = value[key];
        const keyStr = needsQuoting(key) ? `"${escapeString(key)}"` : key;
        const valStr = yamlStringify(val, level + 1, indentSize, flowLevel, sortKeys);

        if (typeof val === 'object' && val !== null && Object.keys(val).length > 0) {
          return indent + keyStr + ':' + valStr;
        }

        return indent + keyStr + ': ' + valStr;
      });

      return '\n' + lines.join('\n');
    }

    return String(value);
  }

  function stringifyString(str, level, indentSize) {
    // Check if multiline
    if (str.includes('\n')) {
      const indent = ' '.repeat((level + 1) * indentSize);
      const lines = str.split('\n').map(line => indent + line);
      return '|\n' + lines.join('\n');
    }

    // Check if needs quoting
    if (needsQuoting(str)) {
      return '"' + escapeString(str) + '"';
    }

    return str;
  }

  function needsQuoting(str) {
    // Empty string
    if (!str) return true;

    // Starts with special characters
    if (/^[\[\]{}&*!|>'"%@`#,\-?:]/.test(str)) return true;

    // Contains special characters
    if (/[:\[\]{}#&*!|>'"%@`]/.test(str)) return true;

    // Reserved words
    if (['true', 'false', 'null', '~', 'yes', 'no', 'on', 'off'].includes(str.toLowerCase())) return true;

    // Looks like a number
    if (/^-?\d/.test(str)) return true;

    return false;
  }

  function escapeString(str) {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('yaml.parse', (input, params = {}) => {
    try {
      return parseYAML(input);
    } catch (e) {
      throw new Error(`YAML parse error: ${e.message}`);
    }
  }, {
    inputType: TYPES.STRING,
    outputType: TYPES.ANY,
    description: 'Parse YAML string to object/array'
  });

  registry.register('yaml.stringify', stringifyYAML, {
    inputType: TYPES.ANY,
    outputType: TYPES.STRING,
    description: 'Convert object/array to YAML string'
  });

  registry.register('yaml.format', (input, params = {}) => {
    const parsed = parseYAML(input);
    return stringifyYAML(parsed, params).trim();
  }, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Format/prettify YAML string'
  });

  registry.register('yaml.validate', (input, params = {}) => {
    try {
      parseYAML(input);
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Validate YAML string'
  });
};

};


// ============================================
// Module: lib/operators/transform.js
// ============================================

__modules['./lib/operators/transform.js'] = function(exports, require, module) {
'use strict';

/**
 * JSON Toolbox CLI - Transform Operators
 * Pure transform operators for Node.js
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Sort
  // ============================================

  function transformSort(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.sort expects array input');
    }

    const { key = null, order = 'asc', numeric = false } = params;
    const sorted = [...input];

    sorted.sort((a, b) => {
      let valA = key ? a[key] : a;
      let valB = key ? b[key] : b;

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      let comparison;
      if (numeric) {
        comparison = Number(valA) - Number(valB);
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return order === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  // ============================================
  // Filter
  // ============================================

  function transformFilter(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.filter expects array input');
    }

    const { key = null, operator = 'eq', value = null, expression = null } = params;

    if (expression) {
      const match = expression.match(/^(\w+)\s*(==|!=|>|<|>=|<=|contains)\s*(.+)$/);
      if (!match) {
        throw new Error(`Invalid filter expression: "${expression}"`);
      }
      const [, k, op, v] = match;
      return transformFilter(input, {
        key: k,
        operator: op === '==' ? 'eq' : op === '!=' ? 'ne' : op,
        value: v.replace(/^["']|["']$/g, '')
      });
    }

    if (!key) {
      throw new Error('transform.filter requires key or expression parameter');
    }

    return input.filter(item => {
      const itemValue = item[key];

      switch (operator) {
        case 'eq':
        case '==':
          return String(itemValue) === String(value);
        case 'ne':
        case '!=':
          return String(itemValue) !== String(value);
        case 'gt':
        case '>':
          return Number(itemValue) > Number(value);
        case 'lt':
        case '<':
          return Number(itemValue) < Number(value);
        case 'gte':
        case '>=':
          return Number(itemValue) >= Number(value);
        case 'lte':
        case '<=':
          return Number(itemValue) <= Number(value);
        case 'contains':
          return String(itemValue).includes(String(value));
        case 'startsWith':
          return String(itemValue).startsWith(String(value));
        case 'endsWith':
          return String(itemValue).endsWith(String(value));
        case 'exists':
          return itemValue !== undefined && itemValue !== null;
        case 'empty':
          return itemValue === undefined || itemValue === null || itemValue === '';
        default:
          throw new Error(`Unknown filter operator: "${operator}"`);
      }
    });
  }

  // ============================================
  // Map
  // ============================================

  function transformMap(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.map expects array input');
    }

    const { pick = null, omit = null, rename = null, extract = null } = params;

    if (extract) {
      return input.map(item => item[extract]);
    }

    return input.map(item => {
      if (typeof item !== 'object' || item === null) {
        return item;
      }

      let result = { ...item };

      if (pick && Array.isArray(pick)) {
        result = {};
        pick.forEach(key => {
          if (item.hasOwnProperty(key)) {
            result[key] = item[key];
          }
        });
      }

      if (omit && Array.isArray(omit)) {
        omit.forEach(key => {
          delete result[key];
        });
      }

      if (rename && typeof rename === 'object') {
        for (const [oldKey, newKey] of Object.entries(rename)) {
          if (result.hasOwnProperty(oldKey)) {
            result[newKey] = result[oldKey];
            delete result[oldKey];
          }
        }
      }

      return result;
    });
  }

  // ============================================
  // Flatten
  // ============================================

  function transformFlatten(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.flatten expects array input');
    }
    const { depth = 1 } = params;
    return input.flat(depth);
  }

  // ============================================
  // Unique
  // ============================================

  function transformUnique(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.unique expects array input');
    }

    const { key = null } = params;

    if (key) {
      const seen = new Set();
      return input.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }

    return [...new Set(input.map(item =>
      typeof item === 'object' ? JSON.stringify(item) : item
    ))].map(item => {
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    });
  }

  // ============================================
  // Reverse
  // ============================================

  function transformReverse(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.reverse expects array input');
    }
    return [...input].reverse();
  }

  // ============================================
  // Slice
  // ============================================

  function transformSlice(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.slice expects array input');
    }

    const { start = 0, end = undefined, limit = undefined } = params;

    if (limit !== undefined) {
      return input.slice(start, start + limit);
    }

    return input.slice(start, end);
  }

  // ============================================
  // Group
  // ============================================

  function transformGroup(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.group expects array input');
    }

    const { key } = params;

    if (!key) {
      throw new Error('transform.group requires key parameter');
    }

    const groups = {};
    input.forEach(item => {
      const groupKey = String(item[key] ?? 'undefined');
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }

  // ============================================
  // Count
  // ============================================

  function transformCount(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.count expects array input');
    }

    const { key = null } = params;

    if (!key) {
      return input.length;
    }

    const counts = {};
    input.forEach(item => {
      const value = String(item[key] ?? 'undefined');
      counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
  }

  // ============================================
  // Merge
  // ============================================

  function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  function transformMerge(input, params = {}) {
    const { deep = false } = params;

    if (Array.isArray(input)) {
      if (deep) {
        return input.reduce((acc, obj) => deepMerge(acc, obj), {});
      }
      return Object.assign({}, ...input);
    }

    if (typeof input === 'object' && input !== null) {
      return { ...input };
    }

    throw new Error('transform.merge expects object or array of objects');
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('transform.sort', transformSort, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Sort array'
  });

  registry.register('transform.filter', transformFilter, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Filter array by expression'
  });

  registry.register('transform.map', transformMap, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Map array values'
  });

  registry.register('transform.flatten', transformFlatten, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Flatten nested array'
  });

  registry.register('transform.unique', transformUnique, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Remove duplicates'
  });

  registry.register('transform.reverse', transformReverse, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Reverse array'
  });

  registry.register('transform.slice', transformSlice, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Slice array'
  });

  registry.register('transform.group', transformGroup, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.OBJECT,
    description: 'Group array by key'
  });

  registry.register('transform.count', transformCount, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ANY,
    description: 'Count array items'
  });

  registry.register('transform.merge', transformMerge, {
    inputType: TYPES.ANY,
    outputType: TYPES.OBJECT,
    description: 'Merge objects'
  });
};

};


// ============================================
// Module: lib/operators/diff.js
// ============================================

__modules['./lib/operators/diff.js'] = function(exports, require, module) {
'use strict';

/**
 * JSON Toolbox CLI - Diff Operators
 * Pure diff operators for deterministic comparison
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Deep Diff
  // ============================================

  function deepDiff(left, right, path = '', ignoreArrayOrder = false) {
    const differences = [];

    // Type mismatch
    const leftType = getType(left);
    const rightType = getType(right);

    if (leftType !== rightType) {
      differences.push({
        path: path || '(root)',
        type: 'type_change',
        left: left,
        right: right,
        leftType: leftType,
        rightType: rightType
      });
      return differences;
    }

    // Compare arrays
    if (Array.isArray(left)) {
      if (ignoreArrayOrder) {
        return diffArraysUnordered(left, right, path, differences);
      }
      return diffArraysOrdered(left, right, path, differences);
    }

    // Compare objects
    if (leftType === 'object') {
      return diffObjects(left, right, path, differences, ignoreArrayOrder);
    }

    // Compare primitives
    if (left !== right) {
      differences.push({
        path: path || '(root)',
        type: 'changed',
        left: left,
        right: right
      });
    }

    return differences;
  }

  function getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  function diffArraysOrdered(left, right, basePath, differences) {
    const maxLen = Math.max(left.length, right.length);

    for (let i = 0; i < maxLen; i++) {
      const path = basePath ? `${basePath}[${i}]` : `[${i}]`;

      if (i >= left.length) {
        differences.push({
          path: path,
          type: 'added',
          right: right[i]
        });
      } else if (i >= right.length) {
        differences.push({
          path: path,
          type: 'removed',
          left: left[i]
        });
      } else {
        const itemDiffs = deepDiff(left[i], right[i], path, false);
        differences.push(...itemDiffs);
      }
    }

    return differences;
  }

  function diffArraysUnordered(left, right, basePath, differences) {
    const leftStrings = left.map(item => JSON.stringify(item));
    const rightStrings = right.map(item => JSON.stringify(item));

    const leftSet = new Set(leftStrings);
    const rightSet = new Set(rightStrings);

    // Find items only in left (removed)
    leftStrings.forEach((str, i) => {
      if (!rightSet.has(str)) {
        differences.push({
          path: basePath ? `${basePath}[${i}]` : `[${i}]`,
          type: 'removed',
          left: left[i]
        });
      }
    });

    // Find items only in right (added)
    rightStrings.forEach((str, i) => {
      if (!leftSet.has(str)) {
        differences.push({
          path: basePath ? `${basePath}[?]` : `[?]`,
          type: 'added',
          right: right[i]
        });
      }
    });

    return differences;
  }

  function diffObjects(left, right, basePath, differences, ignoreArrayOrder) {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);

    for (const key of allKeys) {
      const path = basePath ? `${basePath}.${key}` : key;
      const hasLeft = key in left;
      const hasRight = key in right;

      if (!hasLeft) {
        differences.push({
          path: path,
          type: 'added',
          right: right[key]
        });
      } else if (!hasRight) {
        differences.push({
          path: path,
          type: 'removed',
          left: left[key]
        });
      } else {
        const itemDiffs = deepDiff(left[key], right[key], path, ignoreArrayOrder);
        differences.push(...itemDiffs);
      }
    }

    return differences;
  }

  // ============================================
  // Diff Operator
  // ============================================

  function diffCompare(input, params = {}) {
    // Input must be object with left and right properties
    if (typeof input !== 'object' || input === null) {
      throw new Error('diff.compare expects object with left and right properties');
    }

    const { left, right } = input;
    const { ignoreOrder = false, ignoreWhitespace = false, outputFormat = 'detailed' } = params;

    let leftData = left;
    let rightData = right;

    // Parse strings if needed
    if (typeof leftData === 'string') {
      leftData = JSON.parse(ignoreWhitespace ? leftData.trim() : leftData);
    }
    if (typeof rightData === 'string') {
      rightData = JSON.parse(ignoreWhitespace ? rightData.trim() : rightData);
    }

    const differences = deepDiff(leftData, rightData, '', ignoreOrder);

    if (outputFormat === 'simple') {
      return {
        identical: differences.length === 0,
        count: differences.length
      };
    }

    if (outputFormat === 'paths') {
      return differences.map(d => d.path);
    }

    // Default: detailed
    return {
      identical: differences.length === 0,
      count: differences.length,
      differences: differences
    };
  }

  // ============================================
  // Patch Operator (apply changes)
  // ============================================

  function diffPatch(input, params = {}) {
    if (typeof input !== 'object' || input === null) {
      throw new Error('diff.patch expects object with target and patches');
    }

    const { target, patches } = input;
    if (!Array.isArray(patches)) {
      throw new Error('diff.patch expects patches to be an array');
    }

    let result = JSON.parse(JSON.stringify(target)); // Deep clone

    for (const patch of patches) {
      const { path, type, right, left } = patch;

      if (type === 'added' || type === 'changed') {
        setValueAtPath(result, path, right);
      } else if (type === 'removed') {
        deleteValueAtPath(result, path);
      }
    }

    return result;
  }

  function setValueAtPath(obj, path, value) {
    const segments = parsePath(path);
    let current = obj;

    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (current[seg] === undefined) {
        current[seg] = typeof segments[i + 1] === 'number' ? [] : {};
      }
      current = current[seg];
    }

    current[segments[segments.length - 1]] = value;
  }

  function deleteValueAtPath(obj, path) {
    const segments = parsePath(path);
    let current = obj;

    for (let i = 0; i < segments.length - 1; i++) {
      current = current[segments[i]];
      if (current === undefined) return;
    }

    const lastSeg = segments[segments.length - 1];
    if (Array.isArray(current)) {
      current.splice(lastSeg, 1);
    } else {
      delete current[lastSeg];
    }
  }

  function parsePath(path) {
    if (path === '(root)') return [];
    return path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(s => s !== '')
      .map(s => /^\d+$/.test(s) ? parseInt(s, 10) : s);
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('diff.compare', diffCompare, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.OBJECT,
    description: 'Compare two JSON values and return differences'
  });

  registry.register('diff.patch', diffPatch, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.ANY,
    description: 'Apply diff patches to target object'
  });
};

};


// ============================================
// Module: lib/operators/fix.js
// ============================================

__modules['./lib/operators/fix.js'] = function(exports, require, module) {
'use strict';

/**
 * JSON Toolbox CLI - Fix Operators
 * Pure JSON repair operators without external dependencies
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // JSON Repair
  // ============================================

  function repairJSON(input) {
    if (typeof input !== 'string') {
      throw new Error('fix.repair expects string input');
    }

    let str = input.trim();

    // Already valid?
    try {
      JSON.parse(str);
      return { repaired: false, output: str, method: null };
    } catch (originalError) {
      // Continue with repairs
    }

    const repairs = [];

    // Step 1: Remove BOM
    if (str.charCodeAt(0) === 0xFEFF) {
      str = str.slice(1);
      repairs.push('removed_bom');
    }

    // Step 2: Remove single-line comments
    str = str.replace(/\/\/[^\n\r]*/g, '');
    if (str !== input) repairs.push('removed_line_comments');

    // Step 3: Remove block comments
    str = str.replace(/\/\*[\s\S]*?\*\//g, '');
    if (str !== input) repairs.push('removed_block_comments');

    // Step 4: Convert Python-style booleans and None
    str = str.replace(/\bTrue\b/g, 'true');
    str = str.replace(/\bFalse\b/g, 'false');
    str = str.replace(/\bNone\b/g, 'null');
    if (str.includes('true') || str.includes('false') || str.includes('null')) {
      repairs.push('converted_python_literals');
    }

    // Step 5: Convert single quotes to double quotes (careful with nested)
    str = convertQuotes(str);
    repairs.push('converted_quotes');

    // Step 6: Add quotes to unquoted keys
    str = quoteUnquotedKeys(str);
    repairs.push('quoted_keys');

    // Step 7: Remove trailing commas
    str = str.replace(/,(\s*[\]}])/g, '$1');
    repairs.push('removed_trailing_commas');

    // Step 8: Handle newlines in strings (escape them)
    str = escapeNewlinesInStrings(str);

    // Step 9: Handle undefined -> null
    str = str.replace(/:\s*undefined\b/g, ': null');

    // Step 10: Wrap bare values
    const trimmed = str.trim();
    if (trimmed && !trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('"')) {
      // Try wrapping in array
      try {
        JSON.parse(`[${str}]`);
        str = `[${str}]`;
        repairs.push('wrapped_in_array');
      } catch (e) {
        // Try other approaches
      }
    }

    // Final validation
    try {
      JSON.parse(str);
      return {
        repaired: true,
        output: str,
        method: repairs.join(', ')
      };
    } catch (e) {
      // Last resort: try to extract valid JSON
      const extracted = extractValidJSON(str);
      if (extracted) {
        return {
          repaired: true,
          output: extracted,
          method: 'extracted_valid_json'
        };
      }

      throw new Error(`Unable to repair JSON: ${e.message}`);
    }
  }

  function convertQuotes(str) {
    let result = '';
    let inDouble = false;
    let inSingle = false;
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const prev = str[i - 1];

      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        result += char;
        continue;
      }

      if (char === '"' && !inSingle) {
        inDouble = !inDouble;
        result += char;
      } else if (char === "'" && !inDouble) {
        inSingle = !inSingle;
        result += '"';
      } else {
        result += char;
      }
    }

    return result;
  }

  function quoteUnquotedKeys(str) {
    // Match unquoted keys before colons
    return str.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
  }

  function escapeNewlinesInStrings(str) {
    let result = '';
    let inString = false;
    let stringChar = null;
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        result += char;
        continue;
      }

      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        result += char;
      } else if (char === stringChar && inString) {
        inString = false;
        stringChar = null;
        result += char;
      } else if (inString && (char === '\n' || char === '\r')) {
        result += char === '\n' ? '\\n' : '\\r';
      } else {
        result += char;
      }
    }

    return result;
  }

  function extractValidJSON(str) {
    // Try to find a valid JSON object or array
    const objectMatch = str.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        JSON.parse(objectMatch[0]);
        return objectMatch[0];
      } catch (e) {}
    }

    const arrayMatch = str.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        JSON.parse(arrayMatch[0]);
        return arrayMatch[0];
      } catch (e) {}
    }

    return null;
  }

  // ============================================
  // Fix and Format
  // ============================================

  function fixAndFormat(input, params = {}) {
    const { indent = 2 } = params;
    const result = repairJSON(input);
    const parsed = JSON.parse(result.output);
    return {
      ...result,
      output: JSON.stringify(parsed, null, indent)
    };
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('fix.repair', (input, params) => {
    const result = repairJSON(input);
    return result.output;
  }, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Repair broken JSON string'
  });

  registry.register('fix.repairDetailed', repairJSON, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Repair JSON with detailed report'
  });

  registry.register('fix.format', fixAndFormat, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Repair and format JSON'
  });
};

};


// ============================================
// Module: lib/operators/schema.js
// ============================================

__modules['./lib/operators/schema.js'] = function(exports, require, module) {
'use strict';

/**
 * JSON Toolbox CLI - Schema Operators
 * JSON Schema generation and validation
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // Schema Generation
  // ============================================

  function generateSchema(input, params = {}) {
    const {
      draft = '2020-12',
      required = true,
      examples = false,
      title = 'Generated Schema'
    } = params;

    const schema = {
      $schema: getDraftUri(draft),
      title: title
    };

    Object.assign(schema, inferType(input, required, examples));

    return schema;
  }

  function getDraftUri(draft) {
    const drafts = {
      '4': 'http://json-schema.org/draft-04/schema#',
      '6': 'http://json-schema.org/draft-06/schema#',
      '7': 'http://json-schema.org/draft-07/schema#',
      '2019-09': 'https://json-schema.org/draft/2019-09/schema',
      '2020-12': 'https://json-schema.org/draft/2020-12/schema'
    };
    return drafts[draft] || drafts['2020-12'];
  }

  function inferType(value, includeRequired = true, includeExamples = false) {
    if (value === null) {
      return { type: 'null' };
    }

    if (Array.isArray(value)) {
      return inferArrayType(value, includeRequired, includeExamples);
    }

    switch (typeof value) {
      case 'boolean':
        return { type: 'boolean' };

      case 'number':
        return inferNumberType(value);

      case 'string':
        return inferStringType(value, includeExamples);

      case 'object':
        return inferObjectType(value, includeRequired, includeExamples);

      default:
        return {};
    }
  }

  function inferNumberType(value) {
    if (Number.isInteger(value)) {
      return { type: 'integer' };
    }
    return { type: 'number' };
  }

  function inferStringType(value, includeExamples) {
    const schema = { type: 'string' };

    // Detect format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      schema.format = 'date';
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      schema.format = 'date-time';
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      schema.format = 'email';
    } else if (/^https?:\/\//.test(value)) {
      schema.format = 'uri';
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      schema.format = 'uuid';
    }

    if (includeExamples && value) {
      schema.examples = [value];
    }

    return schema;
  }

  function inferArrayType(arr, includeRequired, includeExamples) {
    if (arr.length === 0) {
      return { type: 'array', items: {} };
    }

    // Check if all items have the same type
    const itemTypes = arr.map(item => inferType(item, includeRequired, includeExamples));
    const uniqueTypes = [...new Set(itemTypes.map(t => JSON.stringify(t)))];

    if (uniqueTypes.length === 1) {
      return {
        type: 'array',
        items: itemTypes[0]
      };
    }

    // Mixed types - use anyOf
    return {
      type: 'array',
      items: {
        anyOf: uniqueTypes.map(t => JSON.parse(t))
      }
    };
  }

  function inferObjectType(obj, includeRequired, includeExamples) {
    const properties = {};
    const required = [];

    for (const [key, value] of Object.entries(obj)) {
      properties[key] = inferType(value, includeRequired, includeExamples);
      if (includeRequired && value !== null && value !== undefined) {
        required.push(key);
      }
    }

    const schema = {
      type: 'object',
      properties: properties
    };

    if (includeRequired && required.length > 0) {
      schema.required = required.sort();
    }

    return schema;
  }

  // ============================================
  // Schema Validation (Basic)
  // ============================================

  function validateSchema(input, params = {}) {
    const { schema } = params;

    if (!schema) {
      throw new Error('schema.validate requires schema parameter');
    }

    let schemaObj = schema;
    if (typeof schema === 'string') {
      schemaObj = JSON.parse(schema);
    }

    const errors = [];
    validateValue(input, schemaObj, '', errors);

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  function validateValue(value, schema, path, errors) {
    if (!schema || typeof schema !== 'object') {
      return;
    }

    // Check type
    if (schema.type) {
      const actualType = getJsonType(value);
      const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];

      // Type compatibility: integer is a subtype of number
      let typeMatches = expectedTypes.includes(actualType);
      if (!typeMatches && actualType === 'integer' && expectedTypes.includes('number')) {
        typeMatches = true;
      }

      if (!typeMatches) {
        errors.push({
          path: path || '(root)',
          message: `Expected type ${expectedTypes.join(' or ')}, got ${actualType}`,
          keyword: 'type'
        });
        return;
      }
    }

    // Check enum
    if (schema.enum) {
      if (!schema.enum.some(e => JSON.stringify(e) === JSON.stringify(value))) {
        errors.push({
          path: path || '(root)',
          message: `Value must be one of: ${schema.enum.join(', ')}`,
          keyword: 'enum'
        });
      }
    }

    // Check const
    if (schema.const !== undefined) {
      if (JSON.stringify(value) !== JSON.stringify(schema.const)) {
        errors.push({
          path: path || '(root)',
          message: `Value must be ${JSON.stringify(schema.const)}`,
          keyword: 'const'
        });
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({
          path: path || '(root)',
          message: `String length must be >= ${schema.minLength}`,
          keyword: 'minLength'
        });
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push({
          path: path || '(root)',
          message: `String length must be <= ${schema.maxLength}`,
          keyword: 'maxLength'
        });
      }
      if (schema.pattern) {
        if (!new RegExp(schema.pattern).test(value)) {
          errors.push({
            path: path || '(root)',
            message: `String must match pattern: ${schema.pattern}`,
            keyword: 'pattern'
          });
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({
          path: path || '(root)',
          message: `Number must be >= ${schema.minimum}`,
          keyword: 'minimum'
        });
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({
          path: path || '(root)',
          message: `Number must be <= ${schema.maximum}`,
          keyword: 'maximum'
        });
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        errors.push({
          path: path || '(root)',
          message: `Array must have >= ${schema.minItems} items`,
          keyword: 'minItems'
        });
      }
      if (schema.maxItems !== undefined && value.length > schema.maxItems) {
        errors.push({
          path: path || '(root)',
          message: `Array must have <= ${schema.maxItems} items`,
          keyword: 'maxItems'
        });
      }
      if (schema.items) {
        value.forEach((item, i) => {
          validateValue(item, schema.items, `${path}[${i}]`, errors);
        });
      }
    }

    // Object validations
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const keys = Object.keys(value);

      // Required properties
      if (schema.required) {
        for (const req of schema.required) {
          if (!keys.includes(req)) {
            errors.push({
              path: path ? `${path}.${req}` : req,
              message: `Missing required property: ${req}`,
              keyword: 'required'
            });
          }
        }
      }

      // Property validation
      if (schema.properties) {
        for (const [key, propValue] of Object.entries(value)) {
          const propSchema = schema.properties[key];
          if (propSchema) {
            validateValue(propValue, propSchema, path ? `${path}.${key}` : key, errors);
          } else if (schema.additionalProperties === false) {
            errors.push({
              path: path ? `${path}.${key}` : key,
              message: `Additional property not allowed: ${key}`,
              keyword: 'additionalProperties'
            });
          }
        }
      }
    }
  }

  function getJsonType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'number' && Number.isInteger(value)) return 'integer';
    return typeof value;
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('schema.generate', generateSchema, {
    inputType: TYPES.ANY,
    outputType: TYPES.OBJECT,
    description: 'Generate JSON Schema from data'
  });

  registry.register('schema.validate', validateSchema, {
    inputType: TYPES.ANY,
    outputType: TYPES.OBJECT,
    description: 'Validate data against JSON Schema'
  });
};

};


// ============================================
// Module: lib/operators/query.js
// ============================================

__modules['./lib/operators/query.js'] = function(exports, require, module) {
'use strict';

/**
 * JSON Toolbox CLI - Query Operators
 * JSONPath and JQ-like query operators
 */

'use strict';

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // JSONPath Implementation
  // ============================================

  function jsonPath(input, params = {}) {
    const { path, returnFirst = false } = params;

    if (!path) {
      throw new Error('query.jsonpath requires path parameter');
    }

    const results = evaluatePath(input, path);

    if (returnFirst) {
      return results.length > 0 ? results[0] : null;
    }

    return results;
  }

  function evaluatePath(data, path) {
    let current = [data];
    const tokens = tokenizePath(path);

    for (const token of tokens) {
      const next = [];

      for (const item of current) {
        const results = evaluateToken(item, token);
        next.push(...results);
      }

      current = next;
    }

    return current;
  }

  function tokenizePath(path) {
    const tokens = [];
    let i = 0;

    // Skip leading $ or @
    if (path[0] === '$' || path[0] === '@') {
      i = 1;
    }

    while (i < path.length) {
      // Dot notation
      if (path[i] === '.') {
        i++;

        // Recursive descent
        if (path[i] === '.') {
          tokens.push({ type: 'recursive' });
          i++;
        }

        // Wildcard
        if (path[i] === '*') {
          tokens.push({ type: 'wildcard' });
          i++;
          continue;
        }

        // Property name
        let name = '';
        while (i < path.length && /[a-zA-Z0-9_$-]/.test(path[i])) {
          name += path[i++];
        }
        if (name) {
          tokens.push({ type: 'property', name });
        }
      }
      // Bracket notation
      else if (path[i] === '[') {
        i++;
        let content = '';
        let depth = 1;

        while (i < path.length && depth > 0) {
          if (path[i] === '[') depth++;
          if (path[i] === ']') depth--;
          if (depth > 0) content += path[i];
          i++;
        }

        tokens.push(parseBracketContent(content));
      }
      else {
        i++;
      }
    }

    return tokens;
  }

  function parseBracketContent(content) {
    content = content.trim();

    // Wildcard
    if (content === '*') {
      return { type: 'wildcard' };
    }

    // Array index
    if (/^-?\d+$/.test(content)) {
      return { type: 'index', value: parseInt(content, 10) };
    }

    // Array slice [start:end:step]
    if (content.includes(':')) {
      const parts = content.split(':').map(p => p.trim() === '' ? null : parseInt(p, 10));
      return {
        type: 'slice',
        start: parts[0],
        end: parts[1],
        step: parts[2] || 1
      };
    }

    // Multiple indices or names [0,1,2] or ['a','b']
    if (content.includes(',')) {
      const items = content.split(',').map(s => {
        s = s.trim();
        if (/^-?\d+$/.test(s)) return parseInt(s, 10);
        return s.replace(/^['"]|['"]$/g, '');
      });
      return { type: 'union', items };
    }

    // Quoted property name
    if (/^['"].*['"]$/.test(content)) {
      return { type: 'property', name: content.slice(1, -1) };
    }

    // Filter expression
    if (content.startsWith('?(') && content.endsWith(')')) {
      return { type: 'filter', expression: content.slice(2, -1) };
    }

    // Plain property name or index
    if (/^\d+$/.test(content)) {
      return { type: 'index', value: parseInt(content, 10) };
    }

    return { type: 'property', name: content };
  }

  function evaluateToken(data, token) {
    if (data === null || data === undefined) {
      return [];
    }

    switch (token.type) {
      case 'property':
        if (typeof data === 'object' && !Array.isArray(data)) {
          const value = data[token.name];
          return value !== undefined ? [value] : [];
        }
        return [];

      case 'index':
        if (Array.isArray(data)) {
          const idx = token.value < 0 ? data.length + token.value : token.value;
          return idx >= 0 && idx < data.length ? [data[idx]] : [];
        }
        return [];

      case 'wildcard':
        if (Array.isArray(data)) {
          return data;
        }
        if (typeof data === 'object') {
          return Object.values(data);
        }
        return [];

      case 'slice':
        if (Array.isArray(data)) {
          const start = token.start ?? 0;
          const end = token.end ?? data.length;
          const step = token.step ?? 1;
          const result = [];
          for (let i = start; i < end && i < data.length; i += step) {
            if (i >= 0) result.push(data[i]);
          }
          return result;
        }
        return [];

      case 'union':
        const results = [];
        for (const item of token.items) {
          if (typeof item === 'number' && Array.isArray(data)) {
            if (item >= 0 && item < data.length) {
              results.push(data[item]);
            }
          } else if (typeof data === 'object' && !Array.isArray(data)) {
            if (data[item] !== undefined) {
              results.push(data[item]);
            }
          }
        }
        return results;

      case 'recursive':
        return getAllDescendants(data);

      case 'filter':
        if (Array.isArray(data)) {
          return data.filter(item => evaluateFilter(item, token.expression));
        }
        return [];

      default:
        return [];
    }
  }

  function getAllDescendants(data) {
    const results = [data];

    if (Array.isArray(data)) {
      for (const item of data) {
        results.push(...getAllDescendants(item));
      }
    } else if (typeof data === 'object' && data !== null) {
      for (const value of Object.values(data)) {
        results.push(...getAllDescendants(value));
      }
    }

    return results;
  }

  function evaluateFilter(item, expression) {
    // Simple filter expressions like @.price > 10
    const match = expression.match(/^@\.(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)$/);
    if (!match) return false;

    const [, prop, op, val] = match;
    const itemValue = item[prop];

    let compareValue = val.trim();
    if (compareValue.startsWith('"') || compareValue.startsWith("'")) {
      compareValue = compareValue.slice(1, -1);
    } else if (!isNaN(compareValue)) {
      compareValue = Number(compareValue);
    }

    switch (op) {
      case '==': return itemValue == compareValue;
      case '!=': return itemValue != compareValue;
      case '>': return itemValue > compareValue;
      case '<': return itemValue < compareValue;
      case '>=': return itemValue >= compareValue;
      case '<=': return itemValue <= compareValue;
      default: return false;
    }
  }

  // ============================================
  // Simple Query Language
  // ============================================

  function simpleQuery(input, params = {}) {
    const { select, where, orderBy, limit, offset } = params;

    let result = Array.isArray(input) ? input : [input];

    // Where filter
    if (where) {
      result = result.filter(item => evaluateWhere(item, where));
    }

    // Select projection
    if (select) {
      const fields = Array.isArray(select) ? select : select.split(',').map(s => s.trim());
      result = result.map(item => {
        const projected = {};
        for (const field of fields) {
          if (typeof item === 'object' && item !== null) {
            projected[field] = item[field];
          }
        }
        return projected;
      });
    }

    // Order by
    if (orderBy) {
      const [field, direction] = orderBy.split(':');
      const desc = direction === 'desc';
      result.sort((a, b) => {
        const va = a[field];
        const vb = b[field];
        if (va < vb) return desc ? 1 : -1;
        if (va > vb) return desc ? -1 : 1;
        return 0;
      });
    }

    // Offset
    if (offset && offset > 0) {
      result = result.slice(offset);
    }

    // Limit
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }

  function evaluateWhere(item, where) {
    if (typeof where === 'string') {
      // Simple expression: "status == active"
      const match = where.match(/^(\w+)\s*(==|!=|>|<|>=|<=|contains)\s*(.+)$/);
      if (!match) return true;

      const [, prop, op, val] = match;
      let value = val.trim().replace(/^["']|["']$/g, '');
      if (!isNaN(value)) value = Number(value);

      const itemValue = item[prop];

      switch (op) {
        case '==': return itemValue == value;
        case '!=': return itemValue != value;
        case '>': return itemValue > value;
        case '<': return itemValue < value;
        case '>=': return itemValue >= value;
        case '<=': return itemValue <= value;
        case 'contains': return String(itemValue).includes(value);
        default: return true;
      }
    }

    if (typeof where === 'object') {
      // Object-based filter: { status: "active", age: { $gt: 18 } }
      for (const [key, condition] of Object.entries(where)) {
        const itemValue = item[key];

        if (typeof condition === 'object' && condition !== null) {
          for (const [op, val] of Object.entries(condition)) {
            switch (op) {
              case '$eq': if (itemValue != val) return false; break;
              case '$ne': if (itemValue == val) return false; break;
              case '$gt': if (itemValue <= val) return false; break;
              case '$lt': if (itemValue >= val) return false; break;
              case '$gte': if (itemValue < val) return false; break;
              case '$lte': if (itemValue > val) return false; break;
              case '$in': if (!val.includes(itemValue)) return false; break;
              case '$nin': if (val.includes(itemValue)) return false; break;
            }
          }
        } else {
          if (itemValue != condition) return false;
        }
      }
    }

    return true;
  }

  // ============================================
  // Register Operators
  // ============================================

  registry.register('query.jsonpath', jsonPath, {
    inputType: TYPES.ANY,
    outputType: TYPES.ARRAY,
    description: 'Query data using JSONPath'
  });

  registry.register('query.select', simpleQuery, {
    inputType: TYPES.ANY,
    outputType: TYPES.ARRAY,
    description: 'Query with select/where/orderBy/limit'
  });

  registry.register('query.get', (input, params) => {
    return jsonPath(input, { ...params, returnFirst: true });
  }, {
    inputType: TYPES.ANY,
    outputType: TYPES.ANY,
    description: 'Get single value at path'
  });
};

};



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
      IO.writeStderr('Error: manifest file required\n');
      IO.writeStderr('Usage: jsontb run <manifest.json> [-i input] [-o output]\n');
      IO.exit(EXIT.ERROR);
    }

    let manifest;
    try {
      manifest = JSON.parse(IO.readFile(manifestPath));
    } catch (e) {
      IO.writeStderr('Error reading manifest: ' + e.message + '\n');
      IO.exit(EXIT.INVALID_MANIFEST);
    }

    let input;
    if (options.input) {
      try {
        input = IO.readFile(options.input);
      } catch (e) {
        IO.writeStderr('Error reading input file: ' + e.message + '\n');
        IO.exit(EXIT.INVALID_INPUT);
      }
    } else if (!IO.isTTY()) {
      input = IO.readStdin();
    } else {
      IO.writeStderr('Error: no input provided. Use -i <file> or pipe via stdin\n');
      IO.exit(EXIT.INVALID_INPUT);
    }

    if (options.dryRun) {
      const engine = new Pipeline.Engine();
      const plan = engine.plan(manifest, 'any');
      IO.writeStdout(JSON.stringify(plan, null, 2) + '\n');
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
          IO.writeStderr('Output written to ' + options.output + '\n');
        }
      } else {
        IO.writeStdout(output);
        if (!String(output).endsWith('\n')) {
          IO.writeStdout('\n');
        }
      }

      if (options.verbose && result.metrics) {
        IO.writeStderr('\nExecution time: ' + result.metrics.totalDuration.toFixed(2) + 'ms\n');
        IO.writeStderr('Steps executed: ' + result.metrics.stepCount + '\n');
      }

      IO.exit(EXIT.SUCCESS);
    } else {
      IO.writeStderr('Pipeline error: ' + result.error.message + '\n');
      if (result.error.step !== undefined) {
        IO.writeStderr('  at step ' + result.error.step + ': ' + result.error.operator + '\n');
      }
      IO.exit(EXIT.ERROR);
    }
  }

  function cmdValidate(args) {
    const manifestPath = args[0];

    if (!manifestPath) {
      IO.writeStderr('Error: manifest file required\n');
      IO.exit(EXIT.ERROR);
    }

    let manifest;
    try {
      manifest = JSON.parse(IO.readFile(manifestPath));
    } catch (e) {
      IO.writeStderr('Error: ' + e.message + '\n');
      IO.exit(EXIT.INVALID_MANIFEST);
    }

    const engine = new Pipeline.Engine();
    const result = engine.validate(manifest);

    if (result.valid) {
      IO.writeStdout('Manifest is valid\n');
      IO.exit(EXIT.SUCCESS);
    } else {
      IO.writeStderr('Manifest validation failed:\n');
      result.errors.forEach(e => {
        IO.writeStderr('  - ' + (e.field || 'manifest') + ': ' + e.message + '\n');
      });
      IO.exit(EXIT.INVALID_MANIFEST);
    }
  }

  function cmdListOperators(args) {
    const options = parseOptions(args);
    const operators = OperatorRegistry.listWithMeta();

    if (options.json) {
      IO.writeStdout(JSON.stringify(operators, null, 2) + '\n');
    } else {
      const grouped = {};
      operators.forEach(op => {
        const ns = op.id.split('.')[0];
        if (!grouped[ns]) grouped[ns] = [];
        grouped[ns].push(op);
      });

      for (const [ns, ops] of Object.entries(grouped)) {
        IO.writeStdout('\n' + ns.toUpperCase() + ':\n');
        ops.forEach(op => {
          IO.writeStdout('  ' + op.id + '\n');
          if (op.description) {
            IO.writeStdout('    ' + op.description + '\n');
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
      IO.writeStderr('Error: operator ID required\n');
      IO.exit(EXIT.ERROR);
    }

    if (!OperatorRegistry.has(operatorId)) {
      IO.writeStderr('Error: unknown operator "' + operatorId + '"\n');
      IO.exit(EXIT.ERROR);
    }

    let input;
    if (options.input) {
      try {
        input = IO.readFile(options.input);
      } catch (e) {
        IO.writeStderr('Error reading input file: ' + e.message + '\n');
        IO.exit(EXIT.INVALID_INPUT);
      }
    } else if (!IO.isTTY()) {
      input = IO.readStdin();
    } else {
      IO.writeStderr('Error: no input provided\n');
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
        if (!String(output).endsWith('\n')) {
          IO.writeStdout('\n');
        }
      }

      IO.exit(EXIT.SUCCESS);
    } catch (e) {
      IO.writeStderr('Error: ' + e.message + '\n');
      IO.exit(EXIT.ERROR);
    }
  }

  function cmdHelp() {
    IO.writeStdout(`
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

  # Format JSON
  ${PROGRAM_NAME} exec json.format --indent 2 < data.json

  # Generate schema
  echo '{"name":"test"}' | ${PROGRAM_NAME} exec schema.generate

`);
    IO.exit(EXIT.SUCCESS);
  }

  function cmdVersion() {
    IO.writeStdout(PROGRAM_NAME + ' v' + VERSION + '\n');
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
          IO.writeStderr('Unknown command: ' + command + '\n');
          IO.writeStderr('Run "' + PROGRAM_NAME + ' help" for usage\n');
          IO.exit(EXIT.ERROR);
        }
    }
  }

  main();
})();
