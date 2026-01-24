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
