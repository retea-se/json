/**
 * JSON Toolbox - JSON Operators
 * Version: 1.0.0
 * 
 * Pure JSON operators for parsing, stringifying, and transforming.
 * No DOM, no network, no storage side effects.
 * 
 * @see docs/operators.md for specification
 */

(function() {
  'use strict';

  const { TYPES } = window.OperatorRegistry;

  // ============================================
  // JSON Parse Operator
  // ============================================

  /**
   * Parse JSON string to object/array
   * @param {string} input - JSON string
   * @param {object} params - Parse parameters
   * @returns {object|array} - Parsed data
   */
  function jsonParse(input, params = {}) {
    if (typeof input !== 'string') {
      throw new Error('json.parse expects string input');
    }

    const {
      strict = true
    } = params;

    try {
      return JSON.parse(input);
    } catch (e) {
      if (strict) {
        throw new Error(`Invalid JSON: ${e.message}`);
      }
      // In non-strict mode, try to extract error position
      const match = e.message.match(/position\s+(\d+)/i);
      if (match) {
        const pos = parseInt(match[1], 10);
        const context = input.substring(Math.max(0, pos - 20), pos + 20);
        throw new Error(`Invalid JSON at position ${pos}: "...${context}..."`);
      }
      throw e;
    }
  }

  // ============================================
  // JSON Stringify Operator
  // ============================================

  /**
   * Convert object/array to JSON string
   * @param {any} input - Data to stringify
   * @param {object} params - Stringify parameters
   * @returns {string} - JSON string
   */
  function jsonStringify(input, params = {}) {
    const {
      indent = 2,
      minify = false,
      sortKeys = false
    } = params;

    let data = input;

    // Sort keys if requested
    if (sortKeys && typeof data === 'object' && data !== null) {
      data = sortObjectKeys(data);
    }

    if (minify) {
      return JSON.stringify(data);
    }

    return JSON.stringify(data, null, indent);
  }

  /**
   * Recursively sort object keys
   * @param {any} obj - Object to sort
   * @returns {any} - Object with sorted keys
   */
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

  // ============================================
  // JSON Format Operator
  // ============================================

  /**
   * Format/prettify JSON string
   * @param {string} input - JSON string
   * @param {object} params - Format parameters
   * @returns {string} - Formatted JSON string
   */
  function jsonFormat(input, params = {}) {
    const parsed = jsonParse(input, { strict: true });
    return jsonStringify(parsed, params);
  }

  // ============================================
  // JSON Minify Operator
  // ============================================

  /**
   * Minify JSON string
   * @param {string} input - JSON string
   * @param {object} params - Minify parameters
   * @returns {string} - Minified JSON string
   */
  function jsonMinify(input, params = {}) {
    const parsed = jsonParse(input, { strict: true });
    return JSON.stringify(parsed);
  }

  // ============================================
  // JSON Validate Operator
  // ============================================

  /**
   * Validate JSON string
   * @param {string} input - JSON string
   * @param {object} params - Validate parameters
   * @returns {object} - Validation result
   */
  function jsonValidate(input, params = {}) {
    if (typeof input !== 'string') {
      return {
        valid: false,
        error: 'Input must be a string',
        position: null
      };
    }

    try {
      JSON.parse(input);
      return {
        valid: true,
        error: null,
        position: null
      };
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
  // JSON Path Operator
  // ============================================

  /**
   * Extract value at JSON path
   * @param {object|array} input - JSON data
   * @param {object} params - Path parameters
   * @returns {any} - Value at path
   */
  function jsonPath(input, params = {}) {
    const { path = '' } = params;
    
    if (!path) {
      return input;
    }

    // Simple path parser: "foo.bar[0].baz"
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
  // JSON Keys Operator
  // ============================================

  /**
   * Get keys from object
   * @param {object} input - JSON object
   * @param {object} params - Keys parameters
   * @returns {array} - Array of keys
   */
  function jsonKeys(input, params = {}) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('json.keys expects object input');
    }

    const { sorted = false } = params;
    const keys = Object.keys(input);
    
    return sorted ? keys.sort() : keys;
  }

  // ============================================
  // JSON Values Operator
  // ============================================

  /**
   * Get values from object
   * @param {object} input - JSON object
   * @param {object} params - Values parameters
   * @returns {array} - Array of values
   */
  function jsonValues(input, params = {}) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('json.values expects object input');
    }

    return Object.values(input);
  }

  // ============================================
  // JSON Entries Operator
  // ============================================

  /**
   * Get entries from object
   * @param {object} input - JSON object
   * @param {object} params - Entries parameters
   * @returns {array} - Array of [key, value] pairs
   */
  function jsonEntries(input, params = {}) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('json.entries expects object input');
    }

    return Object.entries(input);
  }

  // ============================================
  // JSON From Entries Operator
  // ============================================

  /**
   * Create object from entries
   * @param {array} input - Array of [key, value] pairs
   * @param {object} params - FromEntries parameters
   * @returns {object} - Object
   */
  function jsonFromEntries(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('json.fromEntries expects array input');
    }

    return Object.fromEntries(input);
  }

  // ============================================
  // Register Operators
  // ============================================

  window.OperatorRegistry.register('json.parse', jsonParse, {
    inputType: TYPES.STRING,
    outputType: TYPES.ANY, // Can be object or array
    description: 'Parse JSON string to object/array',
    params: {
      strict: { type: 'boolean', default: true, description: 'Strict JSON parsing' }
    }
  });

  window.OperatorRegistry.register('json.stringify', jsonStringify, {
    inputType: TYPES.ANY,
    outputType: TYPES.STRING,
    description: 'Convert object/array to JSON string',
    params: {
      indent: { type: 'number', default: 2, description: 'Indentation spaces (0-8)' },
      minify: { type: 'boolean', default: false, description: 'Minify output' },
      sortKeys: { type: 'boolean', default: false, description: 'Sort object keys' }
    }
  });

  window.OperatorRegistry.register('json.format', jsonFormat, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Format/prettify JSON string',
    params: {
      indent: { type: 'number', default: 2, description: 'Indentation spaces' },
      sortKeys: { type: 'boolean', default: false, description: 'Sort object keys' }
    }
  });

  window.OperatorRegistry.register('json.minify', jsonMinify, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Minify JSON string',
    params: {}
  });

  window.OperatorRegistry.register('json.validate', jsonValidate, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Validate JSON string',
    params: {}
  });

  window.OperatorRegistry.register('json.path', jsonPath, {
    inputType: TYPES.ANY,
    outputType: TYPES.ANY,
    description: 'Extract value at JSON path',
    params: {
      path: { type: 'string', default: '', description: 'Path expression (e.g., "foo.bar[0].baz")' }
    }
  });

  window.OperatorRegistry.register('json.keys', jsonKeys, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.ARRAY,
    description: 'Get keys from object',
    params: {
      sorted: { type: 'boolean', default: false, description: 'Sort keys alphabetically' }
    }
  });

  window.OperatorRegistry.register('json.values', jsonValues, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.ARRAY,
    description: 'Get values from object',
    params: {}
  });

  window.OperatorRegistry.register('json.entries', jsonEntries, {
    inputType: TYPES.OBJECT,
    outputType: TYPES.ARRAY,
    description: 'Get entries from object as [key, value] pairs',
    params: {}
  });

  window.OperatorRegistry.register('json.fromEntries', jsonFromEntries, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.OBJECT,
    description: 'Create object from [key, value] pairs',
    params: {}
  });

  // Export for direct usage
  window.JSONOperators = {
    parse: jsonParse,
    stringify: jsonStringify,
    format: jsonFormat,
    minify: jsonMinify,
    validate: jsonValidate,
    path: jsonPath,
    keys: jsonKeys,
    values: jsonValues,
    entries: jsonEntries,
    fromEntries: jsonFromEntries,
    sortObjectKeys
  };

})();
