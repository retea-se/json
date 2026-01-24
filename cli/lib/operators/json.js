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
