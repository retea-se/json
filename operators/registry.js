/**
 * JSON Toolbox - Operator Registry
 * Version: 1.0.0
 * 
 * Central registry for all pure operators.
 * Operators are pure functions with no side effects.
 * 
 * @see docs/operators.md for specification
 */

(function() {
  'use strict';

  // ============================================
  // Operator Registry
  // ============================================
  
  const registry = new Map();
  const metadata = new Map();

  /**
   * Register an operator
   * @param {string} id - Operator ID (e.g., "csv.parse")
   * @param {Function} fn - Pure operator function
   * @param {object} meta - Operator metadata
   */
  function register(id, fn, meta = {}) {
    if (registry.has(id)) {
      console.warn(`[OperatorRegistry] Operator "${id}" already registered, overwriting`);
    }
    
    // Validate operator ID format
    if (!/^[a-z]+\.[a-z][a-zA-Z]*$/.test(id)) {
      throw new Error(`Invalid operator ID format: "${id}". Expected "namespace.operation"`);
    }
    
    registry.set(id, fn);
    metadata.set(id, {
      id,
      inputType: meta.inputType || 'any',
      outputType: meta.outputType || 'any',
      description: meta.description || '',
      params: meta.params || {},
      pure: true, // All registered operators must be pure
      ...meta
    });
  }

  /**
   * Get an operator by ID
   * @param {string} id - Operator ID
   * @returns {Function|null}
   */
  function get(id) {
    return registry.get(id) || null;
  }

  /**
   * Get operator metadata
   * @param {string} id - Operator ID
   * @returns {object|null}
   */
  function getMeta(id) {
    return metadata.get(id) || null;
  }

  /**
   * Check if operator exists
   * @param {string} id - Operator ID
   * @returns {boolean}
   */
  function has(id) {
    return registry.has(id);
  }

  /**
   * List all registered operators
   * @returns {string[]}
   */
  function list() {
    return Array.from(registry.keys()).sort();
  }

  /**
   * List operators by namespace
   * @param {string} namespace - Namespace (e.g., "csv")
   * @returns {string[]}
   */
  function listByNamespace(namespace) {
    return list().filter(id => id.startsWith(namespace + '.'));
  }

  /**
   * Get all operator metadata
   * @returns {object[]}
   */
  function listWithMeta() {
    return list().map(id => getMeta(id));
  }

  /**
   * Execute an operator
   * @param {string} id - Operator ID
   * @param {any} input - Input data
   * @param {object} params - Operator parameters
   * @returns {any} - Output data
   * @throws {Error} - If operator not found or execution fails
   */
  function execute(id, input, params = {}) {
    const op = get(id);
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
  }

  /**
   * Validate type compatibility between operators
   * @param {string} outputType - Output type from previous operator
   * @param {string} inputType - Input type expected by next operator
   * @returns {boolean}
   */
  function isTypeCompatible(outputType, inputType) {
    if (inputType === 'any') return true;
    if (outputType === 'any') return true;
    return outputType === inputType;
  }

  /**
   * Validate a pipeline's type chain
   * @param {object[]} steps - Pipeline steps
   * @param {string} inputType - Initial input type
   * @returns {object} - Validation result
   */
  function validateTypeChain(steps, inputType = 'any') {
    const errors = [];
    let currentType = inputType;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const meta = getMeta(step.operator);
      
      if (!meta) {
        errors.push({
          step: i,
          error: 'UNKNOWN_OPERATOR',
          message: `Unknown operator: "${step.operator}"`
        });
        continue;
      }

      if (!isTypeCompatible(currentType, meta.inputType)) {
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

  // ============================================
  // Export Registry API
  // ============================================
  
  const OperatorRegistry = {
    register,
    get,
    getMeta,
    has,
    list,
    listByNamespace,
    listWithMeta,
    execute,
    isTypeCompatible,
    validateTypeChain,
    
    // Constants for type checking
    TYPES: {
      STRING: 'string',
      OBJECT: 'object',
      ARRAY: 'array',
      ANY: 'any'
    }
  };

  // Freeze the API to prevent modifications
  Object.freeze(OperatorRegistry);
  Object.freeze(OperatorRegistry.TYPES);

  // Export globally
  window.OperatorRegistry = OperatorRegistry;

  // Also export for potential module bundler usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OperatorRegistry;
  }

})();
