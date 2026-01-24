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
  require('./operators/json.js')(OperatorRegistry);
  require('./operators/csv.js')(OperatorRegistry);
  require('./operators/xml.js')(OperatorRegistry);
  require('./operators/transform.js')(OperatorRegistry);
  require('./operators/diff.js')(OperatorRegistry);
  require('./operators/fix.js')(OperatorRegistry);
  require('./operators/schema.js')(OperatorRegistry);
  require('./operators/query.js')(OperatorRegistry);

  // Use pure YAML parser (zero dependencies)
  require('./operators/yaml-pure.js')(OperatorRegistry);
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
