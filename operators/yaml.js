/**
 * JSON Toolbox - YAML Operators
 * Version: 1.0.0
 * 
 * Pure YAML operators for parsing and stringifying.
 * Uses js-yaml library for YAML operations.
 * No network, no storage side effects.
 * 
 * @see docs/operators.md for specification
 */

(function() {
  'use strict';

  const { TYPES } = window.OperatorRegistry;

  // ============================================
  // YAML Parse Operator
  // ============================================

  /**
   * Parse YAML string to JSON object/array
   * @param {string} input - YAML string
   * @param {object} params - Parse parameters
   * @returns {object|array} - Parsed data
   */
  function yamlParse(input, params = {}) {
    if (typeof input !== 'string') {
      throw new Error('yaml.parse expects string input');
    }

    // Check for js-yaml library
    if (!window.jsyaml) {
      throw new Error('js-yaml library not loaded. YAML operations require the js-yaml library.');
    }

    const {
      strict = true,
      json = false // When true, duplicates will throw an error
    } = params;

    try {
      return window.jsyaml.load(input, {
        json: json
      });
    } catch (e) {
      if (strict) {
        throw new Error(`Invalid YAML: ${e.message}`);
      }
      throw e;
    }
  }

  // ============================================
  // YAML Stringify Operator
  // ============================================

  /**
   * Convert object/array to YAML string
   * @param {any} input - Data to stringify
   * @param {object} params - Stringify parameters
   * @returns {string} - YAML string
   */
  function yamlStringify(input, params = {}) {
    // Check for js-yaml library
    if (!window.jsyaml) {
      throw new Error('js-yaml library not loaded. YAML operations require the js-yaml library.');
    }

    const {
      indent = 2,
      flowLevel = -1, // -1 means block style, 0+ means flow style from that level
      noRefs = true,  // Avoid YAML references/anchors
      sortKeys = false,
      lineWidth = -1, // -1 means no limit
      quotingType = '"',
      forceQuotes = false
    } = params;

    return window.jsyaml.dump(input, {
      indent: indent,
      flowLevel: flowLevel,
      noRefs: noRefs,
      sortKeys: sortKeys,
      lineWidth: lineWidth,
      quotingType: quotingType,
      forceQuotes: forceQuotes
    });
  }

  // ============================================
  // YAML Format Operator
  // ============================================

  /**
   * Format/prettify YAML string
   * @param {string} input - YAML string
   * @param {object} params - Format parameters
   * @returns {string} - Formatted YAML string
   */
  function yamlFormat(input, params = {}) {
    const parsed = yamlParse(input, { strict: true });
    return yamlStringify(parsed, {
      indent: params.indent || 2,
      sortKeys: params.sortKeys || false
    });
  }

  // ============================================
  // YAML Validate Operator
  // ============================================

  /**
   * Validate YAML string
   * @param {string} input - YAML string
   * @param {object} params - Validate parameters
   * @returns {object} - Validation result
   */
  function yamlValidate(input, params = {}) {
    if (typeof input !== 'string') {
      return {
        valid: false,
        error: 'Input must be a string',
        line: null
      };
    }

    // Check for js-yaml library
    if (!window.jsyaml) {
      return {
        valid: false,
        error: 'js-yaml library not loaded',
        line: null
      };
    }

    try {
      window.jsyaml.load(input);
      return {
        valid: true,
        error: null,
        line: null
      };
    } catch (e) {
      return {
        valid: false,
        error: e.message,
        line: e.mark ? e.mark.line : null
      };
    }
  }

  // ============================================
  // Register Operators
  // ============================================

  window.OperatorRegistry.register('yaml.parse', yamlParse, {
    inputType: TYPES.STRING,
    outputType: TYPES.ANY, // Can be object or array
    description: 'Parse YAML string to object/array',
    params: {
      strict: { type: 'boolean', default: true, description: 'Strict YAML parsing' },
      json: { type: 'boolean', default: false, description: 'JSON-compatible mode (no duplicates)' }
    }
  });

  window.OperatorRegistry.register('yaml.stringify', yamlStringify, {
    inputType: TYPES.ANY,
    outputType: TYPES.STRING,
    description: 'Convert object/array to YAML string',
    params: {
      indent: { type: 'number', default: 2, description: 'Indentation spaces' },
      flowLevel: { type: 'number', default: -1, description: 'Flow style threshold (-1 = block style)' },
      noRefs: { type: 'boolean', default: true, description: 'Avoid YAML references/anchors' },
      sortKeys: { type: 'boolean', default: false, description: 'Sort object keys' },
      lineWidth: { type: 'number', default: -1, description: 'Line width limit (-1 = no limit)' }
    }
  });

  window.OperatorRegistry.register('yaml.format', yamlFormat, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Format/prettify YAML string',
    params: {
      indent: { type: 'number', default: 2, description: 'Indentation spaces' },
      sortKeys: { type: 'boolean', default: false, description: 'Sort object keys' }
    }
  });

  window.OperatorRegistry.register('yaml.validate', yamlValidate, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Validate YAML string',
    params: {}
  });

  // Export for direct usage
  window.YAMLOperators = {
    parse: yamlParse,
    stringify: yamlStringify,
    format: yamlFormat,
    validate: yamlValidate
  };

})();
