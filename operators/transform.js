/**
 * JSON Toolbox - Transform Operators
 * Version: 1.0.0
 * 
 * Pure transform operators for array/object manipulation.
 * No DOM, no network, no storage side effects.
 * 
 * @see docs/operators.md for specification
 */

(function() {
  'use strict';

  const { TYPES } = window.OperatorRegistry;

  // ============================================
  // Sort Operator
  // ============================================

  /**
   * Sort array
   * @param {array} input - Array to sort
   * @param {object} params - Sort parameters
   * @returns {array} - Sorted array
   */
  function transformSort(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.sort expects array input');
    }

    const {
      key = null,     // Sort by object key
      order = 'asc',  // 'asc' or 'desc'
      numeric = false // Numeric comparison
    } = params;

    const sorted = [...input]; // Don't mutate original

    sorted.sort((a, b) => {
      let valA = key ? a[key] : a;
      let valB = key ? b[key] : b;

      // Handle undefined/null
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
  // Filter Operator
  // ============================================

  /**
   * Filter array by expression
   * @param {array} input - Array to filter
   * @param {object} params - Filter parameters
   * @returns {array} - Filtered array
   */
  function transformFilter(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.filter expects array input');
    }

    const {
      key = null,
      operator = 'eq',
      value = null,
      expression = null // Alternative: simple expression string
    } = params;

    // Simple expression parser: "key == value" or "key > 10"
    if (expression) {
      const match = expression.match(/^(\w+)\s*(==|!=|>|<|>=|<=|contains)\s*(.+)$/);
      if (!match) {
        throw new Error(`Invalid filter expression: "${expression}"`);
      }
      const [, k, op, v] = match;
      return transformFilter(input, {
        key: k,
        operator: op === '==' ? 'eq' : op === '!=' ? 'ne' : op,
        value: v.replace(/^["']|["']$/g, '') // Remove quotes
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
  // Map Operator
  // ============================================

  /**
   * Map array values
   * @param {array} input - Array to map
   * @param {object} params - Map parameters
   * @returns {array} - Mapped array
   */
  function transformMap(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.map expects array input');
    }

    const {
      pick = null,   // Array of keys to pick
      omit = null,   // Array of keys to omit
      rename = null, // Object mapping old keys to new keys
      extract = null // Single key to extract (returns array of values)
    } = params;

    // Extract single key
    if (extract) {
      return input.map(item => item[extract]);
    }

    return input.map(item => {
      if (typeof item !== 'object' || item === null) {
        return item;
      }

      let result = { ...item };

      // Pick specific keys
      if (pick && Array.isArray(pick)) {
        result = {};
        pick.forEach(key => {
          if (item.hasOwnProperty(key)) {
            result[key] = item[key];
          }
        });
      }

      // Omit specific keys
      if (omit && Array.isArray(omit)) {
        omit.forEach(key => {
          delete result[key];
        });
      }

      // Rename keys
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
  // Flatten Operator
  // ============================================

  /**
   * Flatten nested array
   * @param {array} input - Array to flatten
   * @param {object} params - Flatten parameters
   * @returns {array} - Flattened array
   */
  function transformFlatten(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.flatten expects array input');
    }

    const { depth = 1 } = params;

    return input.flat(depth);
  }

  // ============================================
  // Unique Operator
  // ============================================

  /**
   * Remove duplicates from array
   * @param {array} input - Array with potential duplicates
   * @param {object} params - Unique parameters
   * @returns {array} - Array with unique values
   */
  function transformUnique(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.unique expects array input');
    }

    const { key = null } = params;

    if (key) {
      // Unique by object key
      const seen = new Set();
      return input.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }

    // Unique primitives
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
  // Reverse Operator
  // ============================================

  /**
   * Reverse array
   * @param {array} input - Array to reverse
   * @param {object} params - Reverse parameters
   * @returns {array} - Reversed array
   */
  function transformReverse(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.reverse expects array input');
    }

    return [...input].reverse();
  }

  // ============================================
  // Slice Operator
  // ============================================

  /**
   * Slice array
   * @param {array} input - Array to slice
   * @param {object} params - Slice parameters
   * @returns {array} - Sliced array
   */
  function transformSlice(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.slice expects array input');
    }

    const {
      start = 0,
      end = undefined,
      limit = undefined
    } = params;

    if (limit !== undefined) {
      return input.slice(start, start + limit);
    }

    return input.slice(start, end);
  }

  // ============================================
  // Group Operator
  // ============================================

  /**
   * Group array by key
   * @param {array} input - Array to group
   * @param {object} params - Group parameters
   * @returns {object} - Grouped object
   */
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
  // Count Operator
  // ============================================

  /**
   * Count array items
   * @param {array} input - Array to count
   * @param {object} params - Count parameters
   * @returns {number|object} - Count or counts by key
   */
  function transformCount(input, params = {}) {
    if (!Array.isArray(input)) {
      throw new Error('transform.count expects array input');
    }

    const { key = null } = params;

    if (!key) {
      return input.length;
    }

    // Count by key value
    const counts = {};
    input.forEach(item => {
      const value = String(item[key] ?? 'undefined');
      counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
  }

  // ============================================
  // Merge Operator
  // ============================================

  /**
   * Merge objects
   * @param {object|array} input - Object or array of objects to merge
   * @param {object} params - Merge parameters
   * @returns {object} - Merged object
   */
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

  /**
   * Deep merge helper
   */
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

  // ============================================
  // Register Operators
  // ============================================

  window.OperatorRegistry.register('transform.sort', transformSort, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Sort array',
    params: {
      key: { type: 'string', default: null, description: 'Sort by object key' },
      order: { type: 'string', default: 'asc', description: 'Sort order (asc/desc)' },
      numeric: { type: 'boolean', default: false, description: 'Numeric comparison' }
    }
  });

  window.OperatorRegistry.register('transform.filter', transformFilter, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Filter array by expression',
    params: {
      key: { type: 'string', default: null, description: 'Filter by object key' },
      operator: { type: 'string', default: 'eq', description: 'Comparison operator' },
      value: { type: 'any', default: null, description: 'Value to compare' },
      expression: { type: 'string', default: null, description: 'Filter expression (e.g., "age > 18")' }
    }
  });

  window.OperatorRegistry.register('transform.map', transformMap, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Map array values',
    params: {
      pick: { type: 'array', default: null, description: 'Keys to pick' },
      omit: { type: 'array', default: null, description: 'Keys to omit' },
      rename: { type: 'object', default: null, description: 'Key rename mapping' },
      extract: { type: 'string', default: null, description: 'Extract single key' }
    }
  });

  window.OperatorRegistry.register('transform.flatten', transformFlatten, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Flatten nested array',
    params: {
      depth: { type: 'number', default: 1, description: 'Flatten depth' }
    }
  });

  window.OperatorRegistry.register('transform.unique', transformUnique, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Remove duplicates from array',
    params: {
      key: { type: 'string', default: null, description: 'Unique by object key' }
    }
  });

  window.OperatorRegistry.register('transform.reverse', transformReverse, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Reverse array',
    params: {}
  });

  window.OperatorRegistry.register('transform.slice', transformSlice, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ARRAY,
    description: 'Slice array',
    params: {
      start: { type: 'number', default: 0, description: 'Start index' },
      end: { type: 'number', default: null, description: 'End index' },
      limit: { type: 'number', default: null, description: 'Number of items' }
    }
  });

  window.OperatorRegistry.register('transform.group', transformGroup, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.OBJECT,
    description: 'Group array by key',
    params: {
      key: { type: 'string', required: true, description: 'Group by object key' }
    }
  });

  window.OperatorRegistry.register('transform.count', transformCount, {
    inputType: TYPES.ARRAY,
    outputType: TYPES.ANY, // number or object
    description: 'Count array items',
    params: {
      key: { type: 'string', default: null, description: 'Count by object key' }
    }
  });

  window.OperatorRegistry.register('transform.merge', transformMerge, {
    inputType: TYPES.ANY, // object or array
    outputType: TYPES.OBJECT,
    description: 'Merge objects',
    params: {
      deep: { type: 'boolean', default: false, description: 'Deep merge' }
    }
  });

  // Export for direct usage
  window.TransformOperators = {
    sort: transformSort,
    filter: transformFilter,
    map: transformMap,
    flatten: transformFlatten,
    unique: transformUnique,
    reverse: transformReverse,
    slice: transformSlice,
    group: transformGroup,
    count: transformCount,
    merge: transformMerge,
    deepMerge
  };

})();
