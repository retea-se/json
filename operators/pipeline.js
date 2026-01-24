/**
 * JSON Toolbox - Pipeline Execution Engine
 * Version: 1.0.0
 * 
 * Deterministic pipeline execution engine.
 * Executes operator chains with type validation.
 * No side effects, no network, no storage.
 * 
 * @see docs/pipelines.md for specification
 */

(function() {
  'use strict';

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

    /**
     * Execute a pipeline with input data
     * @param {object} manifest - Pipeline manifest
     * @param {any} input - Input data
     * @param {object} options - Execution options (overrides constructor options)
     * @returns {PipelineResult}
     */
    execute(manifest, input, options = {}) {
      const opts = { ...this.options, ...options };
      const startTime = opts.collectMetrics ? performance.now() : 0;
      
      // Validate manifest
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

      // Execute each step
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepStart = opts.collectMetrics ? performance.now() : 0;
        const inputSize = opts.collectMetrics ? this._getSize(current) : 0;

        try {
          // Get operator
          const operator = window.OperatorRegistry.get(step.operator);
          if (!operator) {
            throw {
              code: 'UNKNOWN_OPERATOR',
              message: `Unknown operator: "${step.operator}"`
            };
          }

          // Type validation
          if (opts.validateTypes) {
            const meta = window.OperatorRegistry.getMeta(step.operator);
            if (meta && !window.OperatorRegistry.isTypeCompatible(currentType, meta.inputType)) {
              throw {
                code: 'TYPE_MISMATCH',
                message: `Type mismatch: "${step.operator}" expects ${meta.inputType}, got ${currentType}`,
                expected: meta.inputType,
                received: currentType
              };
            }
          }

          // Execute operator
          const result = operator(current, step.params || {});
          const outputType = this._detectType(result);

          // Record step result
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
              duration: performance.now() - stepStart,
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
              duration: performance.now() - stepStart,
              inputSize: inputSize,
              outputSize: 0
            };
          }

          stepResults.push(stepResult);

          // Handle error mode
          if (step.onError === 'continue') {
            // Continue with current value (skip this step)
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
                totalDuration: performance.now() - startTime,
                stepCount: i + 1
              } : null
            };
          }
        }
      }

      // Success
      return {
        success: true,
        output: current,
        steps: stepResults,
        metrics: opts.collectMetrics ? {
          totalDuration: performance.now() - startTime,
          stepCount: steps.length
        } : null
      };
    }

    /**
     * Validate a pipeline manifest
     * @param {object} manifest - Pipeline manifest
     * @returns {ValidationResult}
     */
    validate(manifest) {
      const errors = [];

      // Check required fields
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

      // Validate each step
      manifest.steps.forEach((step, i) => {
        if (!step.operator || typeof step.operator !== 'string') {
          errors.push({ field: `steps[${i}].operator`, message: `Step ${i} requires operator` });
        } else {
          // Check operator exists
          if (!window.OperatorRegistry.has(step.operator)) {
            errors.push({ 
              field: `steps[${i}].operator`, 
              message: `Unknown operator: "${step.operator}"` 
            });
          }

          // Validate operator ID format
          if (!/^[a-z]+\.[a-z][a-zA-Z]*$/.test(step.operator)) {
            errors.push({ 
              field: `steps[${i}].operator`, 
              message: `Invalid operator format: "${step.operator}"` 
            });
          }
        }

        // Validate onError
        if (step.onError && !['stop', 'continue'].includes(step.onError)) {
          errors.push({ 
            field: `steps[${i}].onError`, 
            message: `Invalid onError value: "${step.onError}"` 
          });
        }

        // Validate step id format
        if (step.id && !/^[a-z][a-z0-9-]*$/.test(step.id)) {
          errors.push({ 
            field: `steps[${i}].id`, 
            message: `Step id must be kebab-case: "${step.id}"` 
          });
        }
      });

      // Type chain validation
      if (errors.length === 0 && this.options.validateTypes) {
        const typeValidation = window.OperatorRegistry.validateTypeChain(
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

    /**
     * Get execution plan (dry run)
     * @param {object} manifest - Pipeline manifest
     * @param {string} inputType - Expected input type
     * @returns {ExecutionPlan}
     */
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
        const meta = window.OperatorRegistry.getMeta(step.operator);

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

    /**
     * Detect data type
     * @private
     */
    _detectType(value) {
      if (value === null || value === undefined) return 'any';
      if (Array.isArray(value)) return 'array';
      if (typeof value === 'object') return 'object';
      if (typeof value === 'string') return 'string';
      return 'any';
    }

    /**
     * Get approximate size of data
     * @private
     */
    _getSize(value) {
      try {
        return JSON.stringify(value).length;
      } catch {
        return 0;
      }
    }
  }

  // ============================================
  // Pipeline Builder (Fluent API)
  // ============================================

  class PipelineBuilder {
    constructor(name = 'unnamed-pipeline') {
      this._manifest = {
        name: name,
        version: '1.0.0',
        steps: []
      };
    }

    /**
     * Set pipeline name
     */
    name(name) {
      this._manifest.name = name;
      return this;
    }

    /**
     * Set pipeline version
     */
    version(version) {
      this._manifest.version = version;
      return this;
    }

    /**
     * Set pipeline description
     */
    description(desc) {
      this._manifest.description = desc;
      return this;
    }

    /**
     * Set input type
     */
    input(type, format = null) {
      this._manifest.input = { type };
      if (format) this._manifest.input.format = format;
      return this;
    }

    /**
     * Set output type
     */
    output(type, format = null) {
      this._manifest.output = { type };
      if (format) this._manifest.output.format = format;
      return this;
    }

    /**
     * Add a step
     */
    step(operator, params = {}, options = {}) {
      const step = { operator };
      if (Object.keys(params).length > 0) step.params = params;
      if (options.id) step.id = options.id;
      if (options.onError) step.onError = options.onError;
      this._manifest.steps.push(step);
      return this;
    }

    /**
     * Shorthand for csv.parse
     */
    csvParse(params = {}) {
      return this.step('csv.parse', params);
    }

    /**
     * Shorthand for csv.stringify
     */
    csvStringify(params = {}) {
      return this.step('csv.stringify', params);
    }

    /**
     * Shorthand for json.parse
     */
    jsonParse(params = {}) {
      return this.step('json.parse', params);
    }

    /**
     * Shorthand for json.stringify
     */
    jsonStringify(params = {}) {
      return this.step('json.stringify', params);
    }

    /**
     * Shorthand for xml.parse
     */
    xmlParse(params = {}) {
      return this.step('xml.parse', params);
    }

    /**
     * Shorthand for xml.stringify
     */
    xmlStringify(params = {}) {
      return this.step('xml.stringify', params);
    }

    /**
     * Shorthand for yaml.parse
     */
    yamlParse(params = {}) {
      return this.step('yaml.parse', params);
    }

    /**
     * Shorthand for yaml.stringify
     */
    yamlStringify(params = {}) {
      return this.step('yaml.stringify', params);
    }

    /**
     * Shorthand for transform.sort
     */
    sort(params = {}) {
      return this.step('transform.sort', params);
    }

    /**
     * Shorthand for transform.filter
     */
    filter(params = {}) {
      return this.step('transform.filter', params);
    }

    /**
     * Shorthand for transform.map
     */
    map(params = {}) {
      return this.step('transform.map', params);
    }

    /**
     * Build and return manifest
     */
    build() {
      return { ...this._manifest };
    }

    /**
     * Build and execute
     */
    execute(input, options = {}) {
      const engine = new PipelineEngine(options);
      return engine.execute(this._manifest, input);
    }
  }

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Quick pipeline execution
   * @param {object} manifest - Pipeline manifest
   * @param {any} input - Input data
   * @param {object} options - Execution options
   * @returns {PipelineResult}
   */
  function runPipeline(manifest, input, options = {}) {
    const engine = new PipelineEngine(options);
    return engine.execute(manifest, input);
  }

  /**
   * Create a pipeline builder
   * @param {string} name - Pipeline name
   * @returns {PipelineBuilder}
   */
  function pipeline(name) {
    return new PipelineBuilder(name);
  }

  /**
   * Parse manifest from JSON string
   * @param {string} json - JSON manifest string
   * @returns {object}
   */
  function parseManifest(json) {
    return JSON.parse(json);
  }

  /**
   * Serialize manifest to JSON string
   * @param {object} manifest - Pipeline manifest
   * @param {boolean} pretty - Pretty print
   * @returns {string}
   */
  function serializeManifest(manifest, pretty = true) {
    return JSON.stringify(manifest, null, pretty ? 2 : 0);
  }

  // ============================================
  // Export Pipeline API
  // ============================================

  window.PipelineEngine = PipelineEngine;
  window.PipelineBuilder = PipelineBuilder;
  
  window.Pipeline = {
    Engine: PipelineEngine,
    Builder: PipelineBuilder,
    run: runPipeline,
    create: pipeline,
    parseManifest,
    serializeManifest,
    VERSION: '1.0.0'
  };

  // Freeze the API
  Object.freeze(window.Pipeline);

})();
