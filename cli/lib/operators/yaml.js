/**
 * JSON Toolbox CLI - YAML Operators
 * Pure YAML operators for Node.js
 * Uses js-yaml library
 */

'use strict';

let jsyaml;
try {
  jsyaml = require('js-yaml');
} catch (e) {
  // js-yaml not installed, will throw if used
}

module.exports = function(registry) {
  const { TYPES } = registry;

  // ============================================
  // YAML Parse
  // ============================================

  function yamlParse(input, params = {}) {
    if (typeof input !== 'string') {
      throw new Error('yaml.parse expects string input');
    }

    if (!jsyaml) {
      throw new Error('yaml.parse requires js-yaml library. Run: npm install js-yaml');
    }

    const { strict = true, json = false } = params;

    try {
      return jsyaml.load(input, { json: json });
    } catch (e) {
      if (strict) {
        throw new Error(`Invalid YAML: ${e.message}`);
      }
      throw e;
    }
  }

  // ============================================
  // YAML Stringify
  // ============================================

  function yamlStringify(input, params = {}) {
    if (!jsyaml) {
      throw new Error('yaml.stringify requires js-yaml library. Run: npm install js-yaml');
    }

    const {
      indent = 2,
      flowLevel = -1,
      noRefs = true,
      sortKeys = false,
      lineWidth = -1,
      quotingType = '"',
      forceQuotes = false
    } = params;

    return jsyaml.dump(input, {
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
  // YAML Format
  // ============================================

  function yamlFormat(input, params = {}) {
    const parsed = yamlParse(input, { strict: true });
    return yamlStringify(parsed, {
      indent: params.indent || 2,
      sortKeys: params.sortKeys || false
    });
  }

  // ============================================
  // YAML Validate
  // ============================================

  function yamlValidate(input, params = {}) {
    if (typeof input !== 'string') {
      return { valid: false, error: 'Input must be a string', line: null };
    }

    if (!jsyaml) {
      return { valid: false, error: 'js-yaml library not loaded', line: null };
    }

    try {
      jsyaml.load(input);
      return { valid: true, error: null, line: null };
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

  registry.register('yaml.parse', yamlParse, {
    inputType: TYPES.STRING,
    outputType: TYPES.ANY,
    description: 'Parse YAML string to object/array'
  });

  registry.register('yaml.stringify', yamlStringify, {
    inputType: TYPES.ANY,
    outputType: TYPES.STRING,
    description: 'Convert object/array to YAML string'
  });

  registry.register('yaml.format', yamlFormat, {
    inputType: TYPES.STRING,
    outputType: TYPES.STRING,
    description: 'Format/prettify YAML string'
  });

  registry.register('yaml.validate', yamlValidate, {
    inputType: TYPES.STRING,
    outputType: TYPES.OBJECT,
    description: 'Validate YAML string'
  });
};
