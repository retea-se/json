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
